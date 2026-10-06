import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioProducto } from './componentes/formulario-producto/formulario-producto';
import { FormularioCombo } from './componentes/formulario-combo/formulario-combo';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { PrecioPipe } from '../../../globales/pipes/precio.pipe';
import { PuntosPipe } from '../../../globales/pipes/puntos.pipe';
import { QueIncluyePipe } from '../../../globales/pipes/que-incluye.pipe';
import { DbService } from '../../../logica/services/db.service';
import { CandyService } from '../../../logica/services/candy.service';
import { Combo, Producto } from '../../../logica/modelos/candy';
import { sinRepetidos } from '../../../logica/utilidades/sin-repetidos.util';
import { nombreEnLista, nombreLibreValidator } from '../../../logica/utilidades/nombre-en-lista.util';

@Component({
  imports: [SeccionAdmin, FormularioProducto, FormularioCombo, EstadoVacio, Alerta, ReactiveFormsModule, PrecioPipe, PuntosPipe, QueIncluyePipe],
  selector: 'app-admin-candy',
  styleUrl: './admin-candy.css',
  templateUrl: './admin-candy.html',
})
export class AdminCandy {
  private db = inject(DbService);
  private cs = inject(CandyService);

  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cargando = signal(true);

  // las categorías salen de los productos. Las nuevas del "+" viven solo acá hasta que tengan un producto
  categoriasNuevas = signal<string[]>([]);
  categorias = computed(() =>
    sinRepetidos([...this.productos().map((producto) => producto.categoria), ...this.categoriasNuevas()]).sort((a, b) =>
      a.localeCompare(b),
    ),
  );
  // el "+" de las pestañas: mientras está en true, en su lugar va el campo para escribir la categoría
  agregandoCategoria = signal(false);
  // no puede llamarse como otra pestaña (ni "pochoclos" ni "combos") ni ser solo espacios
  nuevaCategoria = new FormControl('', [Validators.required, Validators.pattern(/\S/), nombreLibreValidator(() => this.pestanas())]);
  private campoCategoria = viewChild<ElementRef<HTMLInputElement>>('campoCategoria');
  // una pestaña por categoría y, al final, la de combos (que son otra tabla)
  pestanas = computed(() => [...this.categorias(), 'Combos']);
  pestanaElegida = signal<string | null>(null);
  // la pestaña tocada, o la primera categoría si esa ya no está
  pestanaActiva = computed(() => {
    const elegida = this.pestanaElegida();
    if (elegida && this.pestanas().includes(elegida)) return elegida;
    return this.categorias()[0] ?? '';
  });
  esCombos = computed(() => this.pestanaActiva() === 'Combos');
  productosDeLaPestana = computed(() => this.productos().filter((producto) => producto.categoria === this.pestanaActiva()));

  // el formulario aparece en un recuadro arriba de la lista. null = nuevo
  formularioAbierto = signal(false);
  productoEditado = signal<Producto | null>(null);
  comboEditado = signal<Combo | null>(null);
  // si no se pudo cambiar la disponibilidad, se avisa en un modal
  error = signal<string | null>(null);

  constructor() {
    this.cargar();
    // cuando aparece el campo de la categoría nueva, le pone el cursor para escribir directo
    effect(() => this.campoCategoria()?.nativeElement.focus());
  }

  private async cargar() {
    this.productos.set(await this.db.findAll('productos'));
    // con sus productos, para mostrar qué incluye cada uno
    this.combos.set(await this.cs.cargarCombos());
    this.cargando.set(false);
  }

  // con Enter (o al salir del campo) se crea la pestaña. Si el nombre ya está no hace nada
  agregarCategoria() {
    if (this.nuevaCategoria.invalid) return;
    // la primera letra en mayúscula, como los géneros
    const categoria = nombreEnLista((this.nuevaCategoria.value as string).trim(), this.categorias());
    this.categoriasNuevas.update((nuevas) => [...nuevas, categoria]);
    this.pestanaElegida.set(categoria);
    this.cancelarCategoria();
  }

  // cierra el campo sin crear nada: con Escape, o al salir del campo con un nombre que no sirve
  cancelarCategoria() {
    this.nuevaCategoria.reset();
    this.agregandoCategoria.set(false);
  }

  // el mismo botón agrega un producto o un combo, según la pestaña
  agregar() {
    this.productoEditado.set(null);
    this.comboEditado.set(null);
    this.formularioAbierto.set(true);
  }

  editarProducto(producto: Producto) {
    this.productoEditado.set(producto);
    this.formularioAbierto.set(true);
  }

  editarCombo(combo: Combo) {
    this.comboEditado.set(combo);
    this.formularioAbierto.set(true);
  }

  // al guardar o eliminar se cierra el recuadro y la lista se actualiza
  async alGuardar() {
    this.formularioAbierto.set(false);
    await this.cargar();
  }

  // apagado, el cliente deja de verlo (la policy lectura_publica solo le muestra los disponibles)
  async cambiarDisponible(tabla: string, item: Producto | Combo, evento: Event) {
    const cambiado = await this.db.update(tabla, item.id, { disponible: !item.disponible });
    if (!cambiado) {
      this.error.set(`No se pudo cambiar la disponibilidad de ${item.nombre}.`);
      // vuelve el tilde a como estaba
      (evento.target as HTMLInputElement).checked = item.disponible;
      return;
    }
    await this.cargar();
  }
}
