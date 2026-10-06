import { computed, Service, signal } from '@angular/core';

// Si hay pedidos de HttpClient en camino (hoy solo el de más vendidas del inicio). Los cuenta el interceptor
@Service()
export class CargandoService {
  pedidosEnCurso = signal(0);
  cargando = computed(() => this.pedidosEnCurso() > 0);
}
