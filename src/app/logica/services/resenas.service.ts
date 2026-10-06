import { computed, inject, Service, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Reseña } from '../modelos/resenas';

@Service()
export class ReseñasService {
  private sup = inject(SupabaseService);

  // Las reseñas de la película que se está mirando
  resenasDePelicula = signal<Reseña[]>([]);
  // la película de la última carga: si llega tarde la respuesta de una anterior, no se usa
  private peliculaPedida = '';

  // El promedio sale de las reseñas ya cargadas para la lista, no hace falta otra consulta
  promedio = computed(() => {
    const reseñas = this.resenasDePelicula();
    return reseñas.length ? reseñas.reduce((suma, r) => suma + r.calificacion, 0) / reseñas.length : 0;
  });

  // "4,3": un decimal y con coma
  promedioTexto = computed(() =>
    this.resenasDePelicula().length ? this.promedio().toFixed(1).replace('.', ',') : '–',
  );

  // Las reseñas que escribió un usuario: de ahí sale la calificación que le puso a cada película que vio (perfil)
  async cargarReseñasDeUsuario(usuarioId: string) {
    const { data, error } = await this.sup.Sup.from('resenas').select('*').eq('usuario_id', usuarioId);
    if (error) {
      console.error('No se pudieron cargar tus reseñas', error);
      return [];
    }
    return data as Reseña[];
  }

  async cargarReseñasDePelicula(peliculaId: string) {
    // al cambiar de película la lista se vacía mientras carga, así no se ven las reseñas de la anterior
    if (peliculaId !== this.peliculaPedida) this.resenasDePelicula.set([]);
    this.peliculaPedida = peliculaId;
    const { data, error } = await this.sup.Sup.from('resenas')
      .select('*')
      .eq('pelicula_id', peliculaId);

    if (peliculaId !== this.peliculaPedida) return;
    if (error) {
      console.error('No se pudieron cargar las reseñas', error);
      return;
    }
    this.resenasDePelicula.set(data);
  }
}
