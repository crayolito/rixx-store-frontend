import { Injectable, signal } from "@angular/core";

export interface UsuarioSesion {
  id?: number;
  nombre: string;
  email: string;
  fotoPerfil?: string;
  rol: 'Cliente' | 'Admin';
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
        this.usuarioActual.set(usuario);
        this.estaLogueado.set(true);
      }
    } catch (error) {
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
}
