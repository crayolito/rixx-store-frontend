import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { BloqueEstadoTablaComponente } from '../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import type { DetallePedidoApi, PedidoApi } from '../../../../compartido/modelos/pedido.modelo';
import { NotificacionServicio } from '../../../../compartido/servicios/notificacion';
import { PedidosApiServicio } from '../../../../nucleo/servicios/pedidos-api.servicio';

@Component({
  selector: 'app-pedidos-admin-pagina',
  standalone: true,
  imports: [CommonModule, Modal, BloqueEstadoTablaComponente],
  templateUrl: './pedidos-admin-pagina.html',
  styleUrl: './pedidos-admin-pagina.css',
})
export class PedidosAdminPagina implements OnInit {
  private pedidosApi = inject(PedidosApiServicio);
  private notificacion = inject(NotificacionServicio);

  Math = Math;

  estaCargando = signal(false);
  modalDetallesAbierto = signal(false);
  pedidoSeleccionado = signal<PedidoApi | null>(null);
  detalleProcesandoId = signal<number | null>(null);
  filtrosVisibles = signal(true);

  // Filtros superiores (badges)
  estadosFiltro = [
    { nombre: 'Total', valor: 'total', color: 'morado' },
    { nombre: 'Pendiente', valor: 'pendiente', color: 'amarillo' },
    { nombre: 'Pagado', valor: 'pagado', color: 'azul' },
    { nombre: 'Procesando', valor: 'procesando', color: 'azul' },
    { nombre: 'Completado', valor: 'completado', color: 'verde' },
    { nombre: 'Cancelado', valor: 'cancelado', color: 'rojo' },
  ];
  estadoActivoFiltro = signal<string | null>(null);

  textoBusqueda = signal<string>('');
  fechaCompra = signal<string>('');

  pedidos = signal<PedidoApi[]>([]);

  paginaActual = signal(1);
  pedidosPorPagina = signal(10);

  pedidosFiltrados = computed(() => {
    let resultado = this.pedidos();
    if (this.estadoActivoFiltro() && this.estadoActivoFiltro() !== 'total') {
      resultado = resultado.filter((p) => p.estado === this.estadoActivoFiltro());
    }
    const busqueda = this.textoBusqueda().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(
        (p) =>
          p.numero_pedido.toLowerCase().includes(busqueda) ||
          p.id_pedido.toString().includes(busqueda),
      );
    }
    if (this.fechaCompra()) {
      const fechaBusqueda = new Date(this.fechaCompra());
      resultado = resultado.filter((p) => {
        const fechaPedido = new Date(p.fecha);
        return (
          fechaPedido.getFullYear() === fechaBusqueda.getFullYear() &&
          fechaPedido.getMonth() === fechaBusqueda.getMonth() &&
          fechaPedido.getDate() === fechaBusqueda.getDate()
        );
      });
    }

    return resultado;
  });

  // Paginación
  totalPedidos = computed(() => this.pedidosFiltrados().length);
  totalPaginas = computed(() => Math.ceil(this.totalPedidos() / this.pedidosPorPagina()));
  pedidosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.pedidosPorPagina();
    const fin = inicio + this.pedidosPorPagina();
    return this.pedidosFiltrados().slice(inicio, fin);
  });

  // Contador por estado (para badges)
  contadorPorEstado(estado: string): number {
    if (estado === 'total') return this.pedidos().length;
    return this.pedidos().filter((p) => p.estado === estado).length;
  }

  // Cargar pedidos desde el backend
  cargarPedidos(): void {
    this.estaCargando.set(true);
    this.pedidosApi.listarPedidos({ soloActivos: true }).subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.estaCargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar pedidos:', error);
        this.notificacion.error('Error al cargar los pedidos');
        this.estaCargando.set(false);
      },
    });
  }

  // Abrir modal de detalles
  verDetalles(pedido: PedidoApi): void {
    this.pedidoSeleccionado.set(pedido);
    this.modalDetallesAbierto.set(true);
  }

  cerrarModalDetalles(): void {
    this.modalDetallesAbierto.set(false);
    this.pedidoSeleccionado.set(null);
  }

  // Filtrar por estado badge
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
    this.fechaCompra.set('');
    this.estadoActivoFiltro.set(null);
    this.paginaActual.set(1);
  }

  // Navegación de páginas
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((pag) => pag - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((pag) => pag + 1);
    }
  }

  cantidadTotalProductos(pedido: PedidoApi): number {
    return pedido.detalles?.reduce((suma, d) => suma + d.cantidad, 0) || 0;
  }

  // Indica si el detalle tiene campos dinámicos para mostrar
  tieneCamposDinamicos(detalle: DetallePedidoApi): boolean {
    if (detalle.valores_campos_legibles?.length) return true;
    const vals = detalle.valores_campos;
    return vals != null && Object.keys(vals).length > 0;
  }

  // Devuelve los campos dinámicos en formato legible (etiqueta, valor)
  camposDinamicosParaMostrar(detalle: DetallePedidoApi): { etiqueta: string; valor: string | number }[] {
    if (detalle.valores_campos_legibles?.length) {
      return detalle.valores_campos_legibles;
    }
    const vals = detalle.valores_campos;
    if (!vals) return [];
    return Object.entries(vals).map(([clave, valor]) => ({
      etiqueta: clave,
      valor: typeof valor === 'string' || typeof valor === 'number' ? valor : String(valor ?? ''),
    }));
  }

  // Reembolsa un detalle del pedido
  reembolsarDetalle(pedido: PedidoApi, detalle: DetallePedidoApi): void {
    if (this.detalleProcesandoId()) return;
    this.detalleProcesandoId.set(detalle.id_detalle);
    this.pedidosApi.reembolsarDetalle(detalle.id_detalle).subscribe({
      next: () => {
        this.refrescarPedidoEnModal(pedido.id_pedido);
        this.detalleProcesandoId.set(null);
        this.notificacion.exito('Reembolso procesado correctamente');
      },
      error: (error) => {
        console.error('Error al reembolsar:', error);
        this.notificacion.error(error?.message || 'Error al procesar el reembolso');
        this.detalleProcesandoId.set(null);
      },
    });
  }

  // Completa un detalle del pedido (marca como entregado)
  completarDetalle(pedido: PedidoApi, detalle: DetallePedidoApi): void {
    if (this.detalleProcesandoId()) return;
    this.detalleProcesandoId.set(detalle.id_detalle);
    const cuerpo = {
      estadoEntrega: 'completado' as const,
      valoresCampos: detalle.valores_campos ?? undefined,
    };
    this.pedidosApi.completarDetalle(detalle.id_detalle, cuerpo).subscribe({
      next: () => {
        this.refrescarPedidoEnModal(pedido.id_pedido);
        this.detalleProcesandoId.set(null);
        this.notificacion.exito('Detalle completado correctamente');
      },
      error: (error) => {
        console.error('Error al completar detalle:', error);
        this.notificacion.error(error?.message || 'Error al completar el detalle');
        this.detalleProcesandoId.set(null);
      },
    });
  }

  // Recarga el pedido tras reembolso (la respuesta no incluye el pedido completo)
  private refrescarPedidoEnModal(idPedido: number): void {
    this.pedidosApi.obtenerPedidoPorId(idPedido).subscribe({
      next: (pedidoActualizado) => {
        this.actualizarPedidoEnListaYOSeleccionado(pedidoActualizado);
      },
      error: (err) => {
        console.error('Error al refrescar pedido:', err);
        this.cargarPedidos();
      },
    });
  }

  // Actualiza el pedido en la lista y en el seleccionado (modal)
  private actualizarPedidoEnListaYOSeleccionado(pedidoActualizado: PedidoApi): void {
    this.pedidos.update((pedidos) =>
      pedidos.map((p) => (p.id_pedido === pedidoActualizado.id_pedido ? pedidoActualizado : p)),
    );
    if (this.pedidoSeleccionado()?.id_pedido === pedidoActualizado.id_pedido) {
      this.pedidoSeleccionado.set(pedidoActualizado);
    }
  }

  // Función de alternar filtros
  alternarFiltros(): void {
    this.filtrosVisibles.update((visible) => !visible);
  }

  // Función para mostrar páginas con elipsis
  paginasAMostrar = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) paginas.push(i);
        paginas.push(-1); // -1 representa "..."
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

  cerrarTodosLosDropdowns(): void {}

  ngOnInit(): void {
    this.cargarPedidos();
  }
}
