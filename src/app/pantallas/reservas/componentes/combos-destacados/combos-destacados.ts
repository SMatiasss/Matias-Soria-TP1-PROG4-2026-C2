import { Component, input, model } from '@angular/core';
import { Badge } from '../../../../globales/componentes/badge/badge';
import { Contador } from '../../../../globales/componentes/contador/contador';
import { Combo } from '../../../../logica/modelos/candy';
import { PrecioPipe } from '../../../../globales/pipes/precio.pipe';
import { PuntosPipe } from '../../../../globales/pipes/puntos.pipe';
import { QueIncluyePipe } from '../../../../globales/pipes/que-incluye.pipe';

@Component({
  imports: [Badge, Contador, PrecioPipe, PuntosPipe, QueIncluyePipe],
  selector: 'app-combos-destacados',
  styleUrl: './combos-destacados.css',
  templateUrl: './combos-destacados.html',
})
export class CombosDestacados {
  combos = input.required<Combo[]>();
  // en puntos: los precios se muestran en puntos ("Sin canje" si no se puede) y lo que se agrega se canjea
  conPuntos = input(false);
  // cantidad elegida de cada producto o combo, va y vuelve con el padre: [(cantidades)]
  cantidades = model.required<Record<string, number>>();

  cambiarCantidad(id: string, cantidad: number) {
    this.cantidades.update((actuales) => ({ ...actuales, [id]: cantidad }));
  }
}
