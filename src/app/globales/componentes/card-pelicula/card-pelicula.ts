import { Component, input } from '@angular/core';
import { Badge } from '../badge/badge';
import { Pelicula } from '../../../logica/modelos/peliculas/pelicula';

@Component({
  imports: [Badge],
  selector: 'app-card-pelicula',
  styleUrl: './card-pelicula.css',
  templateUrl: './card-pelicula.html',
})
export class CardPelicula {
  pelicula = input.required<Pelicula>();
  
  // Para las filas donde el título va al costado del póster y no debajo (ej: más vendidas, próximamente): [sinTitulo]="true"
  sinTitulo = input(false);
}
