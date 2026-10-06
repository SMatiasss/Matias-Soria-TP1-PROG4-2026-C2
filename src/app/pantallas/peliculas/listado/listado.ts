import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../../../globales/componentes/header/header';
import { CardPelicula } from '../../../globales/componentes/card-pelicula/card-pelicula';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { SelectorChips } from '../../../globales/componentes/selector-chips/selector-chips';
import { Badge } from '../../../globales/componentes/badge/badge';
import { PeliculasService } from '../../../logica/services/peliculas.service';
import { sinTildes } from '../../../logica/utilidades/sin-tildes.util';

@Component({
  imports: [Header, CardPelicula, EstadoVacio, SelectorChips, Badge, RouterLink],
  selector: 'app-listado',
  styleUrl: './listado.css',
  templateUrl: './listado.html',
})
export class Listado {
  private ps = inject(PeliculasService);

  generosDisponibles = this.ps.generosDisponibles;
  // las que todavía no se estrenaron llevan el badge "Próximamente"
  idsPeliculasPorEstrenar = this.ps.idsPeliculasPorEstrenar;
  hayPeliculas = computed(() => this.ps.peliculasVisibles().length > 0);
  // mientras llegan dice "Cargando..." y no "No hay películas"
  cargandoPeliculas = this.ps.cargandoVisibles;
  textoBusqueda = signal('');
  generosSeleccionados = signal<string[]>([]);

  // Se recalcula solo cada vez que cambia la búsqueda, los géneros elegidos o las películas.
  peliculasFiltradas = computed(() => {
    const texto = sinTildes(this.textoBusqueda().trim().toLowerCase());
    const generos = this.generosSeleccionados();

    return this.ps.peliculasVisibles().filter(
      (p) =>
        sinTildes(p.titulo.toLowerCase()).includes(texto) &&
        (generos.length === 0 || p.generos.some((g) => generos.includes(g))),
    );
  });

  constructor() {
    this.ps.cargarPeliculasVisibles();
  }

  alBuscar(evento: Event) {
    this.textoBusqueda.set((evento.target as HTMLInputElement).value);
  }
}
