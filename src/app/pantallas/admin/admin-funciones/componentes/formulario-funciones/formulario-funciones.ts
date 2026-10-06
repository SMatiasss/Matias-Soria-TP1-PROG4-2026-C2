import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectorFecha } from '../../../../../globales/componentes/selector-fecha/selector-fecha';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { FechaPipe } from '../../../../../globales/pipes/fecha.pipe';
import { DbService } from '../../../../../logica/services/db.service';
import { FORMATOS_FUNCION, Funcion, FuncionFormulario, IDIOMAS_FUNCION, Pelicula } from '../../../../../logica/modelos/peliculas';
// date-fns: format arma el texto de una fecha y parseISO lee "AAAA-MM-DD" como fecha local
import { format, parseISO } from 'date-fns';

// La butaca VIP tiene que costar más que la normal. Si falta alguno de los dos, ya avisa el required
function vipMasCaroValidator(grupo: AbstractControl) {
  const base = grupo.get('precio_base')?.value;
  const vip = grupo.get('precio_vip')?.value;
  if (!base || !vip) return null;
  return vip > base ? null : { vipMasBarato: true };
}

// Lo mismo con los puntos: canjear una butaca VIP cuesta más puntos que una normal
function puntosVipValidator(grupo: AbstractControl) {
  const base = grupo.get('precio_puntos')?.value;
  const vip = grupo.get('precio_puntos_vip')?.value;
  if (!base || !vip) return null;
  return vip > base ? null : { puntosVipMenor: true };
}

@Component({
  imports: [SelectorFecha, Alerta, ReactiveFormsModule, FechaPipe, TitleCasePipe],
  selector: 'app-formulario-funciones',
  styleUrl: './formulario-funciones.css',
  templateUrl: './formulario-funciones.html',
})
export class FormularioFunciones implements OnInit {
  private db = inject(DbService);

  // null = programar nuevas. Si viene una, se editan su formato, idioma, precios y puntos.
  // La película, el día y la hora no: la sala la eligió la base para ese horario
  funcion = input<Funcion | null>(null);
  cancelado = output<void>();
  // avisa a la lista que se crearon o se editaron, para que cierre el formulario y recargue
  guardado = output<void>();

  // todas, también las que todavía no son visibles (se pueden programar antes de mostrarlas)
  peliculas = signal<Pelicula[]>([]);
  intentoGuardar = signal(false);
  programando = signal(false);
  // no se creó ninguna: el aviso se cierra y sigue en el formulario
  error = signal<string | null>(null);
  // se crearon algunas y otras no: al cerrar el aviso vuelve a la lista
  resultado = signal<string | null>(null);

  readonly formatos = Object.values(FORMATOS_FUNCION);
  readonly idiomas = Object.values(IDIOMAS_FUNCION);
  // en el orden de la semana, con el número que usa getDay() (0 = domingo)
  readonly diasSemana = [
    { nombre: 'Lun', numero: 1 },
    { nombre: 'Mar', numero: 2 },
    { nombre: 'Mié', numero: 3 },
    { nombre: 'Jue', numero: 4 },
    { nombre: 'Vie', numero: 5 },
    { nombre: 'Sáb', numero: 6 },
    { nombre: 'Dom', numero: 0 },
  ];
  // las horas de 00 a 23 (se llenan en el constructor). Dos selects en vez de un reloj, se elige rápido
  readonly horas: number[] = [];
  readonly minutos = [0, 15, 30, 45];
  // se programa desde hoy hasta 1 año para adelante
  readonly hoy = new Date();

  formulario = new FormGroup(
    {
      pelicula_id: new FormControl<string | null>(null, Validators.required),
      formato: new FormControl(FORMATOS_FUNCION.DOS_D),
      idioma: new FormControl(IDIOMAS_FUNCION.CASTELLANO),
      precio_base: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      precio_vip: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      // cuántos puntos cuesta canjear una entrada de estas funciones, en vez de pagarla
      precio_puntos: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      precio_puntos_vip: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      // los elegidos, se agregan y se sacan con alternarDia
      dias: new FormControl<number[]>([], Validators.required),
      hora: new FormControl<number | null>(null, Validators.required),
      minutos: new FormControl(0),
      // arranca hoy, las ruedas se mueven solo si es otro día
      desde: new FormControl(format(new Date(), 'yyyy-MM-dd'), Validators.required),
      semanas: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(12)]),
    },
    { validators: [vipMasCaroValidator, puntosVipValidator] },
  );

  constructor() {
    for (let hora = 0; hora < 24; hora++) this.horas.push(hora);
    this.cargarPeliculas();
  }

  // Al editar arranca con los datos de la función, y lo que no se puede cambiar queda deshabilitado:
  // un control deshabilitado no cuenta para validar ni va en formulario.value
  ngOnInit() {
    const funcion = this.funcion();
    if (!funcion) return;
    this.formulario.reset(funcion);
    for (const campo of ['pelicula_id', 'dias', 'hora', 'minutos', 'desde', 'semanas']) this.formulario.get(campo)?.disable();
  }

  private async cargarPeliculas() {
    this.peliculas.set(await this.db.findAll('peliculas'));
  }

  diaElegido(numero: number) {
    return (this.formulario.controls.dias.value as number[]).includes(numero);
  }

  alternarDia(numero: number) {
    const dias = this.formulario.controls.dias.value as number[];
    if (dias.includes(numero)) this.formulario.controls.dias.setValue(dias.filter((dia) => dia !== numero));
    else this.formulario.controls.dias.setValue([...dias, numero]);
  }

  // la fecha de estreno de la película elegida, o null si todavía no eligió
  estrenoElegido() {
    const elegida = this.peliculas().find((pelicula) => pelicula.id === this.formulario.controls.pelicula_id.value);
    return elegida ? elegida.fecha_estreno : null;
  }

  // La preventa vende antes, pero las funciones son desde el día del estreno.
  // Las fechas "AAAA-MM-DD" se pueden comparar como texto
  desdeAntesDelEstreno() {
    const estreno = this.estrenoElegido();
    const desde = this.formulario.controls.desde.value;
    return estreno !== null && desde !== null && desde < estreno;
  }

  async programar() {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid || this.desdeAntesDelEstreno()) {
      this.formulario.markAllAsTouched();
      return;
    }

    // al editar se guarda lo que quedó habilitado: formato, idioma, precios y puntos
    const funcion = this.funcion();
    if (funcion) {
      this.programando.set(true);
      const error = await this.db.guardar('funciones', funcion.id, this.formulario.value);
      this.programando.set(false);
      if (!error) this.guardado.emit();
      else if (error.code === 'P0001') this.error.set(error.message);
      else this.error.set('No se pudo guardar la función. Intentá de nuevo.');
      return;
    }

    const valores = this.formulario.value as FuncionFormulario;

    // un inicio por cada día elegido. Si el día se pasa del mes, new Date sigue en el próximo
    const desde = parseISO(valores.desde);
    const inicios: Date[] = [];
    for (let i = 0; i < valores.semanas * 7; i++) {
      const inicio = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i, valores.hora, valores.minutos);
      // hoy a una hora que ya pasó no se programa
      if (valores.dias.includes(inicio.getDay()) && inicio > new Date()) inicios.push(inicio);
    }
    if (!inicios.length) {
      this.error.set('Con esos días y esa hora no queda ninguna función por crear. Probá con otra hora o con más semanas.');
      return;
    }

    this.programando.set(true);
    // de a una y no con Promise.all: así cada una ya cuenta las anteriores al buscar sala
    const noCreadas: string[] = [];
    let motivo = '';
    for (const inicio of inicios) {
      // sin sala: la elige el trigger sala_y_horario_funcion
      const error = await this.db.guardar('funciones', null, {
        pelicula_id: valores.pelicula_id,
        formato: valores.formato,
        idioma: valores.idioma,
        precio_base: valores.precio_base,
        precio_vip: valores.precio_vip,
        precio_puntos: valores.precio_puntos,
        precio_puntos_vip: valores.precio_puntos_vip,
        inicio: inicio.toISOString(),
      });
      if (error) {
        noCreadas.push(format(inicio, 'dd/MM HH:mm'));
        // P0001: el mensaje del trigger (ej: no hay sala libre)
        motivo = error.code === 'P0001' ? error.message : 'error inesperado de la base';
      }
    }
    this.programando.set(false);

    if (!noCreadas.length) {
      this.guardado.emit();
      return;
    }

    // en el aviso entran pocas fechas, las demás solo se cuentan
    let fechas = noCreadas.slice(0, 4).join(', ');
    if (noCreadas.length > 4) fechas += ` y ${noCreadas.length - 4} más`;
    const detalle = `No se crearon las del ${fechas} (${motivo}).`;
    const creadas = inicios.length - noCreadas.length;
    if (creadas === 0) this.error.set(detalle);
    else this.resultado.set(`Se crearon ${creadas} de ${inicios.length}. ${detalle}`);
  }
}
