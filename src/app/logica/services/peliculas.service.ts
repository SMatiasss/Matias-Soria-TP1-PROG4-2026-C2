import { computed, inject, Service, signal } from '@angular/core';
import { Pelicula } from '../modelos/peliculas/pelicula';
import { SupabaseService } from './supabase';
import { DbService } from './db.service';
import { sinRepetidos } from '../utilidades/sin-repetidos.util';

@Service()
export class PeliculasService {
  private sup = inject(SupabaseService);
  private db = inject(DbService);

  peliculasVisibles = signal<Pelicula[]>([]);

  // ids de películas con alerta de estreno activada por el usuario actual
  idsPeliculasConAlerta = signal<string[]>([]);

  // Géneros sin repetir de todas las películas cargadas, en orden alfabético
  generosDisponibles = computed(() =>
    sinRepetidos(this.peliculasVisibles().flatMap((p) => p.generos)).sort((a, b) => a.localeCompare(b)),
  );

  // Top 3 por entradas vendidas, ya ordenadas desde la consulta
  peliculasMasVendidas = signal<Pelicula[]>([]);

  // Estrenan después de hoy. T00:00 hace que la fecha del estreno se lea en hora local y no en UTC
  proximosEstrenos = computed(() =>
    this.peliculasVisibles().filter((p) => new Date(`${p.fecha_estreno}T00:00`) > new Date()),
  );

  async cargarPeliculasVisibles() {
    const { data, error } = await this.sup.Sup.from('peliculas')
      .select('*')
      .eq('visible', true);

    if (error) {
      console.error('No se pudieron cargar las películas', error);
      return;
    }
    this.peliculasVisibles.set(data);
  }

  // Vista ventas_por_pelicula: cuenta las entradas confirmadas sin exponer las entradas de nadie.
  // El join con peliculas filtra las visibles antes del limit: así siempre llegan 3 visibles (si hay)
  async cargarPeliculasMasVendidas() {
    const { data, error } = await this.sup.Sup.from('ventas_por_pelicula')
      .select('pelicula:peliculas!inner(*)')
      .eq('pelicula.visible', true)
      .order('vendidas', { ascending: false })
      .limit(3);

    if (error) {
      console.error('No se pudieron cargar las películas más vendidas', error);
      return;
    }
    // sin tipos generados, supabase-js cree que la relación es un array, pero en runtime es un objeto (muchos-a-uno)
    this.peliculasMasVendidas.set(data.map((fila) => fila.pelicula as unknown as Pelicula));
  }

  async cargarAlertasDeUsuario(usuarioId: string) {
    const { data, error } = await this.sup.Sup.from('alertas_estreno')
      .select('pelicula_id')
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('No se pudieron cargar las alertas', error);
      return;
    }
    this.idsPeliculasConAlerta.set(data.map((a) => a.pelicula_id));
  }

  async activarAlertaDeEstreno(peliculaId: string, usuarioId: string) {
    const creada = await this.db.create('alertas_estreno', {
      pelicula_id: peliculaId,
      usuario_id: usuarioId,
    });

    if (creada) this.idsPeliculasConAlerta.update((ids) => [...ids, peliculaId]);
  }
}
