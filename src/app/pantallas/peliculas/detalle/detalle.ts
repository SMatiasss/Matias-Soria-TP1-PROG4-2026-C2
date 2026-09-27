import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Header } from '../../../globales/componentes/header/header';
import { CardPelicula } from '../../../globales/componentes/card-pelicula/card-pelicula';
import { Badge } from '../../../globales/componentes/badge/badge';
import { CalificacionEstrellas } from '../../../globales/componentes/calificacion-estrellas/calificacion-estrellas';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { FuncionesPelicula } from './componentes/funciones-pelicula/funciones-pelicula';
import { ReseñasPelicula } from './componentes/resenas-pelicula/resenas-pelicula';
import { DbService } from '../../../logica/services/db.service';
import { FuncionesService } from '../../../logica/services/funciones.service';
import { ReseñasService } from '../../../logica/services/resenas.service';
import { Pelicula } from '../../../logica/modelos/peliculas/pelicula';
import { Funcion } from '../../../logica/modelos/peliculas/funcion';
import { sinRepetidos } from '../../../logica/utilidades/sin-repetidos.util';

@Component({
  imports: [Header, CardPelicula, Badge, CalificacionEstrellas, EstadoVacio, FuncionesPelicula, ReseñasPelicula],
  selector: 'app-detalle',
  styleUrl: './detalle.css',
  templateUrl: './detalle.html',
})
export class Detalle {
  private db = inject(DbService);
  private fs = inject(FuncionesService);
  private res = inject(ReseñasService);

  // id de la película, viene de la ruta /pelicula/:peliculaId
  peliculaId = input.required<string>();

  cargando = signal(true);
  pelicula = signal<Pelicula | null>(null);
  funciones = signal<Funcion[]>([]);

  // Las carga el componente de reseñas, acá solo se muestra el promedio abajo del póster
  resenas = this.res.resenasDePelicula;
  promedio = this.res.promedio;
  promedioTexto = this.res.promedioTexto;

  // El formato se guarda en cada función, no en la película: sale de sus funciones
  formatos = computed(() => sinRepetidos(this.funciones().map((f) => f.formato)));

  constructor() {
    // Profe, puedo usar effect()? es muy práctico que se ejecute cada vez que un signal se actualice
    effect(() => {
      this.cargarPelicula(this.peliculaId());
    });
  }

  private async cargarPelicula(id: string) {
    this.cargando.set(true);

    // Si la película no existe o no está visible, RLS no la devuelve y se muestra "No encontramos esa película"
    const pelicula = await this.db.findById('peliculas', id);

    // Consulta, mi funciones service tiene un sola sola función, conviene borrar el service
    // y colocar "cargarFuncionesDePelicula()" acá ya que solo se usa acá?
    const funciones = await this.fs.cargarFuncionesDePelicula(id); 
    // Otra consulta, podría usar await Promise.all() ? para que las cargas de arriba se hagan a la vez en vez de que espere a la anterior.

    this.pelicula.set(pelicula);
    this.funciones.set(funciones);
    this.cargando.set(false);
  }
}
