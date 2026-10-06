// actualmente en uso en: pedido.ts

export interface ItemCandy {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  combo_id: string | null;
  nombre: string;
  cantidad: number;
  precio: number;
  usado: boolean;
  // los puntos que costó cada unidad si se canjeó (0 = se pagó con plata). Sirve para el historial de canjes
  puntos: number;
}
