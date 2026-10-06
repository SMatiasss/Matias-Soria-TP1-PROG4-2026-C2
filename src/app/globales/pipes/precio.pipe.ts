import { Pipe, PipeTransform } from '@angular/core';

// 5200 → "$ 5.200", con el punto de los miles y hasta 2 decimales, como se escribe en Argentina.
// Con 'sin signo' devuelve solo el número ("5.200"): lo usan las listas del admin, que ponen el $ en su propia columna para alinearlo
@Pipe({ name: 'precio' })
export class PrecioPipe implements PipeTransform {
  transform(valor: number | null, formato = 'con signo') {
    if (valor === null) return '';
    const numero = valor.toLocaleString('es-AR', { maximumFractionDigits: 2 });
    return formato === 'sin signo' ? numero : '$ ' + numero;
  }
}
