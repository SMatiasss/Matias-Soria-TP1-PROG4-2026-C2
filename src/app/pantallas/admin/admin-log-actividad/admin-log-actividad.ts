import { Component, inject, signal } from '@angular/core';
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
export class AdminLogActividad {
  private logs = inject(LogActividadService);

  registros = signal<RegistroActividad[]>([]);
  cargando = signal(true);

  constructor() {
    this.cargarRegistros();
  }

  private async cargarRegistros() {
    this.registros.set(await this.logs.cargarRegistros());
    this.cargando.set(false);
  }
}
