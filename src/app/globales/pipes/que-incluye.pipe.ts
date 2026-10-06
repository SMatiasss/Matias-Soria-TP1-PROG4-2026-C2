import { Pipe, PipeTransform } from '@angular/core';
import { Combo } from '../../logica/modelos/candy';

// Un combo → "Entrada + 2 × Pochoclos grande + 2 × Gaseosa grande", armado con sus productos (combo_productos)
@Pipe({ name: 'queIncluye' })
export class QueIncluyePipe implements PipeTransform {
  transform(combo: Combo) {
    const partes = combo.combo_productos.map((item) => `${item.cantidad} × ${item.producto.nombre}`);
    if (combo.incluye_entrada) partes.unshift('Entrada');
    return partes.join(' + ');
  }
}
