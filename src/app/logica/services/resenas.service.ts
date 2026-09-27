import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';
import { Reseña } from '../modelos/resenas/resena';

@Service()
export class ReseñasService {
  private sup = inject(SupabaseService);

  async cargarReseñasDePelicula(peliculaId: string) {
    const { data, error } = await this.sup.Sup.from('resenas')
      .select('*')
      .eq('pelicula_id', peliculaId);

    if (error) {
      console.error('No se pudieron cargar las reseñas', error);
      return [];
    }
    return data;
  }
}
