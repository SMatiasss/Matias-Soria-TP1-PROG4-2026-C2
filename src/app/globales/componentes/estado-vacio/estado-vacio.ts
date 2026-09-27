import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-estado-vacio',
  styleUrl: './estado-vacio.css',
  templateUrl: './estado-vacio.html',
})
export class EstadoVacio {
  mensaje = input.required<string>();
}
