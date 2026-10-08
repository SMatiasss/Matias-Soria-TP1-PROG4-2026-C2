import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../../../logica/services/db.service';
import { Producto } from '../../../../../logica/modelos/candy';

@Component({
  imports: [Alerta, ReactiveFormsModule],
  selector: 'app-formulario-producto',
  styleUrl: './formulario-producto.css',
  templateUrl: './formulario-producto.html',
})
export class FormularioProducto implements OnInit {
  private db = inject(DbService);

  // null = producto nuevo
  producto = input<Producto | null>(null);
  // la pestaña desde la que se abrió: el producto se guarda en esa categoría
  categoria = input.required<string>();
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
    // pattern: que tenga algo más que espacios
    nombre: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    // vacío = no se puede canjear con puntos
    precio_puntos: new FormControl<number | null>(null, Validators.min(1)),
    disponible: new FormControl(true),
  });

  // al editar arranca con los datos del producto
  ngOnInit() {
    const producto = this.producto();
    if (producto) this.formulario.reset(producto);
  }

  async guardar() {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const datos = { ...this.formulario.value, categoria: this.categoria() };
    // el cambio de precio lo anota en el log un trigger de la base (log_precio_producto)
    const producto = this.producto();
    const error = await this.db.guardar('productos', producto ? producto.id : null, datos);
    this.guardando.set(false);

    if (error) {
      this.error.set('No se pudo guardar el producto. Revisá los datos e intentá de nuevo.');
      return;
    }
    this.guardado.emit();
  }

  async eliminar() {
    this.confirmandoEliminar.set(false);
    const producto = this.producto();
    if (!producto) return;
    const { error, borrado } = await this.db.eliminar('productos', producto.id);

    // P0001 es el "raise exception" del trigger que no deja borrar el producto si ya se vendió o si es parte de un combo.
    // Ese mensaje ya está escrito para el admin. Sin error y sin fila borrada, RLS no lo dejó borrar
    if (error && error.code === 'P0001') this.error.set(error.message);
    else if (!borrado) this.error.set('No se pudo eliminar el producto. Intentá de nuevo.');
    else this.eliminado.emit();
  }
}
