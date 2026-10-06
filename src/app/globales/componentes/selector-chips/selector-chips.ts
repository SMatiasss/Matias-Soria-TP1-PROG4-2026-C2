import { Component, input, model, signal } from '@angular/core';
import { ClickAfuera } from '../../directivas/click-afuera';

@Component({
  imports: [ClickAfuera],
  selector: 'app-selector-chips',
  styleUrl: './selector-chips.css',
  templateUrl: './selector-chips.html',
})
export class SelectorChips {
  etiqueta = input('Géneros');
  opciones = input.required<string[]>();
  // model: el padre la lee y la escribe con [(seleccionadas)], es un banana in a box decia el angular docs.
  seleccionadas = model<string[]>([]);

  panelAbierto = signal(false);

  alternarPanel() {
    this.panelAbierto.update((valor) => !valor);
  }

  alternarOpcion(opcion: string) {
    this.seleccionadas.update((actuales) =>
      actuales.includes(opcion) ? actuales.filter((o) => o !== opcion) : [...actuales, opcion],
    );
  }
}
