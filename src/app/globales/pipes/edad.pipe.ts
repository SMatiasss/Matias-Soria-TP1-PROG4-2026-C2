import { Pipe, PipeTransform } from '@angular/core';

// La restricción de edad de una película: 18 → "+18". Sin restricción (null) → "Todo público"
@Pipe({ name: 'edad' })
export class EdadPipe implements PipeTransform {
  transform(edad: number | null) {
    return edad ? '+' + edad : 'Todo público';
  }
}
