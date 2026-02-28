// Detalle de un pedido
export interface DetallePedidoApi {
  id_detalle: number;
  id_pedido?: number;
  id_precio: number;
  id_codigo: number | null;
  nombreProducto?: string;
  nombrePrecio?: string;
  cantidad: number;
  precio_unitario?: number;
  subtotal: number;
  estado_entrega?: string;
  valores_campos?: Record<string, unknown>;
  /** Etiquetas legibles de campos dinámicos (ej: "ID del jugador") */
  valores_campos_legibles?: { etiqueta: string; valor: string | number }[];
  puede_actualizar?: boolean;
  puede_reembolsar?: boolean;
  fecha_entregado?: string | null;
  /** URL de imagen del producto/precio cuando el backend la envía */
  imagenUrl?: string | null;
  /** Imágenes por formato (usar square para listado) */
  imagenes?: { square?: string; rectangular?: string; smallSquare?: string };
  /** Código entregado cuando el backend lo incluye */
  codigo?: { id_codigo: number; codigo: string; estado: string; fecha_expiracion: string | null };
}

// Pedido completo desde el backend
export interface PedidoApi {
  id_pedido: number;
  id_usuario: number;
  numero_pedido: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: 'pendiente' | 'pagado' | 'procesando' | 'completado' | 'cancelado';
  id_metodo_pago: number | null;
  id_veemper_orden?: string | null;
  error_veemper?: string | null;
  nota_interna: string | null;
  fecha_pago: string | null;
  fecha_completado: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  detalles?: DetallePedidoApi[];
}

// Respuesta de listar pedidos
export interface RespuestaListarPedidos {
  exito: boolean;
  datos: PedidoApi[];
  total?: number;
  mensaje?: string;
}

// Respuesta de crear pedido
export interface RespuestaCrearPedido {
  exito: boolean;
  datos?: PedidoApi;
  mensaje?: string;
}

// Respuesta de actualizar estado
export interface RespuestaActualizarEstado {
  exito: boolean;
  datos?: PedidoApi;
  mensaje?: string;
}

// Cuerpo para crear pedido
export interface CrearPedidoCuerpo {
  idUsuario: number;
  numeroPedido: string;
  fecha?: string;
  subtotal: number;
  descuento: number;
  total: number;
  idMetodoPago?: number | null;
  notaInterna?: string | null;
  detalles: DetallePedidoCrear[];
}

// Detalle para crear pedido
export interface DetallePedidoCrear {
  idPrecio: number;
  idCodigo?: number | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  valoresCampos?: Record<string, any>;
}

// Cuerpo para actualizar estado
export interface ActualizarEstadoCuerpo {
  estado: 'pendiente' | 'pagado' | 'procesando' | 'completado' | 'cancelado';
}

// Cuerpo para actualizar detalle (PATCH estado-entrega)
export interface ActualizarDetalleCuerpo {
  estadoEntrega: string;
  valoresCampos?: Record<string, unknown>;
}

// Respuesta de reembolsar detalle
export interface RespuestaReembolsarDetalle {
  exito: boolean;
  datos?: {
    id_transaccion: number;
    monto: number;
    id_usuario: number;
    id_pedido: number;
  };
  mensaje?: string;
}

// Respuesta de actualizar detalle
export interface RespuestaActualizarDetalle {
  exito: boolean;
  datos?: PedidoApi;
  mensaje?: string;
}
