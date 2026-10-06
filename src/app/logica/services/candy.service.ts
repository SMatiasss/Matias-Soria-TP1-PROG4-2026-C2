import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';
import { ComboFormulario } from '../modelos/candy';

@Service()
export class CandyService {
  private sup = inject(SupabaseService);

  // Los combos con sus productos y cuántos trae de cada uno (db.findAll solo trae la tabla combos)
  async cargarCombos() {
    const { data, error } = await this.sup.Sup.from('combos').select(
      '*, combo_productos(cantidad, producto_id, producto:productos(nombre))',
    );

    if (error) {
      console.error('No se pudieron cargar los combos', error);
      return [];
    }
    return data;
  }

  // Profe, puedo usar rpc()? llama a la función guardar_combo, que guarda el combo y sus productos juntos.
  // id null = combo nuevo. Devuelve el error o null
  async guardarCombo(id: string | null, combo: ComboFormulario) {
    const { error } = await this.sup.Sup.rpc('guardar_combo', {
      p_id: id,
      p_nombre: combo.nombre,
      p_precio: combo.precio,
      p_precio_puntos: combo.precio_puntos,
      p_incluye_entrada: combo.incluye_entrada,
      p_disponible: combo.disponible,
      p_productos: combo.productos,
    });

    if (error) console.error('No se pudo guardar el combo', error);
    return error;
  }
}
