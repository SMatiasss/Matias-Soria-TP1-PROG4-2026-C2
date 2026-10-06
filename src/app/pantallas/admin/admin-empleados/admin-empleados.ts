import { Component, inject, signal } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioEmpleado } from './componentes/formulario-empleado/formulario-empleado';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { UsuariosService } from '../../../logica/services/usuarios.service';
import { Usuario } from '../../../logica/modelos/usuarios';

@Component({
  imports: [SeccionAdmin, FormularioEmpleado, EstadoVacio],
  selector: 'app-admin-empleados',
  styleUrl: './admin-empleados.css',
  templateUrl: './admin-empleados.html',
})
export class AdminEmpleados {
  private us = inject(UsuariosService);

  empleados = signal<Usuario[]>([]);
  cargando = signal(true);

  // el formulario es un recuadro arriba de la lista
  formularioAbierto = signal(false);
  // el que se está editando (null = uno nuevo)
  empleadoEditado = signal<Usuario | null>(null);

  constructor() {
    this.cargarEmpleados();
  }

  private async cargarEmpleados() {
    this.empleados.set(await this.us.cargarEmpleados());
    this.cargando.set(false);
  }

  agregar() {
    this.empleadoEditado.set(null);
    this.formularioAbierto.set(true);
  }

  editar(empleado: Usuario) {
    this.empleadoEditado.set(empleado);
    this.formularioAbierto.set(true);
  }

  // al guardar cierra el formulario y recarga la lista
  async alGuardar() {
    this.formularioAbierto.set(false);
    await this.cargarEmpleados();
  }
}
