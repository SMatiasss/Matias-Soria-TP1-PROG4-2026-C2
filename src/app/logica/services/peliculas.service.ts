import { computed, inject, Service, signal } from '@angular/core';
import { Pelicula } from '../modelos/peliculas';
import { SupabaseService } from './supabase';
import { DbService } from './db.service';
import { sinRepetidos } from '../utilidades/sin-repetidos.util';
import { addDays } from 'date-fns';

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

  // las que todavía no se estrenaron (con T00:00 la fecha se lee en hora local)
  peliculasPorEstrenar = computed(() =>
    this.peliculasVisibles().filter((p) => new Date(`${p.fecha_estreno}T00:00`) > new Date()),
  );

  // sus ids, para marcarlas con "Próximamente"
  idsPeliculasPorEstrenar = computed(() => this.peliculasPorEstrenar().map((p) => p.id));

  // "Próximamente" del inicio: solo las que se estrenan en las próximas 3 semanas
  proximosEstrenos = computed(() => {
    const enTresSemanas = addDays(new Date(), 21);
    return this.peliculasPorEstrenar().filter((p) => new Date(`${p.fecha_estreno}T00:00`) <= enTresSemanas);
  });

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
    // supabase-js lo tipa como array pero llega un objeto
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

  // agrega géneros a la tabla. Si ya hay uno igual (sin contar mayúsculas ni tildes, columna clave) no lo repite.
  // Devuelve el error o null
  async agregarGeneros(nombres: string[]) {
    const { error } = await this.sup.Sup.from('generos').upsert(
      nombres.map((nombre) => ({ nombre })),
      { onConflict: 'clave', ignoreDuplicates: true },
    );
    if (error) console.error('No se pudieron agregar los géneros', error);
    return error;
  }

  async activarAlertaDeEstreno(peliculaId: string, usuarioId: string) {
    const creada = await this.db.create('alertas_estreno', {
      pelicula_id: peliculaId,
      usuario_id: usuarioId,
    });

    if (creada) this.idsPeliculasConAlerta.update((ids) => [...ids, peliculaId]);
  }
}
