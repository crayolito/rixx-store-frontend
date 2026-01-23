import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalSidebarServicio {
  // FASE 1: Signal que controla si el modal está abierto o cerrado
  estaAbierto = signal<boolean>(false);

  // FASE 2: Abrir el modal
  abrir() {
    this.estaAbierto.set(true);
  }

  // FASE 3: Cerrar el modal
  cerrar() {
    this.estaAbierto.set(false);
  }

  // FASE 4: Alternar estado del modal (abrir si está cerrado, cerrar si está abierto)
  alternar() {
    this.estaAbierto.update(valor => !valor);
  }
}
