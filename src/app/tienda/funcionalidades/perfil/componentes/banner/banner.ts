import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { CloudinaryApiServicio } from '../../../../../nucleo/servicios/cloudinary-api.servicio';
import { UsuarioApiServicio } from '../../../../../nucleo/servicios/auth-api.servicio';
import { Sesion } from '../../../../../nucleo/servicios/sesion';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';

/**
 * Banner superior del perfil: foto, nombre y email.
 * Maneja la subida de nueva foto y notifica al padre cuando se actualiza.
 */
@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner {
  /** Nombre del usuario (actualizado por el padre) */
  nombre = input.required<string>();
  /** Email del usuario */
  email = input.required<string>();
  /** URL de la foto de perfil actual */
  fotoPerfil = input.required<string>();

  /** Emite la nueva URL cuando la foto se actualiza correctamente */
  fotoActualizada = output<string>();

  guardando = signal(false);

  private sesion = inject(Sesion);
  private usuarioApi = inject(UsuarioApiServicio);
  private notificacion = inject(NotificacionServicio);
  private cloudinaryApi = inject(CloudinaryApiServicio);

  /** Valida el archivo, sube a Cloudinary y actualiza el perfil */
  manejarCambioFoto(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const archivo = inputEl.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this.notificacion.error('Solo se permiten archivos de imagen');
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      this.notificacion.error('La imagen no debe superar 5MB');
      return;
    }

    this.guardando.set(true);
    this.notificacion.info('Subiendo imagen...');

    this.cloudinaryApi.subirImagen(archivo).subscribe({
      next: (urlFoto) => {
        if (!urlFoto) {
          this.notificacion.error('Error al subir la imagen');
          this.guardando.set(false);
          return;
        }

        const id = this.sesion.usuarioActual()?.id;
        if (!id) {
          this.guardando.set(false);
          return;
        }

        this.usuarioApi.actualizarUsuario(id, { foto: urlFoto }).subscribe({
          next: () => {
            const actual = this.sesion.usuarioActual();
            if (actual) {
              this.sesion.guardarSesion({ ...actual, fotoPerfil: urlFoto });
            }
            this.notificacion.exito('Foto de perfil actualizada');
            this.fotoActualizada.emit(urlFoto);
            this.guardando.set(false);
          },
          error: () => {
            this.notificacion.error('No se pudo actualizar la foto de perfil');
            this.guardando.set(false);
          },
        });
      },
      error: () => {
        this.notificacion.error('Error al subir la imagen');
        this.guardando.set(false);
      },
    });
  }
}
