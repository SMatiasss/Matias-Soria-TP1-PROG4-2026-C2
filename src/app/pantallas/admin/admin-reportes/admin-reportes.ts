import { Component, computed, inject, signal } from '@angular/core';
// date-fns: startOfWeek y startOfMonth dan el primer día de la semana o del mes de una fecha (a las 00:00),
// addWeeks, addMonths y addDays suman semanas, meses o días (o los restan, con un número negativo)
import { addDays, addMonths, addWeeks, format, startOfMonth, startOfWeek } from 'date-fns';
import { SeccionAdmin } from '../componentes/seccion-admin/seccion-admin';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { Alerta } from '../../../globales/componentes/alerta/alerta';
import { GraficoBarras } from '../../../globales/componentes/grafico-barras/grafico-barras';
import { FechaPipe } from '../../../globales/pipes/fecha.pipe';
import { PrecioPipe } from '../../../globales/pipes/precio.pipe';
import { PedidosService } from '../../../logica/services/pedidos.service';
import { DatoGrafico, VentaDelDia } from '../../../logica/modelos/reportes';
import { descargarExcel, imprimirPdf } from '../../../logica/utilidades/exportar.util';

@Component({
  imports: [SeccionAdmin, EstadoVacio, Alerta, GraficoBarras, FechaPipe, PrecioPipe],
  selector: 'app-admin-reportes',
  styleUrl: './admin-reportes.css',
  templateUrl: './admin-reportes.html',
})
export class AdminReportes {
  private pds = inject(PedidosService);
  // los mismos pipes del template, para escribir las fechas y los precios en el PDF y en el Excel
  private fecha = new FechaPipe();
  private precio = new PrecioPipe();

  // 'semana' (de lunes a domingo) o 'mes': todo lo de la pantalla es de ese período
  modo = signal('semana');
  // un día cualquiera del período que se está mirando, las flechas lo corren. Arranca en el de hoy
  diaDelPeriodo = signal(new Date());

  // el primer día del período
  desde = computed(() =>
    this.modo() === 'semana' ? startOfWeek(this.diaDelPeriodo(), { weekStartsOn: 1 }) : startOfMonth(this.diaDelPeriodo()),
  );
  // el primer día del período siguiente: las consultas traen todo lo que es antes de ese día
  hasta = computed(() => (this.modo() === 'semana' ? addWeeks(this.desde(), 1) : addMonths(this.desde(), 1)));
  // "29/09 al 05/10/2026", o "octubre de 2026" (la mayúscula se la pone el CSS)
  nombrePeriodo = computed(() => {
    if (this.modo() === 'semana') return format(this.desde(), 'dd/MM') + ' al ' + format(addDays(this.hasta(), -1), 'dd/MM/yyyy');
    return this.desde().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  });

  ventasPorDia = signal<VentaDelDia[]>([]);
  // de cada gráfico se muestran los 5 primeros
  peliculasMasVistas = signal<DatoGrafico[]>([]);
  candyMasVendido = signal<DatoGrafico[]>([]);
  cargando = signal(true);
  // si no se pudo abrir la ventana del PDF, se avisa en un modal
  error = signal<string | null>(null);

  totalEntradas = computed(() => this.ventasPorDia().reduce((suma, venta) => suma + venta.entradas, 0));
  totalFacturado = computed(() => this.ventasPorDia().reduce((suma, venta) => suma + venta.facturacion, 0));

  constructor() {
    this.cargar();
  }

  private async cargar() {
    // el período que se pide. Si mientras llegan las respuestas se cambia de período, estas ya no sirven:
    // no se muestran, y quedan las del período nuevo (si no, una respuesta lenta podía pisar a la nueva)
    const periodo = this.nombrePeriodo();
    const desde = this.desde();
    const hasta = this.hasta();
    this.cargando.set(true);
    const ventas = await this.pds.cargarVentasPorDia(desde, hasta);
    const peliculas = await this.pds.cargarPeliculasMasVistas(desde, hasta);
    const candy = await this.pds.cargarCandyMasVendido(desde, hasta);
    if (periodo !== this.nombrePeriodo()) return;

    this.ventasPorDia.set(ventas);
    this.peliculasMasVistas.set(peliculas.slice(0, 5));
    this.candyMasVendido.set(candy.slice(0, 5));
    this.cargando.set(false);
  }

  cambiarModo(modo: string) {
    this.modo.set(modo);
    this.cargar();
  }

  // paso: -1 va al período anterior y 1 al siguiente
  moverPeriodo(paso: number) {
    this.diaDelPeriodo.update((dia) => (this.modo() === 'semana' ? addWeeks(dia, paso) : addMonths(dia, paso)));
    this.cargar();
  }

  // la tabla de facturación en un .xlsx (lo arma descargarExcel, en exportar.util.ts)
  exportarExcel() {
    // cada objeto es una fila, y sus nombres son los títulos de las columnas
    const filas = this.ventasPorDia().map((venta) => ({
      'Día': this.fecha.transform(venta.dia),
      'Entradas vendidas': venta.entradas,
      'Facturación': this.redondear(venta.facturacion),
    }));
    filas.push({ 'Día': 'Total', 'Entradas vendidas': this.totalEntradas(), 'Facturación': this.redondear(this.totalFacturado()) });
    descargarExcel(filas, 'Facturación', `facturacion-${format(this.desde(), 'yyyy-MM-dd')}.xlsx`);
  }

  // A 2 decimales: al sumar precios con coma, la computadora a veces deja restos (0,1 + 0,2 = 0,30000000000000004).
  // En la pantalla no se ven porque el pipe precio redondea, pero en el Excel sí
  private redondear(valor: number) {
    return Math.round(valor * 100) / 100;
  }

  // la tabla de facturación para imprimir como PDF (la ventana y el print() están en imprimirPdf, en exportar.util.ts)
  exportarPdf() {
    let filas = '';
    for (const venta of this.ventasPorDia()) {
      filas += `<tr><td>${this.fecha.transform(venta.dia)}</td><td>${venta.entradas}</td><td>${this.precio.transform(venta.facturacion)}</td></tr>`;
    }
    const contenido = `
      <h1>Facturación por día</h1>
      <p>${this.nombrePeriodo()}</p>
      <table>
        <thead><tr><th>Día</th><th>Entradas vendidas</th><th>Facturación</th></tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr><th>Total</th><th>${this.totalEntradas()}</th><th>${this.precio.transform(this.totalFacturado())}</th></tr></tfoot>
      </table>`;
    if (!imprimirPdf(`Facturación ${this.nombrePeriodo()}`, contenido)) {
      this.error.set('El navegador no dejó abrir la ventana del PDF. Permití las ventanas emergentes para esta página e intentá de nuevo.');
    }
  }
}
