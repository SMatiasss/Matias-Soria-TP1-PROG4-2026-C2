import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { SupabaseService } from './supabase';
import { environment } from '../../../environments/environment';

// Las notificaciones push de las alertas de estreno, como en la clase 10.
// Solo andan en el build de producción: con ng serve el service worker está apagado
@Service()
export class NotificacionesService {
  private swPush = inject(SwPush);
  private sup = inject(SupabaseService);
  private http = inject(HttpClient);

  // Pide permiso para mandarle notificaciones y guarda la suscripción de este navegador.
  // Devuelve false si no se pudo (no dio permiso o el navegador no tiene notificaciones): la alerta igual queda guardada
  async suscribir(usuarioId: string) {
    if (!this.swPush.isEnabled) return false;
    try {
      const suscripcion = await this.swPush.requestSubscription({ serverPublicKey: environment.PUBLIC_VAPID });
      const json = suscripcion.toJSON();
      // ignoreDuplicates: si este navegador ya estaba suscripto no hace nada
      const { error } = await this.sup.Sup.from('suscripciones_push').upsert(
        { usuario_id: usuarioId, endpoint: json.endpoint, auth: json.keys?.['auth'], p256dh: json.keys?.['p256dh'] },
        { onConflict: 'endpoint', ignoreDuplicates: true },
      );
      if (error) console.error('No se pudo guardar la suscripción a las notificaciones', error);
      return !error;
    } catch {
      return false;
    }
  }

  // Cada vez que alguien abre la página, la Edge Function revisa si a alguna película con alertas
  // se le abrió la venta y les manda el push a los que la pidieron (la clave la agrega el interceptor)
  revisarAvisos() {
    this.http.post(`${environment.SUPABASE_URL}/functions/v1/avisar-estrenos`, {}).subscribe({
      error: (error) => console.error('No se pudieron revisar los avisos de estreno', error),
    });
  }
}
