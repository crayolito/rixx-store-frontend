/** Código tal como viene del API GET /codigos */
export interface CodigoApi {
  id_codigo: number;
  id_precio: number;
  codigo: string;
  estado: 'disponible' | 'vendido' | 'expirado';
  fechaExpiracion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
  nombreProducto: string;
  nombrePrecio: string;
  correoCliente: string | null;
}

export interface RespuestaCodigos {
  exito: boolean;
  datos: CodigoApi[];
}

/** Respuesta de crear o actualizar un código */
export interface RespuestaCodigo {
  exito: boolean;
  datos?: CodigoApi;
  mensaje?: string;
}

/** Respuesta de eliminar código */
export interface RespuestaEliminarCodigo {
  exito: boolean;
  mensaje?: string;
}

/** Cuerpo para crear código POST /codigos */
export interface CrearCodigoCuerpo {
  id_precio: number;
  codigo: string;
  fecha_expiracion?: string;
}

/** Cuerpo para actualizar código PUT /codigos/:id */
export interface ActualizarCodigoCuerpo {
  estado: 'disponible' | 'vendido' | 'expirado';
}

/** Cuerpo para crear códigos en lote POST /codigos/lote */
export interface CrearCodigosLoteCuerpo {
  id_precio: number;
  codigos: string[];
  fecha_expiracion?: string;
}

/** Respuesta de crear códigos en lote */
export interface RespuestaCodigosLote {
  exito: boolean;
  datos?: CodigoApi[];
  mensaje?: string;
}
