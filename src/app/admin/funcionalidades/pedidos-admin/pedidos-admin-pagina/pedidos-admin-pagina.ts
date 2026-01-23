import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core'; // ← agregar inject
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { NotificacionServicio } from '../../../../compartido/servicios/notificacion'; // ← NUEVA LÍNEA
// Estado del pedido
type EstadoPedido = 'completado' | 'cancelado' | 'procesando' | 'pendiente';

// Método de pago
type MetodoPago = 'tarjeta' | 'paypal' | 'transferencia' | 'efectivo';

// Estado del pago
type EstadoPago = 'pagado' | 'pendiente' | 'rechazado' | 'reembolsado';

// Pedido completo
interface Pedido {
  id: string;
  usuario_email: string;
  usuario_nombre: string;
  productos: ProductoPedido[];
  total_compra: number;
  estado: EstadoPedido;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
  fecha_compra: string;
  informacion_adicional?: InformacionAdicional;
  resumen_financiero: ResumenFinanciero;
}

// Producto dentro del pedido
interface ProductoPedido {
  id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

// Información adicional (flexible)
interface InformacionAdicional {
  [key: string]: string; // Flexible para ID jugador, Nick, Región, etc.
}

// Resumen financiero
interface ResumenFinanciero {
  subtotal: number;
  costo_total: number;
  ganancia_total: number;
}

@Component({
  selector: 'app-pedidos-admin-pagina',
  standalone: true,
  imports: [CommonModule, Modal],  // ← Actualizar, actualmente está vacío []
  templateUrl: './pedidos-admin-pagina.html',
  styleUrl: './pedidos-admin-pagina.css',
})
export class PedidosAdminPagina {

  // FASE 1: Inyectar servicio de notificaciones
  notificacionServicio = inject(NotificacionServicio); // ← NUEVA LÍNEA

  Math = Math;

  // Control de modales y visibilidad
  modalDetallesAbierto = signal(false);
  pedidoSeleccionado = signal<Pedido | null>(null);
  filtrosVisibles = signal(true);

  // Filtros superiores (badges)
  estadosFiltro = [
    { nombre: 'Total', valor: 'total', color: 'morado' },
    { nombre: 'Completado', valor: 'completado', color: 'verde' },
    { nombre: 'Procesando', valor: 'procesando', color: 'azul' },
    { nombre: 'Cancelado', valor: 'cancelado', color: 'rojo' },
    { nombre: 'Pendiente', valor: 'pendiente', color: 'amarillo' }
  ];
  estadoActivoFiltro = signal<string | null>(null);

  // Filtros de búsqueda
  textoBusqueda = signal<string>(''); // ID, usuario, producto
  estadoSeleccionado = signal<string>('');
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');

  // Datos de pedidos
  pedidos = signal<Pedido[]>([
    {
      id: 'ped-001-abc123',
      usuario_email: 'juan.perez@gmail.com',
      usuario_nombre: 'Juan Pérez',
      productos: [
        {
          id: 'prod-001',
          nombre: 'Pines Free Fire 1200 Diamantes',
          precio_unitario: 150.00,
          cantidad: 1,
          subtotal: 150.00
        }
      ],
      total_compra: 150.00,
      estado: 'completado',
      metodo_pago: 'tarjeta',
      estado_pago: 'pagado',
      fecha_compra: '2026-01-20T10:30:00',
      informacion_adicional: {
        'ID del jugador': '1234567890',
        'Nick del jugador': 'JuanGamer',
        'Región': 'Latinoamérica'
      },
      resumen_financiero: {
        subtotal: 150.00,
        costo_total: 120.00,
        ganancia_total: 30.00
      }
    },
    {
      id: 'ped-002-def456',
      usuario_email: 'maria.lopez@hotmail.com',
      usuario_nombre: 'María López',
      productos: [
        {
          id: 'prod-002',
          nombre: 'Netflix Premium 3 Meses',
          precio_unitario: 350.00,
          cantidad: 1,
          subtotal: 350.00
        }
      ],
      total_compra: 350.00,
      estado: 'procesando',
      metodo_pago: 'paypal',
      estado_pago: 'pendiente',
      fecha_compra: '2026-01-21T14:15:00',
      informacion_adicional: {
        'Email de cuenta': 'maria.lopez@hotmail.com',
        'Tipo de suscripción': 'Premium 4K'
      },
      resumen_financiero: {
        subtotal: 350.00,
        costo_total: 280.00,
        ganancia_total: 70.00
      }
    },
    {
      id: 'ped-003-ghi789',
      usuario_email: 'carlos.ruiz@gmail.com',
      usuario_nombre: 'Carlos Ruiz',
      productos: [
        {
          id: 'prod-003',
          nombre: 'Recarga Movistar $50',
          precio_unitario: 50.00,
          cantidad: 2,
          subtotal: 100.00
        }
      ],
      total_compra: 100.00,
      estado: 'cancelado',
      metodo_pago: 'transferencia',
      estado_pago: 'reembolsado',
      fecha_compra: '2026-01-19T08:45:00',
      informacion_adicional: {
        'Número telefónico': '5551234567',
        'Operadora': 'Movistar'
      },
      resumen_financiero: {
        subtotal: 100.00,
        costo_total: 85.00,
        ganancia_total: 0.00
      }
    },
    {
      id: 'ped-004-jkl012',
      usuario_email: 'ana.garcia@yahoo.com',
      usuario_nombre: 'Ana García',
      productos: [
        {
          id: 'prod-004',
          nombre: 'Spotify Premium 6 Meses',
          precio_unitario: 450.00,
          cantidad: 1,
          subtotal: 450.00
        }
      ],
      total_compra: 450.00,
      estado: 'completado',
      metodo_pago: 'tarjeta',
      estado_pago: 'pagado',
      fecha_compra: '2026-01-18T16:20:00',
      informacion_adicional: {
        'Email de cuenta': 'ana.garcia@yahoo.com',
        'Plan': 'Individual'
      },
      resumen_financiero: {
        subtotal: 450.00,
        costo_total: 380.00,
        ganancia_total: 70.00
      }
    },
    {
      id: 'ped-005-mno345',
      usuario_email: 'pedro.sanchez@gmail.com',
      usuario_nombre: 'Pedro Sánchez',
      productos: [
        {
          id: 'prod-005',
          nombre: 'Xbox Game Pass 3 Meses',
          precio_unitario: 300.00,
          cantidad: 1,
          subtotal: 300.00
        }
      ],
      total_compra: 300.00,
      estado: 'pendiente',
      metodo_pago: 'efectivo',
      estado_pago: 'pendiente',
      fecha_compra: '2026-01-21T09:00:00',
      informacion_adicional: {
        'Gamertag': 'PedroGamer123',
        'Región': 'México'
      },
      resumen_financiero: {
        subtotal: 300.00,
        costo_total: 250.00,
        ganancia_total: 50.00
      }
    },
    {
      id: 'ped-006-pqr678',
      usuario_email: 'sofia.torres@outlook.com',
      usuario_nombre: 'Sofía Torres',
      productos: [
        {
          id: 'prod-006',
          nombre: 'Amazon Gift Card $100',
          precio_unitario: 100.00,
          cantidad: 1,
          subtotal: 100.00
        }
      ],
      total_compra: 100.00,
      estado: 'completado',
      metodo_pago: 'tarjeta',
      estado_pago: 'pagado',
      fecha_compra: '2026-01-17T11:30:00',
      informacion_adicional: {
        'Código de tarjeta': 'XXXX-XXXX-XXXX',
        'Moneda': 'USD'
      },
      resumen_financiero: {
        subtotal: 100.00,
        costo_total: 85.00,
        ganancia_total: 15.00
      }
    },
    // ... y así 9 más
    // ... necesitas 10 pedidos más siguiendo este patrón
    // ... necesitas agregar 14 pedidos más con variedad de estados
  ]);

  // Paginación
  paginaActual = signal(1);
  pedidosPorPagina = signal(10);

  // Pedidos filtrados
  pedidosFiltrados = computed(() => {
    let resultado = this.pedidos();

    // Filtrar por badge de estado
    if (this.estadoActivoFiltro() && this.estadoActivoFiltro() !== 'total') {
      resultado = resultado.filter(p => p.estado === this.estadoActivoFiltro());
    }

    // Filtrar por búsqueda (ID, usuario, producto)
    const busqueda = this.textoBusqueda().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(p =>
        p.id.toLowerCase().includes(busqueda) ||
        p.usuario_email.toLowerCase().includes(busqueda) ||
        p.usuario_nombre.toLowerCase().includes(busqueda) ||
        p.productos.some(prod => prod.nombre.toLowerCase().includes(busqueda))
      );
    }

    // Filtrar por estado (dropdown)
    if (this.estadoSeleccionado()) {
      resultado = resultado.filter(p => p.estado === this.estadoSeleccionado());
    }

    // Filtrar por fecha
    if (this.fechaInicio() || this.fechaFin()) {
      resultado = resultado.filter(p => {
        const fechaPedido = new Date(p.fecha_compra);

        // Solo fecha inicio: mostrar desde esa fecha en adelante
        if (this.fechaInicio() && !this.fechaFin()) {
          return fechaPedido >= new Date(this.fechaInicio());
        }

        // Solo fecha fin: mostrar hasta esa fecha
        if (!this.fechaInicio() && this.fechaFin()) {
          return fechaPedido <= new Date(this.fechaFin());
        }

        // Ambas fechas: mostrar rango completo
        return fechaPedido >= new Date(this.fechaInicio()) &&
          fechaPedido <= new Date(this.fechaFin());
      });
    }

    return resultado;
  });

  // Paginación
  totalPedidos = computed(() => this.pedidosFiltrados().length);
  totalPaginas = computed(() =>
    Math.ceil(this.totalPedidos() / this.pedidosPorPagina())
  );
  pedidosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.pedidosPorPagina();
    const fin = inicio + this.pedidosPorPagina();
    return this.pedidosFiltrados().slice(inicio, fin);
  });

  // Contador por estado (para badges)
  contadorPorEstado(estado: string): number {
    if (estado === 'total') return this.pedidos().length;
    return this.pedidos().filter(p => p.estado === estado).length;
  }

  // Abrir modal de detalles
  verDetalles(pedido: Pedido) {
    this.pedidoSeleccionado.set(pedido);
    this.modalDetallesAbierto.set(true);
  }

  cerrarModalDetalles() {
    this.modalDetallesAbierto.set(false);
    this.pedidoSeleccionado.set(null);
  }

  // Completar pedido (validación de estado)
  completarPedido(pedido: Pedido) {
    // FASE 1: Validar que no esté cancelado
    if (pedido.estado === 'cancelado') {
      // Mostrar notificación de error
      this.notificacionServicio.error('No se puede completar un pedido cancelado'); // ← CAMBIO
      return;
    }

    // FASE 2: Cambiar estado a completado
    const pedidosActualizados = this.pedidos().map(p =>
      p.id === pedido.id ? { ...p, estado: 'completado' as EstadoPedido } : p
    );
    this.pedidos.set(pedidosActualizados);

    // FASE 3: Mostrar notificación de éxito
    this.notificacionServicio.exito(`Pedido ${pedido.id} completado exitosamente`); // ← CAMBIO
  }

  // Filtrar por estado badge
  filtrarPorEstado(estado: string) {
    if (this.estadoActivoFiltro() === estado) {
      this.estadoActivoFiltro.set(null);
    } else {
      this.estadoActivoFiltro.set(estado);
    }
    this.paginaActual.set(1);
  }

  // Limpiar todos los filtros
  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.estadoSeleccionado.set('');
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.estadoActivoFiltro.set(null);
    this.paginaActual.set(1);
  }

  // Navegación de páginas
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(pag => pag - 1);
    }
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(pag => pag + 1);
    }
  }

  // Utilidad para truncar texto
  truncarTexto(texto: string, limite: number): string {
    if (texto.length <= limite) {
      return texto;
    }
    return texto.substring(0, limite) + '...';
  }

  // Función de alternar filtros que falta
  alternarFiltros() {
    this.filtrosVisibles.update(visible => !visible);
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

  // Control de dropdowns
  dropdownEstadoAbierto = signal(false);

  // Alternar dropdowns
  alternarDropdownEstado() {
    this.dropdownEstadoAbierto.update(abierto => !abierto);
  }

  // Seleccionar estado desde dropdown
  seleccionarEstadoFiltro(estado: string) {
    this.estadoSeleccionado.set(estado);
    this.dropdownEstadoAbierto.set(false);
    this.paginaActual.set(1);
  }

  // Obtener nombre para mostrar en dropdown
  obtenerNombreEstadoFiltro(): string {
    if (!this.estadoSeleccionado()) return 'Todos los estados';
    const estado = this.estadoSeleccionado();
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  }

  // Cerrar todos los dropdowns
  cerrarTodosLosDropdowns() {
    this.dropdownEstadoAbierto.set(false);
  }
}
