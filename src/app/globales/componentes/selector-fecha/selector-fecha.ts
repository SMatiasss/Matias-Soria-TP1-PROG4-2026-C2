import { AfterViewInit, Component, ElementRef, OnInit, computed, effect, input, model, signal, viewChild } from '@angular/core';
// date-fns: librería chica de funciones sueltas para fechas. Cada función hace una sola cosa y se importa solo lo que se usa.
// addYears: suma o resta años a una fecha. Si cae en un 29 de febrero de un año que no es bisiesto, lo pasa al 28 solo.
// getDaysInMonth: cuántos días tiene un mes (28, 29, 30 o 31), ya contando los años bisiestos.
// startOfDay: la misma fecha a las 00:00, para comparar días sin que moleste la hora.
// parseISO: lee "AAAA-MM-DD" como fecha local. new Date("AAAA-MM-DD") la lee en UTC y en Argentina quedaría el día anterior.
// format: arma el texto de una fecha con el formato pedido. "yyyy-MM-dd" ya pone los dos dígitos (9 → "09").
import { addYears, format, getDaysInMonth, parseISO, startOfDay } from 'date-fns';

@Component({
  imports: [],
  selector: 'app-selector-fecha',
  styleUrl: './selector-fecha.css',
  templateUrl: './selector-fecha.html',
})
export class SelectorFecha implements OnInit, AfterViewInit {
  // Quiero aclarar de antemano, que está siendo una pesadilla explicar esto y son las 1 am con solo 4 horas de sueño.
  // Asique perdon de antemano si explico mal, pero estos comentarios tambien son para guiarme a mí mismo jaja.
  // Es una pesadilla este componente. No sé si aceptaban incluir librerías, pero por ahora quedó funcional.

  // Tiene que ser igual al alto de .opcion-rueda en el CSS (tambien .relleno-rueda y .marca-rueda )
  private readonly altoItem = 36;

  // Formato YYYY-MM-DD, null hasta que se mueve alguna rueda.
  fecha = model<string | null>(null);

  // El rango que se puede elegir: desde fechaBase (ej: hoy), cuántos años para atrás (negativo) o para adelante (positivo).
  // El componente no sabe para qué es la fecha, solo respeta este rango. Ej: registro -100, estreno de una película 1
  fechaBase = input.required<Date>();
  anios = input.required<number>();

  // Primera y última fecha que se pueden elegir
  private fechaMinima = computed(() => {
    const base = startOfDay(this.fechaBase());
    return this.anios() < 0 ? addYears(base, this.anios()) : base;
  });
  private fechaMaxima = computed(() => {
    const base = startOfDay(this.fechaBase());
    return this.anios() < 0 ? base : addYears(base, this.anios());
  });

  readonly meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  // Los años de la rueda, del más viejo al más nuevo
  listaAnios = computed(() => {
    const lista: number[] = [];
    for (let año = this.fechaMinima().getFullYear(); año <= this.fechaMaxima().getFullYear(); año++) {
      lista.push(año);
    }
    return lista;
  });

  // Posición elegida en cada rueda. Arrancan en ngOnInit, cuando ya llegó el rango
  indiceDia = signal(0);
  indiceMes = signal(0);
  indiceAnio = signal(0);

  ruedaMovida = signal(false);

  private anioElegido = computed(() => this.listaAnios()[this.indiceAnio()]);

  // Los meses que se pueden elegir en el año elegido, del 1 al 12.
  // Solo se recortan en el primer año (desde el mes de la mínima) y en el último (hasta el mes de la máxima)
  mesesDisponibles = computed(() => {
    const año = this.anioElegido();
    const desde = año === this.fechaMinima().getFullYear() ? this.fechaMinima().getMonth() + 1 : 1;
    const hasta = año === this.fechaMaxima().getFullYear() ? this.fechaMaxima().getMonth() + 1 : 12;
    const meses: number[] = [];
    for (let mes = desde; mes <= hasta; mes++) {
      meses.push(mes);
    }
    return meses;
  });

  // Recibe el mes elegido. Igual que el día, por seguridad no se pasa del último de la lista
  private mesElegido = computed(() => {
    const ultimo = this.mesesDisponibles().length - 1;
    if (this.indiceMes() > ultimo) return this.mesesDisponibles()[ultimo];
    return this.mesesDisponibles()[this.indiceMes()];
  });

  // Se encarga de calcular cuantos días va a tener el scroll.
  // Solo se recortan en el mes de la fecha mínima (desde su día) y en el de la máxima (hasta su día)
  dias = computed(() => {
    const año = this.anioElegido();
    const mes = this.mesElegido(); // del 1 al 12
    const minima = this.fechaMinima();
    const maxima = this.fechaMaxima();
    const esMesDeLaMinima = año === minima.getFullYear() && mes === minima.getMonth() + 1;
    const esMesDeLaMaxima = año === maxima.getFullYear() && mes === maxima.getMonth() + 1;

    const desde = esMesDeLaMinima ? minima.getDate() : 1;
    // getDaysInMonth recibe cualquier fecha de ese mes y devuelve cuántos días tiene.
    // En Date los meses van de 0 a 11, por eso mes - 1
    const hasta = esMesDeLaMaxima ? maxima.getDate() : getDaysInMonth(new Date(año, mes - 1));

    const dias: number[] = []; // Acá el array de los dias para el scroll con el for.
    for (let dia = desde; dia <= hasta; dia++) {
      dias.push(dia);
    }
    return dias;
  });
  // Si al cambiar el año o el mes la lista se achica y la rueda queda en un índice que ya no existe,
  // el snap del css no permite que esté en un elemento con índice inexistente.
  // Entonces el snap del css realiza un evento scroll para ir al ultimo elemento disponible corrigiendo todo.
  // Es un poco dificil de explicar por texto, pero como lo de css tambien cuenta como scroll, tambien se disparan los
  // "alScrollear.."

  //  Recibe el dia elegido
  private diaElegido = computed(() => {
    const ultimo = this.dias().length - 1; // toma el ultimo día, recordar que los indices empiezan en 0.
    if (this.indiceDia() > ultimo) return this.dias()[ultimo]; // Es por seguridad, ya que la lista se agranda y achica, podría tener un indice más alto al real.
    return this.dias()[this.indiceDia()]; // Si el indice está correcto y no supera el limite, retorna el numero de ese indice.
  });

  // Recibe el acceso a los ruedas divs para modificarlo.
  private readonly scrollDia = viewChild.required<ElementRef<HTMLDivElement>>('scrollDia');
  private readonly scrollMes = viewChild.required<ElementRef<HTMLDivElement>>('scrollMes');
  private readonly scrollAnio = viewChild.required<ElementRef<HTMLDivElement>>('scrollAnio');

  constructor() {
    // Profe, puedo usar effect()? es muy práctico que se ejecute cada vez que un signal se actualice
    effect(() => {
      if (!this.ruedaMovida()) return; // Para asegurarse de activar el effect ya que ruedamovida es un signal.
      const elegida = new Date(this.anioElegido(), this.mesElegido() - 1, this.diaElegido());
      this.fecha.set(format(elegida, 'yyyy-MM-dd')); // Esta es la fecha que elige el usuario
    });
  }

  // Acá ya llegaron los inputs, en el constructor todavía no
  ngOnInit() {
    // Si ya llega una fecha dentro del rango (ej: al editar una película), las ruedas arrancan ahí. Si no, en la fecha base
    const fecha = this.fecha();
    const recibida = fecha ? parseISO(fecha) : null;
    const dentroDelRango = recibida && recibida >= this.fechaMinima() && recibida <= this.fechaMaxima();
    const inicial = dentroDelRango ? recibida : startOfDay(this.fechaBase());

    // Primero el año, porque los meses dependen del año y los días del mes
    this.indiceAnio.set(this.listaAnios().indexOf(inicial.getFullYear()));
    this.indiceMes.set(this.mesesDisponibles().indexOf(inicial.getMonth() + 1));
    this.indiceDia.set(this.dias().indexOf(inicial.getDate()));
  }

  // No lo vimos en clase, pero yo en las primeras clases vi la documentacion pensando que entraba todo y nada que ver.
  // Lo uso para asegurarme de que colo que la fecha actual despues de que serenderice todo el DOM.
  // Si no lo puedo usar, puedo sacarlo y creo que simplemente aparece la fecha mas vieja por defecto.
  ngAfterViewInit() {
    this.scrollDia().nativeElement.scrollTop = this.indiceDia() * this.altoItem;
    this.scrollMes().nativeElement.scrollTop = this.indiceMes() * this.altoItem;
    this.scrollAnio().nativeElement.scrollTop = this.indiceAnio() * this.altoItem;
  }

  //los alScrollear actualizan los indices.
  alScrollearDia(evento: Event) {
    this.indiceDia.set(this.calcularIndice(evento));
  }

  alScrollearMes(evento: Event) {
    this.indiceMes.set(this.calcularIndice(evento));
  }

  alScrollearAnio(evento: Event) {
    this.indiceAnio.set(this.calcularIndice(evento));
  }


  private calcularIndice(evento: Event) {
    const scrollTop = (evento.target as HTMLDivElement).scrollTop;
    return Math.round(scrollTop / this.altoItem);
  }

  // Rueda del mouse: +1- ítem por movimiento.
  alGirar(evento: WheelEvent, rueda: HTMLDivElement) {
    evento.preventDefault();
    this.ruedaMovida.set(true);
    //deltaY dice cuanto giré la rueda y si baje o subí con positivo o negativo.
    if (evento.deltaY > 0) rueda.scrollBy({ top: -this.altoItem, behavior: 'smooth' });
    if (evento.deltaY < 0) rueda.scrollBy({ top: this.altoItem, behavior: 'smooth' });
  }

  // Arrastre con mouse, se inicia acá, pero se carga en alApretar
  private arrastre: { y: number; scrollTop: number } | null = null;

  alApretar(evento: PointerEvent, rueda: HTMLDivElement) {
    this.ruedaMovida.set(true);
    if (evento.pointerType !== 'mouse') return;
    rueda.setPointerCapture(evento.pointerId);
    rueda.classList.add('arrastrando'); // Una clase para el CSS.
    this.arrastre = { y: evento.clientY, scrollTop: rueda.scrollTop };
  }

  alArrastrar(evento: PointerEvent, rueda: HTMLDivElement) {
    // Se asegura de que fue se apretó click.
    // Porque el pointermove detecta el mouse con solo pasar por arriba
    if (!this.arrastre) return;
    rueda.scrollTop = this.arrastre.scrollTop - (evento.clientY - this.arrastre.y);
  }

  alSoltar(rueda: HTMLDivElement) {
    if (!this.arrastre) return;
    this.arrastre = null; // como suelta el click, se limpia
    rueda.classList.remove('arrastrando'); // al volver el snap, la rueda se acomoda sola al ítem más cercano
  }
}
