// actualmente en uso en: resenas.service.ts

export interface Reseña {
  id: string;
  pelicula_id: string;
  usuario_id: string;
  calificacion: number;
  comentario: string | null;
  creada_en: string;
}
