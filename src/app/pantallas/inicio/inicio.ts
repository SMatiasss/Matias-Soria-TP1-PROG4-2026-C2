import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Header } from '../../globales/componentes/header/header';
import { CardPelicula } from '../../globales/componentes/card-pelicula/card-pelicula';
import { EstadoVacio } from '../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../globales/componentes/alerta/alerta';
import { MasVendidas } from './componentes/mas-vendidas/mas-vendidas';
import { CarruselEstrenos } from './componentes/carrusel-estrenos/carrusel-estrenos';
import { PeliculasService } from '../../logica/services/peliculas.service';
import { AuthService } from '../../logica/services/auth.service';
import { CargandoService } from '../../logica/services/cargando.service';
import { NotificacionesService } from '../../logica/services/notificaciones.service';
import { Pelicula } from '../../logica/modelos/peliculas';

@Component({
  imports: [Header, CardPelicula, EstadoVacio, Alerta, MasVendidas, CarruselEstrenos, RouterLink],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio implements OnDestroy {
  private ps = inject(PeliculasService);
  private auths = inject(AuthService);
  private cgs = inject(CargandoService);
  private ns = inject(NotificacionesService);
  private router = inject(Router);

  peliculasMasVendidas = this.ps.peliculasMasVendidas;
  peliculasEnCartelera = this.ps.peliculasVisibles; // Todas las películas
  proximosEstrenos = this.ps.proximosEstrenos;
  // las que todavía no se estrenaron llevan "Próximamente" en la cartelera y en más vendidas
  idsPeliculasPorEstrenar = this.ps.idsPeliculasPorEstrenar;
  idsPeliculasConAlerta = this.ps.idsPeliculasConAlerta;
  // mientras cargan, las columnas dicen "Cargando..." en vez de que no hay nada.
  // El de más vendidas lo prende y lo apaga el interceptor de HttpClient
  cargandoMasVendidas = this.cgs.cargando;
  cargandoPeliculas = this.ps.cargandoVisibles;
  // la alerta se guardó pero el navegador no deja mandarle notificaciones: se le avisa en un modal
  sinNotificaciones = signal(false);

  // el pedido de más vendidas: si se sale de la pantalla antes de que llegue, se cancela
  private suscripcion: Subscription;

  constructor() {
    this.ps.cargarPeliculasVisibles();
    // HttpClient devuelve un Observable: el pedido sale al suscribirse, y la respuesta llega a next
    this.suscripcion = this.ps.traerPeliculasMasVendidas().subscribe({
      next: (filas) => this.ps.peliculasMasVendidas.set(filas.map((fila) => fila.pelicula)),
      error: (error) => console.error('No se pudieron cargar las películas más vendidas', error),
    });

    // las alertas de estreno del usuario se cargan cuando inicia sesión, y sin sesión no se marca ninguna
    effect(() => {
      const usuario = this.auths.usuarioActual();
      if (usuario) this.ps.cargarAlertasDeUsuario(usuario.id);
      else this.ps.idsPeliculasConAlerta.set([]);
    });
  }

  ngOnDestroy() {
    this.suscripcion.unsubscribe();
  }

  async activarAlertaDeEstreno(pelicula: Pelicula) {
    const usuario = this.auths.usuarioActual();
    if (!usuario) {
      this.router.navigateByUrl('/login');
      return;
    }
    if (!(await this.ps.activarAlertaDeEstreno(pelicula.id, usuario.id))) return;
    // para que el aviso le llegue como notificación, aunque no tenga la página abierta
    if (!(await this.ns.suscribir(usuario.id))) this.sinNotificaciones.set(true);
  }
}
