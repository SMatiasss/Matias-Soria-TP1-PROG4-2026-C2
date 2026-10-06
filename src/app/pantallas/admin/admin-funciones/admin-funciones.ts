import { Component, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { FormularioFunciones } from './componentes/formulario-funciones/formulario-funciones';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { Badge } from '../../../globales/componentes/badge/badge';
import { FechaPipe } from '../../../globales/pipes/fecha.pipe';
import { PrecioPipe } from '../../../globales/pipes/precio.pipe';
import { PuntosPipe } from '../../../globales/pipes/puntos.pipe';
import { DbService } from '../../../logica/services/db.service';
import { FuncionesService } from '../../../logica/services/funciones.service';
import { SalasService } from '../../../logica/services/salas.service';
import { Funcion } from '../../../logica/modelos/peliculas';
import { Sala } from '../../../logica/modelos/salas';
import { nombreEnLista } from '../../../logica/utilidades/nombre-en-lista.util';

@Component({
  imports: [SeccionAdmin, FormularioFunciones, EstadoVacio, Alerta, Badge, FechaPipe, PrecioPipe, PuntosPipe, TitleCasePipe],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones {
  private db = inject(DbService);
  private fs = inject(FuncionesService);
  private ss = inject(SalasService);

  // Las que todavía no empezaron, de la más cercana a la más lejana
  funciones = signal<Funcion[]>([]);
  cargando = signal(true);

  // el formulario reemplaza a la lista mientras está abierto
  formularioAbierto = signal(false);
  // la que se está editando (null = programar nuevas)
  funcionEditada = signal<Funcion | null>(null);
  // la que está esperando que confirmen la cancelación (null = ninguna)
  idACancelar = signal<string | null>(null);
  // si no se pudo cancelar una función, agregar una sala o sacarla, se avisa en un modal
  error = signal<string | null>(null);

  // Las salas del cine. La de cada función la elige la base sola: acá solo se agregan o se sacan, como los géneros
  salas = signal<Sala[]>([]);
  // la que está esperando que confirmen sacarla (null = ninguna)
  idSalaASacar = signal<string | null>(null);
  // mientras se crea una (son 518 butacas, tarda un poco) no se puede tocar Agregar de nuevo
  creandoSala = signal(false);

  constructor() {
    this.cargarFunciones();
    this.cargarSalas();
  }

  private async cargarSalas() {
    this.salas.set(await this.db.findAll('salas'));
  }

  // Una sala nueva ya se crea con todas sus butacas, la forma de todas las salas
  async agregarSala(campo: HTMLInputElement) {
    const escrito = campo.value.trim();
    if (!escrito || this.creandoSala()) return;
    // igual que los géneros: si ya hay una que se llama igual (sin contar mayúsculas ni tildes), no se crea otra
    const nombres = this.salas().map((sala) => sala.nombre);
    if (nombres.includes(nombreEnLista(escrito, nombres))) {
      this.error.set('Ya hay una sala con ese nombre.');
      return;
    }

    this.creandoSala.set(true);
    const error = await this.ss.crearSala(escrito);
    this.creandoSala.set(false);
    if (error) {
      this.error.set('No se pudo crear la sala. Intentá de nuevo.');
      return;
    }
    campo.value = '';
    await this.cargarSalas();
  }

  async sacarSala(sala: Sala) {
    this.idSalaASacar.set(null);
    const { error, borrado } = await this.db.eliminar('salas', sala.id);

    // 23503: la base no deja borrar algo que otra tabla usa, acá las funciones de esa sala (aunque ya hayan pasado)
    if (error && error.code === '23503') this.error.set(`${sala.nombre} ya tiene funciones, no se puede sacar.`);
    else if (!borrado) this.error.set(`No se pudo sacar ${sala.nombre}. Intentá de nuevo.`);
    else this.salas.update((lista) => lista.filter((otra) => otra.id !== sala.id));
  }

  private async cargarFunciones() {
    this.funciones.set(await this.fs.cargarProximasFunciones());
    this.cargando.set(false);
  }

  programar() {
    this.funcionEditada.set(null);
    this.formularioAbierto.set(true);
  }

  editar(funcion: Funcion) {
    this.funcionEditada.set(funcion);
    this.formularioAbierto.set(true);
  }

  // al terminar de programar o de editar vuelve a la lista, ya actualizada
  async alGuardar() {
    this.formularioAbierto.set(false);
    await this.cargarFunciones();
  }

  async cancelar(funcion: Funcion) {
    this.idACancelar.set(null);
    const { error, borrado } = await this.db.eliminar('funciones', funcion.id);

    // P0001 es el "raise exception" del trigger que no deja cancelar una función con entradas vendidas.
    // Ese mensaje ya está escrito para el admin. Sin error y sin fila borrada, RLS no la dejó borrar
    if (error && error.code === 'P0001') this.error.set(error.message);
    else if (!borrado) this.error.set('No se pudo cancelar la función. Intentá de nuevo.');
    else this.funciones.update((lista) => lista.filter((otra) => otra.id !== funcion.id));
  }
}
