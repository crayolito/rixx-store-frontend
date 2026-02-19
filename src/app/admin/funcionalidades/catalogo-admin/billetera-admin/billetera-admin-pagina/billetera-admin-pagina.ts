import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { BloqueEstadoTablaComponente } from '../../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { Modal } from '../../../../../compartido/componentes/modal/modal';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import {
  BilleteraApiServicio,
  TransaccionBilleteraApi,
} from '../../../../../nucleo/servicios/billetera-api.servicio';
import {
  UsuarioApiItem,
  UsuarioApiServicio,
} from '../../../../../nucleo/servicios/auth-api.servicio';

// FASE 1: Interfaces
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  saldoActual: number;
}

interface TransaccionBilletera {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  saldoAnterior: number;
  monto: number;
  nuevoSaldo: number;
  tipoMovimiento: 'deposito' | 'retiro';
  metodoPago: string;
  estado: 'completado' | 'pendiente' | 'rechazado';
  nota: string;
  fechaCreacion: Date;
}

@Component({
  selector: 'app-billetera-admin-pagina',
  standalone: true,
  imports: [CommonModule, Modal, BloqueEstadoTablaComponente],
  templateUrl: './billetera-admin-pagina.html',
  styleUrl: './billetera-admin-pagina.css',
})
export class BilleteraAdminPagina implements OnInit {
  Math = Math;

  private billeteraApi = inject(BilleteraApiServicio);
  private usuarioApi = inject(UsuarioApiServicio);
  private notificacion = inject(NotificacionServicio);

  estaCargando = signal(false);
  errorAlCargar = signal(false);
  guardando = signal(false);

  // FASE 2: Signals para control de UI
  filtrosVisibles = signal(true);
  modalAgregarSaldoAbierto = signal(false);

  // FASE 3: Dropdowns
  dropdownMetodoAbierto = signal(false);
  dropdownEstadoAbierto = signal(false);
  dropdownTipoTransaccionAbierto = signal(false);

  // FASE 4: Filtros
  textoBusqueda = signal('');
  metodoSeleccionado = signal('');
  estadoSeleccionado = signal('');
  fechaTransaccion = signal('');

  // FASE 5: Modal - agregar saldo
  busquedaUsuario = signal('');
  usuarioSeleccionado = signal<Usuario | null>(null);
  tipoTransaccion = signal<'deposito' | 'retiro'>('deposito');
  montoTransaccion = signal('');
  notaTransaccion = signal('');

  // FASE 6: Paginación
  paginaActual = signal(1);
  transaccionesPorPagina = signal(15);

  // FASE 7: Usuarios cargados desde API para el modal de agregar saldo
  usuariosDisponibles = signal<Usuario[]>([]);
  cargandoUsuariosModal = signal(false);

  // FASE 8: Transacciones desde API
  transacciones = signal<TransaccionBilletera[]>([]);

  // FASE 9: Computed - Saldo total del sistema (desde usuarios cargados en modal)
  saldoTotalSistema = computed(() => {
    return this.usuariosDisponibles().reduce((total, usuario) => total + usuario.saldoActual, 0);
  });

  ngOnInit(): void {
    this.cargarTransacciones();
  }

  /** Carga las transacciones desde la API */
  cargarTransacciones(): void {
    this.estaCargando.set(true);
    this.errorAlCargar.set(false);
    const pagina = this.paginaActual();
    const limite = Math.min(this.transaccionesPorPagina(), 100);
    this.billeteraApi.listarTransacciones({ pagina, limite }).subscribe({
      next: (datos) => {
        const mapeadas: TransaccionBilletera[] = (datos?.datos ?? []).map((t: TransaccionBilleteraApi) => ({
          id: String(t.id_transaccion),
          usuarioId: String(t.id_usuario),
          usuarioNombre: t.nombreUsuario ?? '',
          usuarioEmail: t.emailUsuario ?? '',
          saldoAnterior: t.saldo_anterior,
          monto: t.monto,
          nuevoSaldo: t.saldo_nuevo,
          tipoMovimiento: t.tipo === 'recarga' ? 'deposito' : 'retiro',
          metodoPago: 'Manual',
          estado: 'completado',
          nota: t.descripcion ?? '',
          fechaCreacion: new Date(t.fecha_creacion),
        }));
        this.transacciones.set(mapeadas);
      },
      error: () => {
        this.errorAlCargar.set(true);
        this.notificacion.error('No se pudieron cargar las transacciones');
      },
      complete: () => this.estaCargando.set(false),
    });
  }

  // FASE 10: Computed - Filtrar usuarios en el modal
  usuariosFiltrados = computed(() => {
    const busqueda = this.busquedaUsuario().toLowerCase().trim();
    if (!busqueda) return this.usuariosDisponibles();

    return this.usuariosDisponibles().filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(busqueda) ||
        usuario.email.toLowerCase().includes(busqueda)
    );
  });

  // FASE 11: Computed - Filtrar transacciones
  transaccionesFiltradas = computed(() => {
    let resultado = this.transacciones();

    // Filtro por búsqueda (email o nombre)
    const busqueda = this.textoBusqueda().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(t =>
        t.usuarioEmail.toLowerCase().includes(busqueda) ||
        t.usuarioNombre.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por método
    if (this.metodoSeleccionado()) {
      resultado = resultado.filter(t => t.metodoPago === this.metodoSeleccionado());
    }

    // Filtro por estado
    if (this.estadoSeleccionado()) {
      resultado = resultado.filter(t => t.estado === this.estadoSeleccionado());
    }

    // Filtro por fecha de transacción
    if (this.fechaTransaccion()) {
      const fechaSeleccionada = new Date(this.fechaTransaccion());
      resultado = resultado.filter(t => {
        const fechaTransaccionSinHora = new Date(t.fechaCreacion);
        fechaTransaccionSinHora.setHours(0, 0, 0, 0);
        fechaSeleccionada.setHours(0, 0, 0, 0);
        return fechaTransaccionSinHora.getTime() === fechaSeleccionada.getTime();
      });
    }

    return resultado;
  });

  // FASE 12: Computed - Paginación
  totalTransacciones = computed(() => this.transaccionesFiltradas().length);
  totalPaginas = computed(() => Math.ceil(this.totalTransacciones() / this.transaccionesPorPagina()));

  transaccionesPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.transaccionesPorPagina();
    const fin = inicio + this.transaccionesPorPagina();
    return this.transaccionesFiltradas().slice(inicio, fin);
  });

  paginasAMostrar = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);
      if (actual > 3) paginas.push(-1);
      for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) {
        paginas.push(i);
      }
      if (actual < total - 2) paginas.push(-1);
      paginas.push(total);
    }

    return paginas;
  });

  // FASE 13: Métodos de filtros
  alternarFiltros() {
    this.filtrosVisibles.set(!this.filtrosVisibles());
  }

  alternarDropdownMetodo() {
    this.dropdownMetodoAbierto.set(!this.dropdownMetodoAbierto());
    this.dropdownEstadoAbierto.set(false);
  }

  alternarDropdownEstado() {
    this.dropdownEstadoAbierto.set(!this.dropdownEstadoAbierto());
    this.dropdownMetodoAbierto.set(false);
  }

  seleccionarMetodo(metodo: string) {
    this.metodoSeleccionado.set(metodo);
    this.dropdownMetodoAbierto.set(false);
    this.paginaActual.set(1);
  }

  seleccionarEstado(estado: string) {
    this.estadoSeleccionado.set(estado);
    this.dropdownEstadoAbierto.set(false);
    this.paginaActual.set(1);
  }

  obtenerNombreMetodoFiltro(): string {
    return this.metodoSeleccionado() || 'Todos los métodos';
  }

  obtenerNombreEstadoFiltro(): string {
    return this.estadoSeleccionado() || 'Todos los estados';
  }

  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.metodoSeleccionado.set('');
    this.estadoSeleccionado.set('');
    this.fechaTransaccion.set('');
    this.paginaActual.set(1);
  }

  cerrarTodosLosDropdowns() {
    this.dropdownMetodoAbierto.set(false);
    this.dropdownEstadoAbierto.set(false);
    this.dropdownTipoTransaccionAbierto.set(false);
  }

  // FASE 14: Métodos de paginación
  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.set(this.paginaActual() - 1);
    }
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.set(this.paginaActual() + 1);
    }
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  // FASE 15: Métodos del modal
  abrirModalAgregarSaldo() {
    this.modalAgregarSaldoAbierto.set(true);
    this.limpiarFormularioModal();
    this.cargarUsuariosParaModal();
  }

  /** Carga usuarios desde la API para el selector del modal de agregar saldo */
  cargarUsuariosParaModal(): void {
    this.cargandoUsuariosModal.set(true);
    this.usuarioApi.listarUsuarios(1, 100).subscribe({
      next: (respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          const datosArray = Array.isArray(respuesta.datos)
            ? respuesta.datos
            : (respuesta.datos as { datos: UsuarioApiItem[] }).datos ?? [];
          const mapeados: Usuario[] = datosArray.map((u) => ({
            id: String(u.id),
            nombre: u.nombre,
            email: u.email,
            saldoActual: u.saldo ?? 0,
          }));
          this.usuariosDisponibles.set(mapeados);
        }
      },
      error: () => {
        this.notificacion.error('No se pudieron cargar los usuarios');
        this.usuariosDisponibles.set([]);
      },
      complete: () => this.cargandoUsuariosModal.set(false),
    });
  }

  cerrarModalAgregarSaldo() {
    this.modalAgregarSaldoAbierto.set(false);
    this.limpiarFormularioModal();
  }

  seleccionarUsuario(usuario: Usuario) {
    this.usuarioSeleccionado.set(usuario);
    this.busquedaUsuario.set('');
  }

  removerUsuarioSeleccionado() {
    this.usuarioSeleccionado.set(null);
  }

  alternarTipoTransaccion() {
    this.dropdownTipoTransaccionAbierto.set(!this.dropdownTipoTransaccionAbierto());
  }

  seleccionarTipoTransaccion(tipo: 'deposito' | 'retiro') {
    this.tipoTransaccion.set(tipo);
    this.dropdownTipoTransaccionAbierto.set(false);
  }

  obtenerNombreTipoTransaccion(): string {
    return this.tipoTransaccion() === 'deposito' ? 'Agregar saldo' : 'Restar saldo';
  }

  guardarTransaccion(): void {
    const usuario = this.usuarioSeleccionado();
    const monto = parseFloat(this.montoTransaccion());
    if (!usuario || !monto || monto <= 0) {
      this.notificacion.error('Complete todos los campos correctamente');
      return;
    }
    const tipo = this.tipoTransaccion() === 'deposito' ? 'recarga' : 'compra';
    this.guardando.set(true);
    this.billeteraApi
      .crearTransaccion({
        idUsuario: Number(usuario.id),
        tipo,
        monto,
        descripcion: this.notaTransaccion() || undefined,
        idPedido: null,
      })
      .subscribe({
        next: (resp) => {
          if (resp?.exito) {
            this.notificacion.exito('Transacción guardada');
            this.cerrarModalAgregarSaldo();
            this.cargarTransacciones();
          } else {
            this.notificacion.error(resp?.mensaje ?? 'Error al guardar');
          }
        },
        error: (err) => {
          const msg = err?.error?.mensaje ?? 'No se pudo guardar la transacción';
          this.notificacion.error(msg);
        },
        complete: () => this.guardando.set(false),
      });
  }

  limpiarFormularioModal() {
    this.busquedaUsuario.set('');
    this.usuarioSeleccionado.set(null);
    this.tipoTransaccion.set('deposito');
    this.montoTransaccion.set('');
    this.notaTransaccion.set('');
  }

  // FASE 16: Utilidades
  truncarTexto(texto: string, longitud: number): string {
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
  }
}
