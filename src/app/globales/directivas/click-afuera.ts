import { Directive, ElementRef, inject, output } from '@angular/core';

// Avisa cuando se hace click afuera del elemento que la tiene, para cerrar un desplegable (ej: el filtro de géneros)
@Directive({
  selector: '[appClickAfuera]',
  host: { '(document:click)': 'revisarClick($event)' },
})
export class ClickAfuera {
  private elemento = inject(ElementRef); // el elemento que tiene la directiva
  clickAfuera = output<void>();

  revisarClick(evento: MouseEvent) {
    if (!this.elemento.nativeElement.contains(evento.target)) this.clickAfuera.emit();
  }
}
