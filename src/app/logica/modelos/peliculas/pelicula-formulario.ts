// actualmente en uso en: formulario-pelicula.ts
// Lo que carga el admin en el formulario de una película. No es una tabla:
// la imagen se sube aparte (imagen_url sale de Storage)

export interface PeliculaFormulario {
  titulo: string;
  sinopsis: string;
  duracion_minutos: number;
  generos: string[];
  restriccion_edad: number | null;
  fecha_estreno: string;
  visible: boolean;
  preventa_habilitada: boolean;
  preventa_precio: number | null;
  preventa_dias_antes: number | null;
}
