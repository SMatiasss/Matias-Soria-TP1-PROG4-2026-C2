import { Component, ElementRef, inject, input, model, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-selector-chips',
  styleUrl: './selector-chips.css',
  templateUrl: './selector-chips.html',
  host: { '(document:click)': 'cerrarSiClickAfuera($event)' },
})
export class SelectorChips {
  private elemento = inject(ElementRef);

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

  cerrarSiClickAfuera(evento: MouseEvent) {
    if (!this.elemento.nativeElement.contains(evento.target)) {
      this.panelAbierto.set(false);
    }
  }
}
