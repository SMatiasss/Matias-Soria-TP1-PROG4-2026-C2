// actualmente en uso en: admin-cupones.ts, formulario-cupon.ts, reservas.ts, beneficios-cuenta.ts
// audiencia usa los valores de AUDIENCIAS_CUPON (audiencia-cupon.ts)

export interface Cupon {
  id: string;
  codigo: string;
  audiencia: string;
  porcentaje: number;
  activo: boolean;
}