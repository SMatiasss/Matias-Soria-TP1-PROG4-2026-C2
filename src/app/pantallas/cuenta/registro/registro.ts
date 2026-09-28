import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Header } from '../../../globales/componentes/header/header';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { SelectorFecha } from '../../../globales/componentes/selector-fecha/selector-fecha';
import { CampoSeleccion } from './componentes/campo-seleccion/campo-seleccion';
import { AuthService } from '../../../logica/services/auth.service';
import { UsuarioRegistro } from '../../../logica/modelos/usuarios/usuario-registro';
import { calcularEdad } from '../../../logica/utilidades/calcular-edad.util';

function contraseñasCoincidenValidator(grupo: AbstractControl) {
  const contraseña = grupo.get('contrasena')?.value;
  const confirmar = grupo.get('confirmarContrasena')?.value;
  return contraseña === confirmar ? null : { noCoinciden: true };
}

// La fecha llega como AAAA-MM-DD desde selector-fecha
function edadMinimaValidator(control: AbstractControl) {
  if (!control.value) return null;
  return calcularEdad(control.value) >= 13 ? null : { menorDeEdad: true };
}

@Component({
  imports: [Header, Alerta, RouterLink, ReactiveFormsModule, SelectorFecha, CampoSeleccion],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private auths = inject(AuthService);
  private router = inject(Router);

  readonly tiposDeSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly coloresDeOjos = ['Marrón', 'Azul', 'Verde', 'Gris', 'Avellana', 'Ámbar', 'Heterocromía'];

  formulario = new FormGroup(
    {
      nombre: new FormControl('', Validators.required),
      apellido: new FormControl('', Validators.required),
      tipoSangre: new FormControl('', Validators.required),
      colorOjos: new FormControl('', Validators.required),
      diasVacacionesPorAnio: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      contrasena: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmarContrasena: new FormControl('', Validators.required),
      // la llena el componente selector-fecha (queda en null hasta que se mueve una rueda)
      fechaNacimiento: new FormControl<string | null>(null, [Validators.required, edadMinimaValidator]),
    },
    { validators: contraseñasCoincidenValidator },
  );

  error = signal<string | null>(null);
  cargando = signal(false);

  async registrarme() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.cargando.set(true);

    const error = await this.auths.registrar(this.formulario.value as UsuarioRegistro);

    this.cargando.set(false);

    if (error) {
      this.error.set(error);
      return;
    }

    this.router.navigateByUrl('/');
  }
}
