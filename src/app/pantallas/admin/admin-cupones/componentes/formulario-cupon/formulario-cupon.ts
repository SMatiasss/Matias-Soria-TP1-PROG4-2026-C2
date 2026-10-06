import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../../../logica/services/db.service';
import { AUDIENCIAS_CUPON, Cupon } from '../../../../../logica/modelos/cupones';

@Component({
  imports: [Alerta, ReactiveFormsModule],
  selector: 'app-formulario-cupon',
  styleUrl: './formulario-cupon.css',
  templateUrl: './formulario-cupon.html',
})
export class FormularioCupon implements OnInit {
  private db = inject(DbService);

  // null = cupón nuevo
  cupon = input<Cupon | null>(null);
  // si ya hay uno de primera compra no se puede crear otro, pero sí editar ese
  hayPrimeraCompra = input(false);
  // avisan a la lista para que cierre el formulario (y recargue, si se guardó o se eliminó)
  cancelado = output<void>();
  guardado = output<void>();
  eliminado = output<void>();

  intentoGuardar = signal(false);
  guardando = signal(false);
  // si no se pudo guardar o eliminar, se muestra en un modal
  error = signal<string | null>(null);
  // tocó Eliminar y falta que confirme
  confirmandoEliminar = signal(false);

  readonly audiencias = AUDIENCIAS_CUPON;

  formulario = new FormGroup({
    codigo: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
    // uno nuevo arranca para mayores de 50: el de primera compra ya suele existir
    audiencia: new FormControl(AUDIENCIAS_CUPON.MAYORES_50),
    porcentaje: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(100)]),
    activo: new FormControl(true),
  });

  // al editar arranca con los datos del cupón
  ngOnInit() {
    const cupon = this.cupon();
    if (cupon) this.formulario.reset(cupon);
  }

  // la opción de primera compra se apaga si ya hay otro cupón de primera compra (y no es este)
  primeraCompraOcupada() {
    return this.hayPrimeraCompra() && this.cupon()?.audiencia !== AUDIENCIAS_CUPON.PRIMERA_COMPRA;
  }

  async guardar() {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const cupon = this.cupon();
    // el código se guarda en mayúsculas y sin espacios en los bordes: así no puede haber "jubilados" y "JUBILADOS"
    const codigo = (this.formulario.controls.codigo.value as string).trim().toUpperCase();
    const error = await this.db.guardar('cupones', cupon ? cupon.id : null, { ...this.formulario.value, codigo });
    this.guardando.set(false);

    if (error) {
      // 23505: el código es único. 23503: las compras guardan el código del cupón que usaron, así que si ya se usó no se puede cambiar
      if (error.code === '23505') this.error.set('Ya hay un cupón con ese código.');
      else if (error.code === '23503') this.error.set('Este cupón ya se usó en compras, no se le puede cambiar el código. Podés desactivarlo y crear otro.');
      else this.error.set('No se pudo guardar el cupón. Revisá los datos e intentá de nuevo.');
      return;
    }
    this.guardado.emit();
  }

  async eliminar() {
    this.confirmandoEliminar.set(false);
    const cupon = this.cupon();
    if (!cupon) return;
    const { error, borrado } = await this.db.eliminar('cupones', cupon.id);

    // 23503: la base no deja borrar algo que otra tabla usa, acá las compras que lo usaron
    if (error && error.code === '23503') this.error.set('Este cupón ya se usó en compras, no se puede eliminar. Podés desactivarlo.');
    else if (!borrado) this.error.set('No se pudo eliminar el cupón. Intentá de nuevo.');
    else this.eliminado.emit();
  }
}
