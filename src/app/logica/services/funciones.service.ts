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

  // Crea una función sin sala: la elige el trigger sala_y_horario_funcion de la base.
  // Devuelve el error de la base (o null si salió bien) para mostrar su mensaje, ej: "No hay ninguna sala libre en ese horario"
  async crearFuncion(datos: object) {
    const { error } = await this.sup.Sup.from('funciones').insert(datos);

    if (error) console.error('No se pudo crear la función', error);
    return error;
  }

  // Borra una función. Devuelve el error de la base y si de verdad se borró: si RLS no la deja borrar no hay error,
  // pero tampoco vuelve ninguna fila (para eso el .select())
  async cancelarFuncion(id: string) {
    const { data, error } = await this.sup.Sup.from('funciones').delete().eq('id', id).select('id');

    if (error) console.error('No se pudo cancelar la función', error);
    return { error, borrada: data !== null && data.length > 0 };
  }
}
