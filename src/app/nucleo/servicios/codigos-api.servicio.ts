import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  ActualizarCodigoCuerpo,
  CodigoApi,
  CrearCodigoCuerpo,
  CrearCodigosLoteCuerpo,
  RespuestaCodigo,
  RespuestaCodigos,
  RespuestaCodigosLote,
  RespuestaEliminarCodigo,
} from '../../compartido/modelos/codigo.modelo';
import { HttpBaseServicio } from './http-base.servicio';
import { Sesion } from './sesion';

@Injectable({ providedIn: 'root' })
export class CodigosApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  /** Obtiene headers con Bearer token */
  private headersConAuth(): { headers: HttpHeaders } | undefined {
    const token = this.sesion.obtenerToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : undefined;
  }

  /** Lista todos los códigos */
  obtenerTodos(): Observable<CodigoApi[]> {
    return this.httpBase
      .obtenerConOpciones<RespuestaCodigos>('/codigos', this.headersConAuth())
      .pipe(map((r) => (r?.exito && Array.isArray(r.datos) ? r.datos : [])));
  }

  /** Crea un código */
  crear(cuerpo: CrearCodigoCuerpo): Observable<RespuestaCodigo> {
    return this.httpBase.enviarPost<RespuestaCodigo>('/codigos', cuerpo, this.headersConAuth());
  }

  /** Actualiza el estado de un código */
  actualizarEstado(id: number, cuerpo: ActualizarCodigoCuerpo): Observable<RespuestaCodigo> {
    return this.httpBase.actualizarPut<RespuestaCodigo>(
      `/codigos/${id}`,
      cuerpo,
      this.headersConAuth(),
    );
  }

  /** Elimina un código (soft delete) */
  eliminar(id: number): Observable<RespuestaEliminarCodigo> {
    return this.httpBase.eliminar<RespuestaEliminarCodigo>(`/codigos/${id}`, this.headersConAuth());
  }

  /** Crea códigos en lote */
  crearEnLote(cuerpo: CrearCodigosLoteCuerpo): Observable<RespuestaCodigosLote> {
    return this.httpBase.enviarPost<RespuestaCodigosLote>(
      '/codigos/lote',
      cuerpo,
      this.headersConAuth(),
    );
  }
}
