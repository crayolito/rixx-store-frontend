import { CommonModule } from '@angular/common';
import { Component, effect, input, OnDestroy, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal implements OnDestroy {
  // FASE 1: Control de visibilidad del modal
  estaAbierto = input.required<boolean>();
  cerrar = output<void>();

  // FASE 2: Guardar referencia al listener para limpiarlo
  private limpiarListener: (() => void) | null = null;

  // FASE 3: Cerrar al hacer click en el overlay
  cerrarAlHacerClickEnOverlay(event: Event) {
    if (event.target === event.currentTarget) {
      this.cerrar.emit();
    }
  }

  // FASE 4: Cerrar con tecla Escape
  constructor() {
    effect(() => {
      // FASE 4.1: Limpiar listener anterior si existe
      if (this.limpiarListener) {
        this.limpiarListener();
        this.limpiarListener = null;
      }

      // FASE 4.2: Agregar nuevo listener solo si el modal está abierto
      if (this.estaAbierto()) {
        const manejarEscape = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            this.cerrar.emit();
          }
        };
        document.addEventListener('keydown', manejarEscape);

        // FASE 4.3: Guardar función de limpieza
        this.limpiarListener = () => {
          document.removeEventListener('keydown', manejarEscape);
        };
      }
    });
  }

  // FASE 5: Limpiar al destruir el componente
  ngOnDestroy() {
    if (this.limpiarListener) {
      this.limpiarListener();
      this.limpiarListener = null;
    }
  }
}
