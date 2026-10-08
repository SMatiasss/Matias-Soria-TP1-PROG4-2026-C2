import { Component, computed, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';

@Component({
  imports: [AsyncPipe],
  selector: 'app-codigo-qr',
  styleUrl: './codigo-qr.css',
  templateUrl: './codigo-qr.html',
})
export class CodigoQr {
  // lo que lleva el QR: el código de la compra, el mismo que lee Validar QR
  texto = input.required<string>();
  // la imagen del QR es una Promise (qrcode tarda un poco en armarla): el HTML la espera con el pipe async.
  // Si cambia el texto, computed arma otra
  imagen = computed(() => this.armar(this.texto()));

  // la librería qrcode se baja recién cuando hay un QR para mostrar. Es CommonJS: en el build de producción viene en default
  private async armar(texto: string) {
    const qrcode = (await import('qrcode')).default;
    return qrcode.toDataURL(texto, { width: 360, margin: 1 });
  }
}
