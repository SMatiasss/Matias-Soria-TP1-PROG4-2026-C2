import { Component, input } from '@angular/core';
import { Badge } from '../badge/badge';
import { Pelicula } from '../../../logica/modelos/peliculas';

// Solo el póster con sus badges. El título, si hace falta, lo pone cada pantalla debajo (clase global .titulo-tarjeta-pelicula)
@Component({
  imports: [Badge],
  selector: 'app-card-pelicula',
  styleUrl: './card-pelicula.css',
  templateUrl: './card-pelicula.html',
})
export class CardPelicula {
  pelicula = input.required<Pelicula>();
}
