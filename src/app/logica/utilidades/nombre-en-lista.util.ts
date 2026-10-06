import { AbstractControl } from '@angular/forms';
import { sinTildes } from './sin-tildes.util';

// Para comparar nombres sin contar mayúsculas ni tildes: "Pochoclos" y "pochoclos" son el mismo
function comparable(nombre: string) {
  return sinTildes(nombre.trim()).toLowerCase();
}

// si ya hay uno igual (sin mayúsculas ni tildes) se usa ese, si no va con la primera en mayúscula
export function nombreEnLista(escrito: string, existentes: string[]) {
  const existente = existentes.find((nombre) => comparable(nombre) === comparable(escrito));
  return existente ? existente : escrito[0].toUpperCase() + escrito.slice(1).toLowerCase();
}

// validator: que no sea ninguno de estos. Recibe una función porque la lista puede cambiar
export function nombreLibreValidator(usados: () => string[]) {
  return (control: AbstractControl) => {
    if (!control.value) return null;
    return usados().some((nombre) => comparable(nombre) === comparable(control.value)) ? { nombreUsado: true } : null;
  };
}
