import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';

@Service()
export class StorageService {
  private sup = inject(SupabaseService);

  // Sube el archivo a "ruta" dentro del bucket y devuelve su URL pública (la que se guarda en peliculas.imagen_url)
  async subirArchivo(archivo: File, ruta: string) {
    const { error } = await this.sup.Stg.from('imagenes').upload(ruta, archivo, { upsert: true }); // upsert: true, si ya hay un archivo en esa ruta lo reemplaza en vez de dar error

    if (error) {
      console.error('No se pudo subir el archivo', error);
      return null;
    }
    return this.sup.Stg.from('imagenes').getPublicUrl(ruta).data.publicUrl;
  }
}
