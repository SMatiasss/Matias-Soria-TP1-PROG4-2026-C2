import { Component, inject, signal } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioPelicula } from './componentes/formulario-pelicula/formulario-pelicula';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { DbService } from '../../../logica/services/db.service';
import { Pelicula } from '../../../logica/modelos/peliculas';

@Component({
  imports: [SeccionAdmin, FormularioPelicula, EstadoVacio],
  selector: 'app-admin-peliculas',
  styleUrl: './admin-peliculas.css',
  templateUrl: './admin-peliculas.html',
})
export class AdminPeliculas {
  private db = inject(DbService);

  // Todas, también las que no son visibles (al admin RLS se las devuelve)
  peliculas = signal<Pelicula[]>([]);
  cargando = signal(true);
  errorLista = signal<string | null>(null);
  // para sugerirlos en el formulario, en orden alfabético como en la cartelera
  generosExistentes = signal<string[]>([]);

  // el formulario reemplaza a la lista mientras está abierto
  formularioAbierto = signal(false);
  // null = película nueva
  peliculaEditada = signal<Pelicula | null>(null);

  constructor() {
    this.cargarPeliculas();
    this.cargarGeneros();
  }

  // Los de la tabla generos, también los que todavía no usa ninguna película.
  // Cuando una película trae uno nuevo, la base lo agrega sola (trigger generos_validos)
  private async cargarGeneros() {
    const generos = await this.db.findAll('generos');
    this.generosExistentes.set(generos.map((genero) => genero.nombre).sort((a, b) => a.localeCompare(b)));
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
    this.errorLista.set(null);
    const cambiada = await this.db.update('peliculas', pelicula.id, { visible: !pelicula.visible });
    if (!cambiada) {
      this.errorLista.set(`No se pudo cambiar la visibilidad de ${pelicula.titulo}.`);
      // vuelve el tilde a como estaba
      (evento.target as HTMLInputElement).checked = pelicula.visible;
      return;
    }
    await this.cargarPeliculas();
  }

  // la base la guarda como AAAA-MM-DD y acá se muestra como DD/MM/AAAA
  fechaTexto(fecha: string) {
    const [año, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${año}`;
  }
}
