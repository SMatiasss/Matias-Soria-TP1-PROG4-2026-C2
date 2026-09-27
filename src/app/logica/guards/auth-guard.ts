import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Para pantallas privadas: si no hay sesión iniciada, redirige a login.
export const authGuard: CanActivateFn = async () => {
  const auths = inject(AuthService);
  const router = inject(Router);

  if (await auths.haySesion()) {
    return true;
  }

  const urlLogin = router.parseUrl('/login');
  return new RedirectCommand(urlLogin);
};
