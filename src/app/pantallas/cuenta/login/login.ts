import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../../../globales/componentes/header/header';
import { AuthService } from '../../../logica/services/auth.service';
import { UsuarioLogin } from '../../../logica/modelos/usuarios';

@Component({
  imports: [Header, RouterLink, ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private auths = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // con FormBuilder cada campo es [valor inicial, validators]
  formulario = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
  });

  error = signal<string | null>(null);
  cargando = signal(false);

  async ingresar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.cargando.set(true); // El cargando es meramente para diseño visual.

    const error = await this.auths.iniciarSesion(this.formulario.value as UsuarioLogin);

    this.cargando.set(false);

    if (error) {
      this.error.set(error);
      return;
    }

    this.router.navigateByUrl('/');
  }
}
