import { Injectable } from '@angular/core';
import type { UsuarioSesion } from './sesion.servicio';

// Usuarios de prueba para desarrollo (sin backend)
const USUARIOS_PRUEBA: Array<{ email: string; contrasena: string; nombre: string; rol: UsuarioSesion['rol'] }> = [
  { email: 'admin@test.com', contrasena: 'admin123', nombre: 'Administrador', rol: 'Admin' },
  { email: 'cliente@test.com', contrasena: 'cliente123', nombre: 'Cliente Demo', rol: 'Cliente' },
];

@Injectable({ providedIn: 'root' })
export class Autenticacion {
  iniciarSesion(email: string, contrasena: string): UsuarioSesion | null {
    const usuario = USUARIOS_PRUEBA.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.contrasena === contrasena
    );
    if (!usuario) return null;
    return {
      nombre: usuario.nombre,
      email: usuario.email,
      fotoPerfil: '/imagenes/foto-perfil1.png',
      rol: usuario.rol,
    };
  }

  registrar(nombre: string, email: string, contrasena: string): UsuarioSesion {
    return {
      nombre: nombre.trim() || 'Usuario',
      email: email.trim(),
      fotoPerfil: '/imagenes/foto-perfil1.png',
      rol: 'Cliente',
    };
  }
}
