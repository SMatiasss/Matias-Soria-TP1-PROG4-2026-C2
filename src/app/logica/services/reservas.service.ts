import { inject, Service } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';

// Consultas de reservas que no son un CRUD simple (lo simple va por DbService)
@Service()
export class ReservasService {
  private sup = inject(SupabaseService);

  // Vista butacas_ocupadas: la puede leer cualquiera, sin ver de quién es cada compra
  async cargarButacasOcupadas(funcionId: string) {
    const { data, error } = await this.sup.Sup.from('butacas_ocupadas')
      .select('butaca_id')
      .eq('funcion_id', funcionId);

    if (error) {
      console.error('No se pudieron cargar las butacas ocupadas', error);
      return [];
    }
    return data.map((o) => o.butaca_id);
  }

  // La función con su película y su sala con todas las butacas, en una sola consulta.
  // null = la función no existe
  async cargarFuncionConPeliculaYSala(funcionId: string) {
    const { data, error } = await this.sup.Sup.from('funciones')
      .select('*, pelicula:peliculas(*), sala:salas(*, butacas(*))')
      .eq('id', funcionId);

    if (error) console.error('No se pudo cargar la función', error);
    return data?.[0] ?? null;
  }

  // Profe, puedo usar Realtime de Supabase? queda un canal abierto y la base avisa al instante cada butaca
  // que se vende o se libera. Devuelve el canal para cerrarlo al salir
  escucharButacas(funcionId: string, alCambiar: (butacaId: string, ocupada: boolean) => void) {
    return this.sup.Sup.channel('funcion:' + funcionId)
      .on('broadcast', { event: 'butaca' }, (mensaje) => alCambiar(mensaje['payload']['butaca_id'], mensaje['payload']['ocupada']))
      .subscribe();
  }

  dejarDeEscuchar(canal: RealtimeChannel) {
    this.sup.Sup.removeChannel(canal);
  }
}
