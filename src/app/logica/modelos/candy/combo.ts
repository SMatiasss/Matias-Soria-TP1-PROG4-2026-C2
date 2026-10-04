// actualmente en uso en: admin-candy.ts, formulario-combo.ts

export interface Combo {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  // apagado, el cliente no lo ve (el admin sí)
  disponible: boolean;
}