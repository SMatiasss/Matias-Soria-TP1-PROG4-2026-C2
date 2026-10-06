import { Component, computed, effect, inject, signal } from '@angular/core';
import { Header } from '../../../globales/componentes/header/header';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { Badge } from '../../../globales/componentes/badge/badge';
import { CardPelicula } from '../../../globales/componentes/card-pelicula/card-pelicula';
import { CalificacionEstrellas } from '../../../globales/componentes/calificacion-estrellas/calificacion-estrellas';
import { FechaPipe } from '../../../globales/pipes/fecha.pipe';
import { PrecioPipe } from '../../../globales/pipes/precio.pipe';
import { PuntosPipe } from '../../../globales/pipes/puntos.pipe';
import { AuthService } from '../../../logica/services/auth.service';
import { PedidosService } from '../../../logica/services/pedidos.service';
import { ReseñasService } from '../../../logica/services/resenas.service';
import { ESTADOS_PEDIDO, Pedido } from '../../../logica/modelos/pedidos';
import { TIPOS_BUTACA } from '../../../logica/modelos/salas';
import { descargarEntradaPdf } from '../../../logica/utilidades/exportar.util';
import { Reseña } from '../../../logica/modelos/resenas';

@Component({
  imports: [Header, EstadoVacio, Alerta, Badge, CardPelicula, CalificacionEstrellas, FechaPipe, PrecioPipe, PuntosPipe],
  selector: 'app-perfil',
  styleUrl: './perfil.css',
  templateUrl: './perfil.html',
})
export class Perfil {
  private auths = inject(AuthService);
  private pds = inject(PedidosService);
  private res = inject(ReseñasService);

  // Al recargar la página llega un momento después que la pantalla (el guard solo mira la sesión)
  usuario = this.auths.usuarioActual;

  // 'compras', 'peliculas' o 'canjes'
  pestana = signal('compras');
  compras = signal<Pedido[]>([]);
  reseñas = signal<Reseña[]>([]);
  cargando = signal(true);
  // la compra que está esperando que confirme la cancelación (null = ninguna)
  idACancelar = signal<string | null>(null);
  cancelando = signal(false);
  // el crédito que se le dio al cancelar, para avisarle en un modal
  creditoDevuelto = signal<number | null>(null);
  error = signal<string | null>(null);

  readonly confirmada = ESTADOS_PEDIDO.CONFIRMADO;

  // Mis películas: las funciones que ya pasaron, de las compras que no se cancelaron
  peliculasVistas = computed(() =>
    this.compras().filter((compra) => compra.estado === this.confirmada && new Date(compra.funcion.inicio) < new Date()),
  );

  // Canjes: las compras (no canceladas) en las que pagó algo con puntos
  comprasConCanjes = computed(() => this.compras().filter((compra) => compra.estado === this.confirmada && compra.puntos_usados > 0));

  constructor() {
    // Las compras se cargan cuando llega el usuario, y otra vez si cambia (después de cancelar se recarga el perfil)
    effect(() => {
      const usuario = this.usuario();
      if (usuario) this.cargar(usuario.id);
    });
  }

  private async cargar(usuarioId: string) {
    this.compras.set(await this.pds.cargarComprasDeUsuario(usuarioId));
    this.reseñas.set(await this.res.cargarReseñasDeUsuario(usuarioId));
    this.cargando.set(false);
  }

  // "F11, F12"
  butacas(compra: Pedido) {
    return compra.entradas.map((entrada) => entrada.butaca.fila + entrada.butaca.columna).join(', ');
  }

  // "2 × Pochoclos grande, 1 × Combo Solo"
  candy(compra: Pedido) {
    return compra.items_candy.map((item) => `${item.cantidad} × ${item.nombre}`).join(', ');
  }

  // el PDF de la entrada, con el mismo QR que se mostró al comprar
  descargarPdf(compra: Pedido) {
    descargarEntradaPdf({
      codigo: compra.codigo,
      pelicula: compra.funcion.pelicula.titulo,
      restriccionEdad: compra.funcion.pelicula.restriccion_edad,
      inicio: compra.funcion.inicio,
      sala: compra.funcion.sala.nombre,
      butacas: compra.entradas.map((e) => e.butaca.fila + e.butaca.columna + (e.tipo_butaca === TIPOS_BUTACA.VIP ? ' (VIP)' : '')),
      candy: compra.items_candy.map((item) => `${item.cantidad} × ${item.nombre}`),
    });
  }

  // la calificación que le puso a esa película (0 = todavía no la calificó)
  calificacion(peliculaId: string) {
    const reseña = this.reseñas().find((r) => r.pelicula_id === peliculaId);
    return reseña ? reseña.calificacion : 0;
  }

  yaPaso(compra: Pedido) {
    return new Date(compra.funcion.inicio) < new Date();
  }

  // si ya se validó alguna entrada o se entregó el candy
  algoUsado(compra: Pedido) {
    return compra.entradas.some((e) => e.usado) || compra.items_candy.some((i) => i.usado);
  }

  // Las mismas reglas que la función cancelar_compra de la base: hasta 2 horas antes y sin nada usado
  puedeCancelar(compra: Pedido) {
    const faltan = new Date(compra.funcion.inicio).getTime() - Date.now();
    return compra.estado === this.confirmada && faltan > 2 * 60 * 60 * 1000 && !this.algoUsado(compra);
  }

  async cancelar(compra: Pedido) {
    this.idACancelar.set(null);
    this.cancelando.set(true);
    const { devuelto, error } = await this.pds.cancelarCompra(compra.id);
    this.cancelando.set(false);

    if (error) {
      // P0001: los "raise exception" de cancelar_compra, ya escritos para el usuario (ej: faltan menos de 2 horas)
      if (error.code === 'P0001') this.error.set(error.message);
      else this.error.set('No se pudo cancelar la compra. Intentá de nuevo.');
      return;
    }
    this.creditoDevuelto.set(devuelto);
    // cambiaron el crédito y los puntos: al recargar el perfil, el effect vuelve a cargar las compras
    await this.auths.recargarPerfil();
  }
}
