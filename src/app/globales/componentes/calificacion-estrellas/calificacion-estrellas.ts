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

  // Esta forma estrella es para el dibujo, totalmente hecha con ia
  readonly formaEstrella = 'M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.16l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z';

  // Estrella sobre la que está el mouse: mientras se elige, se pinta hasta ahí sin cambiar el valor
  estrellaApuntada = signal(0);
  private valorMostrado = computed(() => this.estrellaApuntada() || this.valor());

  // Cuánto de cada estrella se pinta, de 0 a 100
  // Como las estrellas se dibujan con for y relleno se usa en el DOM, como lee un signal,
  // Angular redibuja cada vez que ese signal cambia y hace que el relleno() se ejecute por cada estrella.
  relleno(numero: number) {
    // cuánto le toca a esta estrella: con valor 4,3 a la quinta le toca 0,3 y a las anteriores 1 o más
    const parte = this.valorMostrado() - (numero - 1);
    if (parte < 0) return 0;
    if (parte > 1) return 100;
    return parte * 100;
  }

  elegir(numero: number) {
    if (this.editable()) this.valor.set(numero);
  }

  apuntar(numero: number) {
    if (this.editable()) this.estrellaApuntada.set(numero);
  }
}
