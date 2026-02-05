import { HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { HttpBaseServicio } from "./http-base.servicio";
import type { UsuarioSesion } from "./sesion";
import { Sesion } from "./sesion";

interface RespuestaLogin {
  exito: boolean;
  datos: {
    token: string;
    id: number;
    nombre: string;
    email: string;
    foto?: string;
    idRol?: number;
    rol?: string;
    social_login?: boolean;
    socialLogin?: boolean;
    telefono?: string;
    nacionalidad?: string;
    tieneContrasena?: boolean;
  };
}

interface RespuestaCrearUsuario {
  exito: boolean;
  datos?: { id: number; nombre: string; email: string;[k: string]: unknown };
}

function idRolARol(idRol: number | undefined): 'Cliente' | 'Admin' | 'Revendedor' {
  if (idRol === 1) return 'Admin';
  if (idRol === 2) return 'Cliente';
  if (idRol === 3) return 'Revendedor';
  return 'Cliente';
}

function mapearDatosLoginASesion(datos: RespuestaLogin['datos']): UsuarioSesion {
  const rol: 'Cliente' | 'Admin' | 'Revendedor' = idRolARol(datos.idRol);
  // El backend puede devolver 'social_login' o 'socialLogin'
  const socialLogin = datos.social_login || datos.socialLogin || false;

  return {
    id: datos.id,
    nombre: datos.nombre,
    email: datos.email,
    fotoPerfil: datos.foto,
    rol: rol as UsuarioSesion['rol'],
    token: datos.token,
    socialLogin,
    telefono: datos.telefono,
    nacionalidad: datos.nacionalidad,
  };
}

@Injectable({ providedIn: 'root' })
export class UsuarioApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  login(email: string, contrasena: string, socialLogin = false): Observable<RespuestaLogin> {
    return this.httpBase.enviarPost<RespuestaLogin>('/auth/login', {
      email,
      contrasena: contrasena || '',
      ...(socialLogin && { social_login: true }),
    }).pipe(
      tap((respuesta) => {
        if (respuesta?.exito && respuesta.datos) {
          this.sesion.guardarSesion(mapearDatosLoginASesion(respuesta.datos));
        }
      })
    );
  }

  crearUsuario(datos: {
    nombre: string;
    email: string;
    contrasena?: string;
    estado?: string;
    idRol?: number;
    telefono?: string | null;
    nacionalidad?: string | null;
    social_login?: boolean;
    foto?: string;
  }): Observable<RespuestaCrearUsuario> {
    const cuerpo: Record<string, unknown> = {
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      estado: datos.estado ?? 'activo',
      idRol: datos.idRol ?? 2,
      ...(datos.contrasena != null && datos.contrasena !== '' && { contrasena: datos.contrasena }),
      ...(datos.telefono != null && datos.telefono !== '' && { telefono: datos.telefono }),
      ...(datos.nacionalidad != null && datos.nacionalidad !== '' && { nacionalidad: datos.nacionalidad }),
      ...(datos.social_login && { social_login: true }),
      ...(datos.foto && { foto: datos.foto }),
    };
    return this.httpBase.enviarPost<RespuestaCrearUsuario>('/usuarios', cuerpo);
  }

  actualizarUsuario(
    id: number,
    datos: {
      nombre?: string;
      email?: string;
      contrasena?: string;
      foto?: string;
      telefono?: string | null;
      nacionalidad?: string | null;
    }
  ): Observable<{ exito: boolean; datos?: unknown }> {
    const token = this.sesion.obtenerToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    const cuerpo: Record<string, unknown> = {};
    if (datos['nombre'] !== undefined) cuerpo['nombre'] = datos['nombre'];
    if (datos['email'] !== undefined) cuerpo['email'] = datos['email'];
    if (datos['contrasena'] != null && datos['contrasena'] !== '') cuerpo['contrasena'] = datos['contrasena'];
    if (datos['foto'] !== undefined) cuerpo['foto'] = datos['foto'];
    if (datos['telefono'] !== undefined) cuerpo['telefono'] = datos['telefono'];
    if (datos['nacionalidad'] !== undefined) cuerpo['nacionalidad'] = datos['nacionalidad'];
    return this.httpBase.actualizarPut<{ exito: boolean; datos?: unknown }>(
      `/usuarios/${id}`,
      cuerpo,
      { headers }
    );
  }
}
