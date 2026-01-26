import { Injectable, signal } from '@angular/core';
import { Usuario } from './autenticacion';

@Injectable({
  providedIn: 'root',
})
export class Sesion {
  // FASE 1: Estado del usuario logueado
  usuarioActual = signal<Usuario | null>(null);

  // FASE 2: Verificar si hay sesión activa
  estaLogueado = signal<boolean>(false);

  // FASE 3: Obtener rol del usuario actual
  obtenerRol(): 'Admin' | 'Cliente' | null {
    return this.usuarioActual()?.rol || null;
  }

  // FASE 4: Guardar sesión
  guardarSesion(usuario: Usuario): void {
    this.usuarioActual.set(usuario);
    this.estaLogueado.set(true);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  // FASE 5: Cerrar sesión
  cerrarSesion(): void {
    this.usuarioActual.set(null);
    this.estaLogueado.set(false);
    localStorage.removeItem('usuario');
  }

  // FASE 6: Cargar sesión desde localStorage
  cargarSesion(): void {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado) as Usuario;
        this.usuarioActual.set(usuario);
        this.estaLogueado.set(true);
      } catch (error) {
        this.cerrarSesion();
      }
    }
  }
}
