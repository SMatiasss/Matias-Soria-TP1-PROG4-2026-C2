// actualmente en uso en: pedidos.service.ts (lo arma reservas.ts al pagar)
// no es una tabla: lo que se le manda a la función comprar.
// butacas_con_puntos son las que se canjean, y el crédito no se manda porque se usa siempre
export interface CompraNueva {
  funcion_id: string;
  butacas: string[];
  butacas_con_puntos: string[];
  candy: { id: string; cantidad: number; con_puntos: boolean }[];
  cupon_id: string | null;
}
