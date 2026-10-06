import { Component, input, output } from '@angular/core';
import { Badge } from '../../../../globales/componentes/badge/badge';
import { LineaEntrada, LineaCandy } from '../../../../logica/modelos/pedidos';
import { TIPOS_BUTACA } from '../../../../logica/modelos/salas';
import { PrecioPipe } from '../../../../globales/pipes/precio.pipe';

@Component({
  imports: [Badge],
  selector: 'app-resumen-compra',
  styleUrl: './resumen-compra.css',
  templateUrl: './resumen-compra.html',
})
export class ResumenCompra {
  readonly tipos = TIPOS_BUTACA;
  // el mismo pipe del resto de la app, para escribir los montos en pesos desde monto()
  private precio = new PrecioPipe();

  enPreventa = input(false);
  lineasEntradas = input.required<LineaEntrada[]>();
  lineasCandy = input<LineaCandy[]>([]);
  // lo que no se cobra de las entradas que vienen en un combo, en plata y en puntos
  descuentoCombosPesos = input(0);
  descuentoCombosPuntos = input(0);
  descuentoCupon = input(0);
  codigoCuponAplicado = input<string | null>(null);
  creditoUsado = input(0);
  // en una compra se paga con plata una parte y se canjea con puntos otra
  totalPesos = input.required<number>();
  totalPuntos = input(0);
  // sin sesión es null: no hay puntos
  puntosDisponibles = input<number | null>(null);
  puntosAGanar = input(0);
  motivoBloqueo = input<string | null>(null);
  comprando = input(false);
  pagar = output<void>();

  // un monto en plata ("$ 5.200") o en puntos ("1.000 puntos")
  monto(valor: number, conPuntos: boolean) {
    return conPuntos ? valor.toLocaleString('es-AR') + ' puntos' : this.precio.transform(valor);
  }
}
