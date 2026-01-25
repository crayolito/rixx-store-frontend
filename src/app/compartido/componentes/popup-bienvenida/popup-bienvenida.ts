import { Component, OnInit, signal } from '@angular/core';
import { Modal } from '../modal/modal';
@Component({
  selector: 'app-popup-bienvenida',
  imports: [Modal],
  templateUrl: './popup-bienvenida.html',
  styleUrl: './popup-bienvenida.css',
})
export class PopupBienvenida implements OnInit {
  // FASE 1: Signal para controlar visibilidad
  estaVisible = signal(false);

  // FASE 2: En ngOnInit() o constructor con effect
  ngOnInit() {
    // Esperar 2 segundos, luego mostrar
    setTimeout(() => {
      this.estaVisible.set(true);

      // Después de 5 segundos, ocultar automáticamente
      setTimeout(() => {
        this.estaVisible.set(false);
      }, 2000);
    }, 1000);
  }

  // FASE 3: Método para cerrar manualmente
  cerrarPopup() {
    this.estaVisible.set(false);
  }
}
