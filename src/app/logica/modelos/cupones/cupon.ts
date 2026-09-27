// aún no se usa (puedo modificarlo)
// audiencia usa los valores de AUDIENCIAS_CUPON (audiencia-cupon.ts)

export interface Cupon {
  id: string;
  codigo: string;
  audiencia: string;
  porcentaje: number;
  activo: boolean;
}