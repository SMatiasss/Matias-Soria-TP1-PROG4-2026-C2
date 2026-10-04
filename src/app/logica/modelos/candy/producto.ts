// actualmente en uso en: admin-candy.ts, formulario-producto.ts

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  // apagado, el cliente no lo ve (el admin sí)
  disponible: boolean;
}