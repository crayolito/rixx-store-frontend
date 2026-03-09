import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NotificacionServicio } from '../../../../compartido/servicios/notificacion';
import {
  ActividadPorHoraItem,
  DatosMetricasDashboard,
  MetodoPagoMetrica,
  VentaPorPais,
} from '../../../../nucleo/servicios/metricas-dashboard-api.servicio';
import { MetricasDashboardApiServicio } from '../../../../nucleo/servicios/metricas-dashboard-api.servicio';
import { DashboardMetricasTiempoRealServicio } from '../../../../nucleo/servicios/dashboard-metricas-tiempo-real.servicio';

@Component({
  selector: 'app-metricas-admin-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './metricas-admin-pagina.html',
  styleUrl: './metricas-admin-pagina.css'
})
export class MetricasAdminPagina implements OnInit {
  // Servicios para obtener métricas por HTTP y WebSocket y mostrar notificaciones
  private metricasApi = inject(MetricasDashboardApiServicio);
  private metricasTiempoReal = inject(DashboardMetricasTiempoRealServicio);
  private notificacion = inject(NotificacionServicio);

  // PERIODO SELECCIONADO (como texto para el selector)
  mesSeleccionado = signal('enero');
  anioSeleccionado = signal('2026');

  mesActual = computed(() => this.mesSeleccionado());
  anioActual = computed(() => this.anioSeleccionado());

  // USUARIOS ACTIVOS
  usuariosActivos = signal(0);

  // DATOS FINANCIEROS DEL RESUMEN PRINCIPAL
  datosFinancieros = signal({
    totalIngresos: 0,
    totalGastos: 0,
    ganancia: 0,
    margen: '0%'
  });

  totalOrdenes = signal(0);

  // GANANCIA POR HORA (24 horas)
  datosGananciaPorHora = signal<ActividadPorHoraItem[]>([]);

  // DATOS GEOGRÁFICOS (ventas por país)
  datosGeograficos = signal<VentaPorPais[]>([]);

  // MÉTODOS DE PAGO
  metodosPago = signal<MetodoPagoMetrica[]>([]);

  totalProcesado = computed(() => {
    return this.metodosPago().reduce((suma, metodo) => suma + metodo.monto, 0);
  });

  // TOP 5 SERVICIOS / PRODUCTOS MÁS RENTABLES
  topServicios = signal<
    {
      posicion: number;
      nombre: string;
      ingresos: number;
      costos: number;
      ganancia: number;
    }[]
  >([]);

  // Mapa de meses en texto a número (1–12)
  private readonly mapaMeses: Record<string, number> = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };

  ngOnInit(): void {
    this.cargarMetricasHttp();
    this.inicializarTiempoReal();
  }

  // ═══════════════════════════════════════════════════════
  // CONFIGURACIÓN APEXCHARTS - GRÁFICO LÍNEA
  // ═══════════════════════════════════════════════════════

  get graficoLineaSeries() {
    return [{
      name: 'Ganancia',
      data: this.datosGananciaPorHora().map(d => d.ganancia)
    }];
  }

  graficoLineaOpciones = {
    type: 'line' as const,
    height: 350, // ← CAMBIA de 280 a 350 (más alto)
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false }
  };

  get graficoLineaXAxis() {
    return {
      categories: this.datosGananciaPorHora().map(d => d.hora),
      tickAmount: 12, // ← AGREGAR: Muestra solo 12 etiquetas (cada 2 horas)
      labels: {
        style: { colors: '#8b92a7', fontSize: '12px' }, // ← Fuente más grande
        rotate: -45,
        rotateAlways: false, // ← CAMBIA a false
        hideOverlappingLabels: true // ← AGREGAR: Oculta etiquetas superpuestas
      }
    };
  }

  graficoLineaYAxis = {
    labels: {
      style: { colors: '#8b92a7', fontSize: '11px' },
      formatter: (val: number) => '$' + val.toFixed(2)
    }
  };

  graficoLineaGrid = {
    borderColor: '#2a2e3a',
    strokeDashArray: 3,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } }
  };

  graficoLineaTooltip = {
    theme: 'dark',
    y: {
      formatter: (val: number) => '$' + val.toLocaleString()
    }
  };

  // ═══════════════════════════════════════════════════════
  // CONFIGURACIÓN APEXCHARTS - GRÁFICO PIE
  // ═══════════════════════════════════════════════════════

  get graficoPieSeries() {
    return this.datosGeograficos().map(d => d.ganancia);
  }

  get graficoPieLabels() {
    return this.datosGeograficos().map(d => d.nombre);
  }

  get graficoPieColores() {
    return this.datosGeograficos().map(d => d.color);
  }

  graficoPieOpciones = {
    type: 'donut' as const,
    height: 280,
    background: 'transparent'
  };

  graficoPieLegend = {
    show: false
  };

  // Obtiene el filtro actual (mes/año) en el formato que espera el backend
  private obtenerFiltroPeriodo(): { mes?: number; anio?: number } {
    const mesTexto = this.mesSeleccionado();
    const anioTexto = this.anioSeleccionado();

    const mes = this.mapaMeses[mesTexto] ?? undefined;
    const anio = Number.parseInt(anioTexto, 10);

    return {
      ...(mes && { mes }),
      ...(Number.isFinite(anio) && anio > 0 && { anio }),
    };
  }

  // Aplica todos los datos recibidos del backend al estado de la página
  private aplicarMetricas(datos: DatosMetricasDashboard): void {
    const resumen = datos.resumenFinanciero;
    const actividad = datos.actividadTienda;

    this.usuariosActivos.set(actividad.usuariosActivos ?? 0);

    this.datosFinancieros.set({
      totalIngresos: resumen.totalIngresos ?? 0,
      totalGastos: resumen.totalGastos ?? 0,
      ganancia: resumen.ganancia ?? 0,
      margen: resumen.margen ?? '0%',
    });

    const totalOrdenes =
      actividad.totalOrdenes ??
      resumen.totalOrdenes ??
      0;
    this.totalOrdenes.set(totalOrdenes);

    this.datosGananciaPorHora.set(datos.actividadPorHora ?? []);

    const coloresFallback = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];
    const ventasConColor = (datos.ventasPorPais ?? []).map((item, indice) => ({
      ...item,
      color: item.color ?? coloresFallback[indice % coloresFallback.length],
    }));
    this.datosGeograficos.set(ventasConColor);

    this.metodosPago.set(datos.metodosPago ?? []);

    this.topServicios.set(datos.topProductos ?? []);
  }

  // Inicializa la conexión de WebSocket y escucha las métricas en tiempo real
  private inicializarTiempoReal(): void {
    this.metricasTiempoReal.escucharMetricas((respuesta) => {
      if (!respuesta?.exito || !respuesta.datos) {
        if (respuesta?.mensaje) {
          this.notificacion.error(respuesta.mensaje);
        }
        return;
      }
      this.aplicarMetricas(respuesta.datos);
    });

    this.metricasTiempoReal.solicitarMetricas(this.obtenerFiltroPeriodo());
  }

  // MÉTODO PARA ACTUALIZAR DATOS (HTTP + WebSocket)
  actualizarDatos() {
    const filtro = this.obtenerFiltroPeriodo();
    this.cargarMetricasHttp();
    this.metricasTiempoReal.solicitarMetricas(filtro);
  }

  // Carga las métricas vía HTTP para el periodo seleccionado
  private cargarMetricasHttp(): void {
    const filtro = this.obtenerFiltroPeriodo();
    this.metricasApi.obtenerMetricas(filtro).subscribe({
      next: (datos: DatosMetricasDashboard) => this.aplicarMetricas(datos),
      error: () => {
        this.notificacion.error('No se pudieron cargar las métricas del dashboard. Intenta más tarde.');
      },
    });
  }
}
