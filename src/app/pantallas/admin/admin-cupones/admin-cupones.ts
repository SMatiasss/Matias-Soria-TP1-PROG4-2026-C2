import { Component, computed, inject, signal } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioCupon } from './componentes/formulario-cupon/formulario-cupon';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../logica/services/db.service';
import { AUDIENCIAS_CUPON, Cupon } from '../../../logica/modelos/cupones';

@Component({
  imports: [SeccionAdmin, FormularioCupon, EstadoVacio, Alerta],
  selector: 'app-admin-cupones',
  styleUrl: './admin-cupones.css',
  templateUrl: './admin-cupones.html',
})
export class AdminCupones {
  private db = inject(DbService);

  // Todos, también los apagados (al admin la policy escritura_admin le deja ver todos)
  cupones = signal<Cupon[]>([]);
  cargando = signal(true);
  // de primera compra hay uno solo: la reserva usa el primero activo que encuentra
  hayPrimeraCompra = computed(() => this.cupones().some((cupon) => cupon.audiencia === AUDIENCIAS_CUPON.PRIMERA_COMPRA));

  // el formulario aparece en un recuadro arriba de la lista. null = cupón nuevo
  formularioAbierto = signal(false);
  cuponEditado = signal<Cupon | null>(null);
  // si no se pudo activar o desactivar, se avisa en un modal
  error = signal<string | null>(null);

  constructor() {
    this.cargarCupones();
  }

  private async cargarCupones() {
    this.cupones.set(await this.db.findAll('cupones'));
    this.cargando.set(false);
  }

  paraQuien(cupon: Cupon) {
    if (cupon.audiencia === AUDIENCIAS_CUPON.PRIMERA_COMPRA) return 'Primera compra: lo recibe cada usuario al registrarse';
    return 'Para mayores de 50 años';
  }

  agregar() {
    this.cuponEditado.set(null);
    this.formularioAbierto.set(true);
  }

  editar(cupon: Cupon) {
    this.cuponEditado.set(cupon);
    this.formularioAbierto.set(true);
  }

  // al guardar o eliminar se cierra el recuadro y la lista se actualiza
  async alGuardar() {
    this.formularioAbierto.set(false);
    await this.cargarCupones();
  }

  async cambiarActivo(cupon: Cupon, evento: Event) {
    const cambiado = await this.db.update('cupones', cupon.id, { activo: !cupon.activo });
    if (!cambiado) {
      this.error.set(`No se pudo cambiar el cupón ${cupon.codigo}.`);
      // vuelve el tilde a como estaba
      (evento.target as HTMLInputElement).checked = cupon.activo;
      return;
    }
    await this.cargarCupones();
  }
}
