// aún no se usa (puedo modificarlo)
// tipo usa los valores de TIPOS_BUTACA (../salas/tipo-butaca.ts)
// No es una tabla: es una línea del resumen de compra, agrupa las butacas elegidas del mismo tipo

export interface LineaEntrada {
  tipo: string;
  cantidad: number;
  subtotal: number;
}
