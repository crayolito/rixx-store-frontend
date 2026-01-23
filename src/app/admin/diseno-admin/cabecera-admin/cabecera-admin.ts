import { Component, inject } from '@angular/core';
import { ModalSidebarServicio } from '../../servicios/modal-sidebar.servicio';

@Component({
  selector: 'app-cabecera-admin',
  standalone: true,
  imports: [],
  templateUrl: './cabecera-admin.html',
  styleUrl: './cabecera-admin.css',
})
export class CabeceraAdmin {
  // FASE 1: Inyectar el servicio para poder usarlo
  private modalServicio = inject(ModalSidebarServicio);

  // FASE 2: Alternar el modal del sidebar cuando se hace click en el botón menú
  abrirMenu() {
    this.modalServicio.alternar();
  }
}
