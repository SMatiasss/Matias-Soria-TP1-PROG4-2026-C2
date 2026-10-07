import { Component, inject, input, OnChanges, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CalificacionEstrellas } from '../../../../../globales/componentes/calificacion-estrellas/calificacion-estrellas';
import { EstadoVacio } from '../../../../../globales/componentes/estado-vacio/estado-vacio';
import { AuthService } from '../../../../../logica/services/auth.service';
import { DbService } from '../../../../../logica/services/db.service';
import { ReseñasService } from '../../../../../logica/services/resenas.service';

@Component({
  imports: [RouterLink, FormsModule, CalificacionEstrellas, EstadoVacio],
  selector: 'app-resenas-pelicula',
  styleUrl: './resenas-pelicula.css',
  templateUrl: './resenas-pelicula.html',
})
export class ReseñasPelicula implements OnChanges {
  private auths = inject(AuthService);
  private db = inject(DbService);
  private res = inject(ReseñasService);

  peliculaId = input.required<string>();

  usuario = this.auths.usuarioActual;

  resenas = this.res.resenasDePelicula;
  promedio = this.res.promedio;
  promedioTexto = this.res.promedioTexto;
  calificacion = signal(0);
  comentario = signal('');
  publicando = signal(false);
  error = signal<string | null>(null);

  // Angular lo llama cada vez que cambia un input (la primera vez también): carga las reseñas de la película, y otra vez si cambia
  ngOnChanges() {
    this.cargarReseñas(this.peliculaId());
  }

  private async cargarReseñas(peliculaId: string) {
    await this.res.cargarReseñasDePelicula(peliculaId);
  }

  async publicarResena() {
    const usuario = this.usuario();
    if (!usuario || !this.calificacion()) return;

    // Cada persona califica una sola vez cada película, y la lista ya trae todas las reseñas de esta
    if (this.resenas().find((r) => r.usuario_id === usuario.id)) {
      this.error.set('Ya publicaste una reseña de esta película, no podés publicar otra.');
      return;
    }

    this.publicando.set(true);
    this.error.set(null);

    const publicada = await this.db.create('resenas', {
      pelicula_id: this.peliculaId(),
      usuario_id: usuario.id,
      calificacion: this.calificacion(),
      comentario: this.comentario().trim() || null, // El comentario es opcional
    });

    this.publicando.set(false);

    if (!publicada) {
      this.error.set('No pudimos publicar tu reseña. Intentá de nuevo.');
      return;
    }

    this.calificacion.set(0);
    this.comentario.set('');
    await this.cargarReseñas(this.peliculaId());
  }
}
