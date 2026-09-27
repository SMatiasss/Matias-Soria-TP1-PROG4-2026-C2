// aún no se usa (puedo modificarlo)
// No es una tabla: es una línea del resumen de compra, un producto o combo elegido con su cantidad
// id es el id del producto o del combo

export interface LineaCandy {
  id: string;
  nombre: string;
  cantidad: number;
  subtotal: number;
}
