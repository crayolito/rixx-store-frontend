/** Item de recarga/transacción de billetera (login o listado). */
export interface RecargaItem {
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

/** Respuesta de listado de recargas (ej. dentro de login). */
export interface RespuestaRecargas {
  datos: RecargaItem[];
  total: number;
  pagina?: number;
  totalPaginas?: number;
}
