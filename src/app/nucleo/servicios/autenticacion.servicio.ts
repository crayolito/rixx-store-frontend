import { Injectable } from '@angular/core';
import type { UsuarioSesion } from './sesion';

// Usuarios de prueba para desarrollo (sin backend)
const PERMISOS_CLIENTE = ['ver_perfil', 'ver_checkout', 'ver_billetera'];
const PERMISOS_ADMIN = ['acceder_admin', 'ver_perfil', 'ver_checkout', 'ver_billetera', 'gestionar_usuarios', 'gestionar_productos'];

const USUARIOS_PRUEBA: Array<{ email: string; contrasena: string; nombre: string; rol: string; permisos: string[] }> = [
  { email: 'admin@test.com', contrasena: 'admin123', nombre: 'Administrador', rol: 'Admin', permisos: PERMISOS_ADMIN },
  { email: 'cliente@test.com', contrasena: 'cliente123', nombre: 'Cliente Demo', rol: 'Cliente', permisos: PERMISOS_CLIENTE },
];

function decodificarPayloadJwt(token: string): { email?: string; name?: string; picture?: string } | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as { email?: string; name?: string; picture?: string };
  } catch {
    return null;
  }
}

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
      permisos: usuario.permisos,
    };
  }

  registrar(nombre: string, email: string, contrasena: string): UsuarioSesion {
    return {
      nombre: nombre.trim() || 'Usuario',
      email: email.trim(),
      fotoPerfil: '/imagenes/foto-perfil1.png',
      rol: 'Cliente',
      permisos: PERMISOS_CLIENTE,
    };
  }

  iniciarSesionConGoogle(credential: string): UsuarioSesion | null {
    const payload = decodificarPayloadJwt(credential);
    if (!payload?.email) return null;
    return {
      nombre: payload.name?.trim() || 'Usuario Google',
      email: payload.email,
      fotoPerfil: payload.picture ?? '/imagenes/foto-perfil1.png',
      rol: 'Cliente',
      permisos: PERMISOS_CLIENTE,
      origen: 'google',
    };
  }

  iniciarSesionConGoogleUserInfo(datos: { email: string; nombre?: string; foto?: string }): UsuarioSesion {
    return {
      nombre: datos.nombre?.trim() || 'Usuario Google',
      email: datos.email,
      fotoPerfil: datos.foto ?? '/imagenes/foto-perfil1.png',
      rol: 'Cliente',
      permisos: PERMISOS_CLIENTE,
      origen: 'google',
    };
  }
}
