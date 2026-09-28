import { Component } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';

@Component({
  imports: [SeccionAdmin, EstadoVacio],
  selector: 'app-admin-log-actividad',
  styleUrl: './admin-log-actividad.css',
  templateUrl: './admin-log-actividad.html',
})
export class AdminLogActividad {}
