import { Component, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
// jsQR: busca un QR en los píxeles de una imagen y devuelve su texto (o null si no encontró ninguno)
import jsQR from 'jsqr';
import { Header } from '../../../globales/componentes/header/header';
import { FechaPipe } from '../../../globales/pipes/fecha.pipe';
import { PedidosService } from '../../../logica/services/pedidos.service';
import { ESTADOS_PEDIDO, Pedido } from '../../../logica/modelos/pedidos';

@Component({
  imports: [Header, ReactiveFormsModule, FechaPipe],
  selector: 'app-validar',
  styleUrl: './validar.css',
  templateUrl: './validar.html',
})
export class Validar implements OnDestroy {
  private pds = inject(PedidosService);

  // el código de la compra: lo llena la cámara al leer el QR, o el empleado a mano si el lector no anda
  codigo = new FormControl('', [Validators.required, Validators.pattern(/\S/)]);
  pedido = signal<Pedido | null>(null);
  buscando = signal(false);
  // lo que se le avisa al empleado: que no existe la compra, qué se validó o por qué no se pudo
  aviso = signal<string | null>(null);

  readonly confirmado = ESTADOS_PEDIDO.CONFIRMADO;

  // la cámara: el <video> está siempre, oculto mientras no se escanea
  escaneando = signal(false);
  private video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private camara: MediaStream | null = null;
  // el número del setInterval que lee el video, para cortarlo
  private lectura = 0;

  async buscar() {
    if (this.codigo.invalid) return;
    this.buscando.set(true);
    this.aviso.set(null);
    // los códigos se guardan en mayúsculas: así también lo encuentra si lo escribe en minúsculas
    const pedido = await this.pds.buscarPorCodigo((this.codigo.value as string).trim().toUpperCase());
    this.buscando.set(false);
    this.pedido.set(pedido);
    if (!pedido) this.aviso.set('No hay ninguna compra con ese código.');
  }

  // si queda algo sin usar (las entradas o el candy), para habilitar su botón
  quedaSinUsar(items: { usado: boolean }[]) {
    return items.some((item) => !item.usado);
  }

  // tabla: 'entradas' en la puerta de la sala, 'items_candy' en el mostrador. Una vez usado, ese QR ya no sirve para eso
  async validar(tabla: string) {
    const pedido = this.pedido();
    if (!pedido) return;
    const marcados = await this.pds.marcarUsados(tabla, pedido.id);
    // se vuelve a buscar para ver lo que quedó usado
    await this.buscar();
    if (marcados === null) this.aviso.set('No se pudo validar. Intentá de nuevo.');
    else if (marcados === 0) this.aviso.set('Ya estaba todo usado.');
    else if (tabla === 'entradas') this.aviso.set(`Listo: ${marcados} ${marcados === 1 ? 'entrada validada' : 'entradas validadas'}.`);
    else this.aviso.set('Listo: candy entregado.');
  }

  // getUserMedia prende la cámara (el navegador pide permiso).
  // Cada 300 ms copio un cuadro del video a un canvas para tener sus píxeles, y jsQR busca un QR en ellos
  async escanear() {
    // ya cuenta como escaneando mientras el navegador pide permiso: así un segundo click no prende otra cámara
    if (this.escaneando()) return;
    this.escaneando.set(true);
    this.aviso.set(null);
    try {
      // facingMode environment: en el celular, la cámara de atrás
      this.camara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch {
      this.escaneando.set(false);
      this.aviso.set('No se pudo prender la cámara. Escribí el código a mano.');
      return;
    }
    // si mientras se prendía tocó "Cerrar cámara" o salió de la pantalla, se apaga enseguida
    if (!this.escaneando()) {
      this.cerrarCamara();
      return;
    }
    const video = this.video().nativeElement;
    video.srcObject = this.camara;
    await video.play();
    // si la cerró mientras arrancaba el video, no se empieza a leer
    if (!this.escaneando()) return;

    const canvas = document.createElement('canvas');
    const contexto = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    this.lectura = window.setInterval(() => {
      // hasta que el video no tiene su primer cuadro, no hay nada que leer
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      contexto.drawImage(video, 0, 0);
      const imagen = contexto.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imagen.data, imagen.width, imagen.height);
      if (!qr) return;
      this.cerrarCamara();
      this.codigo.setValue(qr.data);
      this.buscar();
    }, 300);
  }

  cerrarCamara() {
    window.clearInterval(this.lectura);
    if (this.camara) this.camara.getTracks().forEach((pista) => pista.stop());
    this.camara = null;
    this.escaneando.set(false);
  }

  // si sale de la pantalla con la cámara prendida, se apaga
  ngOnDestroy() {
    this.cerrarCamara();
  }
}
