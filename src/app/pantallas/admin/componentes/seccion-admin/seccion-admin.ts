import { Component, input } from '@angular/core';

// Título, descripción y panel de cada sección del admin. Lo que va adentro del panel lo pone cada sección
@Component({
  imports: [],
  selector: 'app-seccion-admin',
  styleUrl: './seccion-admin.css',
  templateUrl: './seccion-admin.html',
})
export class SeccionAdmin {
  titulo = input.required<string>();
  descripcion = input.required<string>();
}
