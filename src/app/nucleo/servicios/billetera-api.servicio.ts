import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpBaseServicio } from './http-base.servicio';
import { Sesion } from './sesion';

export interface TransaccionBilleteraApi {
  id_transaccion: number;
  id_usuario: number;
  tipo: string;
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  descripcion: string | null;
  id_pedido: number | null;
  fecha_creacion: string;
  nombreUsuario?: string;
  emailUsuario?: string;
}

export interface RespuestaListarTransacciones {
  exito: boolean;
  datos?: {
    datos: TransaccionBilleteraApi[];
    total: number;
    pagina: number;
    totalPaginas: number;
  };
  mensaje?: string;
}

export interface CuerpoCrearTransaccion {
  idUsuario: number;
  tipo: string;
  monto: number;
  descripcion?: string;
  idPedido?: number | null;
}

export interface RespuestaCrearTransaccion {
  exito: boolean;
  datos?: TransaccionBilleteraApi;
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class BilleteraApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  /** Obtiene headers con Bearer token */
  private headersConAuth(): { headers: HttpHeaders } | undefined {
    const token = this.sesion.obtenerToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : undefined;
  }

  /** Lista transacciones de billetera con filtros opcionales */
  listarTransacciones(filtros: {
    idUsuario?: number;
    tipo?: string;
    soloActivos?: string;
    pagina?: number;
    limite?: number;
  } = {}): Observable<RespuestaListarTransacciones['datos']> {
    const params: string[] = [];
    if (filtros.idUsuario != null) params.push(`idUsuario=${filtros.idUsuario}`);
    if (filtros.tipo) params.push(`tipo=${filtros.tipo}`);
    if (filtros.soloActivos) params.push(`soloActivos=${filtros.soloActivos}`);
    if (filtros.pagina != null) params.push(`pagina=${filtros.pagina}`);
    if (filtros.limite != null) params.push(`limite=${filtros.limite}`);
    const query = params.length ? '?' + params.join('&') : '';
    return this.httpBase
      .obtenerConOpciones<RespuestaListarTransacciones>(`/billetera/transacciones${query}`, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) throw new Error(r?.mensaje || 'Error al cargar');
          return r.datos;
        })
      );
  }

  /** Crea una transacción (recarga, reembolso o compra) */
  crearTransaccion(cuerpo: CuerpoCrearTransaccion): Observable<RespuestaCrearTransaccion> {
    return this.httpBase.enviarPost<RespuestaCrearTransaccion>(
      '/billetera/transacciones',
      cuerpo,
      this.headersConAuth()
    );
  }
}
