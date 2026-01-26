import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

interface Pedido {
  id: string;
  productos: ProductoPedido[];
  total_compra: number;
  estado: string;
  fecha_compra: string;
}

interface ProductoPedido {
  id: string;
  nombre: string;
  imagen?: string;
  cantidad: number;
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
  imports: [CommonModule],
  templateUrl: './perfil-pagina.html',
  styleUrl: './perfil-pagina.css',
})
export class PerfilPagina {
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

  // FASE 3: Historial de pedidos
  pedidos = signal<Pedido[]>([
    {
      id: 'ped-001-abc123',
      productos: [
        {
          id: 'prod-001',
          nombre: 'Pines Free Fire 1200 Diamantes',
          imagen: '/imagenes/juego1.png',
          cantidad: 2
        },
        {
          id: 'prod-002',
          nombre: 'Diamantes Mobile Legends 500',
          imagen: '/imagenes/juego2.png',
          cantidad: 1
        }
      ],
      total_compra: 150.00,
      estado: 'completado',
      fecha_compra: '2026-01-20T10:30:00'
    },
    {
      id: 'ped-002-def456',
      productos: [
        {
          id: 'prod-003',
          nombre: 'Netflix Premium 3 Meses',
          imagen: '/imagenes/juego3.png',
          cantidad: 1
        },
        {
          id: 'prod-004',
          nombre: 'Spotify Premium 6 Meses',
          imagen: '/imagenes/juego4.png',
          cantidad: 1
        },
        {
          id: 'prod-005',
          nombre: 'Disney+ 1 Año',
          imagen: '/imagenes/juego5.png',
          cantidad: 2
        }
      ],
      total_compra: 350.00,
      estado: 'procesando',
      fecha_compra: '2026-01-21T14:15:00'
    },
    {
      id: 'ped-003-ghi789',
      productos: [
        {
          id: 'prod-006',
          nombre: 'UC PUBG Mobile 1800',
          imagen: '/imagenes/juego6.png',
          cantidad: 3
        },
        {
          id: 'prod-007',
          nombre: 'Gemas Clash of Clans 2500',
          imagen: '/imagenes/juego7.png',
          cantidad: 1
        },
        {
          id: 'prod-008',
          nombre: 'V-Bucks Fortnite 5000',
          imagen: '/imagenes/juego8.png',
          cantidad: 1
        },
        {
          id: 'prod-009',
          nombre: 'Cod Points 2400',
          imagen: '/imagenes/juego9.png',
          cantidad: 2
        },
        {
          id: 'prod-010',
          nombre: 'Riot Points 3500',
          imagen: '/imagenes/juego10.png',
          cantidad: 1
        }
      ],
      total_compra: 580.00,
      estado: 'pendiente',
      fecha_compra: '2026-01-22T09:20:00'
    }
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

  // FASE 7.6: Mostrar más productos en pedidos
  mostrarMasProductos(pedidoId: string): void {
    const expandidos = new Set(this.pedidosExpandidos());
    expandidos.add(pedidoId);
    this.pedidosExpandidos.set(expandidos);
  }

  mostrarTodosProductos(pedidoId: string): boolean {
    return this.pedidosExpandidos().has(pedidoId);
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
    this.saldoActual.set(this.saldoActual() + monto);
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
