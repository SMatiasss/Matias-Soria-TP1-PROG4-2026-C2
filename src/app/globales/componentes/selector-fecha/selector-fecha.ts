import { AfterViewInit, Component, ElementRef, computed, effect, model, signal, viewChild } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-selector-fecha',
  styleUrl: './selector-fecha.css',
  templateUrl: './selector-fecha.html',
})
export class SelectorFecha implements AfterViewInit {
  // Quiero aclarar de antemano, que está siendo una pesadilla explicar esto y son las 1 am con solo 4 horas de sueño.
  // Asique perdon de antemano si explico mal, pero estos comentarios tambien son para guiarme a mí mismo jaja.
  // Es una pesadilla este componente. No sé si aceptaban incluir librerías, pero por ahora quedó funcional.



  // Tiene que ser igual al alto de .opcion-rueda en el CSS (tambien .relleno-rueda y .marca-rueda )
  private readonly altoItem = 36;

  // Formato YYYY-MM-DD, null hasta que se mueve alguna rueda.
  fecha = model<string | null>(null);

  private readonly hoy = new Date();

  readonly meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  // Es para agregar los últimos 100 años al scroll. Se llenan en el constructor
  readonly anios: number[] = [];

  // Arranca en la fecha de hoy
  indiceDia = signal(this.hoy.getDate() - 1);
  indiceMes = signal(this.hoy.getMonth());
  indiceAnio = signal(99); // ya que busco 100 años, la posicion 99 es la última, osea la actual.

  ruedaMovida = signal(false);

  // Tomo el array anios, busco por indice actual de año y comparo con el año de "hoy" que contiene la fecha actual.
  // Para luego, trabajar con los mmeses y evitar meses del futuro.
  // Scrollear el año modifica indiceAnio, que me diría el año, por indice, en la lista "anios" por eso lo usamos para comparar.
  private esAñoActual = computed(() => this.anios[this.indiceAnio()] === this.hoy.getFullYear());

  // No se muestran fechas futuras: en el año actual, solo hasta el mes de hoy
  mesesDisponibles = computed(() => (this.esAñoActual() ? this.meses.slice(0, this.hoy.getMonth() + 1) : this.meses));

  // Se encarga de calcular cuantos días va a tener el scroll.
  dias = computed(() => {
    const mes = this.indiceMes() + 1; //meses empiezan por el 1, indices empiezan por el 0. Hay que agregar 1
    const año = this.anios[this.indiceAnio()]; // No requiere de + 1 porque anios en un array de años. como ejemplo "1967"
    const esMesActual = this.esAñoActual() && mes === this.hoy.getMonth() + 1;

    //Acá hay un truco, profe te juro que esto lo estoy escribiendo yo jaja marea mucho este selector.
    //En los Date los meses valen 0 a 11, siendo 0 enero. Pero acá a mes ya le sumamos uno por lo que toma
    //el mes siguiente. Pero yo quiero la cantidad de dias del mes anterior. Entonces, coloco dia "0".
    //Como día 0 no existe, no tiene sentido, igual lo toma como el día anterior a 1. En todos los
    //meses, el dia anterior a 1 es el ultimo dia del mes anterior. Entonces si no es el mes actual, 
    //muestra todos los dias de ese mes. Si es actual, solo muestra hasta el dia de hoy con this.hoy.getDate().
    const cantidadDeDias = esMesActual ? this.hoy.getDate() : new Date(año, mes, 0).getDate(); 

    const dias: number[] = []; // Acá el array de los dias para el scroll con el for.
    for (let dia = 1; dia <= cantidadDeDias; dia++) {
      dias.push(dia);
    }
    return dias;
  });
  // En caso de tener seleccionado un mes mas adelante al actual, pero con año anterior. Si vuelve al año actual,
  // Al recortarse la lista por estar en actual, el snap del css no permite que esté en un elemento con índice inexistente.
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
    for (let i = 0; i < 100; i++) { // Últimos 100 años hasta hoy, del más viejo al actual. 
      this.anios.push(this.hoy.getFullYear() - 99 + i);
    }

    // Profe, puedo usar effect()? es muy práctico que se ejecute cada vez que un signal se actualice
    effect(() => {
      if (!this.ruedaMovida()) return; // Para asegurarse de activar el effect ya que ruedamovida es un signal.
      const año = this.anios[this.indiceAnio()];
      const mes = this.indiceMes() + 1;
      const dosDigitos = (n: number) => (n < 10 ? '0' + n : String(n)); // 9 → "09", el formato AAAA-MM-DD lleva dos dígitos
      this.fecha.set(`${año}-${dosDigitos(mes)}-${dosDigitos(this.diaElegido())}`); // Esta es la fecha que elige el usuario
    });
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
