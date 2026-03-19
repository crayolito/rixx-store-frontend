import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpBaseServicio } from './http-base.servicio';
import { Sesion } from './sesion';

/** Método de pago tal como lo devuelve el backend (admin: más campos; cliente: id, nombre, descripcion, logo). */
export interface MetodoPagoApi {
  id_metodo_pago: number;
  nombre: string;
  tipo?: string;
  descripcion?: string | null;
  logo?: string | null;
  configuracion?: {
    descripcion?: string;
    logo?: string;
    apiKey?: string;
    secretKey?: string;
    qrTipo?: string;
    qrImagen?: string;
    [k: string]: unknown;
  };
  comision_porcentaje?: number;
  tipo_cambio?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  activo?: boolean;
}

/** Forma normalizada para la UI (logo desde configuracion si viene anidado). */
export interface MetodoPagoUINormalizado {
  id_metodo_pago: number;
  nombre: string;
  descripcion: string;
  logo: string;
  activo?: boolean;
  tipo?: string;
  tipo_cambio?: number;
  // Solo admin: campos desde `configuracion` (si viene en el backend).
  apiKey?: string;
  secretKey?: string;
  qrTipo?: '' | 'estatico' | 'dinamico';
  qrImagen?: string;
}

export interface RespuestaListarMetodosPago {
  exito: boolean;
  datos: MetodoPagoApi[];
  mensaje?: string;
}

export interface RespuestaCrearMetodoPago {
  exito: boolean;
  datos?: MetodoPagoApi;
  mensaje?: string;
}

export interface RespuestaPrepararBinance {
  exito: boolean;
  datos?: {
    metodo: 'binance';
    id_metodo_pago: number;
    nombreMetodo: string;
    descripcion?: string;
    codigo: string;
    monto: number;
    moneda: string;
    qrImagen: string;
    tipo_cambio?: number;
    monto_convertido?: number;
  };
  mensaje?: string;
}

export interface RespuestaVerificarBinance {
  exito: boolean;
  pagado: boolean;
  datos?: {
    transactionId: string;
    orderId: string;
    amount: number;
    currency: string;
    transactionTime: number;
    payerName: string;
  } | null;
  mensaje?: string;
}

/** Respuesta al preparar una recarga de billetera con Binance Pay. */
export interface RespuestaPrepararRecargaBinance {
  exito: boolean;
  datos?: {
    metodo: 'binance';
    id_metodo_pago: number;
    nombreMetodo: string;
    descripcion: string;
    codigo: string;
    monto: number;
    moneda: string;
    tipo_cambio: number | null;
    monto_convertido: number | null;
    qrImagen: string;
  } | null;
  mensaje?: string;
}

/** Respuesta al verificar una recarga de billetera con Binance Pay. */
export interface RespuestaVerificarRecargaBinance {
  exito: boolean;
  pagado: boolean;
  datos?: {
    transactionId: string;
    orderId: string;
    amount: number;
    currency: string;
    transactionTime: number;
    payerName: string;
    billetera: {
      id_transaccion: number;
      id_usuario: number;
      tipo: string;
      monto: number;
      saldo_anterior: number;
      saldo_nuevo: number;
      descripcion: string;
      id_pedido: number | null;
      fecha_creacion: string;
    };
  } | null;
  mensaje?: string;
}

export interface RespuestaGenerarQrVeripagos {
  exito: boolean;
  datos?: {
    movimiento_id: number | string;
    qr: string;
    monto?: number;
    monto_convertido?: number;
    tipo_cambio?: number;
    detalle?: string;
    estado?: string;
    pagado?: boolean;
    remitente?: {
      nombre: string;
      banco: string;
      documento: string;
      cuenta: string;
    } | null;
  } | null;
  mensaje?: string;
}

export interface RespuestaVerificarQrVeripagos {
  exito: boolean;
  pagado: boolean;
  datos?: {
    movimiento_id: number;
    monto: number;
    monto_convertido?: number;
    tipo_cambio?: number;
    detalle: string;
    estado: string;
    remitente: {
      nombre: string;
      banco: string;
      documento: string;
      cuenta: string;
    } | null;
  } | null;
  mensaje?: string;
}

/** Respuesta al preparar una recarga de billetera con Veripagos. */
export interface RespuestaPrepararRecargaVeripagos {
  exito: boolean;
  datos?: {
    movimiento_id: string;
    qr: string;
    monto: number;
    monto_enviado: number;
    tipo_cambio: number;
    monto_convertido: number;
  } | null;
  mensaje?: string;
}

/** Respuesta al verificar una recarga de billetera con Veripagos. */
export interface RespuestaVerificarRecargaVeripagos {
  exito: boolean;
  pagado: boolean;
  datos?: {
    movimiento_id: string;
    monto: number;
    detalle: string;
    estado: string;
    remitente: {
      nombre: string;
      banco: string;
      documento: string;
      cuenta: string;
    } | null;
    billetera: {
      id_transaccion: number;
      id_usuario: number;
      tipo: string;
      monto: number;
      saldo_anterior: number;
      saldo_nuevo: number;
      descripcion: string;
      id_pedido: number | null;
      fecha_creacion: string;
    };
  } | null;
  mensaje?: string;
}

/** qrTipo solo "estatico" | "dinamico". Si "estatico", qrImagen es obligatorio. */
export interface CuerpoCrearMetodoPago {
  nombre: string;
  descripcion?: string | null;
  logo?: string;
  apiKey?: string;
  secretKey?: string;
  qrTipo?: 'estatico' | 'dinamico';
  qrImagen?: string;
  tipoCambio?: number | null;
}

export interface CuerpoActualizarMetodoPago {
  descripcion?: string | null;
  logo?: string | null;
  apiKey?: string;
  secretKey?: string;
  qrTipo?: '' | 'estatico' | 'dinamico';
  qrImagen?: string;
  tipoCambio?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MetodosPagoApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  private headersConAuth(): { headers: HttpHeaders } | undefined {
    const token = this.sesion.obtenerToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : undefined;
  }

  /**
   * Lista métodos de pago. Cliente recibe forma reducida (id, nombre, descripcion, logo);
   * Admin recibe forma completa con configuracion, tipo_cambio, activo.
   */
  listar(soloActivos = true): Observable<MetodoPagoUINormalizado[]> {
    // Mantiene compatibilidad: `listar` se usa desde checkout (cliente/revendedor),
    // por lo tanto usa el endpoint público.
    return this.listarClienteRevendedor(soloActivos);
  }

  /** Lista métodos para Cliente / Revendedor (endpoint público). */
  listarClienteRevendedor(soloActivos = true): Observable<MetodoPagoUINormalizado[]> {
    const params = `?soloActivos=${soloActivos}`;
    return this.httpBase
      .obtenerConOpciones<RespuestaListarMetodosPago>(`/metodos-pago${params}`, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !Array.isArray(r.datos)) return [];
          return r.datos.map((item) => this.normalizarParaUI(item));
        }),
      );
  }

  /** Lista métodos para Admin (endpoint con configuración completa). */
  listarAdmin(soloActivos = true): Observable<MetodoPagoUINormalizado[]> {
    const params = `?soloActivos=${soloActivos}`;
    return this.httpBase
      .obtenerConOpciones<RespuestaListarMetodosPago>(`/metodos-pago/admin${params}`, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !Array.isArray(r.datos)) return [];
          return r.datos.map((item) => this.normalizarParaUI(item));
        }),
      );
  }

  /** Normaliza un ítem del backend a la forma usada en la UI (logo desde configuracion si aplica). */
  normalizarParaUI(item: MetodoPagoApi): MetodoPagoUINormalizado {
    const logo = item.logo ?? item.configuracion?.logo ?? '';
    const descripcion = item.descripcion ?? item.configuracion?.descripcion ?? '';
    return {
      id_metodo_pago: item.id_metodo_pago,
      nombre: item.nombre,
      descripcion: typeof descripcion === 'string' ? descripcion : '',
      logo: typeof logo === 'string' ? logo : '',
      activo: item.activo,
      tipo: item.tipo,
      tipo_cambio: item.tipo_cambio,
      apiKey: item.configuracion?.apiKey,
      secretKey: item.configuracion?.secretKey,
      qrTipo: (item.configuracion?.qrTipo as MetodoPagoUINormalizado['qrTipo']) ?? '',
      qrImagen: item.configuracion?.qrImagen,
    };
  }

  /** Crea un método de pago (solo Administrador). Regla: si qrTipo es estatico, enviar qrImagen; si dinamico, no enviar qrImagen. */
  crear(cuerpo: CuerpoCrearMetodoPago): Observable<MetodoPagoApi> {
    const body: Record<string, unknown> = {
      nombre: cuerpo.nombre.trim(),
      ...(cuerpo.descripcion != null && cuerpo.descripcion !== '' && { descripcion: cuerpo.descripcion }),
      ...(cuerpo.logo != null && cuerpo.logo !== '' && { logo: cuerpo.logo }),
      ...(cuerpo.apiKey != null && cuerpo.apiKey !== '' && { apiKey: cuerpo.apiKey }),
      ...(cuerpo.secretKey != null && cuerpo.secretKey !== '' && { secretKey: cuerpo.secretKey }),
      ...(cuerpo.qrTipo === 'estatico' || cuerpo.qrTipo === 'dinamico' ? { qrTipo: cuerpo.qrTipo } : {}),
      ...(cuerpo.qrTipo === 'estatico' && cuerpo.qrImagen?.trim() && { qrImagen: cuerpo.qrImagen.trim() }),
      ...(cuerpo.tipoCambio != null && { tipoCambio: cuerpo.tipoCambio }),
    };
    return this.httpBase.enviarPost<RespuestaCrearMetodoPago>('/metodos-pago', body, this.headersConAuth()).pipe(
      map((r) => {
        if (!r?.exito || !r.datos) throw new Error(r?.mensaje ?? 'Error al crear método de pago');
        return r.datos;
      }),
    );
  }

  /** Actualiza info de un método de pago (solo Administrador). */
  actualizar(idMetodoPago: number, cuerpo: CuerpoActualizarMetodoPago): Observable<MetodoPagoApi> {
    const body: Record<string, unknown> = {
      ...(cuerpo.descripcion != null && cuerpo.descripcion !== '' && { descripcion: cuerpo.descripcion }),
      ...(cuerpo.logo != null && cuerpo.logo !== '' && { logo: cuerpo.logo }),
      ...(cuerpo.apiKey != null && cuerpo.apiKey.trim() !== '' && { apiKey: cuerpo.apiKey.trim() }),
      ...(cuerpo.secretKey != null && cuerpo.secretKey.trim() !== '' && { secretKey: cuerpo.secretKey.trim() }),
      ...(cuerpo.qrTipo === 'estatico' || cuerpo.qrTipo === 'dinamico' ? { qrTipo: cuerpo.qrTipo } : {}),
      ...(cuerpo.qrTipo === 'estatico' && cuerpo.qrImagen?.trim() ? { qrImagen: cuerpo.qrImagen.trim() } : {}),
      ...(cuerpo.tipoCambio != null ? { tipoCambio: cuerpo.tipoCambio } : {}),
    };

    return this.httpBase
      .actualizarPut<RespuestaCrearMetodoPago>(`/metodos-pago/${idMetodoPago}`, body, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) throw new Error(r?.mensaje ?? 'Error al actualizar método de pago');
          return r.datos;
        }),
      );
  }

  /** Prepara una recarga de billetera con Binance Pay para un monto dado. */
  prepararRecargaBinance(cuerpo: {
    idMetodoPago: number;
    monto: number;
    moneda?: string;
    nota?: string;
  }): Observable<RespuestaPrepararRecargaBinance['datos']> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      monto: cuerpo.monto,
      ...(cuerpo.moneda && { moneda: cuerpo.moneda }),
      ...(cuerpo.nota && { nota: cuerpo.nota }),
    };
    return this.httpBase
      .enviarPost<RespuestaPrepararRecargaBinance>(
        '/metodos-pago/binance/preparar-recarga',
        body,
        this.headersConAuth(),
      )
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) {
            throw new Error(r?.mensaje ?? 'Error al preparar recarga con Binance');
          }
          return r.datos;
        }),
      );
  }

  /** Verifica el estado de una recarga Binance Pay para una nota y monto dados. */
  verificarRecargaBinance(cuerpo: {
    idMetodoPago: number;
    nota: string;
    montoRecarga: number;
    moneda?: string;
  }): Observable<RespuestaVerificarRecargaBinance> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      nota: cuerpo.nota,
      montoRecarga: cuerpo.montoRecarga,
      ...(cuerpo.moneda && { moneda: cuerpo.moneda }),
    };
    return this.httpBase.enviarPost<RespuestaVerificarRecargaBinance>(
      '/metodos-pago/binance/verificar-recarga',
      body,
      this.headersConAuth(),
    );
  }

  /** Prepara un pago con Binance Pay para un monto y nota dados. */
  prepararPagoBinance(cuerpo: {
    idMetodoPago: number;
    idPrecio: number;
    cantidad: number;
    moneda?: string;
  }): Observable<RespuestaPrepararBinance['datos']> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      idPrecio: cuerpo.idPrecio,
      cantidad: cuerpo.cantidad,
      ...(cuerpo.moneda && { moneda: cuerpo.moneda }),
    };
    return this.httpBase
      .enviarPost<RespuestaPrepararBinance>('/metodos-pago/binance/preparar', body, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) {
            throw new Error(r?.mensaje ?? 'Error al preparar pago con Binance');
          }
          return r.datos;
        }),
      );
  }

  /** Verifica el estado de un pago Binance Pay para una nota dada. */
  verificarPagoBinance(cuerpo: {
    idMetodoPago: number;
    nota: string;
    montoEsperado?: number;
    moneda?: string;
  }): Observable<RespuestaVerificarBinance> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      nota: cuerpo.nota,
    };
    return this.httpBase.enviarPost<RespuestaVerificarBinance>(
      '/metodos-pago/binance/verificar',
      body,
      this.headersConAuth(),
    );
  }

  /** Genera un QR de pago VeriPagos para un monto y detalle dados. */
  generarQrVeripagos(cuerpo: {
    idMetodoPago: number;
    idPrecio: number;
    cantidad: number;
    data?: Record<string, unknown>;
    vigencia?: string;
    usoUnico?: boolean;
  }): Observable<RespuestaGenerarQrVeripagos['datos']> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      idPrecio: cuerpo.idPrecio,
      cantidad: cuerpo.cantidad,
      ...(cuerpo.data && { data: cuerpo.data }),
      ...(cuerpo.vigencia && { vigencia: cuerpo.vigencia }),
      ...(cuerpo.usoUnico !== undefined && { usoUnico: cuerpo.usoUnico }),
    };
    return this.httpBase
      .enviarPost<RespuestaGenerarQrVeripagos>('/metodos-pago/veripagos/generar-qr', body, this.headersConAuth())
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) {
            throw new Error(r?.mensaje ?? 'Error al generar QR VeriPagos');
          }
          return r.datos;
        }),
      );
  }

  /** Verifica el estado de un QR VeriPagos para un movimiento dado. */
  verificarQrVeripagos(cuerpo: {
    idMetodoPago: number;
    movimientoId: number | string;
  }): Observable<RespuestaVerificarQrVeripagos> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      movimientoId: cuerpo.movimientoId,
    };
    return this.httpBase.enviarPost<RespuestaVerificarQrVeripagos>(
      '/metodos-pago/veripagos/verificar-qr',
      body,
      this.headersConAuth(),
    );
  }

  /** Prepara una recarga de billetera con Veripagos. */
  prepararRecargaVeripagos(cuerpo: {
    idMetodoPago: number;
    monto: number;
    vigencia?: string;
    usoUnico?: boolean;
  }): Observable<RespuestaPrepararRecargaVeripagos['datos']> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      monto: cuerpo.monto,
      ...(cuerpo.vigencia && { vigencia: cuerpo.vigencia }),
      ...(cuerpo.usoUnico !== undefined && { usoUnico: cuerpo.usoUnico }),
    };
    return this.httpBase
      .enviarPost<RespuestaPrepararRecargaVeripagos>(
        '/metodos-pago/veripagos/preparar-recarga',
        body,
        this.headersConAuth(),
      )
      .pipe(
        map((r) => {
          if (!r?.exito || !r.datos) {
            throw new Error(r?.mensaje ?? 'Error al preparar recarga con Veripagos');
          }
          return r.datos;
        }),
      );
  }

  /** Verifica el estado de una recarga con Veripagos. */
  verificarRecargaVeripagos(cuerpo: {
    idMetodoPago: number;
    movimientoId: string;
    montoRecarga: number;
  }): Observable<RespuestaVerificarRecargaVeripagos> {
    const body: Record<string, unknown> = {
      idMetodoPago: cuerpo.idMetodoPago,
      movimientoId: cuerpo.movimientoId,
      montoRecarga: cuerpo.montoRecarga,
    };
    return this.httpBase.enviarPost<RespuestaVerificarRecargaVeripagos>(
      '/metodos-pago/veripagos/verificar-recarga',
      body,
      this.headersConAuth(),
    );
  }
}
