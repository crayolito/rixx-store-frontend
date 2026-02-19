import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalSidebarServicio } from '../../servicios/modal-sidebar.servicio';
import { Sesion } from '../../../nucleo/servicios/sesion';

@Component({
  selector: 'app-cabecera-admin',
  standalone: true,
  imports: [],
  templateUrl: './cabecera-admin.html',
  styleUrl: './cabecera-admin.css',
})
export class CabeceraAdmin {
  private modalServicio = inject(ModalSidebarServicio);
  private router = inject(Router);
  private sesion = inject(Sesion);

  inicialesUsuario = computed(() => {
    const u = this.sesion.usuarioActual();
    if (!u?.nombre) return '—';
    const partes = u.nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return u.nombre.slice(0, 2).toUpperCase();
  });

  nombreUsuario = computed(() => this.sesion.usuarioActual()?.nombre ?? 'Usuario');

  abrirMenu(): void {
    this.modalServicio.alternar();
  }

  irAConfiguracion(): void {
    this.router.navigate(['/admin/configuraciones/metodos-pago']);
  }

  cerrarSesion(): void {
    this.sesion.cerrarSesion();
    this.router.navigate(['/']);
  }
}
