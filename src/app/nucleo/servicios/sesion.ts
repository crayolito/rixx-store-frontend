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
  saldo?: number;
  tieneContrasena?: boolean;
}

const CLAVE_SESION = 'sesion-usuario';

/** Permisos mínimos para cliente en tienda (perfil, checkout, billetera). */
const PERMISOS_MINIMOS_CLIENTE = ['ver_perfil', 'ver_checkout', 'ver_billetera'];

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
        // Si es cliente y no tiene permisos mínimos (sesión antigua o backend sin permisos), asignarlos
        const rol = (usuario.rol ?? '').toLowerCase();
        const esAdmin = rol.includes('admin') || rol === 'administrador';
        if (!esAdmin && !usuario.permisos.includes('ver_perfil')) {
          const unicos = new Set(usuario.permisos);
          PERMISOS_MINIMOS_CLIENTE.forEach((p) => unicos.add(p));
          usuario.permisos = Array.from(unicos);
          localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
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

  /** Actualiza el saldo del usuario en sesión (tras recarga, etc.). */
  actualizarSaldo(nuevoSaldo: number): void {
    const actual = this.usuarioActual();
    if (!actual) return;
    const actualizado = { ...actual, saldo: nuevoSaldo };
    localStorage.setItem(CLAVE_SESION, JSON.stringify(actualizado));
    this.usuarioActual.set(actualizado);
  }

  tienePermiso(permiso: string): boolean {
    const permisos = this.usuarioActual()?.permisos ?? [];
    return permisos.includes(permiso);
  }
}
