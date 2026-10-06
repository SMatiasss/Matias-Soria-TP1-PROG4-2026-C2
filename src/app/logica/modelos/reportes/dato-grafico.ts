// actualmente en uso en: grafico-barras.ts, pedidos.service.ts, admin-reportes.ts
// No es una tabla: una barra de un gráfico, con su texto y su valor (ej: una película y cuántas entradas vendió)

export interface DatoGrafico {
  etiqueta: string;
  valor: number;
}
