import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CargandoService } from '../services/cargando.service';

// Cada pedido de HttpClient a Supabase sale con la clave pública (apikey) y prende el "cargando" mientras viaja.
// El pedido que llega no se puede modificar: se clona con el header nuevo
export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.SUPABASE_URL)) return next(req);

  const cgs = inject(CargandoService);
  cgs.pedidosEnCurso.update((pedidos) => pedidos + 1);
  const conClave = req.clone({ setHeaders: { apikey: environment.SUPABASE_KEY } });
  // finalize: cuando termina (bien, con error o porque se canceló) se apaga el cargando
  return next(conClave).pipe(finalize(() => cgs.pedidosEnCurso.update((pedidos) => pedidos - 1)));
};
