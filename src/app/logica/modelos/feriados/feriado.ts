// actualmente en uso en: feriados.service.ts
// No es una tabla: lo que devuelve la API de feriados. fecha: "2026-02-16", tipo: "inamovible", nombre: "Carnaval"
export interface Feriado {
  fecha: string;
  tipo: string;
  nombre: string;
}
