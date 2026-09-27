import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../logica/services/auth.service';
import { ROLES_USUARIO } from '../../../logica/modelos/usuarios/rol-usuario';

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private auths = inject(AuthService);
  private router = inject(Router);

  usuarioActual = this.auths.usuarioActual;
  roles = ROLES_USUARIO;

  enlaces = input<string[]>([]);
  seccionActiva = input<string>('');
  // Flag para que el header sepa que si está en login tiene que mostrar para registrarse.
  enLogin = input(false);

  async cerrarSesion() {
    await this.auths.cerrarSesion();
    this.router.navigateByUrl('/');
  }
}
