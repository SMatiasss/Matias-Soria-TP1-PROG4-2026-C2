import { Component, inject, signal } from '@angular/core';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioFunciones } from './componentes/formulario-funciones/formulario-funciones';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { FuncionesService } from '../../../logica/services/funciones.service';
import { Funcion } from '../../../logica/modelos/peliculas';
import { format } from 'date-fns';

@Component({
  imports: [SeccionAdmin, FormularioFunciones, EstadoVacio, Alerta],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones {
  private fs = inject(FuncionesService);

  // Las que todavía no empezaron, de la más cercana a la más lejana
  funciones = signal<Funcion[]>([]);
  cargando = signal(true);

  // el formulario reemplaza a la lista mientras está abierto
  formularioAbierto = signal(false);
  // la que está esperando que confirmen la cancelación (null = ninguna)
  idACancelar = signal<string | null>(null);
  // si no se pudo cancelar, se avisa en un modal
  error = signal<string | null>(null);

  constructor() {
    this.cargarFunciones();
  }

  private async cargarFunciones() {
    this.funciones.set(await this.fs.cargarProximasFunciones());
    this.cargando.set(false);
  }

  // al terminar de programar vuelve a la lista, ya con las funciones nuevas
  async alProgramar() {
    this.formularioAbierto.set(false);
    await this.cargarFunciones();
  }

  async cancelar(funcion: Funcion) {
    this.idACancelar.set(null);
    const { error, borrada } = await this.fs.cancelarFuncion(funcion.id);

    // P0001 es el "raise exception" del trigger que no deja cancelar una función con entradas vendidas.
    // Ese mensaje ya está escrito para el admin. Sin error y sin fila borrada, RLS no la dejó borrar
    if (error && error.code === 'P0001') this.error.set(error.message);
    else if (!borrada) this.error.set('No se pudo cancelar la función. Intentá de nuevo.');
    else this.funciones.update((lista) => lista.filter((otra) => otra.id !== funcion.id));
  }

  // la base la guarda con fecha y hora completas (en UTC), acá se muestra en hora local como DD/MM/AAAA HH:mm
  fechaTexto(inicio: string) {
    return format(new Date(inicio), 'dd/MM/yyyy HH:mm');
  }
}
