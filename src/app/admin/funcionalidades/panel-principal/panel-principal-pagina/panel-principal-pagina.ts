import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { NotificacionServicio } from '../../../../compartido/servicios/notificacion';
import { UsuarioApiServicio } from '../../../../nucleo/servicios/auth-api.servicio';
import { Sesion } from '../../../../nucleo/servicios/sesion';

@Component({
  selector: 'app-panel-principal-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './panel-principal-pagina.html',
  styleUrl: './panel-principal-pagina.css',
})
export class PanelPrincipalPagina {
  private sesion = inject(Sesion);
  private usuarioApi = inject(UsuarioApiServicio);
  private notificacion = inject(NotificacionServicio);

  nombre = signal<string>('');
  correo = signal<string>('');
  contrasenaActual = signal('');
  nuevaContrasena = signal('');

  puedeCambiarContrasena = signal<boolean>(false);
  mostrarContrasena = signal<boolean>(false);
  mostrarNuevaContrasena = signal<boolean>(false);
  guardando = signal(false);
  modalConfirmacionAbierto = signal(false);

  tieneSocialLogin = signal(false);

  hayCambiosInfoPendientes = computed(() => {
    const u = this.sesion.usuarioActual();
    if (!u) return false;
    const nombreCambiado = this.nombre().trim() !== (u.nombre || '');
    const correoCambiado = this.correo().trim() !== (u.email || '');
    return nombreCambiado || correoCambiado;
  });

  puedeGuardarContrasena = computed(() => {
    if (!this.puedeCambiarContrasena() || this.tieneSocialLogin()) return false;
    return this.contrasenaActual().trim() !== '' && this.nuevaContrasena().trim() !== '';
  });

  constructor() {
    effect(() => {
      const u = this.sesion.usuarioActual();
      if (u) {
        this.nombre.set(u.nombre || '');
        this.correo.set(u.email || '');
        this.tieneSocialLogin.set(u.socialLogin === true);
      }
    }, { allowSignalWrites: true });
  }

  onNombreChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.nombre.set(target.value);
  }

  onCorreoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.correo.set(target.value);
  }

  toggleCambiarContrasena(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.puedeCambiarContrasena.set(target.checked);
    if (target.checked) {
      this.contrasenaActual.set('');
      this.nuevaContrasena.set('');
    }
  }

  actualizarContrasenaActual(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.contrasenaActual.set(target.value);
  }

  actualizarNuevaContrasena(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.nuevaContrasena.set(target.value);
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena.update(v => !v);
  }

  toggleMostrarNuevaContrasena(): void {
    this.mostrarNuevaContrasena.update(v => !v);
  }

  cancelarInfo(): void {
    const u = this.sesion.usuarioActual();
    if (u) {
      this.nombre.set(u.nombre || '');
      this.correo.set(u.email || '');
    }
    this.notificacion.info('Cambios descartados');
  }

  cambiarContrasena(): void {
    const id = this.sesion.usuarioActual()?.id;
    if (id == null) {
      this.notificacion.advertencia('No hay sesión activa');
      return;
    }
    const actual = this.contrasenaActual().trim();
    const nueva = this.nuevaContrasena().trim();
    if (!actual || !nueva) {
      this.notificacion.advertencia('Completa contraseña actual y nueva');
      return;
    }
    if (nueva.length < 6) {
      this.notificacion.advertencia('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    this.guardando.set(true);
    this.usuarioApi.cambiarContrasena(id, actual, nueva).subscribe({
      next: () => {
        this.contrasenaActual.set('');
        this.nuevaContrasena.set('');
        this.puedeCambiarContrasena.set(false);
        this.guardando.set(false);
        this.notificacion.exito('Contraseña actualizada correctamente');
      },
      error: () => {
        this.notificacion.error('No se pudo cambiar la contraseña');
        this.guardando.set(false);
      },
    });
  }

  abrirConfirmacionGuardar(): void {
    const id = this.sesion.usuarioActual()?.id;
    if (id == null) {
      this.notificacion.advertencia('No hay sesión activa');
      return;
    }
    const nombre = this.nombre().trim();
    const correo = this.correo().trim();
    if (!nombre || !correo) {
      this.notificacion.advertencia('Nombre y correo son obligatorios');
      return;
    }
    this.modalConfirmacionAbierto.set(true);
  }

  cerrarConfirmacion(): void {
    this.modalConfirmacionAbierto.set(false);
  }

  ejecutarGuardar(): void {
    this.modalConfirmacionAbierto.set(false);
    const id = this.sesion.usuarioActual()?.id;
    if (id == null) return;
    const nombre = this.nombre().trim();
    const correo = this.correo().trim();
    if (!nombre || !correo) return;

    this.guardando.set(true);
    this.usuarioApi.actualizarUsuario(id, { nombre, email: correo }).subscribe({
      next: () => {
        const actual = this.sesion.usuarioActual();
        if (actual) {
          this.sesion.guardarSesion({ ...actual, nombre, email: correo });
        }
        this.guardando.set(false);
        this.notificacion.exito('Información actualizada correctamente');
      },
      error: () => {
        this.notificacion.error('No se pudieron guardar los cambios');
        this.guardando.set(false);
      },
    });
  }
}
