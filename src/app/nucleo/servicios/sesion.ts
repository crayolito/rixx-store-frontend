import { Injectable, signal } from "@angular/core";

export interface UsuarioSesion {
  id?: number;
  nombre: string;
  email: string;
  fotoPerfil?: string;
  rol: string;
  idRol?: number;
  permisos: string[];
  origen?: 'email' | 'google';
  token?: string;
  socialLogin?: boolean;
  telefono?: string;
  nacionalidad?: string;
}

const CLAVE_SESION = 'sesion-usuario';

@Injectable({ providedIn: 'root' })
export class Sesion {
  readonly usuarioActual = signal<UsuarioSesion | null>(null);
  readonly estaLogueado = signal(false);

  cargarSesion(): void {
    try {
      const raw = localStorage.getItem(CLAVE_SESION);
      if (raw) {
        const usuario = JSON.parse(raw) as UsuarioSesion;
        if (!Array.isArray(usuario.permisos)) {
          usuario.permisos = [];
        }
        this.usuarioActual.set(usuario);
        this.estaLogueado.set(true);
      }
    } catch {
      this.usuarioActual.set(null);
      this.estaLogueado.set(false);
    }
  }

  guardarSesion(usuario: UsuarioSesion): void {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
    this.estaLogueado.set(true);
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_SESION);
    this.usuarioActual.set(null);
    this.estaLogueado.set(false);
  }

  obtenerToken(): string | null {
    return this.usuarioActual()?.token ?? null;
  }

  tienePermiso(permiso: string): boolean {
    const permisos = this.usuarioActual()?.permisos ?? [];
    return permisos.includes(permiso);
  }
}
