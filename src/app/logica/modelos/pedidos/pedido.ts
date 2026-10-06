// actualmente en uso en: pedidos.service.ts, validar.ts, perfil.ts
import { ItemEntrada } from './item-entrada';
import { ItemCandy } from './item-candy';
import { Funcion } from '../peliculas/funcion';

// estado usa los valores de ESTADOS_PEDIDO (estado-pedido.ts)
// funcion, entradas e items_candy llegan si se piden en el select. codigo es el QR, uno solo por compra

export interface Pedido {
  id: string;
  codigo: string;
  usuario_id: string | null;
  funcion_id: string;
  funcion: Funcion;
  entradas: ItemEntrada[];
  items_candy: ItemCandy[];
  codigo_cupon: string | null;
  descuento_aplicado: number;
  puntos_usados: number;
  puntos_ganados: number;
  credito_usado: number;
  total: number;
  creado_en: string;
  estado: string;
}
