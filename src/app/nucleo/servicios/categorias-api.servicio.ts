import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import type {
  CategoriaApi,
  RespuestaCategoria,
  RespuestaCategorias,
  RespuestaEliminarCategoria,
} from '../../compartido/modelos/categoria.modelo';
import { HttpBaseServicio } from './http-base.servicio';
import { Sesion } from './sesion';

@Injectable({ providedIn: 'root' })
export class CategoriasApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  /** Lista todas las categorías (público, sin token) */
  obtenerTodas(): Observable<CategoriaApi[]> {
    return this.httpBase
      .obtener<RespuestaCategorias>('/categorias')
      .pipe(map((r) => (r?.exito && Array.isArray(r.datos) ? r.datos : [])));
  }

  /** Crea una categoría. Body: { nombre: string, handle?: string, generaCodigo?: boolean } */
  crear(cuerpo: { nombre: string; handle?: string; generaCodigo?: boolean }): Observable<RespuestaCategoria> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase.enviarPost<RespuestaCategoria>('/categorias', cuerpo, { headers });
  }

  /** Actualiza una categoría por id. Body: { nombre?: string, generaCodigo?: boolean } */
  actualizar(id: number, cuerpo: { nombre?: string; generaCodigo?: boolean }): Observable<RespuestaCategoria> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase.actualizarPut<RespuestaCategoria>(`/categorias/${id}`, cuerpo, {
      headers,
    });
  }

  /** Elimina una categoría por id */
  eliminar(id: number): Observable<RespuestaEliminarCategoria> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase.eliminar<RespuestaEliminarCategoria>(`/categorias/${id}`, { headers });
  }
}
