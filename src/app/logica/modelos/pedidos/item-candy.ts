// aún no se usa (puedo modificarlo)

export interface ItemCandy {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  combo_id: string | null;
  nombre: string;
  cantidad: number;
  precio: number;
  usado: boolean;
}
