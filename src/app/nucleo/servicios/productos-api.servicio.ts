import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import type {
  ProductoApi,
  ProductoDetalleApi,
  ProductoParaCodigosApi,
  RespuestaProductoDetalle,
  RespuestaProductos,
  RespuestaProductosParaCodigos,
} from '../../compartido/modelos/producto.modelo';
import { HttpBaseServicio } from './http-base.servicio';
import { Sesion } from './sesion';

// Imágenes en el cuerpo (crear/actualizar): objeto con square, rectangular, smallSquare
export interface ImagenesProductoCuerpo {
  square?: string;
  rectangular?: string;
  smallSquare?: string;
}

// Item de precio al CREAR (POST)
export interface PrecioCrearCuerpo {
  nombre: string;
  handle: string;
  precioBase: number;
  margenCliente: number;
  margenRevendedor: number;
  margenMayorista: number;
  stock: number;
  orden: number;
  estado: string;
}

// Item de precio al ACTUALIZAR (PUT): existente con id_precio, nuevo sin id
export interface PrecioActualizarCuerpo {
  id_precio?: number;
  nombre?: string;
  handle?: string;
  precioBase?: number;
  margenCliente?: number;
  margenRevendedor?: number;
  margenMayorista?: number;
  stock?: number;
  orden?: number;
  estado?: string;
}

// Campo dinámico en el cuerpo (crear/actualizar): tipo, orden, handle, etiqueta, requerido
export interface CampoDinamicoCuerpo {
  tipo: string;
  orden: number;
  handle: string;
  etiqueta: string;
  requerido: boolean;
}

// Cuerpo POST /productos
export interface CrearProductoCuerpo {
  titulo: string;
  descripcion?: string;
  comoCanjear?: string;
  terminosCondiciones?: string;
  estado?: string;
  tipoProceso?: string;
  imagenes?: ImagenesProductoCuerpo;
  camposDinamicos?: CampoDinamicoCuerpo[];
  precios: PrecioCrearCuerpo[];
  idCategorias: number[];
}

// Respuesta GET /productos/:handle/servers (servidor dinámico Vemper)
export interface RespuestaServidoresProducto {
  exito: boolean;
  datos?: {
    success: boolean;
    product_id: string;
    servers: Record<string, string>;
  };
}

// Cuerpo PUT /productos/:handle
export interface ActualizarProductoCuerpo {
  titulo?: string;
  descripcion?: string;
  comoCanjear?: string;
  terminosCondiciones?: string;
  imagenes?: ImagenesProductoCuerpo;
  camposDinamicos?: CampoDinamicoCuerpo[];
  estado?: string;
  tipoProceso?: string;
  importado?: boolean;
  idCategorias?: number[];
  precios?: PrecioActualizarCuerpo[];
}

@Injectable({ providedIn: 'root' })
export class ProductosApiServicio {
  private httpBase = inject(HttpBaseServicio);
  private sesion = inject(Sesion);

  /** Lista productos paginado (requiere token Admin). Navegación por handle. */
  obtenerPaginado(pagina: number, limite: number): Observable<RespuestaProductos> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const params = `?pagina=${pagina}&limite=${limite}`;
    return this.httpBase
      .obtenerConOpciones<RespuestaProductos>(`/productos${params}`, { headers })
      .pipe(map((r) => ({ exito: r?.exito ?? false, datos: Array.isArray(r?.datos) ? r.datos : [] })));
  }

  obtenerPorHandle(handle: string): Observable<ProductoDetalleApi | null> {
    return this.httpBase
      .obtener<RespuestaProductoDetalle>(`/productos/${encodeURIComponent(handle)}`)
      .pipe(map((r) => (r?.exito && r.datos ? r.datos : null)));
  }

  eliminar(handle: string): Observable<{ exito: boolean; mensaje?: string }> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase.eliminar<{ exito: boolean; mensaje?: string }>(
      `/productos/${encodeURIComponent(handle)}`,
      {
        headers,
      },
    );
  }

  actualizarPorHandle(
    handle: string,
    cuerpo: ActualizarProductoCuerpo,
  ): Observable<{ exito: boolean; datos?: ProductoDetalleApi }> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase.actualizarPut<{ exito: boolean; datos?: ProductoDetalleApi }>(
      `/productos/${encodeURIComponent(handle)}`,
      cuerpo,
      { headers },
    );
  }

  actualizarPrecio(
    idPrecio: number,
    datos: Partial<{
      nombre: string;
      margenCliente: number;
      margenRevendedor: number;
      margenMayorista: number;
      estado: string;
      orden: number;
      idCategorias: number[];
    }>,
  ): Observable<{ exito: boolean; datos?: unknown }> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const cuerpo: Record<string, unknown> = {};
    if (datos.nombre !== undefined) cuerpo['nombre'] = datos.nombre;
    if (datos.margenCliente !== undefined) cuerpo['margenCliente'] = datos.margenCliente;
    if (datos.margenRevendedor !== undefined) cuerpo['margenRevendedor'] = datos.margenRevendedor;
    if (datos.margenMayorista !== undefined) cuerpo['margenMayorista'] = datos.margenMayorista;
    if (datos.estado !== undefined) cuerpo['estado'] = datos.estado;
    if (datos.orden !== undefined) cuerpo['orden'] = datos.orden;
    if (datos.idCategorias !== undefined) cuerpo['idCategorias'] = datos.idCategorias;
    return this.httpBase.actualizarPut<{ exito: boolean; datos?: unknown }>(
      `/precios/${idPrecio}`,
      cuerpo,
      {
        headers,
      },
    );
  }

  crear(datos: CrearProductoCuerpo): Observable<{ exito: boolean; datos?: ProductoDetalleApi }> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase.enviarPost<{ exito: boolean; datos?: ProductoDetalleApi }>(
      '/productos',
      datos,
      { headers },
    );
  }

  /** Buscar productos (público). Solo devuelve importado = true. GET /productos/buscar?q=...&limite=... */
  listarParaBusqueda(limite: number, texto?: string): Observable<ProductoApi[]> {
    const q = texto?.trim() ? encodeURIComponent(texto.trim()) : '';
    const params = `?q=${q}&limite=${limite}`;
    return this.httpBase
      .obtener<RespuestaProductos>(`/productos/buscar${params}`)
      .pipe(map((r) => (r?.exito && Array.isArray(r.datos) ? r.datos : [])));
  }

  /** Productos con importado = true (para catálogo admin) */
  obtenerImportados(): Observable<ProductoApi[]> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase
      .obtenerConOpciones<RespuestaProductos>('/productos/importados', { headers })
      .pipe(map((r) => (r?.exito && Array.isArray(r.datos) ? r.datos : [])));
  }

  /** Productos sincronizados con Vemper (idVemper no null) - solo para importar-vemper */
  obtenerVemper(): Observable<ProductoApi[]> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase
      .obtenerConOpciones<RespuestaProductos>('/productos/veemper', { headers })
      .pipe(map((r) => (r?.exito && Array.isArray(r.datos) ? r.datos : [])));
  }

  /** Marca un producto como importado (visible en catálogo) */
  marcarComoImportado(handle: string): Observable<{ exito: boolean; datos?: ProductoDetalleApi }> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.actualizarPorHandle(handle, { importado: true });
  }

  /** Obtiene servidores disponibles para un producto con servidor dinámico (GET /productos/:handle/servers). */
  obtenerServidores(handle: string): Observable<Record<string, string>> {
    return this.httpBase
      .obtener<RespuestaServidoresProducto>(`/productos/${encodeURIComponent(handle)}/servers`)
      .pipe(map((r) => (r?.exito && r.datos?.servers ? r.datos.servers : {})));
  }

  /** Obtiene productos con precios para crear códigos */
  obtenerParaCodigos(): Observable<ProductoParaCodigosApi[]> {
    const token = this.sesion.obtenerToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.httpBase
      .obtenerConOpciones<RespuestaProductosParaCodigos>('/productos/para-codigos', { headers })
      .pipe(map((r) => (r?.exito && Array.isArray(r.datos) ? r.datos : [])));
  }
}
