import { Component, inject, OnDestroy, signal } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { FechaPipe } from '../../../globales/pipes/fecha.pipe';
import { LogActividadService } from '../../../logica/services/log-actividad.service';
import { RegistroActividad } from '../../../logica/modelos/actividad';

@Component({
  imports: [SeccionAdmin, EstadoVacio, FechaPipe],
  selector: 'app-admin-log-actividad',
  styleUrl: './admin-log-actividad.css',
  templateUrl: './admin-log-actividad.html',
})
export class AdminLogActividad implements OnDestroy {
  private logs = inject(LogActividadService);

  registros = signal<RegistroActividad[]>([]);
  cargando = signal(true);
  // el canal de Realtime: lo que se registra mientras está abierta la pantalla aparece sin recargar
  private canal = this.logs.escucharRegistros((registro) => this.sumarRegistro(registro));

  constructor() {
    this.cargarRegistros();
  }

  // al salir de la pantalla se cierra el canal
  ngOnDestroy() {
    this.logs.dejarDeEscuchar(this.canal);
  }

  private async cargarRegistros() {
    this.registros.set(await this.logs.cargarRegistros());
    this.cargando.set(false);
  }

  // lo nuevo va arriba, como en la lista. Si ya vino con la carga del principio no se repite
  private sumarRegistro(registro: RegistroActividad) {
    if (this.registros().some((otro) => otro.id === registro.id)) return;
    this.registros.update((registros) => [registro, ...registros]);
  }
}
