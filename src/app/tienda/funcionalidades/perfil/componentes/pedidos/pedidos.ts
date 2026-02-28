import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { DetallePedidoApi, PedidoApi } from '../../../../../compartido/modelos/pedido.modelo';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';

/** Listado unificado de pedidos con filtro por estado y paginación. */
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  pedidos = input<PedidoApi[]>([]);
  cargando = input(false);

  refrescar = output<void>();

  estadoFiltro = signal<string | null>(null);
  filtroFechaDesde = signal('');
  filtroFechaHasta = signal('');
  filtroNombreProducto = signal('');
  pedidosExpandidos = signal<Set<number>>(new Set());
  paginaActual = signal(1);

  readonly limiteProductosVisibles = 2;
  readonly tamanoPagina = 4;

  private notificacion = inject(NotificacionServicio);

  /** Nombres legibles por estado (solo los que existan en los datos). */
  private readonly nombresEstado: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    procesando: 'Procesando',
    completado: 'Completado',
    cancelado: 'Cancelado',
  };

  /** Opciones de filtro: Todos + solo estados que existen en la lista de pedidos. */
  estadosOpciones = computed(() => {
    const lista = this.pedidos();
    const estados = new Set(lista.map((p) => p.estado).filter(Boolean));
    const opciones: { valor: string | null; nombre: string }[] = [{ valor: null, nombre: 'Todos' }];
    estados.forEach((estado) => {
      opciones.push({ valor: estado, nombre: this.nombresEstado[estado] ?? estado });
    });
    return opciones.sort((a, b) => (a.valor == null ? -1 : b.valor == null ? 1 : a.nombre.localeCompare(b.nombre)));
  });

  pedidosFiltrados = computed(() => {
    let lista = this.pedidos();
    const estado = this.estadoFiltro();
    if (estado) lista = lista.filter((p) => p.estado === estado);
    const desde = this.filtroFechaDesde();
    const hasta = this.filtroFechaHasta();
    const nombre = this.filtroNombreProducto().trim().toLowerCase();
    if (desde || hasta || nombre) {
      lista = lista.filter((p) => {
        const fecha = new Date(p.fecha).getTime();
        if (desde && fecha < new Date(desde).getTime()) return false;
        if (hasta && fecha > new Date(hasta).setHours(23, 59, 59, 999)) return false;
        if (nombre) {
          const coincideNumero = p.numero_pedido.toLowerCase().includes(nombre);
          const coincideDetalle = p.detalles?.some(
            (d) => (d.nombreProducto ?? '').toLowerCase().includes(nombre) || (d.nombrePrecio ?? '').toLowerCase().includes(nombre),
          );
          if (!coincideNumero && !coincideDetalle) return false;
        }
        return true;
      });
    }
    return lista;
  });

  totalPaginas = computed(() => {
    const total = this.pedidosFiltrados().length;
    return Math.max(1, Math.ceil(total / this.tamanoPagina));
  });

  /** Pedidos de la página actual (4 por página). */
  pedidosEnPagina = computed(() => {
    const lista = this.pedidosFiltrados();
    const pagina = this.paginaActual();
    const tamano = this.tamanoPagina;
    const inicio = (pagina - 1) * tamano;
    return lista.slice(inicio, inicio + tamano);
  });

  constructor() {
    effect(
      () => {
        this.pedidosFiltrados();
        this.paginaActual.set(1);
      },
      { allowSignalWrites: true },
    );
  }

  private router = inject(Router);

  filtrarPorEstado(valor: string | null): void {
    this.estadoFiltro.set(valor);
    this.paginaActual.set(1);
  }

  irPagina(pagina: number): void {
    const total = this.totalPaginas();
    if (pagina >= 1 && pagina <= total) this.paginaActual.set(pagina);
  }

  cantidadItems(pedido: PedidoApi): number {
    return pedido.detalles?.reduce((s, d) => s + d.cantidad, 0) ?? 0;
  }

  mostrarMasProductos(idPedido: number): void {
    this.pedidosExpandidos.update((set) => new Set(set).add(idPedido));
  }

  mostrarTodosProductos(idPedido: number): boolean {
    return this.pedidosExpandidos().has(idPedido);
  }

  reordenar(pedido: PedidoApi): void {
    this.router.navigate(['/checkout'], { state: { reordenarPedido: pedido } });
  }

  /** Devuelve todos los códigos del pedido separados por salto de línea. */
  codigosDelPedido(pedido: PedidoApi): string {
    const codigos = (pedido.detalles ?? [])
      .filter((d): d is DetallePedidoApi & { codigo: { codigo: string } } => !!d.codigo?.codigo)
      .map((d) => d.codigo.codigo);
    return codigos.join('\n');
  }

  /** Indica si el pedido tiene al menos un detalle con código. */
  pedidoTieneCodigos(pedido: PedidoApi): boolean {
    return (pedido.detalles ?? []).some((d) => !!d.codigo?.codigo);
  }

  /** Copia un texto al portapapeles y muestra notificación. */
  async copiarCodigo(texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      this.notificacion.exito('Código copiado');
    } catch {
      this.notificacion.error('No se pudo copiar');
    }
  }

  /** Copia todos los códigos del pedido al portapapeles (uno por línea). */
  async copiarTodosCodigos(pedido: PedidoApi): Promise<void> {
    const texto = this.codigosDelPedido(pedido);
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      this.notificacion.exito('Códigos copiados al portapapeles');
    } catch {
      this.notificacion.error('No se pudo copiar');
    }
  }
}
