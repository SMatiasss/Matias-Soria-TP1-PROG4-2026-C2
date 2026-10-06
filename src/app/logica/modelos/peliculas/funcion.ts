// actualmente en uso en: detalle.ts, funciones-pelicula.ts, admin-funciones.ts, formulario-funciones.ts, pedidos.service.ts, pedido.ts, reservas.ts, info-funcion.ts
import { Pelicula } from './pelicula';
import { Sala } from '../salas/sala';

// formato usa los valores de FORMATOS_FUNCION (formato-funcion.ts)
// idioma usa los valores de IDIOMAS_FUNCION (idioma-funcion.ts)
// pelicula y sala llegan si se piden en el select

export interface Funcion {
  id: string;
  pelicula_id: string;
  sala_id: string;
  inicio: string;
  formato: string;
  idioma: string;
  precio_base: number;
  precio_vip: number;
  // cuántos puntos cuesta canjear una entrada normal o VIP de esta función, en vez de pagarla
  precio_puntos: number;
  precio_puntos_vip: number;
  pelicula: Pelicula;
  sala: Sala;
}
