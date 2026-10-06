import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';

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
}
