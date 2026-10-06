import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../globales/componentes/header/header';
import { CardPelicula } from '../../globales/componentes/card-pelicula/card-pelicula';
import { EstadoVacio } from '../../globales/componentes/estado-vacio/estado-vacio';
import { MasVendidas } from './componentes/mas-vendidas/mas-vendidas';
import { CarruselEstrenos } from './componentes/carrusel-estrenos/carrusel-estrenos';
import { PeliculasService } from '../../logica/services/peliculas.service';
import { AuthService } from '../../logica/services/auth.service';
import { Pelicula } from '../../logica/modelos/peliculas';

@Component({
  imports: [Header, CardPelicula, EstadoVacio, MasVendidas, CarruselEstrenos, RouterLink],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio {
  private ps = inject(PeliculasService);
  private auths = inject(AuthService);
  private router = inject(Router);

  peliculasMasVendidas = this.ps.peliculasMasVendidas;
  peliculasEnCartelera = this.ps.peliculasVisibles; // Todas las películas
  proximosEstrenos = this.ps.proximosEstrenos;
  // las que todavía no se estrenaron llevan "Próximamente" en la cartelera y en más vendidas
  idsPeliculasPorEstrenar = this.ps.idsPeliculasPorEstrenar;
  idsPeliculasConAlerta = this.ps.idsPeliculasConAlerta;

  constructor() {
    this.ps.cargarPeliculasVisibles();
    this.ps.cargarPeliculasMasVendidas();

    // Profe, puedo usar effect()? es muy práctico que se ejecute cada vez que un signal se actualice
    effect(() => {
      const usuario = this.auths.usuarioActual();
      if (usuario) this.ps.cargarAlertasDeUsuario(usuario.id);
      else this.ps.idsPeliculasConAlerta.set([]);
    });
  }

  async activarAlertaDeEstreno(pelicula: Pelicula) {
    const usuario = this.auths.usuarioActual();
    if (!usuario) {
      this.router.navigateByUrl('/login');
      return;
    }
    await this.ps.activarAlertaDeEstreno(pelicula.id, usuario.id);
  }
}
