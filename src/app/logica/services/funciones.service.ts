import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';
import { Funcion } from '../modelos/peliculas';

@Service()
export class FuncionesService {
  private sup = inject(SupabaseService);

  // Funciones que todavía no empezaron, ordenadas por fecha. Solo trae el nombre de la sala, no sus butacas.
  async cargarFuncionesDePelicula(peliculaId: string) {
    const { data, error } = await this.sup.Sup.from('funciones')
      .select('*, sala:salas(id, nombre)')
      .eq('pelicula_id', peliculaId)
      .gte('inicio', new Date().toISOString())
      .order('inicio');

    if (error) {
      console.error('No se pudieron cargar las funciones', error);
      return [];
    }
    return data;
  }
}
