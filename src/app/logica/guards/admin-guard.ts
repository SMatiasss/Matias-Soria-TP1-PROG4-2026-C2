import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ROLES_USUARIO } from '../modelos/usuarios';

// Para las pantallas de admin: sin sesión redirige a login y con otro rol a inicio.
export const adminGuard: CanActivateFn = async () => {
  const auths = inject(AuthService);
  const router = inject(Router);

  const rol = await auths.rolActual();
  if (rol === ROLES_USUARIO.ADMIN) {
    return true;
  }

  const urlDestino = router.parseUrl(rol === null ? '/login' : '/');
  return new RedirectCommand(urlDestino);
};
