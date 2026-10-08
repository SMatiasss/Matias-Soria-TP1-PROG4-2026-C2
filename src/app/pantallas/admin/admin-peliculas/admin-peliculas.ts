import { Component, inject, signal } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioPelicula } from './componentes/formulario-pelicula/formulario-pelicula';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { Badge } from '../../../globales/componentes/badge/badge';
import { FechaPipe } from '../../../globales/pipes/fecha.pipe';
import { PrecioPipe } from '../../../globales/pipes/precio.pipe';
import { EdadPipe } from '../../../globales/pipes/edad.pipe';
import { DbService } from '../../../logica/services/db.service';
import { PeliculasService } from '../../../logica/services/peliculas.service';
import { Pelicula } from '../../../logica/modelos/peliculas';

@Component({
  imports: [SeccionAdmin, FormularioPelicula, EstadoVacio, Alerta, Badge, FechaPipe, PrecioPipe, EdadPipe],
  selector: 'app-admin-peliculas',
  styleUrl: './admin-peliculas.css',
  templateUrl: './admin-peliculas.html',
})
export class AdminPeliculas {
  private db = inject(DbService);
  private ps = inject(PeliculasService);

  // Todas, también las que no son visibles (al admin RLS se las devuelve)
  peliculas = signal<Pelicula[]>([]);
  cargando = signal(true);
  // si no se pudo cambiar la visibilidad o sacar un género, se avisa en un modal
  error = signal<string | null>(null);
  // para sugerirlos en el formulario, en orden alfabético como en la cartelera
  generosExistentes = signal<string[]>([]);
  // el género que tocó para sacar, mientras pide confirmar
  generoASacar = signal<string | null>(null);

  // el formulario reemplaza a la lista mientras está abierto
  formularioAbierto = signal(false);
  // null = película nueva
  peliculaEditada = signal<Pelicula | null>(null);

  constructor() {
    this.cargarPeliculas();
    this.cargarGeneros();
  }

  // Los de la tabla generos, también los que todavía no usa ninguna película.
  // Cuando una película trae uno nuevo, el formulario lo agrega a la tabla al guardarla (agregarGeneros)
  private async cargarGeneros() {
    const generos = await this.db.findAll('generos');
    this.generosExistentes.set(generos.map((genero) => genero.nombre).sort((a, b) => a.localeCompare(b)));
  }

  // Para corregir uno mal escrito. Si alguna película lo tiene no se borra: primero hay que sacárselo
  async sacarGenero(genero: string) {
    this.generoASacar.set(null);
    const usan = this.peliculas().filter((pelicula) => pelicula.generos.includes(genero));
    if (usan.length) {
      this.error.set(`${genero} lo tiene: ${usan.map((pelicula) => pelicula.titulo).join(', ')}. Sacáselo antes de borrarlo.`);
      return;
    }
    if (await this.ps.eliminarGenero(genero)) this.generosExistentes.update((generos) => generos.filter((otro) => otro !== genero));
    else this.error.set(`No se pudo sacar ${genero}. Intentá de nuevo.`);
  }

  private async cargarPeliculas() {
    this.peliculas.set(await this.db.findAll('peliculas'));
    this.cargando.set(false);
  }

  abrirNueva() {
    this.peliculaEditada.set(null);
    this.formularioAbierto.set(true);
  }

  editar(pelicula: Pelicula) {
    this.peliculaEditada.set(pelicula);
    this.formularioAbierto.set(true);
  }

  cerrarFormulario() {
    this.formularioAbierto.set(false);
  }

  // al guardar vuelve a la lista, ya con la película nueva o editada
  async alGuardar() {
    this.formularioAbierto.set(false);
    await this.cargarPeliculas();
    // por si la película trajo un género nuevo
    await this.cargarGeneros();
  }

  async cambiarVisible(pelicula: Pelicula, evento: Event) {
    const cambiada = await this.db.update('peliculas', pelicula.id, { visible: !pelicula.visible });
    if (!cambiada) {
      this.error.set(`No se pudo cambiar la visibilidad de ${pelicula.titulo}.`);
      // vuelve el tilde a como estaba
      (evento.target as HTMLInputElement).checked = pelicula.visible;
      return;
    }
    await this.cargarPeliculas();
  }
}
