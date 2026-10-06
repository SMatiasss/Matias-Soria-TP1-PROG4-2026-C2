import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { UsuariosService } from '../../../../../logica/services/usuarios.service';
import { EmpleadoNuevo, Usuario } from '../../../../../logica/modelos/usuarios';

@Component({
  imports: [Alerta, ReactiveFormsModule],
  selector: 'app-formulario-empleado',
  styleUrl: './formulario-empleado.css',
  templateUrl: './formulario-empleado.html',
})
export class FormularioEmpleado implements OnInit {
  private us = inject(UsuariosService);

  // null = empleado nuevo
  empleado = input<Usuario | null>(null);
  // avisan a la lista para que cierre el formulario (y recargue, si se guardó)
  cancelado = output<void>();
  guardado = output<void>();

  formulario = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
    apellido: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    // Supabase pide 6 caracteres como mínimo
    contrasena: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  intentoGuardar = signal(false);
  guardando = signal(false);
  // si no se pudo crear o guardar, se muestra en un modal
  error = signal<string | null>(null);

  // Al editar solo se cambian el nombre y el apellido. El correo y la contraseña son de la cuenta de Supabase Auth,
  // que desde la app solo cambia cada uno con su sesión: quedan deshabilitados (no cuentan para validar ni van en .value)
  ngOnInit() {
    const empleado = this.empleado();
    if (!empleado) return;
    this.formulario.reset(empleado);
    this.formulario.controls.email.disable();
    this.formulario.controls.contrasena.disable();
  }

  async guardar() {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const empleado = this.empleado();
    // al editar, el correo y la contraseña no vienen (están deshabilitados): se usan solo el nombre y el apellido
    const valores = this.formulario.value as EmpleadoNuevo;
    if (empleado) {
      const error = await this.us.editarEmpleado(empleado.id, valores.nombre, valores.apellido);
      if (error) this.error.set('No se pudieron guardar los cambios. Intentá de nuevo.');
    } else {
      this.error.set(await this.us.crearEmpleado(valores));
    }
    this.guardando.set(false);
    if (!this.error()) this.guardado.emit();
  }
}
