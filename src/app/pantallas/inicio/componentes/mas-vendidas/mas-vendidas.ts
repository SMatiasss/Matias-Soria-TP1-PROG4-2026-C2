import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardPelicula } from '../../../../globales/componentes/card-pelicula/card-pelicula';
import { Pelicula } from '../../../../logica/modelos/peliculas';

@Component({
  imports: [RouterLink, CardPelicula],
  selector: 'app-mas-vendidas',
  styleUrl: './mas-vendidas.css',
  templateUrl: './mas-vendidas.html',
})
export class MasVendidas {
  // Ya vienen ordenadas de la más vendida a la menos vendida
  peliculas = input.required<Pelicula[]>();
}
