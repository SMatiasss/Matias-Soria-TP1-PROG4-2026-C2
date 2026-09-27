import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Para login/registro: si ya hay sesión iniciada, redirige a inicio en vez de mostrar el formulario.
export const invitadoGuard: CanActivateFn = async () => {
  const auths = inject(AuthService);
  const router = inject(Router);

  if (!(await auths.haySesion())) {
    return true;
  }

  const urlInicio = router.parseUrl('/');
  return new RedirectCommand(urlInicio);
};
