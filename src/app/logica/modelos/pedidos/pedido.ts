// aún no se usa (puedo modificarlo)
import { ItemEntrada } from './item-entrada';
import { ItemCandy } from './item-candy';

// estado usa los valores de ESTADOS_PEDIDO (estado-pedido.ts)
// entradas e items_candy llegan si se piden en el select: .select('*, entradas(*), items_candy(*)')
// codigo es el único QR de la compra: sirve para las entradas y para retirar el candy

export interface Pedido {
  id: string;
  codigo: string;
  usuario_id: string | null;
  funcion_id: string;
  entradas: ItemEntrada[];
  items_candy: ItemCandy[];
  codigo_cupon: string | null;
  descuento_aplicado: number;
  recompensa_canjeada_nombre: string | null;
  puntos_usados: number;
  puntos_ganados: number;
  credito_usado: number;
  total: number;
  creado_en: string;
  estado: string;
}
