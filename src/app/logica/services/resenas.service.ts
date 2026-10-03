import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Reseña } from '../modelos/resenas';

@Service()
export class ReseñasService {
  private sup = inject(SupabaseService);

  // Las reseñas de la película que se está mirando
  resenasDePelicula = signal<Reseña[]>([]);

  // El promedio sale de las reseñas ya cargadas para la lista, no hace falta otra consulta
  promedio = computed(() => {
    const reseñas = this.resenasDePelicula();
    return reseñas.length ? reseñas.reduce((suma, r) => suma + r.calificacion, 0) / reseñas.length : 0;
  });

  // "4,3": un decimal y con coma
  promedioTexto = computed(() =>
    this.resenasDePelicula().length ? this.promedio().toFixed(1).replace('.', ',') : '–',
  );

  async cargarReseñasDePelicula(peliculaId: string) {
    const { data, error } = await this.sup.Sup.from('resenas')
      .select('*')
      .eq('pelicula_id', peliculaId);

    if (error) {
      console.error('No se pudieron cargar las reseñas', error);
      return;
    }
    this.resenasDePelicula.set(data);
  }
}
