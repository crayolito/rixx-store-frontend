import { Injectable, signal } from '@angular/core';

// Estructura de una notificación
export interface Notificacion {
  id: string;
  tipo: 'exito' | 'error' | 'info' | 'advertencia';
  mensaje: string;
  duracion?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionServicio {
  notificaciones = signal<Notificacion[]>([]);
  private cola: Notificacion[] = [];
  private procesandoCola = false;
  private tiempoRestante = 0;
  private tiempoInicio = 0;
  private temporizadorId: ReturnType<typeof setTimeout> | null = null;
  private notificacionActualId: string | null = null;

  // Agrega una notificación a la cola
  mostrar(
    tipo: Notificacion['tipo'],
    mensaje: string,
    duracion: number = 4000
  ) {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const nuevaNotificacion: Notificacion = {
      id,
      tipo,
      mensaje,
      duracion,
    };

    this.cola.push(nuevaNotificacion);

    if (!this.procesandoCola) {
      this.procesarCola();
    }
  }

  // Procesa la cola de notificaciones
  private procesarCola() {
    if (this.cola.length === 0) {
      this.procesandoCola = false;
      return;
    }

    this.procesandoCola = true;
    const notificacion = this.cola.shift()!;
    this.notificacionActualId = notificacion.id;
    this.notificaciones.set([notificacion]);

    if (notificacion.duracion && notificacion.duracion > 0) {
      this.tiempoRestante = notificacion.duracion;
      this.iniciarTemporizador(notificacion.id);
    }
  }

  // Inicia el temporizador para cerrar automáticamente
  private iniciarTemporizador(id: string) {
    this.tiempoInicio = Date.now();
    this.temporizadorId = setTimeout(() => {
      this.cerrar(id);
      setTimeout(() => this.procesarCola(), 300);
    }, this.tiempoRestante);
  }

  // Pausa el temporizador cuando el mouse está encima
  pausar() {
    if (this.temporizadorId) {
      clearTimeout(this.temporizadorId);
      this.temporizadorId = null;
      const tiempoTranscurrido = Date.now() - this.tiempoInicio;
      this.tiempoRestante = Math.max(0, this.tiempoRestante - tiempoTranscurrido);
    }
  }

  // Reanuda el temporizador cuando el mouse sale
  reanudar() {
    if (this.notificacionActualId && this.tiempoRestante > 0) {
      this.iniciarTemporizador(this.notificacionActualId);
    }
  }

  // Cierra una notificación específica
  cerrar(id: string) {
    if (this.temporizadorId) {
      clearTimeout(this.temporizadorId);
      this.temporizadorId = null;
    }
    this.notificacionActualId = null;
    this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }

  // Cierra todas las notificaciones y limpia la cola
  cerrarTodas() {
    if (this.temporizadorId) {
      clearTimeout(this.temporizadorId);
      this.temporizadorId = null;
    }
    this.notificaciones.set([]);
    this.cola = [];
    this.procesandoCola = false;
    this.notificacionActualId = null;
  }

  // Métodos de conveniencia para cada tipo
  exito(mensaje: string, duracion?: number) {
    this.mostrar('exito', mensaje, duracion);
  }

  error(mensaje: string, duracion?: number) {
    this.mostrar('error', mensaje, duracion);
  }

  info(mensaje: string, duracion?: number) {
    this.mostrar('info', mensaje, duracion);
  }

  advertencia(mensaje: string, duracion?: number) {
    this.mostrar('advertencia', mensaje, duracion);
  }
}
