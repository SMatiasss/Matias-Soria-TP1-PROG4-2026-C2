import { inject, Service } from '@angular/core';
import { format, parseISO } from 'date-fns';
import { SupabaseService } from './supabase';
import { CompraNueva, ESTADOS_PEDIDO, Pedido } from '../modelos/pedidos';
import { Funcion } from '../modelos/peliculas';
import { DatoGrafico, VentaDelDia } from '../modelos/reportes';

// Todo lo de las compras: comprar, el perfil, validar el QR y los reportes del admin.
// Los reportes cuentan solo las compras confirmadas, desde (incluido) hasta (sin incluir)
@Service()
export class PedidosService {
  private sup = inject(SupabaseService);

  // La compra la hace la función comprar de la base, que recalcula todo y guarda el pedido. Devuelve el código del QR
  async comprar(compra: CompraNueva) {
    const { data, error } = await this.sup.Sup.rpc('comprar', {
      p_funcion_id: compra.funcion_id,
      p_butacas: compra.butacas,
      p_butacas_con_puntos: compra.butacas_con_puntos,
      p_candy: compra.candy,
      p_cupon_id: compra.cupon_id,
    });
    if (error) console.error('No se pudo hacer la compra', error);
    return { codigo: data as string | null, error };
  }

  // Las compras de un usuario para el perfil, la más nueva primero. Las canceladas vienen sin entradas ni candy
  async cargarComprasDeUsuario(usuarioId: string) {
    const { data, error } = await this.sup.Sup.from('pedidos')
      .select('*, funcion:funciones(inicio, sala:salas(nombre), pelicula:peliculas(id, titulo, imagen_url, duracion_minutos, restriccion_edad)), entradas!entradas_pedido_id_fkey(*, butaca:butacas(fila, columna)), items_candy(*)')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('No se pudieron cargar las compras', error);
      return [];
    }
    return data as Pedido[];
  }

  // Cancelar lo hace la función cancelar_compra de la base. Devuelve el crédito que se le dio
  async cancelarCompra(pedidoId: string) {
    const { data, error } = await this.sup.Sup.rpc('cancelar_compra', { p_pedido_id: pedidoId });
    if (error) console.error('No se pudo cancelar la compra', error);
    return { devuelto: data as number, error };
  }

  // La compra con ese código (el del QR), o null si no hay ninguna
  async buscarPorCodigo(codigo: string) {
    const { data, error } = await this.sup.Sup.from('pedidos')
      .select('*, funcion:funciones(inicio, sala:salas(nombre), pelicula:peliculas(titulo)), entradas!entradas_pedido_id_fkey(*, butaca:butacas(fila, columna)), items_candy(*)')
      .eq('codigo', codigo);

    if (error) {
      console.error('No se pudo buscar la compra', error);
      return null;
    }
    return data.length ? (data[0] as Pedido) : null;
  }

  // Marca como usadas las entradas o el candy de una compra. Devuelve cuántas marcó, o null si falló
  async marcarUsados(tabla: string, pedidoId: string) {
    const { data, error } = await this.sup.Sup.from(tabla)
      .update({ usado: true })
      .eq('pedido_id', pedidoId)
      .eq('usado', false)
      .select('id');

    if (error) {
      console.error(`No se pudo marcar como usado en ${tabla}`, error);
      return null;
    }
    return data.length;
  }

  // Cuánto se facturó y cuántas entradas se vendieron cada día, en orden. Solo los días con ventas
  async cargarVentasPorDia(desde: Date, hasta: Date) {
    const { data, error } = await this.sup.Sup.from('pedidos')
      // hay dos relaciones entre pedidos y entradas: con el nombre de la FK le digo cuál usar
      .select('total, credito_usado, creado_en, entradas!entradas_pedido_id_fkey(count)')
      .eq('estado', ESTADOS_PEDIDO.CONFIRMADO)
      .gte('creado_en', desde.toISOString())
      .lt('creado_en', hasta.toISOString())
      .order('creado_en');

    if (error) {
      console.error('No se pudieron cargar las ventas', error);
      return [];
    }

    const dias: VentaDelDia[] = [];
    for (const pedido of data) {
      // el día en hora local: una compra de las 23 h en Argentina en UTC ya es del día siguiente
      const dia = format(parseISO(pedido.creado_en), 'yyyy-MM-dd');
      // entradas(count) llega como [{ count: 3 }]
      const entradas = pedido.entradas[0].count;
      // lo pagado con crédito también cuenta: es plata que se cobró en una compra que después se canceló
      const facturado = pedido.total + pedido.credito_usado;
      const delDia = dias.find((otro) => otro.dia === dia);
      if (delDia) {
        delDia.entradas += entradas;
        delDia.facturacion += facturado;
      } else {
        dias.push({ dia, entradas, facturacion: facturado });
      }
    }
    return dias;
  }

  // Cuántas entradas se vendieron de cada película en el período, de la más vista a la menos vista
  async cargarPeliculasMasVistas(desde: Date, hasta: Date) {
    const { data, error } = await this.sup.Sup.from('entradas')
      // la misma FK que en cargarVentasPorDia
      .select('pedido:pedidos!entradas_pedido_id_fkey!inner(estado), funcion:funciones!inner(inicio, pelicula:peliculas(titulo))')
      .eq('pedido.estado', ESTADOS_PEDIDO.CONFIRMADO)
      .gte('funcion.inicio', desde.toISOString())
      .lt('funcion.inicio', hasta.toISOString());

    if (error) {
      console.error('No se pudieron cargar las películas más vistas', error);
      return [];
    }

    const peliculas: DatoGrafico[] = [];
    for (const entrada of data) {
      // supabase-js lo tipa como array pero llega un objeto
      const funcion = entrada.funcion as unknown as Funcion;
      this.sumar(peliculas, funcion.pelicula.titulo, 1);
    }
    return peliculas.sort((a, b) => b.valor - a.valor);
  }

  // Lo más vendido del candy. Sale de candy_vendido, que la base llena en cada venta con los combos ya abiertos
  // en productos (2 combos de 2 pochoclos = 4 pochoclos)
  async cargarCandyMasVendido(desde: Date, hasta: Date) {
    const { data, error } = await this.sup.Sup.from('candy_vendido')
      .select('producto, cantidad, pedido:pedidos!inner(estado, creado_en)')
      .eq('pedido.estado', ESTADOS_PEDIDO.CONFIRMADO)
      .gte('pedido.creado_en', desde.toISOString())
      .lt('pedido.creado_en', hasta.toISOString());

    if (error) {
      console.error('No se pudo cargar lo más vendido del candy', error);
      return [];
    }

    const productos: DatoGrafico[] = [];
    for (const vendido of data) this.sumar(productos, vendido.producto, vendido.cantidad);
    return productos.sort((a, b) => b.valor - a.valor);
  }

  // Le suma el valor a la barra con esa etiqueta, o la agrega si todavía no está
  private sumar(datos: DatoGrafico[], etiqueta: string, valor: number) {
    const dato = datos.find((otro) => otro.etiqueta === etiqueta);
    if (dato) dato.valor += valor;
    else datos.push({ etiqueta, valor });
  }
}
