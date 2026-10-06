import { Component, effect, input, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-codigo-qr',
  styleUrl: './codigo-qr.css',
  templateUrl: './codigo-qr.html',
})
export class CodigoQr {
  // lo que lleva el QR: el código de la compra, el mismo que lee Validar QR
  texto = input.required<string>();
  // la imagen del QR, cuando termina de armarse
  imagen = signal<string | null>(null);

  constructor() {
    // Profe, puedo usar effect()? es muy práctico que se ejecute cada vez que un signal se actualice
    effect(() => {
      this.armar(this.texto());
    });
  }

  // la librería qrcode se baja recién cuando hay un QR para mostrar
  private async armar(texto: string) {
    const qrcode = await import('qrcode');
    this.imagen.set(await qrcode.toDataURL(texto, { width: 360, margin: 1 }));
  }
}
