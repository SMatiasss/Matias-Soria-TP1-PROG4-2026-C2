import { Component, computed, input } from '@angular/core';
import { DatoGrafico } from '../../../logica/modelos/reportes';

// Barras horizontales hechas solo con CSS: cada una mide según su valor, y la del valor más alto ocupa todo el ancho.
// Las usa reportes para las películas más vistas y para lo más vendido del candy
@Component({
  imports: [],
  selector: 'app-grafico-barras',
  styleUrl: './grafico-barras.css',
  templateUrl: './grafico-barras.html',
})
export class GraficoBarras {
  // ya vienen ordenados, del más alto al más bajo
  datos = input.required<DatoGrafico[]>();

  maximo = computed(() => Math.max(...this.datos().map((dato) => dato.valor)));
}
