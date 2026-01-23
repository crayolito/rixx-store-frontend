import { Injectable, signal } from '@angular/core';

// FASE 1: Definir la estructura de una notificación
export interface Notificacion {
  id: string;
  tipo: 'exito' | 'error' | 'info' | 'advertencia';
  mensaje: string;
  duracion?: number; // milisegundos (0 = no se cierra automáticamente)
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionServicio {
  // FASE 2: Signal para la notificación visible y cola de espera
  notificaciones = signal<Notificacion[]>([]);
  private cola: Notificacion[] = []; // Cola de notificaciones en espera
  private procesandoCola = false; // Control para procesar la cola

  // FASE 3: Método principal para agregar notificación a la cola
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

    // Agregar a la cola
    this.cola.push(nuevaNotificacion);

    // Procesar la cola si no se está procesando
    if (!this.procesandoCola) {
      this.procesarCola();
    }
  }

  // FASE 4: Procesar la cola (mostrar una por una)
  private procesarCola() {
    // Si no hay nada en la cola, terminar
    if (this.cola.length === 0) {
      this.procesandoCola = false;
      return;
    }

    // Marcar como procesando
    this.procesandoCola = true;

    // Obtener la primera notificación de la cola
    const notificacion = this.cola.shift()!;

    // Mostrar la notificación (solo 1 a la vez)
    this.notificaciones.set([notificacion]);

    // Auto-cerrar después de la duración
    if (notificacion.duracion && notificacion.duracion > 0) {
      setTimeout(() => {
        this.cerrar(notificacion.id);
        // Procesar la siguiente notificación después de cerrar
        setTimeout(() => this.procesarCola(), 300); // Esperar 300ms entre notificaciones
      }, notificacion.duracion);
    }
  }

  // FASE 5: Cerrar una notificación específica
  cerrar(id: string) {
    this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }

  // FASE 6: Cerrar todas las notificaciones y limpiar la cola
  cerrarTodas() {
    this.notificaciones.set([]);
    this.cola = [];
    this.procesandoCola = false;
  }

  // FASE 7: Métodos de conveniencia para cada tipo
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
