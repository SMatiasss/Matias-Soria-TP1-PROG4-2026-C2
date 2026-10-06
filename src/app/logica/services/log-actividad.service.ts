import { inject, Service } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { RegistroActividad } from '../modelos/actividad';

@Service()
export class LogActividadService {
  private sup = inject(SupabaseService);

  // Todo el log, lo más nuevo primero (lo escriben los triggers de la base).
  // Supabase trae hasta 1000 filas: si algún día se pasa, acá hay que paginar
  async cargarRegistros() {
    const { data, error } = await this.sup.Sup.from('registro_actividad')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('No se pudo cargar el log de actividad', error);
      return [];
    }
    return data;
  }

  // Realtime con postgres_changes: cada fila que un trigger agrega al log llega al instante (solo al admin, por RLS).
  // Devuelve el canal para cerrarlo al salir
  escucharRegistros(alLlegar: (registro: RegistroActividad) => void) {
    return this.sup.Sup.channel('registro-actividad')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registro_actividad' }, (cambio) =>
        alLlegar(cambio.new as RegistroActividad),
      )
      .subscribe();
  }

  dejarDeEscuchar(canal: RealtimeChannel) {
    this.sup.Sup.removeChannel(canal);
  }
}
