import { Component, computed, input, model, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-calificacion-estrellas',
  styleUrl: './calificacion-estrellas.css',
  templateUrl: './calificacion-estrellas.html',
  host: { '(mouseleave)': 'estrellaApuntada.set(0)' },
})
export class CalificacionEstrellas {
  // De 0 a 5. Puede tener decimales para mostrar un promedio (ej: 4.3 pinta 4 estrellas y un 30% de la quinta)
  valor = model(0);
  // Con editable se puede elegir la puntuación: <app-calificacion-estrellas [editable]="true" [(valor)]="..." />
  editable = input(false);
  tamano = input(20);

  readonly estrellas = [1, 2, 3, 4, 5];
  readonly formaEstrella = 'M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.16l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z';

  // Estrella sobre la que está el mouse: mientras se elige, se pinta hasta ahí sin cambiar el valor
  estrellaApuntada = signal(0);
  private valorMostrado = computed(() => this.estrellaApuntada() || this.valor());

  // Cuánto de cada estrella se pinta, de 0 a 100
  relleno(numero: number) {
    return Math.max(0, Math.min(1, this.valorMostrado() - (numero - 1))) * 100;
  }

  elegir(numero: number) {
    if (this.editable()) this.valor.set(numero);
  }

  apuntar(numero: number) {
    if (this.editable()) this.estrellaApuntada.set(numero);
  }
}
