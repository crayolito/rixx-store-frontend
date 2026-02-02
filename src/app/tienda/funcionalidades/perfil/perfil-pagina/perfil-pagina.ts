import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Modal } from '../../../../compartido/componentes/modal/modal';

export interface DatosEntrega {
  idJugador?: string;
  idServer?: string;
  [k: string]: string | undefined;
}

export interface ProductoPedido {
  id: string;
  nombre: string;
  imagen?: string;
  cantidad: number;
}

export interface PedidoAutomatico {
  id: string;
  tipo: 'automatico';
  productos: ProductoPedido[];
  total_compra: number;
  estado: string;
  fecha_compra: string;
  datosEntrega?: DatosEntrega;
}

export interface CodigoGiftCard {
  serial?: string;
  pin?: string;
  valor?: number;
}

export interface PedidoGiftCard {
  id: string;
  tipo: 'gift_card';
  nombre: string;
  fechaEmision: string;
  codigos: CodigoGiftCard[];
  valorTotal: number;
  instrucciones?: string;
}

export type Pedido = PedidoAutomatico | PedidoGiftCard;

export interface TransaccionBilletera {
  id: string;
  fecha: string;
  tipo: 'recarga' | 'compra' | 'reembolso';
  descripcion: string;
  monto: number;
  saldoResultante?: number;
}

interface Paquete {
  id: string;
  monto: number;
}

interface MetodoPago {
  id: string;
  nombre: string;
  logo: string;
  descripcion: string;
}

@Component({
  selector: 'app-perfil-pagina',
  standalone: true,
  imports: [CommonModule, Modal],
  templateUrl: './perfil-pagina.html',
  styleUrl: './perfil-pagina.css',
})
export class PerfilPagina implements OnInit {
  // FASE 1: Estado de la sección activa
  seccionActiva = signal<'perfil' | 'pedidos' | 'billetera'>('perfil');

  // FASE 2: Datos del usuario
  nombre = signal<string>('Juan Pérez García');
  email = signal<string>('juan.perez@ejemplo.com');
  fotoPerfil = signal<string>('/imagenes/foto-perfil1.png');
  contrasena = signal<string>('');
  mostrarContrasena = signal<boolean>(false);
  mostrarCambioContrasena = signal<boolean>(false);
  ingresoPorGoogle = signal<boolean>(true);
  estaEditando = signal<boolean>(false);
  nombreTemporal = signal<string>('');
  emailTemporal = signal<string>('');
  pedidosExpandidos = signal<Set<string>>(new Set());
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const seccion = params['seccion'];
      if (seccion === 'pedidos' || seccion === 'billetera') {
        this.seccionActiva.set(seccion);
      }
    });
  }

  // FASE 3: Pedidos automáticos y Gift Cards
  pedidosAutomaticos = signal<PedidoAutomatico[]>([
    {
      id: 'ped-001',
      tipo: 'automatico',
      productos: [
        { id: 'prod-001', nombre: 'Pines Free Fire 1200 Diamantes', imagen: '/imagenes/juego1.png', cantidad: 2 },
        { id: 'prod-002', nombre: 'Diamantes Mobile Legends 500', imagen: '/imagenes/juego2.png', cantidad: 1 }
      ],
      total_compra: 150.00,
      estado: 'completado',
      fecha_compra: '2026-01-20T10:30:00',
      datosEntrega: { idJugador: '123456789', idServer: 'BR-01' }
    },
    {
      id: 'ped-002',
      tipo: 'automatico',
      productos: [
        { id: 'prod-003', nombre: 'Netflix Premium 3 Meses', imagen: '/imagenes/juego3.png', cantidad: 1 },
        { id: 'prod-004', nombre: 'Spotify Premium 6 Meses', imagen: '/imagenes/juego4.png', cantidad: 1 },
        { id: 'prod-005', nombre: 'Disney+ 1 Año', imagen: '/imagenes/juego5.png', cantidad: 2 }
      ],
      total_compra: 350.00,
      estado: 'procesando',
      fecha_compra: '2026-01-21T14:15:00'
    },
    {
      id: 'ped-003',
      tipo: 'automatico',
      productos: [
        { id: 'prod-006', nombre: 'UC PUBG Mobile 1800', imagen: '/imagenes/juego6.png', cantidad: 3 },
        { id: 'prod-007', nombre: 'Gemas Clash of Clans 2500', imagen: '/imagenes/juego7.png', cantidad: 1 },
        { id: 'prod-008', nombre: 'V-Bucks Fortnite 5000', imagen: '/imagenes/juego8.png', cantidad: 1 }
      ],
      total_compra: 580.00,
      estado: 'pendiente',
      fecha_compra: '2026-01-22T09:20:00',
      datosEntrega: { idJugador: '987654', idServer: 'LATAM' }
    }
  ]);

  pedidosGiftCard = signal<PedidoGiftCard[]>([
    {
      id: 'gift-001',
      tipo: 'gift_card',
      nombre: 'Gift Card Steam 50 USD',
      fechaEmision: '2026-01-18T12:00:00',
      codigos: [
        { serial: 'ST-XXXX-YYYY', pin: '1234-5678-9012', valor: 50 },
        { serial: 'ST-AAAA-BBBB', pin: 'N/A', valor: 50 }
      ],
      valorTotal: 100,
      instrucciones: 'Canjear en store.steampowered.com'
    },
    {
      id: 'gift-002',
      tipo: 'gift_card',
      nombre: 'Gift Card Xbox 25 USD',
      fechaEmision: '2026-01-19T09:30:00',
      codigos: [{ serial: 'XB-12345678', pin: '9999-8888-7777', valor: 25 }],
      valorTotal: 25,
      instrucciones: 'Ingresar código en xbox.com/redeem'
    }
  ]);

  // Switch/tabs: ver Automáticos, Gift Cards o ambos a la vez
  tipoPedidoVista = signal<'automaticos' | 'gift_cards' | 'todos'>('todos');

  // Filtros para pedidos (ambos apartados)
  filtroFechaDesde = signal<string>('');
  filtroFechaHasta = signal<string>('');
  filtroNombreProducto = signal<string>('');

  pedidosAutomaticosFiltrados = computed(() => {
    const lista = this.pedidosAutomaticos();
    const desde = this.filtroFechaDesde();
    const hasta = this.filtroFechaHasta();
    const nombre = this.filtroNombreProducto().trim().toLowerCase();
    if (!desde && !hasta && !nombre) return lista;
    return lista.filter((p) => {
      const fecha = new Date(p.fecha_compra).getTime();
      if (desde && fecha < new Date(desde).getTime()) return false;
      if (hasta && fecha > new Date(hasta).setHours(23, 59, 59, 999)) return false;
      if (nombre && !p.productos.some((prod) => prod.nombre.toLowerCase().includes(nombre))) return false;
      return true;
    });
  });

  pedidosGiftCardFiltrados = computed(() => {
    const lista = this.pedidosGiftCard();
    const desde = this.filtroFechaDesde();
    const hasta = this.filtroFechaHasta();
    const nombre = this.filtroNombreProducto().trim().toLowerCase();
    if (!desde && !hasta && !nombre) return lista;
    return lista.filter((p) => {
      const fecha = new Date(p.fechaEmision).getTime();
      if (desde && fecha < new Date(desde).getTime()) return false;
      if (hasta && fecha > new Date(hasta).setHours(23, 59, 59, 999)) return false;
      if (nombre && !p.nombre.toLowerCase().includes(nombre)) return false;
      return true;
    });
  });

  // Modal verificar identidad (Gift Cards)
  modalVerificarIdentidadAbierto = signal(false);
  contrasenaVerificacion = signal('');
  identidadVerificada = signal(false);

  // Historial transacciones billetera
  transaccionesBilletera = signal<TransaccionBilletera[]>([
    { id: 'tx-1', fecha: '2026-01-25T10:00:00', tipo: 'recarga', descripcion: 'Recarga por Binance Pay', monto: 50, saldoResultante: 50 },
    { id: 'tx-2', fecha: '2026-01-24T15:30:00', tipo: 'compra', descripcion: 'Compra Pines Free Fire', monto: -25.50, saldoResultante: 24.50 },
    { id: 'tx-3', fecha: '2026-01-23T09:00:00', tipo: 'reembolso', descripcion: 'Reembolso pedido cancelado', monto: 30, saldoResultante: 50 }
  ]);

  // FASE 4: Billetera
  saldoActual = signal<number>(0.00);
  paquetes: Paquete[] = [
    { id: 'paq-1', monto: 10 },
    { id: 'paq-2', monto: 25 },
    { id: 'paq-3', monto: 50 },
    { id: 'paq-4', monto: 100 },
    { id: 'paq-5', monto: 200 },
    { id: 'paq-6', monto: 500 }
  ];
  paqueteSeleccionado = signal<Paquete | null>(null);
  cantidadEspecial = signal<string>('');
  metodosPago: MetodoPago[] = [
    {
      id: 'binance',
      nombre: 'Binance Pay',
      logo: '/logo-binance.png',
      descripcion: 'Pago con criptomonedas'
    },
    {
      id: 'veripagos',
      nombre: 'Veripagos',
      logo: '/logo-veripagos.svg',
      descripcion: 'Transferencia bancaria'
    }
  ];
  metodoPagoSeleccionado = signal<string>('');

  // FASE 5: Cambiar sección
  cambiarSeccion(seccion: 'perfil' | 'pedidos' | 'billetera'): void {
    this.seccionActiva.set(seccion);
  }

  // FASE 6: Manejar foto de perfil
  manejarCambioFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (e) => {
      const resultado = e.target?.result as string;
      this.fotoPerfil.set(resultado);
    };
    lector.readAsDataURL(archivo);
  }

  // FASE 7: Actualizar datos del usuario
  actualizarNombre(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.estaEditando()) {
      this.nombreTemporal.set(target.value);
    } else {
      this.nombre.set(target.value);
    }
  }

  actualizarEmail(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.estaEditando()) {
      this.emailTemporal.set(target.value);
    } else {
      this.email.set(target.value);
    }
  }

  actualizarContrasena(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.contrasena.set(target.value);
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena.set(!this.mostrarContrasena());
  }

  toggleCambioContrasena(): void {
    this.mostrarCambioContrasena.set(!this.mostrarCambioContrasena());
  }

  guardarPerfil(): void {
    console.log('Guardando perfil:', {
      nombre: this.nombre(),
      email: this.email(),
      fotoPerfil: this.fotoPerfil()
    });
    alert('Perfil actualizado correctamente');
  }

  // FASE 7.5: Edición de datos básicos
  activarEdicion(): void {
    this.estaEditando.set(true);
    this.nombreTemporal.set(this.nombre());
    this.emailTemporal.set(this.email());
  }

  cancelarEdicion(): void {
    this.estaEditando.set(false);
    this.nombreTemporal.set('');
    this.emailTemporal.set('');
  }

  guardarCambios(): void {
    this.nombre.set(this.nombreTemporal());
    this.email.set(this.emailTemporal());
    this.estaEditando.set(false);
    alert('Cambios guardados correctamente');
  }

  // FASE 7.6: Mostrar más productos en pedidos (máximo 2 visibles, luego "+ Más")
  readonly limiteProductosVisibles = 2;

  mostrarMasProductos(pedidoId: string): void {
    const expandidos = new Set(this.pedidosExpandidos());
    expandidos.add(pedidoId);
    this.pedidosExpandidos.set(expandidos);
  }

  mostrarTodosProductos(pedidoId: string): boolean {
    return this.pedidosExpandidos().has(pedidoId);
  }

  reordenar(pedido: PedidoAutomatico): void {
    this.router.navigate(['/checkout'], { state: { reordenar: pedido.productos } });
  }

  // Modal verificar identidad para Gift Cards
  abrirModalVerificarIdentidad(): void {
    this.contrasenaVerificacion.set('');
    this.modalVerificarIdentidadAbierto.set(true);
  }

  cerrarModalVerificarIdentidad(): void {
    this.modalVerificarIdentidadAbierto.set(false);
    this.contrasenaVerificacion.set('');
  }

  verificarIdentidad(): void {
    const clave = this.contrasenaVerificacion();
    if (!clave) {
      alert('Ingresa tu contraseña');
      return;
    }
    this.identidadVerificada.set(true);
    this.cerrarModalVerificarIdentidad();
  }

  actualizarContrasenaVerificacion(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.contrasenaVerificacion.set(target.value);
  }

  verCodigosGiftCard(): void {
    if (!this.identidadVerificada()) {
      this.abrirModalVerificarIdentidad();
    }
  }

  copiarTodoGiftCard(pedido: PedidoGiftCard): void {
    const bloquesCodigos = pedido.codigos.map((c) => `Serial: ${c.serial ?? 'N/A'}\nPIN: ${c.pin ?? 'N/A'}`);
    const lineas = [
      pedido.nombre,
      `Fecha de emisión: ${new Date(pedido.fechaEmision).toLocaleString()}`,
      '--- Códigos ---',
      ...bloquesCodigos,
      `Valor total: $${pedido.valorTotal} USD`,
      pedido.instrucciones ? `Instrucciones: ${pedido.instrucciones}` : ''
    ];
    navigator.clipboard.writeText(lineas.filter(Boolean).join('\n')).then(() => alert('Copiado al portapapeles'));
  }

  copiarCodigoIndividual(texto: string): void {
    navigator.clipboard.writeText(texto).then(() => alert('Copiado al portapapeles'));
  }

  // FASE 8: Billetera
  seleccionarPaquete(paquete: Paquete | null): void {
    this.paqueteSeleccionado.set(paquete);
    if (paquete) {
      this.cantidadEspecial.set('');
    }
  }

  actualizarCantidadEspecial(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.cantidadEspecial.set(target.value);
    if (target.value) {
      this.paqueteSeleccionado.set(null);
    }
  }

  seleccionarMetodoPago(metodoId: string): void {
    this.metodoPagoSeleccionado.set(metodoId);
  }

  puedeRecargar(): boolean {
    const monto = this.paqueteSeleccionado()?.monto || parseFloat(this.cantidadEspecial());
    return monto > 0 && this.metodoPagoSeleccionado() !== '';
  }

  recargarBilletera(): void {
    const monto = this.paqueteSeleccionado()?.monto || parseFloat(this.cantidadEspecial());
    if (!monto || monto <= 0) {
      alert('Selecciona un paquete o ingresa una cantidad');
      return;
    }
    if (!this.metodoPagoSeleccionado()) {
      alert('Selecciona un método de pago');
      return;
    }
    const nuevoSaldo = this.saldoActual() + monto;
    this.saldoActual.set(nuevoSaldo);
    const transacciones = [...this.transaccionesBilletera()];
    transacciones.unshift({
      id: 'tx-' + Date.now(),
      fecha: new Date().toISOString(),
      tipo: 'recarga',
      descripcion: 'Recarga billetera',
      monto,
      saldoResultante: nuevoSaldo
    });
    this.transaccionesBilletera.set(transacciones);
    alert(`Se recargaron $${monto} US a tu billetera`);
    this.paqueteSeleccionado.set(null);
    this.cantidadEspecial.set('');
    this.metodoPagoSeleccionado.set('');
  }

  // FASE 9: Utilidades
  truncarTexto(texto: string, longitud: number): string {
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
  }
}
