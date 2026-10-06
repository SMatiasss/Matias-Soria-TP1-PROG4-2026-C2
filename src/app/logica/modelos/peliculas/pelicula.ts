// actualmente en uso en: peliculas.service.ts, inicio.ts, detalle.ts, card-pelicula.ts, mas-vendidas.ts, carrusel-estrenos.ts, admin-peliculas.ts, formulario-pelicula.ts, formulario-funciones.ts, funcion.ts

// restriccion_edad usa los valores de RESTRICCIONES_EDAD (restriccion-edad.ts)
// el precio normal está en cada función: preventa_precio solo vale en los días de preventa

export interface Pelicula {
  id: string;
  titulo: string;
  sinopsis: string;
  imagen_url: string;
  duracion_minutos: number;
  generos: string[];
  restriccion_edad: number | null;
  visible: boolean;
  fecha_estreno: string;
  preventa_habilitada: boolean;
  preventa_precio: number | null;
  preventa_dias_antes: number | null;
}
