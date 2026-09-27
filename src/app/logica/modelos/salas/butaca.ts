// actualmente en uso en: mapa-butacas.ts, sala.ts
// tipo usa los valores de TIPOS_BUTACA (tipo-butaca.ts)

export interface Butaca {
  id: string;
  sala_id: string;
  fila: string;
  columna: number;
  tipo: string;
}
