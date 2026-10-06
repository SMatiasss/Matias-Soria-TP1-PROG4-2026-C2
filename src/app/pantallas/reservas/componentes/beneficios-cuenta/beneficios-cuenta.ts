import { Component, input, model } from '@angular/core';
import { Badge } from '../../../../globales/componentes/badge/badge';
import { Usuario } from '../../../../logica/modelos/usuarios';
import { Cupon } from '../../../../logica/modelos/cupones';
import { PrecioPipe } from '../../../../globales/pipes/precio.pipe';

@Component({
  imports: [Badge, PrecioPipe],
  selector: 'app-beneficios-cuenta',
  styleUrl: './beneficios-cuenta.css',
  templateUrl: './beneficios-cuenta.html',
})
export class BeneficiosCuenta {
  usuario = input.required<Usuario>();
  cuponPrimeraCompra = input<Cupon | null>(null);
  cuponesMayores = input<Cupon[]>([]);

  cuponAplicado = model<Cupon | null>(null);

  // Un solo cupón por compra: pedido guarda un único codigo_cupon
  alternarCupon(cupon: Cupon) {
    this.cuponAplicado.update((actual) => (actual?.id === cupon.id ? null : cupon));
  }
}
