// actualmente en uso en: admin-candy.ts, formulario-producto.ts, formulario-combo.ts, combo-producto.ts, reservas.ts, candy-bar.ts

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  // cuántos puntos cuesta canjearlo en vez de pagarlo. null = no se puede canjear con puntos
  precio_puntos: number | null;
  // apagado, el cliente no lo ve (el admin sí)
  disponible: boolean;
}