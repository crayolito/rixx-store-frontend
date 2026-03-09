import { inject, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constantes/http.constantes';
import { Sesion } from './sesion';
import { DatosMetricasDashboard, RespuestaMetricasDashboard } from './metricas-dashboard-api.servicio';

// Maneja la conexión WebSocket para métricas de dashboard en tiempo real
@Injectable({ providedIn: 'root' })
export class DashboardMetricasTiempoRealServicio {
  private sesion = inject(Sesion);
  private socket: Socket | null = null;

  // Abre la conexión con el namespace de dashboard usando el token JWT actual
  conectar(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.sesion.obtenerToken();

    this.socket = io(`${API_BASE_URL}/dashboard`, {
      transports: ['websocket'],
      // En navegadores no se pueden enviar headers arbitrarios en WebSocket puro,
      // pero socket.io permite definir extraHeaders en el handshake HTTP (útil
      // cuando el backend espera Authorization en headers).
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  // Cierra la conexión activa (si existe)
  desconectar(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Registra un listener para el evento de métricas del dashboard
  escucharMetricas(
    manejador: (payload: RespuestaMetricasDashboard & { datos?: DatosMetricasDashboard }) => void,
  ): void {
    this.conectar();
    this.socket?.off('metricas_dashboard');
    this.socket?.on('metricas_dashboard', (payload: RespuestaMetricasDashboard) => {
      manejador(payload);
    });
  }

  // Emite una solicitud de métricas en tiempo real con mes/año opcionales
  solicitarMetricas(filtro?: { mes?: number; anio?: number }): void {
    this.conectar();
    const payload: { mes?: number; anio?: number } = {};
    if (filtro?.mes != null) {
      payload.mes = filtro.mes;
    }
    if (filtro?.anio != null) {
      payload.anio = filtro.anio;
    }
    this.socket?.emit('solicitar_metricas', payload);
  }
}

