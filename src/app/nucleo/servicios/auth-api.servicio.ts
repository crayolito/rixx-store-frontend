import { HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, map, Observable, of, switchMap } from "rxjs";
import type { PedidoApi } from "../../compartido/modelos/pedido.modelo";
import type { RespuestaRecargas } from "../../compartido/modelos/recarga.modelo";
import { HttpBaseServicio } from "./http-base.servicio";
import type { UsuarioSesion } from "./sesion";
import { Sesion } from "./sesion";

export interface RolConPermisos {
  id_rol: number;
  nombre: string;
  permisos: string[];
}

export interface UsuarioApiItem {
  id: number;
  rol: string;
  nombre: string;
  email: string;
  foto: string | null;
  telefono: string | null;
  saldo: number;
  estado: string;
  nacionalidad: string | null;
  socialLogin: boolean;
  ultimoAcceso?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface RespuestaListarUsuarios {
  exito: boolean;
  datos: UsuarioApiItem[] | { datos: UsuarioApiItem[]; total?: number };
  total?: number;
  pagina?: number;
  totalPaginas?: number;
}

/** Respuesta de login: Admin sin saldo/pedidos/recargas; Cliente/Revendedor con saldo, pedidos y recargas. */
export interface RespuestaLogin {
  exito: boolean;
  datos: {
    token: string;
    id: number;
    nombre: string;
    email: string;
    foto?: string;
    idRol?: number;
    id_rol?: number;
    rol?: string;
    social_login?: boolean;
    socialLogin?: boolean;
    telefono?: string;
    nacionalidad?: string;
    tieneContrasena?: boolean;
    saldo?: number;
    pedidos?: { datos: PedidoApi[]; total: number };
    recargas?: RespuestaRecargas;
  };
}

interface RespuestaCrearUsuario {
  exito: boolean;
  datos?: { id: number; nombre: string; email: string;[k: string]: unknown };
}

function extraerIdRolDelToken(token: string): number | undefined {
  try {
    const payload = token.split('.')[1];
    if (!payload) return undefined;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(json) as { idRol?: number; id_rol?: number };
    return decoded.idRol ?? decoded.id_rol;
  } catch {
    return undefined;
  }
}

const PERMISOS_MINIMOS_CLIENTE = ['ver_perfil', 'ver_checkout', 'ver_billetera'];

function permisosPorRolAdmin(rolNombre: string): string[] {
  const nombre = (rolNombre ?? '').toLowerCase();
  if (nombre.includes('admin') || nombre === 'administrador') {
    return ['acceder_admin', 'ver_perfil', 'ver_checkout', 'ver_billetera', 'gestionar_usuarios', 'gestionar_productos'];
  }
  return [...PERMISOS_MINIMOS_CLIENTE];
}

/** Asegura que un cliente siempre tenga al menos permisos de perfil, checkout y billetera. */
function asegurarPermisosCliente(permisos: string[], rolNombre: string): string[] {
  const nombre = (rolNombre ?? '').toLowerCase();
  if (nombre.includes('admin') || nombre === 'administrador') return permisos;
  const unicos = new Set(permisos);
  PERMISOS_MINIMOS_CLIENTE.forEach((p) => unicos.add(p));
  return Array.from(unicos);
}

function mapearDatosLoginASesion(datos: RespuestaLogin['datos'], permisos: string[] = [], rolNombre: string = 'Cliente'): UsuarioSesion {
  const idRol = datos.idRol ?? datos.id_rol;
  const socialLogin = datos.social_login || datos.socialLogin || false;

  return {
    id: datos.id,
    nombre: datos.nombre,
    email: datos.email,
    fotoPerfil: datos.foto,
    rol: datos.rol ?? rolNombre,
    idRol,
    permisos,
    token: datos.token,
    socialLogin,
    telefono: datos.telefono,
    nacionalidad: datos.nacionalidad,
    ...(datos.saldo != null && { saldo: datos.saldo }),
    ...(datos.tieneContrasena != null && { tieneContrasena: datos.tieneContrasena }),
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
      switchMap((respuesta) => {
        if (!respuesta?.exito || !respuesta.datos) return of(respuesta);
        const datos = respuesta.datos;
        const idRol = datos.idRol ?? datos.id_rol ?? (datos.token ? extraerIdRolDelToken(datos.token) : undefined);
        const rolDelBackend = datos.rol ?? 'Cliente';
        this.sesion.guardarSesion(mapearDatosLoginASesion(datos, [], rolDelBackend));
        return this.listarRolesConPermisos().pipe(
          map((rolesResp) => {
            if (rolesResp?.exito && rolesResp.datos) {
              const miRol = rolesResp.datos.find((r) => r.id_rol === idRol)
                ?? rolesResp.datos.find((r) => r.nombre.toLowerCase() === rolDelBackend.toLowerCase())
                ?? rolesResp.datos.find((r) => rolDelBackend.toLowerCase().includes(r.nombre.toLowerCase()));
              const permisosBackend = miRol?.permisos ?? permisosPorRolAdmin(rolDelBackend);
              const permisos = asegurarPermisosCliente(Array.isArray(permisosBackend) ? permisosBackend : [], rolDelBackend);
              const rolNombre = miRol?.nombre ?? rolDelBackend;
              this.sesion.guardarSesion(mapearDatosLoginASesion(datos, permisos, rolNombre));
            } else {
              this.sesion.guardarSesion(mapearDatosLoginASesion(datos, permisosPorRolAdmin(rolDelBackend), rolDelBackend));
            }
            return respuesta;
          }),
          catchError(() => {
            this.sesion.guardarSesion(mapearDatosLoginASesion(datos, permisosPorRolAdmin(rolDelBackend), rolDelBackend));
            return of(respuesta);
          })
        );
      })
    );
  }

  registrar(datos: {
    nombre: string;
    email: string;
    contrasena?: string;
    social_login?: boolean;
    telefono?: string | null;
    nacionalidad?: string | null;
    foto?: string;
  }): Observable<RespuestaCrearUsuario> {
    const cuerpo: Record<string, unknown> = {
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      social_login: datos.social_login ?? false,
      ...(datos.contrasena != null && datos.contrasena !== '' && { contrasena: datos.contrasena }),
      ...(datos.telefono != null && datos.telefono !== '' && { telefono: datos.telefono }),
      ...(datos.nacionalidad != null && datos.nacionalidad !== '' && { nacionalidad: datos.nacionalidad }),
      ...(datos.foto && { foto: datos.foto }),
    };
    return this.httpBase.enviarPost<RespuestaCrearUsuario>('/auth/register', cuerpo);
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

  cambiarContrasena(
    id: number,
    contrasenaActual: string,
    nuevaContrasena: string
  ): Observable<{ exito: boolean; mensaje?: string }>{
    const token = this.sesion.obtenerToken();
    const headers = token
    ? new HttpHeaders({ Authorization: `Bearer ${token}` })
    : undefined;
    return this.httpBase.actualizarPut<{ exito: boolean; mensaje?: string }>(
      `/usuarios/${id}/contrasena`,
      {
        contrasenaActual,
        contrasenaNueva: nuevaContrasena
      },
      { headers }
    );
  }

  listarRoles(): Observable<{ exito: boolean; datos: RolConPermisos[] }> {
    return this.listarRolesConPermisos();
  }

  listarRolesConPermisos(): Observable<{ exito: boolean; datos: RolConPermisos[] }> {
    const token = this.sesion.obtenerToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    return this.httpBase.obtenerConOpciones<{ exito: boolean; datos: RolConPermisos[] }>(
      '/roles',
      { headers }
    );
  }

  listarUsuarios(pagina: number, limite: number): Observable<RespuestaListarUsuarios> {
    const token = this.sesion.obtenerToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    const params = `?pagina=${pagina}&limite=${limite}`;
    return this.httpBase.obtenerConOpciones<RespuestaListarUsuarios>(`/usuarios${params}`, { headers });
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
      idRol?: number;
      estado?: string;
    }
  ): Observable<{ exito: boolean; datos?: unknown }> {
    const token = this.sesion.obtenerToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    const cuerpo: Record<string, unknown> = {};
    if (datos['nombre'] !== undefined) cuerpo['nombre'] = datos['nombre'];
    if (datos['email'] !== undefined) cuerpo['email'] = datos['email'];
    if (datos['foto'] !== undefined) cuerpo['foto'] = datos['foto'];
    if (datos['telefono'] !== undefined) cuerpo['telefono'] = datos['telefono'];
    if (datos['nacionalidad'] !== undefined) cuerpo['nacionalidad'] = datos['nacionalidad'];
    if (datos['idRol'] !== undefined) cuerpo['idRol'] = datos['idRol'];
    if (datos['estado'] !== undefined) cuerpo['estado'] = datos['estado'];
    return this.httpBase.actualizarPut<{ exito: boolean; datos?: unknown }>(
      `/usuarios/${id}`,
      cuerpo,
      { headers }
    );
  }

  eliminarUsuario(id: number): Observable<{ exito: boolean; mensaje?: string }> {
    const token = this.sesion.obtenerToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    return this.httpBase.eliminar<{ exito: boolean; mensaje?: string }>(
      `/usuarios/${id}`,
      { headers }
    );
  }
}
