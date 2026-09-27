// actualmente en uso en: peliculas.service.ts, inicio.ts, card-pelicula.ts, mas-vendidas.ts, carrusel-estrenos.ts

// restriccion_edad usa los valores de RESTRICCIONES_EDAD (restriccion-edad.ts)
// el precio normal está en cada función (precio_base / precio_vip), preventa_precio solo se usa
// para compras hechas entre (fecha_estreno - preventa_dias_antes) y fecha_estreno

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
