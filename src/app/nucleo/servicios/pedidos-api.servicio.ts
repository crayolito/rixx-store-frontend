import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import type {
  ActualizarDetalleCuerpo,
  ActualizarEstadoCuerpo,
  CrearPedidoCuerpo,
  PedidoApi,
  RespuestaActualizarEstado,
  RespuestaCrearPedido,
  RespuestaListarPedidos,
  RespuestaReembolsarDetalle,
} from '../../compartido/modelos/pedido.modelo';
import { HttpBaseServicio } from './http-base.servicio';
import { Sesion } from './sesion';

@Injectable({ providedIn: 'root' })
export class PedidosApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  /** Obtiene headers con Bearer token */
  private headersConAuth(): { headers: HttpHeaders } | undefined {
    const token = this.sesion.obtenerToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : undefined;
  }

  /** Lista pedidos con filtros opcionales */
  listarPedidos(
    filtros: {
      idUsuario?: number;
      estado?: string;
      soloActivos?: boolean;
    } = {},
  ): Observable<PedidoApi[]> {
    const params: string[] = [];
    if (filtros.idUsuario != null) params.push(`idUsuario=${filtros.idUsuario}`);
    if (filtros.estado) params.push(`estado=${filtros.estado}`);
    if (filtros.soloActivos !== undefined) params.push(`soloActivos=${filtros.soloActivos}`);
    const query = params.length ? '?' + params.join('&') : '';
    return this.httpBase
      .obtenerConOpciones<RespuestaListarPedidos>(`/pedidos${query}`, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) throw new Error(r?.mensaje || 'Error al cargar pedidos');
          return r.datos;
        }),
      );
  }

  /** Crea un pedido */
  crearPedido(cuerpo: CrearPedidoCuerpo): Observable<PedidoApi> {
    return this.httpBase
      .enviarPost<RespuestaCrearPedido>('/pedidos', cuerpo, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) throw new Error(r?.mensaje || 'Error al crear pedido');
          return r.datos;
        }),
      );
  }

  /** Actualiza el estado de un pedido */
  actualizarEstado(
    idPedido: number,
    estado: ActualizarEstadoCuerpo['estado'],
  ): Observable<PedidoApi> {
    return this.httpBase
      .actualizarPut<RespuestaActualizarEstado>(
        `/pedidos/${idPedido}/estado`,
        { estado },
        this.headersConAuth(),
      )
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) throw new Error(r?.mensaje || 'Error al actualizar estado');
          return r.datos;
        }),
      );
  }

  /** Obtiene un pedido por ID */
  obtenerPedidoPorId(idPedido: number): Observable<PedidoApi> {
    return this.httpBase
      .obtenerConOpciones<{ exito: boolean; datos: PedidoApi; mensaje?: string }>(
        `/pedidos/${idPedido}`,
        this.headersConAuth(),
      )
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) throw new Error(r?.mensaje || 'Error al cargar pedido');
          return r.datos;
        }),
      );
  }

  /** Reembolsa un detalle del pedido - POST /pedidos/detalle/:idDetalle/reembolsar */
  reembolsarDetalle(idDetalle: number): Observable<RespuestaReembolsarDetalle['datos']> {
    return this.httpBase
      .enviarPost<RespuestaReembolsarDetalle>(
        `/pedidos/detalle/${idDetalle}/reembolsar`,
        {},
        this.headersConAuth(),
      )
      .pipe(
        map((r) => {
          if (!r?.exito) throw new Error(r?.mensaje || 'Error al reembolsar detalle');
          return r.datos;
        }),
      );
  }

  /** Completa un detalle - PATCH /pedidos/detalle/:idDetalle/estado-entrega (devuelve exito: true) */
  completarDetalle(idDetalle: number, cuerpo: ActualizarDetalleCuerpo): Observable<void> {
    const cuerpoHttp: Record<string, unknown> = {
      estadoEntrega: cuerpo.estadoEntrega,
      ...(cuerpo.valoresCampos && { valoresCampos: cuerpo.valoresCampos }),
    };
    return this.httpBase
      .actualizarParcialConOpciones<{ exito: boolean; mensaje?: string }>(
        `/pedidos/detalle/${idDetalle}/estado-entrega`,
        cuerpoHttp,
        this.headersConAuth(),
      )
      .pipe(
        map((r) => {
          if (!r?.exito) throw new Error(r?.mensaje || 'Error al completar detalle');
          return undefined;
        }),
      );
  }
}
