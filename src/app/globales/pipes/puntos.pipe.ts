import { Pipe, PipeTransform } from '@angular/core';

// 1500 → "1.500 puntos". Sin precio en puntos (null), eso no se puede canjear: "Sin canje"
@Pipe({ name: 'puntos' })
export class PuntosPipe implements PipeTransform {
  transform(valor: number | null) {
    if (!valor) return 'Sin canje';
    return valor.toLocaleString('es-AR') + ' puntos';
  }
}
