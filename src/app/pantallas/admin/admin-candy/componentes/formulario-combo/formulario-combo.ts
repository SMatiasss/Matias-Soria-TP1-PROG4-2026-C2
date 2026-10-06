import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../../../logica/services/db.service';
import { CandyService } from '../../../../../logica/services/candy.service';
import { Combo, ComboFormulario, Producto, ProductoElegido } from '../../../../../logica/modelos/candy';

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
  // todos los productos, para elegir los del combo y mostrar sus nombres
  productos = input<Producto[]>([]);
  // las categorías de esos productos, para agruparlos en el select
  categorias = input<string[]>([]);
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
  // la cantidad escrita no es un número entero de 1 para arriba (ej: 1,5)
  errorCantidad = signal(false);

  formulario = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    // vacío = no se puede canjear con puntos
    precio_puntos: new FormControl<number | null>(null, Validators.min(1)),
    incluye_entrada: new FormControl(false),
    disponible: new FormControl(true),
    // los que trae el combo, se agregan y se sacan con agregarProducto y quitarProducto
    productos: new FormControl<ProductoElegido[]>([], Validators.required),
  });

  // al editar arranca con los datos del combo y sus productos
  ngOnInit() {
    const combo = this.combo();
    if (!combo) return;
    this.formulario.reset({
      ...combo,
      productos: combo.combo_productos.map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad })),
    });
  }

  // los de una categoría, para su grupo en el select
  productosDe(categoria: string) {
    return this.productos().filter((producto) => producto.categoria === categoria);
  }

  productosElegidos() {
    return this.formulario.controls.productos.value as ProductoElegido[];
  }

  nombreProducto(id: string) {
    const producto = this.productos().find((otro) => otro.id === id);
    return producto ? producto.nombre : '';
  }

  // Si el producto ya estaba en el combo, se suman las cantidades en vez de repetirlo
  agregarProducto(producto: HTMLSelectElement, cantidad: HTMLInputElement) {
    const productoId = producto.value;
    const unidades = Number(cantidad.value);
    // solo enteros: la base guarda la cantidad como número entero
    this.errorCantidad.set(!Number.isInteger(unidades) || unidades < 1);
    if (!productoId || this.errorCantidad()) return;

    const elegidos = this.productosElegidos();
    const yaEstaba = elegidos.find((elegido) => elegido.producto_id === productoId);
    if (yaEstaba) {
      this.formulario.controls.productos.setValue(
        elegidos.map((elegido) =>
          elegido.producto_id === productoId ? { producto_id: productoId, cantidad: elegido.cantidad + unidades } : elegido,
        ),
      );
    } else {
      this.formulario.controls.productos.setValue([...elegidos, { producto_id: productoId, cantidad: unidades }]);
    }
    cantidad.value = '1';
  }

  quitarProducto(productoId: string) {
    this.formulario.controls.productos.setValue(this.productosElegidos().filter((elegido) => elegido.producto_id !== productoId));
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
    const error = await this.cs.guardarCombo(combo ? combo.id : null, this.formulario.value as ComboFormulario);
    this.guardando.set(false);

    if (error) {
      // P0001 es el "raise exception" de la función guardar_combo, ese mensaje ya está escrito para el admin
      if (error.code === 'P0001') this.error.set(error.message);
      else this.error.set('No se pudo guardar el combo. Revisá los datos e intentá de nuevo.');
      return;
    }
    this.guardado.emit();
  }

  async eliminar() {
    this.confirmandoEliminar.set(false);
    const combo = this.combo();
    if (!combo) return;
    const { error, borrado } = await this.db.eliminar('combos', combo.id);

    // P0001 es el "raise exception" del trigger que no deja borrar el combo si ya se vendió.
    // Ese mensaje ya está escrito para el admin. Sin error y sin fila borrada, RLS no lo dejó borrar
    if (error && error.code === 'P0001') this.error.set(error.message);
    else if (!borrado) this.error.set('No se pudo eliminar el combo. Intentá de nuevo.');
    else this.eliminado.emit();
  }
}
