// actualmente en uso en: reservas.ts, resumen-compra.ts
// tipo usa los valores de TIPOS_BUTACA (../salas/tipo-butaca.ts)
// No es una tabla: es una línea del resumen de compra, agrupa las butacas elegidas del mismo tipo que se pagan igual.
// conPuntos: se canjean con puntos (subtotal en puntos) o se pagan con plata (subtotal en pesos)

export interface LineaEntrada {
  tipo: string;
  cantidad: number;
  conPuntos: boolean;
  subtotal: number;
}
