import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../logica/services/auth.service';
import { ROLES_USUARIO } from '../../../logica/modelos/usuarios';

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

  // La pantalla de cada rol, al lado de Cartelera: el empleado valida QR y el admin administra. El cliente no tiene
  enlace = computed(() => {
    const rol = this.usuarioActual()?.rol;
    if (rol === ROLES_USUARIO.EMPLEADO) return { ruta: '/validar', texto: 'Validar QR' };
    if (rol === ROLES_USUARIO.ADMIN) return { ruta: '/admin', texto: 'Admin' };
    return null;
  });

  seccionActiva = input<string>('');
  // Flag para que el header sepa que si está en login tiene que mostrar para registrarse.
  enLogin = input(false);

  async cerrarSesion() {
    await this.auths.cerrarSesion();
    this.router.navigateByUrl('/');
  }
}
