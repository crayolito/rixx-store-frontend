import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-metricas-admin-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './metricas-admin-pagina.html',
  styleUrl: './metricas-admin-pagina.css'
})
export class MetricasAdminPagina {
  // PERIODO SELECCIONADO
  mesSeleccionado = signal('enero');
  anioSeleccionado = signal('2026');

  mesActual = computed(() => this.mesSeleccionado());
  anioActual = computed(() => this.anioSeleccionado());

  // USUARIOS ACTIVOS
  usuariosActivos = signal(8);

  // DATOS FINANCIEROS REALISTAS
  datosFinancieros = signal({
    totalIngresos: 45280,
    totalGastos: 32150,
    ganancia: 13130,
    margen: '29.0%'
  });

  totalOrdenes = signal(127);

  // GANANCIA POR HORA (24 horas)
  datosGananciaPorHora = signal([
    { hora: '00:00', ganancia: 0 },
    { hora: '01:00', ganancia: 0 },
    { hora: '02:00', ganancia: 0 },
    { hora: '03:00', ganancia: 0 },
    { hora: '04:00', ganancia: 0 },
    { hora: '05:00', ganancia: 0 },
    { hora: '06:00', ganancia: 120 },
    { hora: '07:00', ganancia: 340 },
    { hora: '08:00', ganancia: 580 },
    { hora: '09:00', ganancia: 890 },
    { hora: '10:00', ganancia: 1250 },
    { hora: '11:00', ganancia: 1450 },
    { hora: '12:00', ganancia: 1680 },
    { hora: '13:00', ganancia: 1320 },
    { hora: '14:00', ganancia: 1580 },
    { hora: '15:00', ganancia: 1890 },
    { hora: '16:00', ganancia: 2150 },
    { hora: '17:00', ganancia: 1980 },
    { hora: '18:00', ganancia: 1750 },
    { hora: '19:00', ganancia: 1420 },
    { hora: '20:00', ganancia: 980 },
    { hora: '21:00', ganancia: 650 },
    { hora: '22:00', ganancia: 380 },
    { hora: '23:00', ganancia: 180 }
  ]);

  // DATOS GEOGRÁFICOS (Países LATAM reales)
  datosGeograficos = signal([
    { nombre: 'Ecuador', ganancia: 18450, ordenes: 52, color: '#3B82F6' },
    { nombre: 'Perú', ganancia: 12380, ordenes: 38, color: '#10B981' },
    { nombre: 'Bolivia', ganancia: 8920, ordenes: 24, color: '#F59E0B' },
    { nombre: 'Chile', ganancia: 5380, ordenes: 13, color: '#EF4444' }
  ]);

  // MÉTODOS DE PAGO
  metodosPago = signal([
    { nombre: 'Binance Pay', transacciones: 45, monto: 18750 },
    { nombre: 'Veripagos', transacciones: 38, monto: 15890 },
    { nombre: 'Tarjeta de Crédito', transacciones: 32, monto: 8420 },
    { nombre: 'PayPal', transacciones: 12, monto: 2220 }
  ]);

  totalProcesado = computed(() => {
    return this.metodosPago().reduce((sum, m) => sum + m.monto, 0);
  });

  // TOP 5 SERVICIOS (E-commerce realista)
  topServicios = signal([
    {
      posicion: 1,
      nombre: 'Gift Card Amazon USA $50',
      ingresos: 12500,
      costos: 10850,
      ganancia: 1650
    },
    {
      posicion: 2,
      nombre: 'Netflix Premium 1 Mes',
      ingresos: 8940,
      costos: 7620,
      ganancia: 1320
    },
    {
      posicion: 3,
      nombre: 'Spotify Premium 3 Meses',
      ingresos: 6780,
      costos: 5850,
      ganancia: 930
    },
    {
      posicion: 4,
      nombre: 'Steam Wallet $100',
      ingresos: 5420,
      costos: 4680,
      ganancia: 740
    },
    {
      posicion: 5,
      nombre: 'PlayStation Plus 12 Meses',
      ingresos: 4290,
      costos: 3820,
      ganancia: 470
    }
  ]);

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
      formatter: (val: number) => '$' + val.toFixed(0)
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

  // MÉTODO PARA ACTUALIZAR DATOS
  actualizarDatos() {
    console.log(`Actualizando datos para ${this.mesActual()} ${this.anioActual()}`);
    // Aquí irían las llamadas a la API
  }
}
