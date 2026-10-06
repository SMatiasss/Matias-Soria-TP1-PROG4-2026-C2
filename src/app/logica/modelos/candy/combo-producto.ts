// actualmente en uso en: combo.ts (lo cargan candy.service.ts, admin-candy.ts y reservas.ts)
import { Producto } from './producto';

// un producto dentro de un combo y cuántos trae (tabla combo_productos). producto llega si se pide en el select

export interface ComboProducto {
  combo_id: string;
  producto_id: string;
  cantidad: number;
  producto: Producto;
}
