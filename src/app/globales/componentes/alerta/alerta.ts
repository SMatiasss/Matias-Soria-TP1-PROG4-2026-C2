import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-alerta',
  styleUrl: './alerta.css',
  templateUrl: './alerta.html',
})
export class Alerta {
  titulo = input.required<string>();
  descripcion = input.required<string>();
  textoBoton = input('Continuar');
  continuar = output<void>();
}
