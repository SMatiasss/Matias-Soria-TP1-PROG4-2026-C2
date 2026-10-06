// actualmente en uso en: funcion.ts (lo cargan funciones.service.ts, reservas.ts e info-funcion.ts), admin-funciones.ts
import { Butaca } from './butaca';

export interface Sala {
  id: string;
  nombre: string;
  butacas: Butaca[];
}
