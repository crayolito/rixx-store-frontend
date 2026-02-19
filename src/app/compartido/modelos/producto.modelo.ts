export interface CampoDinamicoApi {
  tipo: string;
  handle: string;
  etiqueta: string;
  requerido: boolean;
}

export interface ImagenesProducto {
  square: string | null;
  rectangular: string | null;
  smallSquare: string | null;
}

export interface ProductoApi {
  id_producto: number;
  handle: string;
  titulo: string;
  tipoProceso: string;
  descripcion: string | null;
  comoCanjear: string | null;
  terminosCondiciones: string | null;
  imagenes: ImagenesProducto;
  camposDinamicos: CampoDinamicoApi[];
  importado?: boolean;
  idVemper: string | null;
  sincronizado?: boolean;
  servidorDinamico?: boolean;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
  categorias?: string[];
}

export interface PrecioApi {
  id_precio: number;
  idProducto: number;
  nombre: string;
  handle: string;
  idVemper: string | null;
  precioBase: string;
  margenCliente: string;
  margenRevendedor: string;
  margenMayorista: string;
  stock: number | null;
  orden: number;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
}

export interface ProductoDetalleApi extends ProductoApi {
  precios: PrecioApi[];
}

export interface RespuestaProductos {
  exito: boolean;
  datos: ProductoApi[];
}

export interface RespuestaProductoDetalle {
  exito: boolean;
  datos: ProductoDetalleApi;
}

/** Producto con precios para el selector de códigos */
export interface ProductoParaCodigosApi {
  id_producto: number;
  titulo: string;
  handle: string;
  precios: {
    id_precio: number;
    nombre: string;
  }[];
}

/** Respuesta de productos para códigos */
export interface RespuestaProductosParaCodigos {
  exito: boolean;
  datos: ProductoParaCodigosApi[];
}
