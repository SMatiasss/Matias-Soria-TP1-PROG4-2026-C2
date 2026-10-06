// actualmente en uso en: pedidos.service.ts, admin-reportes.ts
// No es una tabla: una fila del reporte de facturación, lo que se vendió en un día
// dia va como AAAA-MM-DD, en hora local

export interface VentaDelDia {
  dia: string;
  entradas: number;
  facturacion: number;
}
