import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificacionServicio } from '../../servicios/notificacion';

@Component({
  selector: 'app-notificacion-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificacion-toast.html',
  styleUrl: './notificacion-toast.css',
})
export class NotificacionToast {
  // FASE 1: Inyectar el servicio de notificaciones
  notificacionServicio = inject(NotificacionServicio);

  // FASE 2: Método para cerrar una notificación
  cerrarNotificacion(id: string) {
    this.notificacionServicio.cerrar(id);
  }
}
