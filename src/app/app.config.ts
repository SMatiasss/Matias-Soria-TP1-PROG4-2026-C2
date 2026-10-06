import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { apiKeyInterceptor } from './logica/interceptors/api-key-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // HttpClient, con el interceptor que le agrega la clave de Supabase a cada pedido
    provideHttpClient(withInterceptors([apiKeyInterceptor])),
    // PWA: el service worker deja instalar la app y que funcione en segundo plano.
    // Solo anda en el build de producción (con ng serve está apagado)
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    })
  ]
};
