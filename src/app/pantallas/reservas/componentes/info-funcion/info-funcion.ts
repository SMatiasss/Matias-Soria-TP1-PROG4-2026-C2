import { Component, computed, input } from '@angular/core';
import { CardPelicula } from '../../../../globales/componentes/card-pelicula/card-pelicula';
import { Badge } from '../../../../globales/componentes/badge/badge';
import { Funcion } from '../../../../logica/modelos/peliculas';

@Component({
  imports: [CardPelicula, Badge],
  selector: 'app-info-funcion',
  styleUrl: './info-funcion.css',
  templateUrl: './info-funcion.html',
})
export class InfoFuncion {
  funcion = input.required<Funcion>();

  fechaTexto = computed(() =>
    new Date(this.funcion().inicio).toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
  );

  horaTexto = computed(() =>
    new Date(this.funcion().inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  );
}
