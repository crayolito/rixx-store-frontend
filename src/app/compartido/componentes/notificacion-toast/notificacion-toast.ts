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
  notificacionServicio = inject(NotificacionServicio);

  // Cierra una notificación
  cerrarNotificacion(id: string) {
    this.notificacionServicio.cerrar(id);
  }

  // Pausa el temporizador cuando el mouse entra
  pausarTemporizador() {
    this.notificacionServicio.pausar();
  }

  // Reanuda el temporizador cuando el mouse sale
  reanudarTemporizador() {
    this.notificacionServicio.reanudar();
  }
}
