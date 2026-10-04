import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';

@Service()
export class CandyService {
  private sup = inject(SupabaseService);

  // Borra un producto o un combo ('productos' o 'combos'). Devuelve el error de la base y si de verdad se borró:
  // si RLS no lo deja borrar no hay error, pero tampoco vuelve ninguna fila (para eso el .select())
  async eliminar(tabla: string, id: string) {
    const { data, error } = await this.sup.Sup.from(tabla).delete().eq('id', id).select('id');

    if (error) console.error(`No se pudo eliminar de ${tabla}`, error);
    return { error, borrado: data !== null && data.length > 0 };
  }
}
