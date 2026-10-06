import { AfterViewInit, Component, ElementRef, OnInit, computed, effect, input, model, signal, viewChild } from '@angular/core';
// date-fns: funciones sueltas para fechas (parseISO lee "AAAA-MM-DD" en hora local, no en UTC)
import { addYears, format, getDaysInMonth, parseISO, startOfDay } from 'date-fns';

@Component({
  imports: [],
  selector: 'app-selector-fecha',
  styleUrl: './selector-fecha.css',
  templateUrl: './selector-fecha.html',
})
export class SelectorFecha implements OnInit, AfterViewInit {
  // igual al alto de .opcion-rueda, .relleno-rueda y .marca-rueda en el CSS
  private readonly altoItem = 36;

  // AAAA-MM-DD. Si llega una, las ruedas arrancan ahí
  fecha = model<string | null>(null);

  // el rango: desde fechaBase, cuántos años para atrás (negativo) o para adelante (positivo)
  fechaBase = input.required<Date>();
  anios = input.required<number>();

  // primera y última fecha que se pueden elegir
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

  // los meses del año elegido (se recortan en el primer y el último año)
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

  // el mes elegido, sin pasarse del último de la lista
  private mesElegido = computed(() => {
    const ultimo = this.mesesDisponibles().length - 1;
    if (this.indiceMes() > ultimo) return this.mesesDisponibles()[ultimo];
    return this.mesesDisponibles()[this.indiceMes()];
  });

  // los días del mes elegido (se recortan en el mes de la mínima y en el de la máxima)
  dias = computed(() => {
    const año = this.anioElegido();
    const mes = this.mesElegido(); // del 1 al 12
    const minima = this.fechaMinima();
    const maxima = this.fechaMaxima();
    const esMesDeLaMinima = año === minima.getFullYear() && mes === minima.getMonth() + 1;
    const esMesDeLaMaxima = año === maxima.getFullYear() && mes === maxima.getMonth() + 1;

    const desde = esMesDeLaMinima ? minima.getDate() : 1;
    // en Date los meses van de 0 a 11, por eso mes - 1
    const hasta = esMesDeLaMaxima ? maxima.getDate() : getDaysInMonth(new Date(año, mes - 1));

    const dias: number[] = [];
    for (let dia = desde; dia <= hasta; dia++) {
      dias.push(dia);
    }
    return dias;
  });

  // el día elegido, sin pasarse del último (si la lista se achica, el snap del CSS también corrige la rueda)
  private diaElegido = computed(() => {
    const ultimo = this.dias().length - 1;
    if (this.indiceDia() > ultimo) return this.dias()[ultimo];
    return this.dias()[this.indiceDia()];
  });

  // las ruedas, para moverlas
  private readonly scrollDia = viewChild.required<ElementRef<HTMLDivElement>>('scrollDia');
  private readonly scrollMes = viewChild.required<ElementRef<HTMLDivElement>>('scrollMes');
  private readonly scrollAnio = viewChild.required<ElementRef<HTMLDivElement>>('scrollAnio');

  constructor() {
    // Profe, puedo usar effect()? es muy práctico que se ejecute cada vez que un signal se actualice
    effect(() => {
      // hasta que no se mueve una rueda no hay fecha elegida
      if (!this.ruedaMovida()) return;
      const elegida = new Date(this.anioElegido(), this.mesElegido() - 1, this.diaElegido());
      this.fecha.set(format(elegida, 'yyyy-MM-dd'));
    });
  }

  // acá ya llegaron los inputs: las ruedas arrancan en la fecha recibida (si está en el rango) o en la base
  ngOnInit() {
    const fecha = this.fecha();
    const recibida = fecha ? parseISO(fecha) : null;
    const dentroDelRango = recibida && recibida >= this.fechaMinima() && recibida <= this.fechaMaxima();
    const inicial = dentroDelRango ? recibida : startOfDay(this.fechaBase());

    // primero el año, porque los meses dependen del año y los días del mes
    this.indiceAnio.set(this.listaAnios().indexOf(inicial.getFullYear()));
    this.indiceMes.set(this.mesesDisponibles().indexOf(inicial.getMonth() + 1));
    this.indiceDia.set(this.dias().indexOf(inicial.getDate()));
  }

  // Profe, puedo usar ngAfterViewInit? pone las ruedas en la fecha inicial cuando ya existe el DOM
  ngAfterViewInit() {
    this.scrollDia().nativeElement.scrollTop = this.indiceDia() * this.altoItem;
    this.scrollMes().nativeElement.scrollTop = this.indiceMes() * this.altoItem;
    this.scrollAnio().nativeElement.scrollTop = this.indiceAnio() * this.altoItem;
  }

  // al scrollear se actualiza el índice de cada rueda
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

  // rueda del mouse: un ítem por movimiento
  alGirar(evento: WheelEvent, rueda: HTMLDivElement) {
    evento.preventDefault();
    this.ruedaMovida.set(true);
    if (evento.deltaY > 0) rueda.scrollBy({ top: -this.altoItem, behavior: 'smooth' });
    if (evento.deltaY < 0) rueda.scrollBy({ top: this.altoItem, behavior: 'smooth' });
  }

  // arrastre con el mouse: se carga al apretar
  private arrastre: { y: number; scrollTop: number } | null = null;

  alApretar(evento: PointerEvent, rueda: HTMLDivElement) {
    this.ruedaMovida.set(true);
    if (evento.pointerType !== 'mouse') return;
    rueda.setPointerCapture(evento.pointerId);
    rueda.classList.add('arrastrando');
    this.arrastre = { y: evento.clientY, scrollTop: rueda.scrollTop };
  }

  alArrastrar(evento: PointerEvent, rueda: HTMLDivElement) {
    // pointermove también se dispara al pasar por arriba: solo cuenta si se apretó
    if (!this.arrastre) return;
    rueda.scrollTop = this.arrastre.scrollTop - (evento.clientY - this.arrastre.y);
  }

  alSoltar(rueda: HTMLDivElement) {
    if (!this.arrastre) return;
    this.arrastre = null;
    rueda.classList.remove('arrastrando'); // al volver el snap, la rueda se acomoda sola al ítem más cercano
  }
}
