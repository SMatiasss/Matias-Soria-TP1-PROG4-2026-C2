import { Component, computed, input, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Funcion } from '../../../../../logica/modelos/peliculas';
import { sinRepetidos } from '../../../../../logica/utilidades/sin-repetidos.util';

@Component({
  imports: [RouterLink, TitleCasePipe],
  selector: 'app-funciones-pelicula',
  styleUrl: './funciones-pelicula.css',
  templateUrl: './funciones-pelicula.html',
})
export class FuncionesPelicula {
  // Vienen ordenadas por fecha y sin las que ya empezaron. El inicio de cada una trae fecha y hora en UTC, ej: "2026-10-05T16:00:00+00:00"
  funciones = input.required<Funcion[]>();

  // 'sv-SE' da la fecha local como AAAA-MM-DD: sirve como clave de cada día
  private readonly hoy = new Date().toLocaleDateString('sv-SE');

  filtroFormato = signal('');
  filtroIdioma = signal('');
  diaElegido = signal<string | null>(null);

  // Primer día que se ve en la tira de 7 (las flechas lo mueven).
  // Tambien para habilitar/deshabilitar la flecha que va a la izquierda
  primerDiaVisible = signal(0); 

  // Solo los días que tienen funciones, no un calendario fijo
  // De cada inicio se saca solo el día en hora local (AAAA-MM-DD, con diaDeFuncion) para los botones de los días.
  diasConFunciones = computed(() => sinRepetidos(this.funciones().map((f) => this.diaDeFuncion(f))));
  
  // Se muestran 7 días a la vez, las flechas corren la tira
  diasVisibles = computed(() => this.diasConFunciones().slice(this.primerDiaVisible(), this.primerDiaVisible() + 7));

  // Es un booleano que habilita o deshabilita el botón de avanzar los dias.
  hayDiasSiguientes = computed(() => this.primerDiaVisible() + 7 < this.diasConFunciones().length);

  // Hasta que se elige uno, se muestra el primer día con funciones para cuando carga la pantalla detalle.
  diaActivo = computed(() => this.diaElegido() ?? this.diasConFunciones()[0]);

  // Formatos e idiomas sin repetir, para los desplegables de filtro
  opcionesFormato = computed(() => sinRepetidos(this.funciones().map((f) => f.formato)));
  opcionesIdioma = computed(() => sinRepetidos(this.funciones().map((f) => f.idioma)));

  // Funciones del día elegido que pasan los filtros, agrupadas por formato + idioma (ej: "2D · Castellano")
  gruposDeFunciones = computed(() => {
    const grupos: { formato: string; idioma: string; funciones: Funcion[] }[] = []; // Es el array que se ve cada fila con las funciones.
    for (const funcion of this.funciones()) { 

      // Busca las funciones que cumplen con el dia y los filtros seleccionados.
      if (this.diaDeFuncion(funcion) !== this.diaActivo()) continue;
      if (this.filtroFormato() && funcion.formato !== this.filtroFormato()) continue;
      if (this.filtroIdioma() && funcion.idioma !== this.filtroIdioma()) continue;

      // Busca si ya existe la fila con ese formato e idioma y la elige.
      const grupo = grupos.find((g) => g.formato === funcion.formato && g.idioma === funcion.idioma); 

      // Si encontró la fila en el paso anterior, agrega la nueva funcion a la fila. 
      // En la pantalla basicamente se agrega el horario.
      if (grupo) grupo.funciones.push(funcion); 
      
      // Si no encontró una fila ya existe, la crea y agrega la funcion 
      else grupos.push({ formato: funcion.formato, idioma: funcion.idioma, funciones: [funcion] }); 
    }
    return grupos;
  });

  moverDias(paso: number) {
    this.primerDiaVisible.update((inicio) => inicio + paso);
  }


  // Los siguientes 3 es puro visual.
  diaNombre(dia: string) {
    if (dia === this.hoy) return 'Hoy';
    // viene en minúscula, la mayúscula se la pone el CSS con text-transform
    return new Date(`${dia}T00:00`).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
  }

  diaFecha(dia: string) {
    return new Date(`${dia}T00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');
  }

  horaTexto(funcion: Funcion) {
    return new Date(funcion.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  }

  private diaDeFuncion(funcion: Funcion) {
    return new Date(funcion.inicio).toLocaleDateString('sv-SE');
  }
}
