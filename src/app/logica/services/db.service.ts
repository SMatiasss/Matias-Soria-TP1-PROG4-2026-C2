import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';

// CRUD para cualquier tabla (lo especial va en el servicio de cada tema).
// create, update y delete devuelven true si salió bien, guardar y eliminar devuelven el error
@Service()
export class DbService {
  private sup = inject(SupabaseService);

  // SELECT * FROM tabla
  async findAll(tabla: string) {
    const { data, error } = await this.sup.Sup.from(tabla).select('*');

    if (error) console.error(`No se pudo leer ${tabla}`, error);
    return data ?? [];
  }

  // SELECT * FROM tabla WHERE id = id
  async findById(tabla: string, id: string) {
    const { data, error } = await this.sup.Sup.from(tabla).select('*').eq('id', id);

    if (error) console.error(`No se pudo leer ${tabla} con id ${id}`, error);
    // el id es único: llega [fila] o [] si no existe (o si RLS no la deja ver)
    return data?.[0] ?? null;
  }

  // INSERT INTO tabla VALUES datos
  async create(tabla: string, datos: object) {
    const { error } = await this.sup.Sup.from(tabla).insert(datos);

    if (error) console.error(`No se pudo crear en ${tabla}`, error);
    return !error;
  }

  // UPDATE tabla SET datos WHERE id = id
  async update(tabla: string, id: string, datos: object) {
    const { error } = await this.sup.Sup.from(tabla).update(datos).eq('id', id);

    if (error) console.error(`No se pudo modificar ${tabla} con id ${id}`, error);
    return !error;
  }

  // INSERT si id es null, UPDATE si no. Devuelve el error de la base (o null si salió bien)
  async guardar(tabla: string, id: string | null, datos: object) {
    const { error } = id
      ? await this.sup.Sup.from(tabla).update(datos).eq('id', id)
      : await this.sup.Sup.from(tabla).insert(datos);

    if (error) console.error(`No se pudo guardar en ${tabla}`, error);
    return error;
  }

  // DELETE FROM tabla WHERE id = id
  async delete(tabla: string, id: string) {
    const { error } = await this.sup.Sup.from(tabla).delete().eq('id', id);

    if (error) console.error(`No se pudo borrar ${tabla} con id ${id}`, error);
    return !error;
  }

  // Como delete, pero devuelve el error y si se borró de verdad (si RLS no deja, no hay error pero tampoco fila).
  // Con el código del error se sabe qué pasó, ej: 23503 = otra tabla lo usa
  async eliminar(tabla: string, id: string) {
    const { data, error } = await this.sup.Sup.from(tabla).delete().eq('id', id).select('id');

    if (error) console.error(`No se pudo eliminar de ${tabla}`, error);
    return { error, borrado: data !== null && data.length > 0 };
  }
}
