import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardPelicula } from '../../../../globales/componentes/card-pelicula/card-pelicula';
import { Pelicula } from '../../../../logica/modelos/peliculas';

@Component({
  imports: [RouterLink, CardPelicula],
  selector: 'app-carrusel-estrenos',
  styleUrl: './carrusel-estrenos.css',
  templateUrl: './carrusel-estrenos.html',
})
export class CarruselEstrenos {
  peliculas = input.required<Pelicula[]>();
  idsPeliculasConAlerta = input.required<string[]>();   // ids de las películas que ya tienen la alerta de estreno activada
  alertaSolicitada = output<Pelicula>();

  private readonly listaEstrenos = viewChild.required<ElementRef<HTMLUListElement>>('listaEstrenos');

  mover(direccion: number) {
    const lista = this.listaEstrenos().nativeElement;
    // scrollBy con smooth: la lista se mueve animada, un tercio de su alto (una película)
    lista.scrollBy({ top: (lista.clientHeight / 3) * direccion, behavior: 'smooth' });
  }
}
