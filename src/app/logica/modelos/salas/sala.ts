// actualmente en uso en: funcion.ts (lo carga funciones.service.ts)
import { Butaca } from './butaca';

export interface Sala {
  id: string;
  nombre: string;
  butacas: Butaca[];
}
