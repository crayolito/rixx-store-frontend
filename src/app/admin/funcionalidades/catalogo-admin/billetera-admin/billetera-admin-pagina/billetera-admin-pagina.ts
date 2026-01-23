import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Modal } from '../../../../../compartido/componentes/modal/modal';

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
  imports: [CommonModule, Modal],
  templateUrl: './billetera-admin-pagina.html',
  styleUrl: './billetera-admin-pagina.css',
})
export class BilleteraAdminPagina {
  Math = Math;

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

  // FASE 7: Datos mock de usuarios para búsqueda
  usuariosDisponibles: Usuario[] = [
    { id: 'usr-001', nombre: 'Juan Pérez', email: 'juan.perez@email.com', saldoActual: 1500 },
    { id: 'usr-002', nombre: 'María García', email: 'maria.garcia@email.com', saldoActual: 3200 },
    { id: 'usr-003', nombre: 'Carlos López', email: 'carlos.lopez@email.com', saldoActual: 850 },
    { id: 'usr-004', nombre: 'Ana Martínez', email: 'ana.martinez@email.com', saldoActual: 5400 },
    { id: 'usr-005', nombre: 'Pedro Sánchez', email: 'pedro.sanchez@email.com', saldoActual: 2100 },
  ];

  // FASE 8: Datos mock de transacciones
  transacciones = signal<TransaccionBilletera[]>([
    {
      id: '1',
      usuarioId: 'usr-001',
      usuarioNombre: 'Juan Pérez',
      usuarioEmail: 'juan.perez@email.com',
      saldoAnterior: 1000,
      monto: 500,
      nuevoSaldo: 1500,
      tipoMovimiento: 'deposito',
      metodoPago: 'Transferencia',
      estado: 'completado',
      nota: 'Recarga de saldo inicial',
      fechaCreacion: new Date('2024-01-15'),
    },
    {
      id: '2',
      usuarioId: 'usr-002',
      usuarioNombre: 'María García',
      usuarioEmail: 'maria.garcia@email.com',
      saldoAnterior: 3500,
      monto: 300,
      nuevoSaldo: 3200,
      tipoMovimiento: 'retiro',
      metodoPago: 'Efectivo',
      estado: 'completado',
      nota: 'Retiro solicitado por el usuario',
      fechaCreacion: new Date('2024-01-14'),
    },
    {
      id: '3',
      usuarioId: 'usr-003',
      usuarioNombre: 'Carlos López',
      usuarioEmail: 'carlos.lopez@email.com',
      saldoAnterior: 500,
      monto: 350,
      nuevoSaldo: 850,
      tipoMovimiento: 'deposito',
      metodoPago: 'Tarjeta',
      estado: 'completado',
      nota: 'Depósito por compra cancelada',
      fechaCreacion: new Date('2024-01-13'),
    },
    {
      id: '4',
      usuarioId: 'usr-004',
      usuarioNombre: 'Ana Martínez',
      usuarioEmail: 'ana.martinez@email.com',
      saldoAnterior: 5000,
      monto: 400,
      nuevoSaldo: 5400,
      tipoMovimiento: 'deposito',
      metodoPago: 'Transferencia',
      estado: 'pendiente',
      nota: 'Bonificación por programa de lealtad',
      fechaCreacion: new Date('2024-01-12'),
    },
    {
      id: '5',
      usuarioId: 'usr-005',
      usuarioNombre: 'Pedro Sánchez',
      usuarioEmail: 'pedro.sanchez@email.com',
      saldoAnterior: 2500,
      monto: 400,
      nuevoSaldo: 2100,
      tipoMovimiento: 'retiro',
      metodoPago: 'Efectivo',
      estado: 'completado',
      nota: 'Retiro manual aprobado',
      fechaCreacion: new Date('2024-01-11'),
    },
  ]);

  // FASE 9: Computed - Saldo total del sistema
  saldoTotalSistema = computed(() => {
    return this.usuariosDisponibles.reduce((total, usuario) => total + usuario.saldoActual, 0);
  });

  // FASE 10: Computed - Filtrar usuarios en el modal
  usuariosFiltrados = computed(() => {
    const busqueda = this.busquedaUsuario().toLowerCase();
    if (!busqueda) return [];

    return this.usuariosDisponibles.filter(usuario =>
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

  guardarTransaccion() {
    // PASO 1: Validar datos
    const usuario = this.usuarioSeleccionado();
    const monto = parseFloat(this.montoTransaccion());

    if (!usuario || !monto || monto <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    // PASO 2: Calcular nuevo saldo
    const saldoAnterior = usuario.saldoActual;
    const nuevoSaldo = this.tipoTransaccion() === 'deposito'
      ? saldoAnterior + monto
      : saldoAnterior - monto;

    if (nuevoSaldo < 0) {
      alert('El saldo no puede ser negativo');
      return;
    }

    // PASO 3: Crear nueva transacción
    const nuevaTransaccion: TransaccionBilletera = {
      id: Date.now().toString(),
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      usuarioEmail: usuario.email,
      saldoAnterior: saldoAnterior,
      monto: monto,
      nuevoSaldo: nuevoSaldo,
      tipoMovimiento: this.tipoTransaccion(),
      metodoPago: 'Manual',
      estado: 'completado',
      nota: this.notaTransaccion() || 'Sin nota',
      fechaCreacion: new Date(),
    };

    // PASO 4: Agregar a la lista
    this.transacciones.update(lista => [nuevaTransaccion, ...lista]);

    // PASO 5: Actualizar saldo del usuario
    const usuarioIndex = this.usuariosDisponibles.findIndex(u => u.id === usuario.id);
    if (usuarioIndex !== -1) {
      this.usuariosDisponibles[usuarioIndex].saldoActual = nuevoSaldo;
    }

    // PASO 6: Cerrar modal
    alert('Transacción guardada exitosamente');
    this.cerrarModalAgregarSaldo();
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
