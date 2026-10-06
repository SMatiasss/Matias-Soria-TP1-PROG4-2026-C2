// actualmente en uso en: formulario-funciones.ts
// Lo que carga el admin para programar funciones. No es una tabla:
// con estos datos se crea una función por cada día elegido, y la sala la elige la base

export interface FuncionFormulario {
  pelicula_id: string;
  formato: string;
  idioma: string;
  precio_base: number;
  precio_vip: number;
  precio_puntos: number;
  precio_puntos_vip: number;
  // días de la semana como los numera getDay(): 0 = domingo, 1 = lunes ... 6 = sábado
  dias: number[];
  hora: number;
  minutos: number;
  // AAAA-MM-DD, el primer día que se programa
  desde: string;
  // durante cuántas semanas se repite
  semanas: number;
}
