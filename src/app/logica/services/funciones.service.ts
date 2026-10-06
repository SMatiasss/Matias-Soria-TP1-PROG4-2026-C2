import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';

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

  // Para el admin: todas las que todavía no empezaron, con el título de la película y el nombre de la sala
  async cargarProximasFunciones() {
    const { data, error } = await this.sup.Sup.from('funciones')
      .select('*, pelicula:peliculas(titulo), sala:salas(nombre)')
      .gte('inicio', new Date().toISOString())
      .order('inicio');

    if (error) {
      console.error('No se pudieron cargar las funciones', error);
      return [];
    }
    return data;
  }
}
