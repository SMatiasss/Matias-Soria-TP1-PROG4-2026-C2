import { computed, Service, signal } from '@angular/core';

// Si hay pedidos de HttpClient en camino (más vendidas del inicio y la revisión de avisos). Los cuenta el interceptor
@Service()
export class CargandoService {
  pedidosEnCurso = signal(0);
  cargando = computed(() => this.pedidosEnCurso() > 0);
}
