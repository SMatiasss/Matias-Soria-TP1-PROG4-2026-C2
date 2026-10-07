import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { RouterLink } from '@angular/router';
import { Header } from '../../globales/componentes/header/header';
import { MapaButacas } from '../../globales/componentes/mapa-butacas/mapa-butacas';
import { EstadoVacio } from '../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../globales/componentes/alerta/alerta';
import { CodigoQr } from '../../globales/componentes/codigo-qr/codigo-qr';
import { InfoFuncion } from './componentes/info-funcion/info-funcion';
import { CombosDestacados } from './componentes/combos-destacados/combos-destacados';
import { CandyBar } from './componentes/candy-bar/candy-bar';
import { BeneficiosCuenta } from './componentes/beneficios-cuenta/beneficios-cuenta';
import { ResumenCompra } from './componentes/resumen-compra/resumen-compra';
import { AuthService } from '../../logica/services/auth.service';
import { DbService } from '../../logica/services/db.service';
import { ReservasService } from '../../logica/services/reservas.service';
import { CandyService } from '../../logica/services/candy.service';
import { PedidosService } from '../../logica/services/pedidos.service';
import { Funcion } from '../../logica/modelos/peliculas';
import { TIPOS_BUTACA } from '../../logica/modelos/salas';
import { Producto, Combo } from '../../logica/modelos/candy';
import { Cupon, AUDIENCIAS_CUPON } from '../../logica/modelos/cupones';
import { EntradaPdf, LineaEntrada, LineaCandy } from '../../logica/modelos/pedidos';
import { sinRepetidos } from '../../logica/utilidades/sin-repetidos.util';
import { calcularEdad } from '../../logica/utilidades/calcular-edad.util';
import { descargarEntradaPdf } from '../../logica/utilidades/exportar.util';

@Component({
  imports: [RouterLink, Header, MapaButacas, EstadoVacio, Alerta, CodigoQr, InfoFuncion, CombosDestacados, CandyBar, BeneficiosCuenta, ResumenCompra],
  selector: 'app-reservas',
  styleUrl: './reservas.css',
  templateUrl: './reservas.html',
})
export class Reservas implements OnDestroy {
  private db = inject(DbService);
  private rs = inject(ReservasService);
  private cs = inject(CandyService);
  private pds = inject(PedidosService);
  private auths = inject(AuthService);

  // id de la función, viene de la ruta /reservas/:funcionId
  funcionId = input.required<string>();

  usuario = this.auths.usuarioActual;

  cargando = signal(true);
  funcion = signal<Funcion | null>(null);
  butacasOcupadas = signal<string[]>([]);
  productos = signal<Producto[]>([]);
  combos = signal<Combo[]>([]);
  cuponesActivos = signal<Cupon[]>([]);

  // Pasos de la compra: 1 butacas, 2 candy bar, 3 beneficios (el 3 solo existe con sesión)
  pasoActual = signal(1);
  // Paso más avanzado al que se llegó con "Continuar": las pestañas solo dejan ir hasta ahí, nunca más adelante
  pasoMaximo = signal(1);
  avisoButacas = signal('');

  // En puntos, lo que se agrega se canjea: así se puede pagar una entrada con plata y un pochoclo con puntos
  conPuntos = signal(false);

  butacasSeleccionadas = signal<string[]>([]);
  // de las seleccionadas, las que se eligieron en puntos: esas se canjean
  butacasConPuntos = signal<string[]>([]);
  // cantidad elegida por id de producto o de combo, las que se pagan con plata y las que se canjean con puntos
  cantidadesPesos = signal<Record<string, number>>({});
  cantidadesPuntos = signal<Record<string, number>>({});
  cuponAplicado = signal<Cupon | null>(null);

  comprando = signal(false);
  // la compra hecha, con lo que lleva su PDF: con ella se muestra que salió bien
  entradaComprada = signal<EntradaPdf | null>(null);
  // si no se pudo comprar, el motivo va en un modal
  errorCompra = signal<string | null>(null);
  // la butaca elegida que otra compra ocupó mientras elegía ("F12"), para avisarle en un modal
  butacaOcupada = signal<string | null>(null);
  // el canal de Realtime de la función que se está mirando: avisa las butacas que se venden o se liberan
  private canal: RealtimeChannel | null = null;

  // 'sv-SE' da la fecha local como AAAA-MM-DD, comparable con fecha_estreno
  private readonly hoy = new Date().toLocaleDateString('sv-SE');

  categoriasCandy = computed(() =>
    sinRepetidos(this.productos().map((p) => p.categoria)).map((nombre) => ({
      nombre,
      productos: this.productos().filter((p) => p.categoria === nombre),
    })),
  );

  // los combos y los productos juntos, para buscar lo que hay en el carrito
  itemsCandy = computed(() => [...this.combos(), ...this.productos()]);

  // los empleados no tienen fecha de nacimiento: para ellos no hay edad
  edadUsuario = computed(() => {
    const usuario = this.usuario();
    return usuario?.fecha_nacimiento ? calcularEdad(usuario.fecha_nacimiento) : null;
  });

  // Preventa: la venta abre (fecha_estreno - preventa_dias_antes) si la película tiene preventa, si no el día del estreno
  ventaAbierta = computed(() => {
    const pelicula = this.funcion()?.pelicula;
    if (!pelicula) return false;
    if (this.hoy >= pelicula.fecha_estreno) return true;
    if (!pelicula.preventa_habilitada) return false;

    const apertura = new Date(`${pelicula.fecha_estreno}T00:00`);
    // si no se configuró, 7 días
    apertura.setDate(apertura.getDate() - (pelicula.preventa_dias_antes ?? 7));
    return this.hoy >= apertura.toLocaleDateString('sv-SE');
  });

  // Después del estreno vuelve el precio normal de la función
  enPreventa = computed(() => {
    const pelicula = this.funcion()?.pelicula;
    return !!pelicula && pelicula.preventa_precio !== null && this.hoy < pelicula.fecha_estreno && this.ventaAbierta();
  });

  butacasElegidas = computed(() => {
    const ids = this.butacasSeleccionadas();
    return (this.funcion()?.sala.butacas ?? []).filter((b) => ids.includes(b.id));
  });

  // los contadores del candy muestran las cantidades de lo que se está viendo: plata o puntos
  cantidadesVisibles = computed(() => (this.conPuntos() ? this.cantidadesPuntos() : this.cantidadesPesos()));

  // Una línea por tipo de butaca y por cómo se paga, así las VIP y las canjeadas se ven aparte.
  // El texto de cada una está en el html del resumen
  lineasEntradas = computed<LineaEntrada[]>(() => {
    const lineas: LineaEntrada[] = [];
    for (const conPuntos of [false, true]) {
      for (const tipo of [TIPOS_BUTACA.NORMAL, TIPOS_BUTACA.ACCESIBLE, TIPOS_BUTACA.VIP]) {
        const cantidad = this.butacasPagadas(conPuntos).filter((b) => b.tipo === tipo).length;
        if (cantidad) lineas.push({ tipo, cantidad, conPuntos, subtotal: cantidad * this.precioEntrada(tipo, conPuntos) });
      }
    }
    return lineas;
  });

  lineasCandy = computed<LineaCandy[]>(() => {
    const lineas: LineaCandy[] = [];
    for (const conPuntos of [false, true]) {
      const cantidades = conPuntos ? this.cantidadesPuntos() : this.cantidadesPesos();
      for (const item of this.itemsCandy()) {
        if (!cantidades[item.id]) continue;
        // si algo dejó de canjearse mientras estaba en el carrito suma 0 (ver motivoBloqueo)
        const subtotal = cantidades[item.id] * (this.precioCandy(item, conPuntos) ?? 0);
        lineas.push({ id: item.id, nombre: item.nombre, cantidad: cantidades[item.id], conPuntos, subtotal });
      }
    }
    return lineas;
  });

  subtotalPesos = computed(() => this.sumarLineas(false));
  subtotalPuntos = computed(() => this.sumarLineas(true));
  descuentoCombosPesos = computed(() => this.descuentoCombos(false));
  descuentoCombosPuntos = computed(() => this.descuentoCombos(true));

  cuponPrimeraCompra = computed(() => {
    const usuario = this.usuario();
    if (!usuario || usuario.cupon_primera_compra_usado) return null;
    return this.cuponesActivos().find((c) => c.audiencia === AUDIENCIAS_CUPON.PRIMERA_COMPRA) ?? null;
  });

  cuponesMayores = computed(() =>
    (this.edadUsuario() ?? 0) >= 50 ? this.cuponesActivos().filter((c) => c.audiencia === AUDIENCIAS_CUPON.MAYORES_50) : [],
  );

  // los cupones y el crédito son descuentos en plata: solo se aplican a lo que se paga con plata
  descuentoCupon = computed(() => {
    const cupon = this.cuponAplicado();
    if (!cupon) return 0;
    return Math.round(((this.subtotalPesos() - this.descuentoCombosPesos()) * cupon.porcentaje) / 100);
  });

  // El crédito se usa siempre, aunque sea poco. Si fuera opcional se acumularía cancelando compras
  creditoUsado = computed(() => {
    if (!this.usuario()) return 0;
    const restante = this.subtotalPesos() - this.descuentoCombosPesos() - this.descuentoCupon();
    const credito = this.usuario()?.credito ?? 0;
    // nunca se usa más crédito que lo que falta pagar
    if (credito > restante) return restante;
    return credito;
  });

  totalPesos = computed(() => {
    const aPagar = this.subtotalPesos() - this.descuentoCombosPesos() - this.descuentoCupon() - this.creditoUsado();
    if (aPagar < 0) return 0;
    return aPagar;
  });

  totalPuntos = computed(() => this.subtotalPuntos() - this.descuentoCombosPuntos());

  // 1 punto por cada peso que se paga (lo canjeado no suma)
  puntosAGanar = computed(() => (this.usuario() ? Math.floor(this.totalPesos()) : 0));

  // Mismas reglas que la función comprar de Supabase: si alguna no se cumple, Pagar queda apagado y dice por qué
  motivoBloqueo = computed(() => {
    const funcion = this.funcion();
    if (!funcion) return null;
    const restriccion = funcion.pelicula.restriccion_edad;

    if (new Date(funcion.inicio) <= new Date()) return 'Esta función ya comenzó.';
    if (!this.ventaAbierta()) return 'La venta de entradas para esta película todavía no está habilitada.';
    if (restriccion) {
      const edad = this.edadUsuario();
      // los empleados y el admin no tienen fecha de nacimiento
      if (edad === null && this.usuario()) return `Tu cuenta no tiene fecha de nacimiento: no puede comprar películas +${restriccion}.`;
      if (edad === null) return `Iniciá sesión para comprar entradas de una película +${restriccion}.`;
      if (edad < restriccion) return `Tenés que tener ${restriccion} años o más para ver esta película.`;
    }
    // lo canjeado que quedó guardado de antes de cerrar la sesión: sin sesión no hay puntos
    if (!this.usuario() && (this.butacasConPuntos().length || this.lineasCandy().some((linea) => linea.conPuntos))) {
      return 'Iniciá sesión para canjear con puntos.';
    }
    // cada combo con entrada cubre una butaca que se paga igual que él
    if (this.combosConEntrada(false) > this.butacasPagadas(false).length) {
      return 'Cada combo con entrada necesita una butaca pagada con plata: elegí más butacas o sacá combos.';
    }
    if (this.combosConEntrada(true) > this.butacasPagadas(true).length) {
      return 'Cada combo con entrada canjeado necesita una butaca canjeada con puntos.';
    }
    const cantidadesPuntos = this.cantidadesPuntos();
    const sinCanje = this.itemsCandy().find((item) => cantidadesPuntos[item.id] && !item.precio_puntos);
    if (sinCanje) return `${sinCanje.nombre} ya no se puede canjear con puntos: sacalo.`;
    const puntos = this.usuario()?.puntos ?? 0;
    if (this.totalPuntos() > puntos) return `Te faltan ${(this.totalPuntos() - puntos).toLocaleString('es-AR')} puntos.`;
    return null;
  });

  constructor() {
    // carga la función del id de la ruta, y otra vez si cambia
    effect(() => {
      this.cargarFuncion(this.funcionId());
    });

    // Los beneficios solo existen con sesión. Si se cierra la sesión acá, se quitan los aplicados
    effect(() => {
      if (this.usuario()) {
        this.cargarCupones();
      } else {
        // sin sesión no existe el paso 3, si estaba ahí vuelve al 2
        // (con update y no con pasoActual(), si no este effect se ejecutaría en cada cambio de paso)
        this.pasoActual.update((paso) => (paso > 2 ? 2 : paso));
        this.pasoMaximo.update((paso) => (paso > 2 ? 2 : paso));
        this.cuponesActivos.set([]);
        this.cuponAplicado.set(null);
        // sin sesión no hay puntos: las butacas canjeadas pasan a pagarse con plata y el candy canjeado se saca
        this.conPuntos.set(false);
        this.butacasConPuntos.set([]);
        this.cantidadesPuntos.set({});
      }
    });

    // Guarda lo elegido mientras la pestaña esté abierta, así recargar la página no lo borra
    effect(() => {
      if (this.cargando()) return; // mientras carga todavía no se recuperó lo guardado, no hay que pisarlo
      const elegido = {
        butacas: this.butacasSeleccionadas(),
        butacasConPuntos: this.butacasConPuntos(),
        pesos: this.cantidadesPesos(),
        puntos: this.cantidadesPuntos(),
        guardadoEn: Date.now(),
      };
      sessionStorage.setItem('reserva-' + this.funcionId(), JSON.stringify(elegido));
    });
  }

  // Angular reusa la pantalla si se pasa a otra función: arranca todo de cero, también lo de una compra anterior
  private async cargarFuncion(id: string) {
    // se escucha antes de cargar las ocupadas, así no se pierde ninguna venta que pase mientras tanto
    if (this.canal) this.rs.dejarDeEscuchar(this.canal);
    this.canal = this.rs.escucharButacas(id, (butacaId, ocupada) => this.butacaCambio(butacaId, ocupada));
    this.cargando.set(true);
    this.entradaComprada.set(null);
    this.errorCompra.set(null);
    this.cuponAplicado.set(null);
    this.pasoActual.set(1);
    this.pasoMaximo.set(1);
    this.butacasSeleccionadas.set([]);
    this.butacasConPuntos.set([]);
    this.cantidadesPesos.set({});
    this.cantidadesPuntos.set({});

    const funcion = await this.rs.cargarFuncionConPeliculaYSala(id);
    const ocupadas = await this.rs.cargarButacasOcupadas(id);
    const productos = await this.db.findAll('productos');
    // con lo que trae cada combo, para mostrarlo con el pipe queIncluye
    const combos = await this.cs.cargarCombos();

    // sin película = la función no existe o su película no está visible (RLS)
    this.funcion.set(funcion?.pelicula ? funcion : null);
    this.butacasOcupadas.set(ocupadas);
    // a un cliente RLS ya le da solo los disponibles, pero al admin le da todos: por eso el filter
    this.productos.set(productos.filter((p) => p.disponible));
    this.combos.set(combos.filter((c) => c.disponible));

    // Lo que había elegido antes de recargar, sin las butacas que otro compró mientras tanto
    let guardado = JSON.parse(sessionStorage.getItem('reserva-' + id) ?? '{}');
    // si pasaron más de 5 minutos desde el último cambio, se descarta
    if (Date.now() - guardado.guardadoEn > 5 * 60 * 1000) guardado = {};
    const butacas = (guardado.butacas ?? []).filter((b: string) => !ocupadas.includes(b));
    this.butacasSeleccionadas.set(butacas);
    this.cantidadesPesos.set(guardado.pesos ?? {});
    // lo canjeado vuelve solo con sesión (sin sesión no hay puntos, y en pesos no se podría sacar del carrito)
    if (this.usuario()) {
      this.butacasConPuntos.set((guardado.butacasConPuntos ?? []).filter((b: string) => butacas.includes(b)));
      this.cantidadesPuntos.set(guardado.puntos ?? {});
    }
    this.cargando.set(false);
  }

  private async cargarCupones() {
    // A un cliente RLS ya le da solo los activos, pero al admin le da todos: por eso el filter de abajo
    const cupones = await this.db.findAll('cupones');
    const primeraCarga = !this.cuponesActivos().length;
    this.cuponesActivos.set(cupones.filter((c) => c.activo));
    // el de primera compra arranca aplicado: vale solo en esta compra y, si no se usa, se pierde.
    // Solo en la primera carga, así no vuelve si lo sacó para usar otro cupón
    if (primeraCarga && !this.cuponAplicado()) this.cuponAplicado.set(this.cuponPrimeraCompra());
  }

  // Lo que cuesta una entrada según la butaca, en pesos o en puntos. La preventa solo cambia el precio en pesos
  private precioEntrada(tipo: string, conPuntos: boolean) {
    const funcion = this.funcion();
    if (!funcion) return 0;
    const vip = tipo === TIPOS_BUTACA.VIP;
    if (conPuntos) return vip ? funcion.precio_puntos_vip : funcion.precio_puntos;
    if (vip) return funcion.precio_vip;
    return this.enPreventa() ? (funcion.pelicula.preventa_precio ?? funcion.precio_base) : funcion.precio_base;
  }

  // Lo que cuesta un producto o un combo, en pesos o en puntos. null = no se canjea con puntos
  private precioCandy(item: Producto | Combo, conPuntos: boolean) {
    return conPuntos ? item.precio_puntos : item.precio;
  }

  // las butacas elegidas que se pagan con plata (conPuntos false) o que se canjean (true)
  private butacasPagadas(conPuntos: boolean) {
    return this.butacasElegidas().filter((b) => this.butacasConPuntos().includes(b.id) === conPuntos);
  }

  private sumarLineas(conPuntos: boolean) {
    return [...this.lineasEntradas(), ...this.lineasCandy()]
      .filter((linea) => linea.conPuntos === conPuntos)
      .reduce((suma, linea) => suma + linea.subtotal, 0);
  }

  // cuántos combos con entrada hay en el carrito, pagados con plata o canjeados
  private combosConEntrada(conPuntos: boolean) {
    const cantidades = conPuntos ? this.cantidadesPuntos() : this.cantidadesPesos();
    return this.combos().reduce((suma, combo) => suma + (combo.incluye_entrada ? (cantidades[combo.id] ?? 0) : 0), 0);
  }

  // Las entradas que trae un combo no se cobran aparte (cubre las que se pagan igual que el combo, primero las
  // comunes). De una VIP se cobra la diferencia
  private descuentoCombos(conPuntos: boolean) {
    const funcion = this.funcion();
    if (!funcion) return 0;
    const butacas = this.butacasPagadas(conPuntos);
    const vip = butacas.filter((b) => b.tipo === TIPOS_BUTACA.VIP).length;
    const comunes = butacas.length - vip;

    let comunesCubiertas = this.combosConEntrada(conPuntos);
    if (comunesCubiertas > comunes) comunesCubiertas = comunes;
    let vipCubiertas = this.combosConEntrada(conPuntos) - comunesCubiertas;
    if (vipCubiertas > vip) vipCubiertas = vip;

    // de una VIP se descuenta el precio de una normal (sin preventa): la diferencia se sigue cobrando
    const normal = conPuntos ? funcion.precio_puntos : funcion.precio_base;
    return comunesCubiertas * this.precioEntrada(TIPOS_BUTACA.NORMAL, conPuntos) + vipCubiertas * normal;
  }

  // Lo que avisa la base en tiempo real: otra compra ocupó una butaca, o una cancelación la liberó
  butacaCambio(butacaId: string, ocupada: boolean) {
    if (!ocupada) {
      this.butacasOcupadas.update((ids) => ids.filter((id) => id !== butacaId));
      return;
    }
    if (!this.butacasOcupadas().includes(butacaId)) this.butacasOcupadas.update((ids) => [...ids, butacaId]);
    // si la tenía elegida, se la saca y se le avisa. Mientras paga (o ya pagó) las que se ocupan son las suyas
    if (!this.butacasSeleccionadas().includes(butacaId) || this.comprando() || this.entradaComprada()) return;
    const butaca = this.butacasElegidas().find((b) => b.id === butacaId);
    this.butacasSeleccionadas.update((ids) => ids.filter((id) => id !== butacaId));
    this.butacasConPuntos.update((ids) => ids.filter((id) => id !== butacaId));
    this.butacaOcupada.set(butaca ? butaca.fila + butaca.columna : 'que elegiste');
  }

  // al salir de la pantalla se cierra el canal
  ngOnDestroy() {
    if (this.canal) this.rs.dejarDeEscuchar(this.canal);
  }

  // El mapa devuelve todas las elegidas: las nuevas se pagan como se está viendo (plata o puntos),
  // y las que se sacaron también se sacan de las canjeadas
  cambiarButacas(ids: string[]) {
    const nuevas = ids.filter((id) => !this.butacasSeleccionadas().includes(id));
    const canjeadas = this.butacasConPuntos().filter((id) => ids.includes(id));
    this.butacasConPuntos.set(this.conPuntos() ? [...canjeadas, ...nuevas] : canjeadas);
    this.butacasSeleccionadas.set(ids);
  }

  // los contadores del candy cambian las cantidades de lo que se está viendo
  cambiarCandy(cantidades: Record<string, number>) {
    if (this.conPuntos()) this.cantidadesPuntos.set(cantidades);
    else this.cantidadesPesos.set(cantidades);
  }

  // Lo usan "Continuar", "Volver" y las pestañas.
  // Sin butacas no se puede avanzar: el candy se compra junto con la entrada
  irAPaso(paso: number) {
    if (paso > 1 && !this.butacasSeleccionadas().length) {
      this.avisoButacas.set('Elegí al menos una butaca para continuar');
      return;
    }
    this.avisoButacas.set('');
    this.pasoActual.set(paso);
    if (paso > this.pasoMaximo()) this.pasoMaximo.set(paso);
  }

  // Una pestaña se puede tocar si ya se llegó a ese paso con "Continuar" (y, del 2 en adelante, si hay butacas)
  puedeIrAPaso(paso: number) {
    return paso <= this.pasoMaximo() && (paso === 1 || this.butacasSeleccionadas().length > 0);
  }

  descargarPdf(entrada: EntradaPdf) {
    descargarEntradaPdf(entrada);
  }

  // La compra la hace la función comprar de la base: lo de acá es solo la vista previa
  async pagar() {
    const funcion = this.funcion();
    if (!funcion || this.motivoBloqueo() || !this.butacasSeleccionadas().length) return;

    this.comprando.set(true);
    const cupon = this.cuponAplicado();
    const { codigo, error } = await this.pds.comprar({
      funcion_id: funcion.id,
      butacas: this.butacasSeleccionadas(),
      butacas_con_puntos: this.butacasConPuntos(),
      candy: this.lineasCandy().map((linea) => ({ id: linea.id, cantidad: linea.cantidad, con_puntos: linea.conPuntos })),
      cupon_id: cupon ? cupon.id : null,
    });
    this.comprando.set(false);

    if (error) {
      // P0001: los mensajes de la función comprar (ej: te faltan puntos). 23505: otro se quedó con una butaca
      if (error.code === 'P0001') this.errorCompra.set(error.message);
      else if (error.code === '23505') this.errorCompra.set('Alguna de tus butacas se acaba de vender. Elegí otra.');
      else this.errorCompra.set('No se pudo hacer la compra. Intentá de nuevo.');
      // las ocupadas cambian si otro compró: se recargan, y se sacan de las elegidas
      const ocupadas = await this.rs.cargarButacasOcupadas(funcion.id);
      this.butacasOcupadas.set(ocupadas);
      this.butacasSeleccionadas.update((ids) => ids.filter((id) => !ocupadas.includes(id)));
      this.butacasConPuntos.update((ids) => ids.filter((id) => !ocupadas.includes(id)));
      return;
    }

    sessionStorage.removeItem('reserva-' + funcion.id);
    // lo que va en el PDF (el que compró sin sesión después no puede volver a leer la compra)
    this.entradaComprada.set({
      codigo: codigo as string,
      pelicula: funcion.pelicula.titulo,
      restriccionEdad: funcion.pelicula.restriccion_edad,
      inicio: funcion.inicio,
      sala: funcion.sala.nombre,
      butacas: this.butacasElegidas().map((b) => b.fila + b.columna + (b.tipo === TIPOS_BUTACA.VIP ? ' (VIP)' : '')),
      candy: this.lineasCandy().map((linea) => `${linea.cantidad} × ${linea.nombre}`),
    });
    // cambiaron los puntos, el crédito o el cupón de primera compra del usuario
    await this.auths.recargarPerfil();
  }
}
