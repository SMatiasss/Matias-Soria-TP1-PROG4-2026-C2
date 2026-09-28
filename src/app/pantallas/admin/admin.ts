import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Header } from '../../globales/componentes/header/header';

@Component({
  imports: [Header, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin {
  readonly secciones = [
    { ruta: 'peliculas', texto: 'Películas' },
    { ruta: 'salas', texto: 'Salas' },
    { ruta: 'funciones', texto: 'Funciones' },
    { ruta: 'candy', texto: 'Candy bar' },
    { ruta: 'cupones', texto: 'Cupones y recompensas' },
    { ruta: 'empleados', texto: 'Empleados' },
    { ruta: 'reportes', texto: 'Reportes' },
    { ruta: 'actividad', texto: 'Log de actividad' },
  ];
}
