import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import type { Pais } from '../../../../../compartido/datos/paises.datos';
import { PAISES } from '../../../../../compartido/datos/paises.datos';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { UsuarioApiServicio } from '../../../../../nucleo/servicios/auth-api.servicio';
import { Sesion } from '../../../../../nucleo/servicios/sesion';

/** Datos emitidos cuando se guardan los cambios correctamente */
export interface DatosPersonalesGuardados {
  nombre: string;
  email: string;
  telefono?: string;
  nacionalidad?: string;
}

/**
 * Formulario de información personal y cambio de contraseña.
 * Recibe los datos actuales, permite editar y emite cuando se guardan.
 */
@Component({
  selector: 'app-datos-personales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datos-personales.html',
  styleUrl: './datos-personales.css',
})
export class DatosPersonales {
  /** Nombre actual del usuario */
  nombre = input.required<string>();
  /** Email actual */
  email = input.required<string>();
  /** Teléfono actual */
  telefono = input<string>('');
  /** Código de nacionalidad actual */
  nacionalidad = input<string>('');
  /** Si la cuenta está vinculada a Google (no permite cambiar contraseña) */
  tieneSocialLogin = input<boolean>(false);

  /** Emite cuando se guardan los datos personales correctamente */
  datosGuardados = output<DatosPersonalesGuardados>();

  readonly paises = PAISES;

  estaEditando = signal(false);
  guardando = signal(false);
  nombreTemporal = signal('');
  emailTemporal = signal('');
  telefonoTemporal = signal('');
  nacionalidadTemporal = signal('');
  selectorPaisAbierto = signal(false);
  selectorNacionalidadAbierto = signal(false);
  paisSeleccionado = signal<Pais>(PAISES[0]);
  paisNacionalidad = signal<Pais>(PAISES[0]);
  mostrarContrasena = signal(false);
  mostrarCambioContrasena = signal(false);
  contrasenaActual = signal('');
  nuevaContrasena = signal('');

  private sesion = inject(Sesion);
  private usuarioApi = inject(UsuarioApiServicio);
  private notificacion = inject(NotificacionServicio);

  constructor() {
    effect(() => {
      const nac = (this.nacionalidad() || '').toLowerCase();
      const pais = nac ? this.paises.find(p => p.codigo.toLowerCase() === nac) : null;
      if (pais) this.paisNacionalidad.set({ ...pais });
    }, { allowSignalWrites: true });
  }

  alternarSelectorPais(): void {
    this.selectorPaisAbierto.update(v => !v);
  }

  alternarSelectorNacionalidad(): void {
    this.selectorNacionalidadAbierto.update(v => !v);
  }

  seleccionarPais(pais: Pais): void {
    this.paisSeleccionado.set({ ...pais });
    this.selectorPaisAbierto.set(false);
  }

  seleccionarNacionalidadPerfil(pais: Pais): void {
    this.paisNacionalidad.set({ ...pais });
    this.nacionalidadTemporal.set(pais.codigo.toUpperCase());
    this.selectorNacionalidadAbierto.set(false);
  }

  actualizarNombre(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.nombreTemporal.set(target.value);
  }

  actualizarEmail(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.emailTemporal.set(target.value);
  }

  actualizarTelefono(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.telefonoTemporal.set(target.value);
  }

  actualizarNuevaContrasena(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.nuevaContrasena.set(target.value);
  }

  actualizarContrasenaActual(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.contrasenaActual.set(target.value);
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena.update(v => !v);
  }

  toggleCambioContrasena(): void {
    this.mostrarCambioContrasena.update(v => !v);
  }

  activarEdicion(): void {
    this.estaEditando.set(true);
    this.nombreTemporal.set(this.nombre());
    this.emailTemporal.set(this.email());
    this.telefonoTemporal.set(this.telefono());
    this.nacionalidadTemporal.set(this.nacionalidad() || this.paisNacionalidad().codigo.toUpperCase());
  }

  cancelarEdicion(): void {
    this.estaEditando.set(false);
    this.nombreTemporal.set('');
    this.emailTemporal.set('');
    this.telefonoTemporal.set('');
    this.nacionalidadTemporal.set('');
    this.contrasenaActual.set('');
    this.nuevaContrasena.set('');
  }

  guardarCambios(): void {
    const id = this.sesion.usuarioActual()?.id;
    if (id == null) {
      this.notificacion.advertencia('Inicia sesión para poder editar tu perfil.');
      return;
    }
    const nombre = this.nombreTemporal().trim();
    const email = this.emailTemporal().trim();
    if (!nombre || !email) {
      this.notificacion.advertencia('Nombre y email son obligatorios');
      return;
    }

    const telefonoRaw = this.telefonoTemporal().trim().replace(/\s/g, '');
    const prefijo = this.paisSeleccionado().sigla;
    const telefono = telefonoRaw
      ? (telefonoRaw.startsWith('+') ? this.telefonoTemporal().trim() : `${prefijo} ${telefonoRaw}`)
      : undefined;
    const nacionalidad =
      (this.nacionalidadTemporal() || this.paisNacionalidad().codigo).toUpperCase() || undefined;

    const cuerpo: Parameters<UsuarioApiServicio['actualizarUsuario']>[1] = {
      nombre,
      email,
      telefono: telefono ?? null,
      nacionalidad: nacionalidad ?? null,
    };

    this.guardando.set(true);
    this.usuarioApi.actualizarUsuario(id, cuerpo).subscribe({
      next: () => {
        const actual = this.sesion.usuarioActual();
        if (actual) {
          this.sesion.guardarSesion({
            ...actual,
            nombre,
            email,
            telefono: telefono ?? actual.telefono,
            nacionalidad: nacionalidad ?? actual.nacionalidad,
          });
        }
        this.estaEditando.set(false);
        this.nuevaContrasena.set('');
        this.notificacion.exito('Cambios guardados correctamente');
        this.datosGuardados.emit({ nombre, email, telefono, nacionalidad });
      },
      error: () => {
        this.notificacion.error('No se pudieron guardar los cambios');
      },
      complete: () => this.guardando.set(false),
    });
  }

  guardarPerfil(): void {
    const id = this.sesion.usuarioActual()?.id;
    if (id == null || this.tieneSocialLogin()) return;
    const actual = this.contrasenaActual().trim();
    const nueva = this.nuevaContrasena().trim();
    if (!actual) {
      this.notificacion.advertencia('Ingresa tu contraseña actual');
      return;
    }
    if (!nueva) {
      this.notificacion.advertencia('Ingresa la nueva contraseña');
      return;
    }
    this.guardando.set(true);
    this.usuarioApi.cambiarContrasena(id, actual, nueva).subscribe({
      next: () => {
        this.contrasenaActual.set('');
        this.nuevaContrasena.set('');
        this.notificacion.exito('Contraseña actualizada correctamente');
      },
      error: () => {
        this.notificacion.error('No se pudo cambiar la contraseña');
      },
      complete: () => this.guardando.set(false),
    });
  }
}
