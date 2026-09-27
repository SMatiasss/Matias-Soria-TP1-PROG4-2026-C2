// aún no se usa (puedo modificarlo)
// tipo_butaca usa los valores de TIPOS_BUTACA (../salas/tipo-butaca.ts)
// funcion_id repite el del pedido a propósito: permite el unique (funcion_id, butaca_id) que impide vender dos veces la misma butaca

export interface ItemEntrada {
  id: string;
  pedido_id: string;
  funcion_id: string;
  butaca_id: string;
  tipo_butaca: string;
  precio: number;
  usado: boolean;
}
