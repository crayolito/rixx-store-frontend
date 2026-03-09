import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpBaseServicio } from './http-base.servicio';
import { Sesion } from './sesion';

// Representa el periodo para el cual se calculan las métricas
export interface PeriodoMetricas {
  mes: number;
  anio: number;
  etiqueta?: string;
}

// Resumen financiero principal del dashboard
export interface ResumenFinanciero {
  totalIngresos: number;
  totalGastos: number;
  ganancia: number;
  margen: string;
  totalOrdenes?: number;
}

// Actividad general de la tienda (usuarios activos, órdenes, etc.)
export interface ActividadTienda {
  usuariosActivos: number;
  totalOrdenes?: number;
  [clave: string]: unknown;
}

// Ganancia o actividad agrupada por hora
export interface ActividadPorHoraItem {
  hora: string;
  ganancia: number;
  ordenes?: number;
}

// Ventas agrupadas por país
export interface VentaPorPais {
  nombre: string;
  ganancia: number;
  ordenes: number;
  color?: string;
}

// Distribución por métodos de pago
export interface MetodoPagoMetrica {
  nombre: string;
  transacciones: number;
  monto: number;
}

// Productos o servicios más vendidos/rentables
export interface TopProducto {
  posicion: number;
  nombre: string;
  ingresos: number;
  costos: number;
  ganancia: number;
}

// Cuerpo principal de datos que devuelve el backend para el dashboard
export interface DatosMetricasDashboard {
  periodo: PeriodoMetricas;
  resumenFinanciero: ResumenFinanciero;
  actividadTienda: ActividadTienda;
  actividadPorHora: ActividadPorHoraItem[];
  ventasPorPais: VentaPorPais[];
  metodosPago: MetodoPagoMetrica[];
  topProductos: TopProducto[];
}

// Respuesta estándar del backend para métricas de dashboard
export interface RespuestaMetricasDashboard {
  exito: boolean;
  datos?: DatosMetricasDashboard;
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class MetricasDashboardApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  // Construye los headers de autenticación con el token actual
  private headersConAuth(): { headers: HttpHeaders } | undefined {
    const token = this.sesion.obtenerToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : undefined;
  }

  // Obtiene las métricas del dashboard para un mes/año o el actual si no se envían filtros
  obtenerMetricas(filtro?: { mes?: number; anio?: number }): Observable<DatosMetricasDashboard> {
    const params: string[] = [];
    if (filtro?.mes != null) {
      params.push(`mes=${filtro.mes}`);
    }
    if (filtro?.anio != null) {
      params.push(`anio=${filtro.anio}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';

    return this.httpBase
      .obtenerConOpciones<RespuestaMetricasDashboard>(`/dashboard/metricas${query}`, this.headersConAuth())
      .pipe(
        map((respuesta) => {
          if (!respuesta?.exito || !respuesta.datos) {
            throw new Error(respuesta?.mensaje ?? 'No se pudieron obtener las métricas del dashboard');
          }
          return respuesta.datos;
        }),
      );
  }
}

