import { Component, computed, input, model } from '@angular/core';
import { Butaca } from '../../../logica/modelos/salas/butaca';
import { TIPOS_BUTACA } from '../../../logica/modelos/salas/tipo-butaca';
import { sinRepetidos } from '../../../logica/utilidades/sin-repetidos.util';

// Todas las filas usan bloques de 4·20·4 butacas. La fila accesible es de 2·10·2
// y se centra dentro de esos mismos bloques para que los pasillos queden alineados.
const ANCHOS_BLOQUES = [4, 20, 4];
const BUTACAS_FILA_ACCESIBLE = [2, 10, 2];

@Component({
  imports: [],
  selector: 'app-mapa-butacas',
  styleUrl: './mapa-butacas.css',
  templateUrl: './mapa-butacas.html',
})
export class MapaButacas {
  butacas = input.required<Butaca[]>();
  ocupadas = input.required<string[]>();
  seleccionadas = model.required<string[]>();

  readonly tipos = TIPOS_BUTACA;

  // null = hueco para alinear la fila accesible
  filas = computed(() => {
    const letras = sinRepetidos(this.butacas().map((b) => b.fila)).sort((a, b) => a.localeCompare(b));

    return letras.map((letra) => {
      const ordenadas = this.butacas()
        .filter((b) => b.fila === letra)
        .sort((a, b) => a.columna - b.columna);
      const tipo = ordenadas[0].tipo;
      const cantidades = tipo === TIPOS_BUTACA.ACCESIBLE ? BUTACAS_FILA_ACCESIBLE : ANCHOS_BLOQUES;

      let inicio = 0;
      const bloques = cantidades.map((cantidad, i) => {
        const hueco: null[] = Array((ANCHOS_BLOQUES[i] - cantidad) / 2).fill(null);
        const bloque = [...hueco, ...ordenadas.slice(inicio, inicio + cantidad), ...hueco];
        inicio += cantidad;
        return bloque;
      });

      return { letra, tipo, bloques };
    });
  });

  alternar(butaca: Butaca) {
    if (this.ocupadas().includes(butaca.id)) return;
    this.seleccionadas.update((ids) =>
      ids.includes(butaca.id) ? ids.filter((id) => id !== butaca.id) : [...ids, butaca.id],
    );
  }
}
