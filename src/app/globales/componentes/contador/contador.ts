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
    this.cantidad.update((c) => Math.max(0, c - 1));
  }

  sumar() {
    this.cantidad.update((c) => c + 1);
  }
}
