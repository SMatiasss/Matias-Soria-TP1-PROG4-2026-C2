import { Component } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';

@Component({
  imports: [SeccionAdmin, EstadoVacio],
  selector: 'app-admin-salas',
  styleUrl: './admin-salas.css',
  templateUrl: './admin-salas.html',
})
export class AdminSalas {}
