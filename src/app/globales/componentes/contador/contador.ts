import { Component, model } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-contador',
  styleUrl: './contador.css',
  templateUrl: './contador.html',
})
export class Contador {
  cantidad = model(0);

  restar() {
    // El botón ya está apagado en 0, pero igual nunca baja de 0
    if (this.cantidad() > 0) this.cantidad.update((c) => c - 1);
  }

  sumar() {
    this.cantidad.update((c) => c + 1);
  }
}
