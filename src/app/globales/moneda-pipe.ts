import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moneda',
})
export class MonedaPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
