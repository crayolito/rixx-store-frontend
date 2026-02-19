import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpBaseServicio } from './http-base.servicio';

export interface RespuestaServidoresVemper {
  success: boolean;
  product_id: string;
  servers: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class VemperApiServicio {
  private httpBase = inject(HttpBaseServicio);

  /** Obtiene los servidores disponibles para un producto con idVemper (servidorDinamico = true). */
  obtenerServidores(idVemper: string): Observable<Record<string, string>> {
    return this.httpBase
      .obtener<RespuestaServidoresVemper>(`/productos/veemper/${encodeURIComponent(idVemper)}/servidores`)
      .pipe(map((r) => (r?.success && r.servers ? r.servers : {})));
  }
}