import { Injectable, signal } from '@angular/core';

// FASE 1: Modelo de Usuario
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  contrasena: string;
  rol: 'Admin' | 'Cliente';
  fotoPerfil?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Autenticacion {
  // FASE 2: Usuarios de prueba
  private usuarios: Usuario[] = [
    {
      id: '1',
      nombre: 'Admin Usuario',
      email: 'admin@ejemplo.com',
      contrasena: 'admin123',
      rol: 'Admin',
      fotoPerfil: '/imagenes/foto-perfil1.png'
    },
    {
      id: '2',
      nombre: 'Cliente Usuario',
      email: 'cliente@ejemplo.com',
      contrasena: 'cliente123',
      rol: 'Cliente',
      fotoPerfil: '/imagenes/foto-perfil1.png'
    }
  ];

  // FASE 3: Método de login
  iniciarSesion(email: string, contrasena: string): Usuario | null {
    const usuario = this.usuarios.find(
      u => u.email === email && u.contrasena === contrasena
    );
    
    return usuario ? { ...usuario } : null;
  }

  // FASE 4: Método de registro (para futuro)
  registrar(nombre: string, email: string, contrasena: string): Usuario {
    const nuevoUsuario: Usuario = {
      id: Date.now().toString(),
      nombre,
      email,
      contrasena,
      rol: 'Cliente',
      fotoPerfil: '/imagenes/foto-perfil1.png'
    };
    
    this.usuarios.push(nuevoUsuario);
    return { ...nuevoUsuario };
  }
}
