import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../../../logica/services/db.service';
import { CandyService } from '../../../../../logica/services/candy.service';
import { Combo } from '../../../../../logica/modelos/candy';

@Component({
  imports: [Alerta, ReactiveFormsModule],
  selector: 'app-formulario-combo',
  styleUrl: './formulario-combo.css',
  templateUrl: './formulario-combo.html',
})
export class FormularioCombo implements OnInit {
  private db = inject(DbService);
  private cs = inject(CandyService);

  // null = combo nuevo
  combo = input<Combo | null>(null);
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

  formulario = new FormGroup({
    nombre: new FormControl('', Validators.required),
    descripcion: new FormControl('', Validators.required),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    disponible: new FormControl(true),
  });

  // al editar arranca con los datos del combo
  ngOnInit() {
    const combo = this.combo();
    if (combo) this.formulario.reset(combo);
  }

  async guardar() {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    // el cambio de precio lo anota en el log un trigger de la base (log_precio_combo)
    const combo = this.combo();
    const salioBien = combo
      ? await this.db.update('combos', combo.id, this.formulario.value)
      : await this.db.create('combos', this.formulario.value);
    this.guardando.set(false);

    if (!salioBien) {
      this.error.set('No se pudo guardar el combo. Revisá los datos e intentá de nuevo.');
      return;
    }
    this.guardado.emit();
  }

  async eliminar() {
    this.confirmandoEliminar.set(false);
    const combo = this.combo();
    if (!combo) return;
    const { error, borrado } = await this.cs.eliminar('combos', combo.id);

    // P0001 es el "raise exception" del trigger que no deja borrar el combo si ya se vendió.
    // Ese mensaje ya está escrito para el admin. Sin error y sin fila borrada, RLS no lo dejó borrar
    if (error && error.code === 'P0001') this.error.set(error.message);
    else if (!borrado) this.error.set('No se pudo eliminar el combo. Intentá de nuevo.');
    else this.eliminado.emit();
  }
}
