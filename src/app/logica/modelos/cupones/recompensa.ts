// aún no se usa (puedo modificarlo)
// tipo usa los valores de TIPOS_RECOMPENSA (tipo-recompensa.ts)

export interface Recompensa {
  id: string;
  nombre: string;
  costo_en_puntos: number;
  tipo: string;
  producto_id: string | null;
}
