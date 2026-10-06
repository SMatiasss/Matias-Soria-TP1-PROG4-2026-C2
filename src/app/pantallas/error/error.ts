import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../../globales/componentes/header/header';

// La muestra la ruta ** de app.routes.ts: cualquier dirección que no existe
@Component({
  imports: [Header, RouterLink],
  selector: 'app-error',
  styleUrl: './error.css',
  templateUrl: './error.html',
})
export class Error {}
