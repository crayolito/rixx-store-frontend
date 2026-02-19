import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { ItemCarrito } from '../../../../compartido/servicios/carrito.servicio';
import { CarritoServicio } from '../../../../compartido/servicios/carrito.servicio';

// FASE 1: Modelos de datos
interface MetodoPago {
  id: string;
  nombre: string;
  descripcion: string;
  logo: string;
  tipo: 'binance' | 'qr-boliviano';
  activo: boolean;
}

interface DatosCliente {
  nombre: string;
  email: string;
  telefono?: string;
}

@Component({
  selector: 'app-checkout-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-pagina.html',
  styleUrl: './checkout-pagina.css',
})
export class CheckoutPagina implements OnInit {
  // FASE 2: Servicios
  private carritoServicio = inject(CarritoServicio);
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  // FASE 3: Estado del carrito
  items = this.carritoServicio.items;
  subtotal = this.carritoServicio.subtotal;
  total = this.carritoServicio.total;

  // FASE 4: Métodos de pago
  readonly metodosPago = signal<MetodoPago[]>([
    {
      id: '1',
      nombre: 'Binance Pay',
      descripcion: 'Pago con criptomoneda | Rápido y seguro | Mundial',
      logo: '/logo-binance.png',
      tipo: 'binance',
      activo: true
    },
    {
      id: '2',
      nombre: 'QR Boliviano',
      descripcion: 'Pago con QR desde tu banco | TC=1$ = 10,7 Bs | Solo Bolivia',
      logo: '/logo-veripagos.svg',
      tipo: 'qr-boliviano',
      activo: true
    }
  ]);

  // FASE 5: Datos del cliente (cargar desde localStorage)
  datosCliente = signal<DatosCliente>({
    nombre: '',
    email: '',
    telefono: ''
  });

  datosClienteTemporal = signal<DatosCliente>({
    nombre: '',
    email: '',
    telefono: ''
  });

  estaEditandoDatos = signal<boolean>(false);

  // FASE 6: Estado del formulario
  metodoPagoSeleccionado = signal<string>('');
  estaProcesando = signal<boolean>(false);
  mostrarQR = signal<boolean>(false);
  tiempoRestante = signal<number>(600); // 10 minutos en segundos
  private intervaloCuentaRegresiva: any = null;

  // FASE 7: Datos del pago (generados después de procesar)
  datosPago = signal<{
    monto: number;
    nota: string;
    idMovimiento: string;
    producto: string;
    metodo: 'binance' | 'qr-boliviano' | null;
  } | null>(null);

  // FASE 8: Computados
  metodoPagoActual = computed(() => {
    const metodoId = this.metodoPagoSeleccionado();
    return this.metodosPago().find(m => m.id === metodoId) || null;
  });

  montoEnUSDT = computed(() => {
    return this.total();
  });

  montoEnBs = computed(() => {
    const tasaCambio = 10.7;
    return this.total() * tasaCambio;
  });

  // FASE 9: Validación del formulario
  formularioValido = computed(() => {
    const datos = this.datosCliente();
    return datos.nombre.trim() !== '' &&
           datos.email.trim() !== '' &&
           this.metodoPagoSeleccionado() !== '';
  });

  // FASE 10: Funciones de acción
  cargarDatosCliente(): void {
    const datosGuardados = localStorage.getItem('datosClienteCheckout');
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados);
        this.datosCliente.set(datos);
      } catch (e) {
        console.error('Error al cargar datos del cliente:', e);
      }
    } else {
      // Datos por defecto de prueba
      const datosPorDefecto: DatosCliente = {
        nombre: 'Juan Pérez García',
        email: 'juan.perez@ejemplo.com',
        telefono: ''
      };
      this.datosCliente.set(datosPorDefecto);
    }
  }

  activarEdicionDatos(): void {
    this.datosClienteTemporal.set({ ...this.datosCliente() });
    this.estaEditandoDatos.set(true);
  }

  cancelarEdicionDatos(): void {
    this.estaEditandoDatos.set(false);
    this.datosClienteTemporal.set({ ...this.datosCliente() });
  }

  guardarDatosCliente(): void {
    this.datosCliente.set({ ...this.datosClienteTemporal() });
    localStorage.setItem('datosClienteCheckout', JSON.stringify(this.datosCliente()));
    this.estaEditandoDatos.set(false);
  }

  actualizarDatosClienteTemporal(campo: keyof DatosCliente, valor: string): void {
    this.datosClienteTemporal.update(datos => ({
      ...datos,
      [campo]: valor
    }));
  }

  seleccionarMetodoPago(id: string): void {
    this.metodoPagoSeleccionado.set(id);
    this.cdr.detectChanges();
  }

  // FASE 11: Procesar pago
  async procesarPago(): Promise<void> {
    if (!this.formularioValido()) {
      alert('Por favor completa todos los campos obligatorios y selecciona un método de pago');
      return;
    }

    if (!this.metodoPagoSeleccionado()) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    this.estaProcesando.set(true);
    this.mostrarQR.set(false);
    this.cdr.detectChanges();

    // Delay de 5 segundos
    await new Promise(resolve => setTimeout(resolve, 5000));

    const metodo = this.metodoPagoActual();
    if (!metodo) {
      this.estaProcesando.set(false);
      this.cdr.detectChanges();
      return;
    }

    // Generar datos del pago
    const nota = Math.floor(100000 + Math.random() * 900000).toString();
    const idMovimiento = Math.floor(100000 + Math.random() * 900000).toString();
    const producto = this.items().map(item => item.titulo).join(', ');

    this.datosPago.set({
      monto: metodo.tipo === 'binance' ? this.montoEnUSDT() : this.montoEnBs(),
      nota,
      idMovimiento,
      producto,
      metodo: metodo.tipo
    });

    this.estaProcesando.set(false);
    this.mostrarQR.set(true);
    this.cdr.detectChanges();

    // Iniciar cuenta regresiva
    this.iniciarCuentaRegresiva();
  }

  // FASE 12: Cuenta regresiva
  iniciarCuentaRegresiva(): void {
    if (this.intervaloCuentaRegresiva) {
      clearInterval(this.intervaloCuentaRegresiva);
    }
    this.intervaloCuentaRegresiva = setInterval(() => {
      const tiempo = this.tiempoRestante();
      if (tiempo <= 0) {
        clearInterval(this.intervaloCuentaRegresiva);
        this.intervaloCuentaRegresiva = null;
        return;
      }
      this.tiempoRestante.update(t => t - 1);
    }, 1000);
  }

  // FASE 13: Formatear tiempo
  formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  }

  // FASE 14: Verificar pago
  verificarPago(): void {
    // TODO: Implementar verificación de pago
    console.log('Verificando pago...');
  }

  // FASE 15: Volver atrás (desde QR)
  volverAtras(): void {
    if (this.intervaloCuentaRegresiva) {
      clearInterval(this.intervaloCuentaRegresiva);
      this.intervaloCuentaRegresiva = null;
    }
    this.mostrarQR.set(false);
    this.estaProcesando.set(false);
    this.datosPago.set(null);
    this.tiempoRestante.set(600);
  }

  // FASE 16: Volver a la página anterior (producto, categoría, etc.)
  volverAlCatalogo(): void {
    if (this.intervaloCuentaRegresiva) {
      clearInterval(this.intervaloCuentaRegresiva);
      this.intervaloCuentaRegresiva = null;
    }
    this.mostrarQR.set(false);
    this.estaProcesando.set(false);
    this.datosPago.set(null);
    this.tiempoRestante.set(600);
    this.metodoPagoSeleccionado.set('');
    this.estaEditandoDatos.set(false);
    this.datosClienteTemporal.set({
      nombre: '',
      email: '',
      telefono: ''
    });
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  tieneDatosAdicionales(item: ItemCarrito): boolean {
    const campos = item.camposDinamicos && Object.keys(item.camposDinamicos).length > 0;
    const servidor = item.servidor?.trim();
    return !!(campos || servidor);
  }

  obtenerDatosAdicionales(item: ItemCarrito): { etiqueta: string; valor: string }[] {
    const datos: { etiqueta: string; valor: string }[] = [];
    if (item.servidor?.trim()) datos.push({ etiqueta: 'Servidor', valor: item.servidor });
    const campos = item.camposDinamicos ?? {};
    Object.entries(campos).forEach(([handle, valor]) => {
      if (handle !== 'servidor' && valor?.trim()) {
        const etiqueta = handle.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        datos.push({ etiqueta, valor });
      }
    });
    return datos;
  }

  // FASE 17: Redirigir si el carrito está vacío y cargar datos
  ngOnInit(): void {
    if (this.items().length === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.cargarDatosCliente();
  }
}
