// actualmente en uso en: reservas.ts, resumen-compra.ts
// No es una tabla: es una línea del resumen de compra, un producto o combo elegido con su cantidad
// id es el id del producto o del combo. conPuntos: se canjea con puntos (subtotal en puntos) o se paga con plata

export interface LineaCandy {
  id: string;
  nombre: string;
  cantidad: number;
  conPuntos: boolean;
  subtotal: number;
}
