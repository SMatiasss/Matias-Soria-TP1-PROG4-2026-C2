import { Component, inject, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectorFecha } from '../../../../../globales/componentes/selector-fecha/selector-fecha';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../../../logica/services/db.service';
import { FuncionesService } from '../../../../../logica/services/funciones.service';
import { FORMATOS_FUNCION, FuncionFormulario, IDIOMAS_FUNCION, Pelicula } from '../../../../../logica/modelos/peliculas';
// date-fns, la misma que usa el selector de fecha: format arma el texto de una fecha ("AAAA-MM-DD", "DD/MM HH:mm")
// y parseISO lee "AAAA-MM-DD" como fecha local
import { format, parseISO } from 'date-fns';

// La butaca VIP tiene que costar más que la normal. Si falta alguno de los dos, ya avisa el required
function vipMasCaroValidator(grupo: AbstractControl) {
  const base = grupo.get('precio_base')?.value;
  const vip = grupo.get('precio_vip')?.value;
  if (!base || !vip) return null;
  return vip > base ? null : { vipMasBarato: true };
}

@Component({
  imports: [SelectorFecha, Alerta, ReactiveFormsModule],
  selector: 'app-formulario-funciones',
  styleUrl: './formulario-funciones.css',
  templateUrl: './formulario-funciones.html',
})
export class FormularioFunciones {
  private db = inject(DbService);
  private fs = inject(FuncionesService);

  cancelado = output<void>();
  // avisa a la lista que se crearon funciones, para que cierre el formulario y recargue
  programadas = output<void>();

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
  // las 24 horas, de 00 a 23 (se llenan en el constructor). Dos selects cortos en vez de un reloj nativo: se elige rápido y sin scroll
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
      // los elegidos, se agregan y se sacan con alternarDia
      dias: new FormControl<number[]>([], Validators.required),
      hora: new FormControl<number | null>(null, Validators.required),
      minutos: new FormControl(0),
      // arranca hoy, las ruedas se mueven solo si es otro día
      desde: new FormControl(format(new Date(), 'yyyy-MM-dd'), Validators.required),
      semanas: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(12)]),
    },
    { validators: vipMasCaroValidator },
  );

  constructor() {
    for (let hora = 0; hora < 24; hora++) this.horas.push(hora);
    this.cargarPeliculas();
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

  // el estreno como DD/MM/AAAA, para el aviso
  estrenoTexto() {
    const estreno = this.estrenoElegido();
    return estreno ? format(parseISO(estreno), 'dd/MM/yyyy') : '';
  }

  async programar() {
    this.intentoGuardar.set(true);
    if (this.formulario.invalid || this.desdeAntesDelEstreno()) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.value as FuncionFormulario;

    // Un inicio por cada día elegido en esas semanas. Si el día se pasa del mes, new Date sigue en el próximo (32/10 = 1/11)
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
    // De a una (sin Promise.all): así cada una ya cuenta las anteriores al buscar sala libre, y se sabe cuáles fallaron
    const noCreadas: string[] = [];
    let motivo = '';
    for (const inicio of inicios) {
      const error = await this.fs.crearFuncion({
        pelicula_id: valores.pelicula_id,
        formato: valores.formato,
        idioma: valores.idioma,
        precio_base: valores.precio_base,
        precio_vip: valores.precio_vip,
        inicio: inicio.toISOString(),
      });
      if (error) {
        noCreadas.push(format(inicio, 'dd/MM HH:mm'));
        // P0001 es el "raise exception" del trigger (ej: no hay sala libre), su mensaje ya está escrito para el admin
        motivo = error.code === 'P0001' ? error.message : 'error inesperado de la base';
      }
    }
    this.programando.set(false);

    if (!noCreadas.length) {
      this.programadas.emit();
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
