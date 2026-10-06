import { Component, input, model } from '@angular/core';
import { Contador } from '../../../../globales/componentes/contador/contador';
import { Producto } from '../../../../logica/modelos/candy';
import { PrecioPipe } from '../../../../globales/pipes/precio.pipe';
import { PuntosPipe } from '../../../../globales/pipes/puntos.pipe';

@Component({
  imports: [Contador, PrecioPipe, PuntosPipe],
  selector: 'app-candy-bar',
  styleUrl: './candy-bar.css',
  templateUrl: './candy-bar.html',
})
export class CandyBar {
  categorias = input.required<{ nombre: string; productos: Producto[] }[]>();
  // en puntos: los precios se muestran en puntos ("Sin canje" si no se puede) y lo que se agrega se canjea
  conPuntos = input(false);
  // cantidad elegida de cada producto o combo, va y vuelve con el padre: [(cantidades)]
  cantidades = model.required<Record<string, number>>();

  cambiarCantidad(id: string, cantidad: number) {
    this.cantidades.update((actuales) => ({ ...actuales, [id]: cantidad }));
  }
}
