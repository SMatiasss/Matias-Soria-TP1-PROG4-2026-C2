import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';

// "2026-10-15" → "15/10/2026". Con otro formato también muestra la hora: 'dd/MM/yyyy HH:mm' para el inicio de una función.
// parseISO (date-fns) lee las dos formas que llegan de la base, "AAAA-MM-DD" y fecha con hora en UTC, y las muestra en hora local
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | null, formato = 'dd/MM/yyyy') {
    if (!valor) return '';
    return format(parseISO(valor), formato);
  }
}
