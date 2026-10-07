import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacionesService } from './logica/services/notificaciones.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private ns = inject(NotificacionesService);

  // al abrir (o recargar) la página se revisa si hay avisos de estreno para mandar
  constructor() {
    this.ns.revisarAvisos();
  }
}
