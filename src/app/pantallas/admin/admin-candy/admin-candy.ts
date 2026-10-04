import { Component, computed, inject, signal } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioProducto } from './componentes/formulario-producto/formulario-producto';
import { FormularioCombo } from './componentes/formulario-combo/formulario-combo';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../logica/services/db.service';
import { CATEGORIAS_PRODUCTO, Combo, Producto } from '../../../logica/modelos/candy';

@Component({
  imports: [SeccionAdmin, FormularioProducto, FormularioCombo, EstadoVacio, Alerta],
  selector: 'app-admin-candy',
  styleUrl: './admin-candy.css',
  templateUrl: './admin-candy.html',
})
export class AdminCandy {
  private db = inject(DbService);

  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cargando = signal(true);

  // una pestaña por categoría y, al final, la de combos (que son otra tabla)
  readonly pestanas = [...Object.values(CATEGORIAS_PRODUCTO), 'Combos'];
  pestanaActiva = signal<string>(CATEGORIAS_PRODUCTO.POCHOCLOS);
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
  }

  private async cargar() {
    this.productos.set(await this.db.findAll('productos'));
    this.combos.set(await this.db.findAll('combos'));
    this.cargando.set(false);
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
