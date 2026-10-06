// actualmente en uso en: admin-candy.ts, formulario-combo.ts, que-incluye.pipe.ts, reservas.ts, combos-destacados.ts
import { ComboProducto } from './combo-producto';

// lo que trae está en combo_productos (llega si se pide en el select). Si incluye_entrada,
// en la compra reemplaza el precio de una entrada

export interface Combo {
  id: string;
  nombre: string;
  precio: number;
  // lo que cuesta en puntos el combo entero (con la entrada, si la trae). null = no se canjea
  precio_puntos: number | null;
  incluye_entrada: boolean;
  // apagado, el cliente no lo ve (el admin sí)
  disponible: boolean;
  combo_productos: ComboProducto[];
}
