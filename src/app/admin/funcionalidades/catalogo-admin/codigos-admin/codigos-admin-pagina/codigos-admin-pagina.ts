import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { BloqueEstadoTablaComponente } from '../../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { Modal } from '../../../../../compartido/componentes/modal/modal';
import type { CodigoApi } from '../../../../../compartido/modelos/codigo.modelo';
import type {
  PrecioApi,
  ProductoDetalleApi,
} from '../../../../../compartido/modelos/producto.modelo';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CodigosApiServicio } from '../../../../../nucleo/servicios/codigos-api.servicio';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

interface PrecioProducto {
  id: string;
  nombre: string;
  precio: number;
  bonificacion?: string;
}

interface ProductoConPrecios {
  id: string;
  nombre: string;
  handle: string;
  precios: PrecioProducto[];
}

@Component({
  selector: 'app-codigos-admin-pagina',
  standalone: true,
  imports: [CommonModule, Modal, BloqueEstadoTablaComponente],
  templateUrl: './codigos-admin-pagina.html',
  styleUrl: './codigos-admin-pagina.css',
})
export class CodigosAdminPagina implements OnInit {
  Math = Math;

  private codigosApi = inject(CodigosApiServicio);
  private productosApi = inject(ProductosApiServicio);
  private notificacion = inject(NotificacionServicio);

  estadosFiltro = [
    { nombre: 'Total', valor: 'total', color: 'morado' },
    { nombre: 'Disponible', valor: 'disponible', color: 'verde' },
    { nombre: 'Vendido', valor: 'vendido', color: 'azul' },
    { nombre: 'Expirado', valor: 'expirado', color: 'rojo' },
  ];
  estadoActivoFiltro = signal<string | null>(null);

  modalAgregarAbierto = signal(false);
  filtrosVisibles = signal(true);

  // Estados de carga
  estaCargando = signal(false);
  errorAlCargar = signal(false);
  guardando = signal(false);

  // Modal agregar
  productoSeleccionado = signal<string>('');
  precioSeleccionado = signal<string>('');
  sinFechaExpiracion = signal<boolean>(false);
  fechaExpiracionCodigo = signal<string>('');
  textoCodigosModal = signal<string>('');
  busquedaProductoModal = signal<string>('');
  desplegarBusquedaProducto = signal<boolean>(false);
  productosDisponibles = signal<ProductoConPrecios[]>([]);
  cargandoPreciosProducto = signal(false);

  preciosDisponibles = computed(() => {
    if (!this.productoSeleccionado()) return [];
    const producto = this.productosDisponibles().find((p) => p.id === this.productoSeleccionado());
    return producto ? producto.precios : [];
  });

  precioSelectHabilitado = computed(() => this.productoSeleccionado() !== '');

  productosFiltradosModal = computed(() => {
    const texto = this.busquedaProductoModal().toLowerCase().trim();
    const lista = this.productosDisponibles();
    if (!texto) return lista;
    return lista.filter((p) => p.nombre.toLowerCase().includes(texto));
  });

  textoProductoSeleccionado = computed(() => {
    if (!this.productoSeleccionado()) return '';
    const producto = this.productosDisponibles().find((p) => p.id === this.productoSeleccionado());
    return producto ? producto.nombre : '';
  });

  textoBusqueda = signal<string>('');
  fechaCreacion = signal<string>('');
  fechaExpiracion = signal<string>('');

  codigos = signal<CodigoApi[]>([]);

  paginaActual = signal(1);
  codigosPorPagina = signal(10);

  codigosFiltrados = computed(() => {
    let resultado = this.codigos();

    if (this.estadoActivoFiltro() && this.estadoActivoFiltro() !== 'total') {
      resultado = resultado.filter((c) => c.estado === this.estadoActivoFiltro());
    }

    // Buscador de texto: busca en código, producto, precio y cliente
    const busqueda = this.textoBusqueda().toLowerCase().trim();
    if (busqueda) {
      resultado = resultado.filter((c) => {
        const codigo = c.codigo.toLowerCase();
        const producto = c.nombreProducto.toLowerCase();
        const precio = c.nombrePrecio.toLowerCase();
        const cliente = c.correoCliente?.toLowerCase() ?? '';
        return codigo.includes(busqueda) || 
               producto.includes(busqueda) || 
               precio.includes(busqueda) || 
               cliente.includes(busqueda);
      });
    }

    // Filtro por fecha de creación
    const fechaCreacionFiltro = this.fechaCreacion();
    if (fechaCreacionFiltro) {
      const fechaFiltro = new Date(fechaCreacionFiltro);
      fechaFiltro.setHours(0, 0, 0, 0);
      resultado = resultado.filter((c) => {
        const fechaCreacion = new Date(c.fechaCreacion);
        fechaCreacion.setHours(0, 0, 0, 0);
        return fechaCreacion.getTime() === fechaFiltro.getTime();
      });
    }

    // Filtro por fecha de expiración
    const fechaExpiracionFiltro = this.fechaExpiracion();
    if (fechaExpiracionFiltro) {
      const fechaFiltro = new Date(fechaExpiracionFiltro);
      fechaFiltro.setHours(0, 0, 0, 0);
      resultado = resultado.filter((c) => {
        if (!c.fechaExpiracion) return false;
        const fechaExp = new Date(c.fechaExpiracion);
        fechaExp.setHours(0, 0, 0, 0);
        return fechaExp.getTime() === fechaFiltro.getTime();
      });
    }

    return resultado;
  });


  totalCodigos = computed(() => this.codigosFiltrados().length);
  totalPaginas = computed(() => Math.ceil(this.totalCodigos() / this.codigosPorPagina()));

  codigosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.codigosPorPagina();
    const fin = inicio + this.codigosPorPagina();
    return this.codigosFiltrados().slice(inicio, fin);
  });

  contadorPorEstado(estado: string): number {
    const codigosBase = this.codigosFiltrados();

    if (estado === 'total') return codigosBase.length;
    return codigosBase.filter((c) => c.estado === estado).length;
  }

  paginasAMostrar = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      } else if (actual >= total - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = total - 4; i <= total; i++) paginas.push(i);
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = actual - 1; i <= actual + 1; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      }
    }
    return paginas;
  });

  ngOnInit(): void {
    this.cargarCodigos();
  }

  /** Carga los códigos desde la API */
  cargarCodigos(): void {
    this.estaCargando.set(true);
    this.errorAlCargar.set(false);
    this.codigosApi.obtenerTodos().subscribe({
      next: (datos: CodigoApi[]) => {
        this.codigos.set(datos);
      },
      error: () => {
        this.errorAlCargar.set(true);
        this.notificacion.error('No se pudieron cargar los códigos');
      },
      complete: () => this.estaCargando.set(false),
    });
  }

  /** Carga productos con precios para el modal de agregar */
  cargarProductosManuales(): void {
    this.productosApi.obtenerParaCodigos().subscribe({
      next: (lista) => {
        const productos = lista.map((p) => ({
          id: String(p.id_producto),
          nombre: p.titulo,
          handle: p.handle,
          precios: p.precios.map((pr: { id_precio: number; nombre: string }) => ({
            id: String(pr.id_precio),
            nombre: pr.nombre,
            precio: 0, // No se usa en el modal
          })),
        }));
        this.productosDisponibles.set(productos);
      },
      error: () => {
        this.notificacion.error('No se pudieron cargar los productos');
      },
    });
  }

  /** Carga precios de un producto seleccionado por handle */
  cargarPreciosProducto(handle: string): void {
    this.cargandoPreciosProducto.set(true);
    this.productosApi.obtenerPorHandle(handle).subscribe({
      next: (producto: ProductoDetalleApi | null) => {
        if (producto?.precios?.length) {
          this.productosDisponibles.update((lista) =>
            lista.map((p) => {
              if (p.handle === handle) {
                return {
                  ...p,
                  precios: producto.precios.map((pr: PrecioApi) => ({
                    id: String(pr.id_precio),
                    nombre: pr.nombre,
                    precio: parseFloat(pr.precioBase ?? '0'),
                  })),
                };
              }
              return p;
            }),
          );
        }
      },
      error: () => this.notificacion.error('No se pudieron cargar los precios'),
      complete: () => this.cargandoPreciosProducto.set(false),
    });
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) this.paginaActual.update((p) => p - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((p) => p + 1);
    }
  }

  filtrarPorEstado(estado: string): void {
    if (this.estadoActivoFiltro() === estado) {
      this.estadoActivoFiltro.set(null);
    } else {
      this.estadoActivoFiltro.set(estado);
    }
    this.paginaActual.set(1);
  }

  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.fechaCreacion.set('');
    this.fechaExpiracion.set('');
    this.estadoActivoFiltro.set(null);
    this.paginaActual.set(1);
  }

  abrirModalAgregar(): void {
    this.modalAgregarAbierto.set(true);
    this.productoSeleccionado.set('');
    this.precioSeleccionado.set('');
    this.busquedaProductoModal.set('');
    this.desplegarBusquedaProducto.set(false);
    this.sinFechaExpiracion.set(false);
    this.fechaExpiracionCodigo.set('');
    this.textoCodigosModal.set('');
    this.productosDisponibles.set([]);
    this.cargarProductosManuales();
  }

  cerrarModalAgregar(): void {
    this.modalAgregarAbierto.set(false);
    this.productoSeleccionado.set('');
    this.precioSeleccionado.set('');
    this.busquedaProductoModal.set('');
    this.desplegarBusquedaProducto.set(false);
    this.sinFechaExpiracion.set(false);
    this.fechaExpiracionCodigo.set('');
    this.textoCodigosModal.set('');
  }

  seleccionarProductoModal(productoId: string): void {
    const producto = this.productosDisponibles().find((p) => p.id === productoId);
    if (!producto) return;
    this.productoSeleccionado.set(productoId);
    this.precioSeleccionado.set('');
    this.desplegarBusquedaProducto.set(false);
    this.busquedaProductoModal.set('');
  }

  /** Selecciona el precio del producto en el modal de agregar */
  seleccionarPrecioModal(precioId: string): void {
    this.precioSeleccionado.set(precioId);
  }

  alternarDesplegarBusquedaProducto(): void {
    this.desplegarBusquedaProducto.update((v) => !v);
  }

  cerrarBusquedaProducto(): void {
    this.desplegarBusquedaProducto.set(false);
  }

  limpiarProductoSeleccionado(): void {
    this.productoSeleccionado.set('');
    this.precioSeleccionado.set('');
    this.busquedaProductoModal.set('');
  }

  alternarSinFechaExpiracion(): void {
    this.sinFechaExpiracion.update((v) => !v);
    if (this.sinFechaExpiracion()) this.fechaExpiracionCodigo.set('');
  }

  alternarFiltros(): void {
    this.filtrosVisibles.update((v) => !v);
  }

  eliminarCodigo(id: number): void {
    this.guardando.set(true);
    this.codigosApi.eliminar(id).subscribe({
      next: () => {
        this.notificacion.exito('Código eliminado');
        this.cargarCodigos();
      },
      error: (err: { error?: { mensaje?: string } }) => {
        const msg = err?.error?.mensaje ?? 'No se pudo eliminar el código';
        this.notificacion.error(msg);
      },
      complete: () => this.guardando.set(false),
    });
  }

  actualizarEstadoCodigo(id: number, nuevoEstado: 'disponible' | 'vendido' | 'expirado'): void {
    this.guardando.set(true);
    this.codigosApi.actualizarEstado(id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.notificacion.exito('Estado actualizado');
        this.cargarCodigos();
      },
      error: (err: { error?: { mensaje?: string } }) => {
        const msg = err?.error?.mensaje ?? 'No se pudo actualizar el estado';
        this.notificacion.error(msg);
      },
      complete: () => this.guardando.set(false),
    });
  }

  truncarTexto(texto: string, limite: number): string {
    if (!texto || texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  }


  /** Obtiene la fecha de expiración formateada para mostrar */
  formatearFechaExpiracion(fecha: string | null): string {
    if (!fecha) return '—';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return fecha;
    }
  }

  /** Obtiene la fecha de creación formateada */
  formatearFechaCreacion(fecha: string): string {
    try {
      const d = new Date(fecha);
      return d.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  }

  /** Guarda los códigos del modal (uno por línea) en lote */
  guardarCodigos(): void {
    const idPrecio = this.precioSeleccionado() ? parseInt(this.precioSeleccionado(), 10) : 0;
    if (!idPrecio) {
      this.notificacion.advertencia('Selecciona un producto y precio');
      return;
    }

    const lineas = this.textoCodigosModal()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lineas.length === 0) {
      this.notificacion.advertencia('Ingresa al menos un código');
      return;
    }

    const fechaExpiracion = this.sinFechaExpiracion()
      ? undefined
      : this.fechaExpiracionCodigo()
        ? new Date(this.fechaExpiracionCodigo()).toISOString().slice(0, 10)
        : undefined;

    this.guardando.set(true);

    this.codigosApi
      .crearEnLote({
        id_precio: idPrecio,
        codigos: lineas,
        fecha_expiracion: fechaExpiracion,
      })
      .subscribe({
        next: (resp) => {
          this.guardando.set(false);
          if (resp?.exito && resp.datos) {
            const cantidadCreados = resp.datos.length;
            this.notificacion.exito(`Se crearon ${cantidadCreados} código(s) correctamente`);
            this.cerrarModalAgregar();
            this.cargarCodigos();
          } else {
            const mensaje = resp?.mensaje ?? 'No se pudieron crear los códigos';
            this.notificacion.error(mensaje);
          }
        },
        error: (err: { error?: { mensaje?: string } }) => {
          this.guardando.set(false);
          const msg = err?.error?.mensaje ?? 'Error al crear los códigos';
          this.notificacion.error(msg);
        },
      });
  }
}
