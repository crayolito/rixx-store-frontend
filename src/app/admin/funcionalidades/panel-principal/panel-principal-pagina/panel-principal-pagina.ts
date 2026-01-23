import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-panel-principal-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-principal-pagina.html',
  styleUrl: './panel-principal-pagina.css',
})
export class PanelPrincipalPagina {
  // ===== ESTADO: DATOS DEL USUARIO =====
  nombre = signal<string>('Jose Alejandro Sahonero Salas');
  correo = signal<string>('correo@ejemplo.com');
  contrasena = 'Jose78452415';
  confirmarContrasena = '';

  // ===== ESTADO: MODO EDICIÓN =====
  editandoNombre = signal<boolean>(false);
  editandoCorreo = signal<boolean>(false);
  puedeCambiarContrasena = signal<boolean>(false);
  mostrarContrasena = signal<boolean>(false);
  mostrarConfirmarContrasena = signal<boolean>(false);

  // ===== FASE 1: Manejar cambios en el nombre =====
  onNombreChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.nombre.set(target.value);
  }

  // ===== FASE 2: Toggle edición de nombre =====
  toggleEditarNombre(): void {
    const editando = !this.editandoNombre();
    this.editandoNombre.set(editando);

    if (!editando) {
      console.log('Guardando nombre:', this.nombre());
    }
  }

  // ===== FASE 3: Manejar cambios en el correo =====
  onCorreoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.correo.set(target.value);
  }

  // ===== FASE 4: Toggle edición de correo =====
  toggleEditarCorreo(): void {
    const editando = !this.editandoCorreo();
    this.editandoCorreo.set(editando);

    if (!editando) {
      console.log('Guardando correo:', this.correo());
    }
  }

  // ===== FASE 5: Toggle cambiar contraseña =====
  toggleCambiarContrasena(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.puedeCambiarContrasena.set(target.checked);

    if (target.checked) {
      this.contrasena = '';
      this.confirmarContrasena = '';
      this.mostrarContrasena.set(false);
      this.mostrarConfirmarContrasena.set(false);
    }
  }

  // ===== FASE 6: Toggle mostrar contraseña =====
  toggleMostrarContrasena(): void {
    this.mostrarContrasena.set(!this.mostrarContrasena());
  }

  // ===== FASE 7: Toggle mostrar confirmar contraseña =====
  toggleMostrarConfirmarContrasena(): void {
    this.mostrarConfirmarContrasena.set(!this.mostrarConfirmarContrasena());
  }
}
