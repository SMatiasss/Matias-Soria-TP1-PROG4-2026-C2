// actualmente en uso en: funciones.service.ts, detalle.ts, funciones-pelicula.ts, admin-funciones.ts
import { Pelicula } from './pelicula';
import { Sala } from '../salas/sala';

// formato usa los valores de FORMATOS_FUNCION (formato-funcion.ts)
// idioma usa los valores de IDIOMAS_FUNCION (idioma-funcion.ts)
// pelicula y sala llegan si se piden en el select: .select('*, pelicula:peliculas(*), sala:salas(*, butacas(*))')

export interface Funcion {
  id: string;
  pelicula_id: string;
  sala_id: string;
  inicio: string;
  formato: string;
  idioma: string;
  precio_base: number;
  precio_vip: number;
  pelicula: Pelicula;
  sala: Sala;
}
