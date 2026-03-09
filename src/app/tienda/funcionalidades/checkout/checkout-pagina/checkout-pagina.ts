import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificacionToast } from '../../../../compartido/componentes/notificacion-toast/notificacion-toast';
import { CrearPedidoCuerpo } from '../../../../compartido/modelos/pedido.modelo';
import type { ItemCarrito } from '../../../../compartido/servicios/carrito.servicio';
import { CarritoServicio } from '../../../../compartido/servicios/carrito.servicio';
import { NotificacionServicio } from '../../../../compartido/servicios/notificacion';
import { BilleteraApiServicio } from '../../../../nucleo/servicios/billetera-api.servicio';
import { MetodosPagoApiServicio, type MetodoPagoUINormalizado } from '../../../../nucleo/servicios/metodos-pago-api.servicio';
import { PedidosApiServicio } from '../../../../nucleo/servicios/pedidos-api.servicio';
import { Sesion } from '../../../../nucleo/servicios/sesion';

interface DatosCliente {
  nombre: string;
  email: string;
  telefono?: string;
}

@Component({
  selector: 'app-checkout-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificacionToast],
  templateUrl: './checkout-pagina.html',
  styleUrl: './checkout-pagina.css',
})
export class CheckoutPagina implements OnInit, OnDestroy {
  // FASE 2: Servicios
  private carritoServicio = inject(CarritoServicio);
  private metodosPagoApi = inject(MetodosPagoApiServicio);
  private billeteraApi = inject(BilleteraApiServicio);
  private pedidosApi = inject(PedidosApiServicio);
  private notificacion = inject(NotificacionServicio);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private sesion = inject(Sesion);

  // Modo recarga de billetera (viene desde la página de billetera)
  esRecarga = signal(false);
  montoRecarga = signal(0);

  items = this.carritoServicio.items;
  subtotal = this.carritoServicio.subtotal;

  /** Total a pagar: si es recarga usa montoRecarga, sino usa el total del carrito. */
  total = computed(() => {
    if (this.esRecarga()) {
      return this.montoRecarga();
    }
    return this.carritoServicio.total();
  });

  readonly metodosPago = signal<MetodoPagoUINormalizado[]>([]);

  // FASE 5: Datos del cliente (cargar desde localStorage)
  datosCliente = signal<DatosCliente>({
    nombre: '',
    email: '',
    telefono: '',
  });

  datosClienteTemporal = signal<DatosCliente>({
    nombre: '',
    email: '',
    telefono: '',
  });

  estaEditandoDatos = signal<boolean>(false);

  metodoPagoSeleccionado = signal<number | null>(null);
  estaProcesando = signal<boolean>(false);
  mostrarQR = signal<boolean>(false);
  tiempoRestante = signal<number>(600); // 10 minutos en segundos
  private intervaloCuentaRegresiva: any = null;
  private intervaloVerificacion: any = null;
  estadoPago = signal<'esperando' | 'pagado' | 'expirado' | 'cancelado' | 'error' | null>(null);
  qrImagen = signal<string | null>(null);

  // FASE 7: Datos del pago (generados después de procesar)
  datosPago = signal<{
    monto: number;
    nota: string;
    idMovimiento: string | null;
    producto: string;
    metodo: 'binance' | 'qr-boliviano' | null;
    moneda?: string;
    montoOriginal?: number;
    monedaOriginal?: string;
    tipoCambioAplicado?: number;
  } | null>(null);

  metodoPagoActual = computed(() => {
    const id = this.metodoPagoSeleccionado();
    return id == null ? null : this.metodosPago().find((m) => m.id_metodo_pago === id) ?? null;
  });

  /** Saldo actual del usuario en billetera. */
  saldoBilletera = computed(() => this.sesion.usuarioActual()?.saldo ?? 0);

  /** Indica si el usuario tiene saldo suficiente para pagar. */
  tieneSaldoSuficiente = computed(() => this.saldoBilletera() >= this.total());

  /** Indica si se seleccionó pagar con billetera. */
  pagarConBilletera = signal(false);

  /** Monto en USDT (total a pagar). */
  montoEnUSDT = computed(() => this.total());

  /** Monto en Bs según tipo de cambio del método seleccionado. */
  montoEnBs = computed(() => {
    const metodo = this.metodoPagoActual();
    const tasa = metodo?.tipo_cambio ?? 10.7;
    return this.total() * tasa;
  });

  // FASE 9: Validación del formulario
  formularioValido = computed(() => {
    const datos = this.datosCliente();
    return datos.nombre.trim() !== '' && datos.email.trim() !== '';
  });

  // Indica si hay un método de pago válido seleccionado (billetera o método externo)
  tieneMetodoPagoValido = computed(() => {
    return this.pagarConBilletera() || this.metodoPagoActual() != null;
  });

  // Indica si se puede procesar el pago
  puedeConfirmarPedido = computed(() => {
    if (!this.tieneMetodoPagoValido()) return false;
    if (this.esRecarga()) return true;
    // Para compras normales: validar formulario y que haya items
    return this.formularioValido() && this.items().length > 0;
  });

  // FASE 10: Funciones de acción
  // Carga los datos del cliente: prioridad sesión > localStorage > vacíos
  cargarDatosCliente(): void {
    const usuario = this.sesion.usuarioActual();
    if (usuario?.nombre && usuario?.email) {
      this.datosCliente.set({
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono ?? '',
      });
      return;
    }
    const datosGuardados = localStorage.getItem('datosClienteCheckout');
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados) as DatosCliente;
        this.datosCliente.set(datos);
      } catch (e) {
        console.error('Error al cargar datos del cliente:', e);
        this.datosCliente.set({ nombre: '', email: '', telefono: '' });
      }
    } else {
      this.datosCliente.set({ nombre: '', email: '', telefono: '' });
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
    this.datosClienteTemporal.update((datos) => ({
      ...datos,
      [campo]: valor,
    }));
  }

  seleccionarMetodoPago(idMetodo: number): void {
    this.metodoPagoSeleccionado.set(idMetodo);
    this.pagarConBilletera.set(false);
    this.cdr.detectChanges();
  }

  /** Selecciona pagar con saldo de billetera. */
  seleccionarPagoBilletera(): void {
    this.pagarConBilletera.set(true);
    this.metodoPagoSeleccionado.set(null);
    this.cdr.detectChanges();
  }

  // FASE 11: Confirmar pedido o iniciar flujo de pago externo
  procesarPago(): void {
    // Prevenir múltiples clics
    if (this.estaProcesando()) {
      return;
    }

    // Validaciones: solo notificación toast (no aplica para recarga)
    if (!this.esRecarga() && !this.formularioValido()) {
      this.notificacion.advertencia('Completa todos los campos obligatorios.');
      return;
    }

    // Marcar como procesando ANTES de hacer cualquier cosa
    this.estaProcesando.set(true);
    this.cdr.detectChanges();

    try {
      // Si eligió pagar con billetera
      if (this.pagarConBilletera()) {
        if (this.esRecarga()) {
          this.notificacion.advertencia('No puedes recargar billetera con saldo de billetera.');
          this.estaProcesando.set(false);
          return;
        }
        this.procesarPagoConBilletera();
        return;
      }

      const metodo = this.metodoPagoActual();

      // Si no hay método seleccionado, mostrar error
      if (!metodo) {
        this.notificacion.advertencia('Selecciona un método de pago.');
        this.estaProcesando.set(false);
        return;
      }

      // Según el identificador / nombre del método, decidimos el flujo
      if (this.esMetodoBinance(metodo)) {
        this.iniciarPagoBinance();
      } else if (this.esMetodoVeripagos(metodo)) {
        this.iniciarPagoVeripagos();
      } else {
        // Método de pago no soportado
        this.notificacion.error('Método de pago no soportado.');
        this.estaProcesando.set(false);
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      this.estaProcesando.set(false);
      this.cdr.detectChanges();
      this.notificacion.error('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
    }
  }

  /** Procesa el pago descontando del saldo de billetera. */
  private procesarPagoConBilletera(): void {
    if (!this.tieneSaldoSuficiente()) {
      this.notificacion.advertencia('Saldo insuficiente en tu billetera.');
      this.estaProcesando.set(false);
      return;
    }

    const fecha = new Date();
    const numeroPedido = `PED-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;
    const primerItem = this.items()[0];
    const descripcion = primerItem 
      ? `Compra: ${primerItem.titulo}${this.items().length > 1 ? ` y ${this.items().length - 1} más` : ''}`
      : `Orden ${numeroPedido}`;

    // Primero descontamos del saldo
    this.billeteraApi.compraConBilletera({
      monto: this.total(),
      descripcion,
      idPedido: null,
    }).subscribe({
      next: (resp) => {
        if (resp.datos?.saldo_nuevo != null) {
          this.sesion.actualizarSaldo(resp.datos.saldo_nuevo);
        }
        // Ahora creamos el pedido
        this.crearPedidoTrasPagoBilletera(numeroPedido);
      },
      error: (err) => {
        console.error('Error al procesar pago con billetera:', err);
        this.estaProcesando.set(false);
        this.cdr.detectChanges();
        const mensajeError = err?.error?.mensaje || err?.message || 'Error desconocido';
        this.notificacion.error(`No se pudo procesar el pago: ${mensajeError}`);
      },
    });
  }

  /** Crea el pedido después de descontar de billetera. */
  private crearPedidoTrasPagoBilletera(numeroPedido: string): void {
    try {
      const detalles = this.items().map((item: ItemCarrito) => {
        const idPrecio = item.varianteId ? parseInt(item.varianteId, 10) : 0;
        return {
          idPrecio: idPrecio || 1,
          idCodigo: null,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.precioTotal,
          valoresCampos: item.camposDinamicos ?? (item.servidor ? { servidor: item.servidor } : {}),
        };
      });

      const idUsuario = this.sesion.usuarioActual()?.id || 1;

      const cuerpo: CrearPedidoCuerpo = {
        idUsuario: idUsuario,
        numeroPedido: numeroPedido,
        subtotal: this.subtotal(),
        descuento: 0,
        total: this.total(),
        idMetodoPago: null,
        notaInterna: `Pago con billetera - Cliente: ${this.datosCliente().nombre} - ${this.datosCliente().email}`,
        detalles: detalles,
      };

      this.pedidosApi.crearPedido(cuerpo).subscribe({
        next: () => {
          this.carritoServicio.limpiarCarrito();
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
          this.notificacion.exito('¡Pago exitoso! Tu pedido ha sido registrado.');
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error al crear pedido tras pago con billetera:', error);
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
          const mensajeError = error?.error?.mensaje || error?.message || 'Error desconocido';
          this.notificacion.error(
            `El pago se realizó pero hubo un problema al registrar el pedido: ${mensajeError}. Contacta a soporte.`,
          );
        },
      });
    } catch (error) {
      console.error('Error al crear pedido tras pago con billetera:', error);
      this.estaProcesando.set(false);
      this.cdr.detectChanges();
      this.notificacion.error('El pago se realizó pero ocurrió un error al crear el pedido. Contacta a soporte.');
    }
  }

  /** Finaliza la recarga de billetera después de confirmar el pago. */
  finalizarRecarga(): void {
    const monto = this.montoRecarga();
    const metodo = this.metodoPagoActual();
    const descripcion = metodo?.nombre 
      ? `Recarga con ${metodo.nombre}` 
      : 'Recarga de billetera';

    this.billeteraApi.recargarBilletera({ monto, descripcion }).subscribe({
      next: (resp) => {
        if (resp.datos?.saldo_nuevo != null) {
          this.sesion.actualizarSaldo(resp.datos.saldo_nuevo);
        }
        this.notificacion.exito(`¡Recarga exitosa! Se agregaron $${monto.toFixed(2)} USD a tu billetera.`);
        this.router.navigate(['/perfil'], { queryParams: { seccion: 'billetera' } });
      },
      error: (err) => {
        console.error('Error al registrar recarga:', err);
        this.notificacion.error('El pago se recibió pero hubo un error al actualizar el saldo. Contacta soporte.');
      },
    });
  }

  // Identifica si el método seleccionado corresponde a Binance Pay
  private esMetodoBinance(metodo: MetodoPagoUINormalizado | null): boolean {
    if (!metodo) return false;
    const nombre = metodo.nombre.toLowerCase();
    return metodo.tipo === 'binance' || metodo.id_metodo_pago === 1 || nombre.includes('binance');
  }

  // Identifica si el método seleccionado corresponde a Veripagos / QR boliviano
  private esMetodoVeripagos(metodo: MetodoPagoUINormalizado | null): boolean {
    if (!metodo) return false;
    const nombre = metodo.nombre.toLowerCase();
    return (
      metodo.tipo === 'qr-boliviano' ||
      metodo.tipo === 'veripagos' ||
      metodo.id_metodo_pago === 2 ||
      nombre.includes('qr') ||
      nombre.includes('veripagos')
    );
  }

  // Crea el pedido inmediatamente (métodos que no requieren verificación externa)
  private crearPedidoDirecto(): void {
    try {
      const fecha = new Date();
      const numeroPedido = `PED-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;

      const detalles = this.items().map((item: ItemCarrito) => {
        const idPrecio = item.varianteId ? parseInt(item.varianteId, 10) : 0;

        return {
          idPrecio: idPrecio || 1,
          idCodigo: null,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.precioTotal,
          valoresCampos: item.camposDinamicos ?? (item.servidor ? { servidor: item.servidor } : {}),
        };
      });

      const idUsuario = this.sesion.usuarioActual()?.id || 1;

      const cuerpo: CrearPedidoCuerpo = {
        idUsuario: idUsuario,
        numeroPedido: numeroPedido,
        subtotal: this.subtotal(),
        descuento: 0,
        total: this.total(),
        idMetodoPago: this.metodoPagoSeleccionado(),
        notaInterna: `Cliente: ${this.datosCliente().nombre} - ${this.datosCliente().email}`,
        detalles: detalles,
      };

      this.pedidosApi.crearPedido(cuerpo).subscribe({
        next: () => {
          this.carritoServicio.limpiarCarrito();
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
          this.notificacion.exito('Pedido registrado correctamente.');
        },
        error: (error) => {
          console.error('Error al crear pedido:', error);
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
          const mensajeError = error?.error?.mensaje || error?.message || 'Error desconocido';
          this.notificacion.error(
            `No se pudo crear el pedido: ${mensajeError}. Revisa los datos e intenta de nuevo.`,
          );
        },
      });
    } catch (error) {
      console.error('Error al crear pedido directo:', error);
      this.estaProcesando.set(false);
      this.cdr.detectChanges();
      this.notificacion.error('Ocurrió un error inesperado al crear el pedido.');
    }
  }

  // Inicia el flujo de pago con Binance Pay
  private iniciarPagoBinance(): void {
    const metodo = this.metodoPagoActual();
    if (!metodo) {
      this.notificacion.advertencia('Selecciona un método de pago válido.');
      this.estaProcesando.set(false);
      return;
    }

    const fecha = new Date();
    const primerItem = this.items()[0];
    const idPrecio = primerItem?.varianteId ? parseInt(primerItem.varianteId, 10) : 0;
    const cantidad = primerItem?.cantidad ?? 1;

    this.notificacion.info('Estamos generando tu pago con Binance, esto puede tardar unos segundos...');

    this.metodosPagoApi
      .prepararPagoBinance({
        idMetodoPago: metodo.id_metodo_pago,
        idPrecio: idPrecio || 1,
        cantidad,
        moneda: 'USDT',
      })
      .subscribe({
        next: (datosRespuesta) => {
          if (!datosRespuesta) {
            throw new Error('Respuesta vacía al preparar pago Binance');
          }
          const tipoCambioBinance = datosRespuesta.tipo_cambio ?? metodo.tipo_cambio;
          this.datosPago.set({
            monto: datosRespuesta.monto,
            nota: datosRespuesta.codigo,
            idMovimiento: null,
            producto: 'Compra en tienda',
            metodo: 'binance',
            moneda: datosRespuesta.moneda,
            montoOriginal: this.total(),
            monedaOriginal: 'USD',
            tipoCambioAplicado: tipoCambioBinance,
          });
          this.qrImagen.set(this.normalizarQrImagen(datosRespuesta.qrImagen));
          this.mostrarQR.set(true);
          this.estadoPago.set('esperando');
          this.tiempoRestante.set(600);
          this.iniciarCuentaRegresiva();
          this.iniciarVerificacionBinance();
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al preparar pago Binance:', error);
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
          const mensajeError = error?.error?.mensaje || error?.message || 'No se pudo preparar el pago Binance.';
          this.notificacion.error(mensajeError);
        },
      });
  }

  // Inicia el flujo de pago con VeriPagos (QR boliviano)
  private iniciarPagoVeripagos(): void {
    const metodo = this.metodoPagoActual();
    if (!metodo) {
      this.notificacion.advertencia('Selecciona un método de pago válido.');
      this.estaProcesando.set(false);
      return;
    }

    const fecha = new Date();
    const numeroPedido = `PED-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;
    const primerItem = this.items()[0];
    const detalle = primerItem ? `Orden ${numeroPedido} - ${primerItem.titulo}` : `Orden ${numeroPedido}`;
    const idPrecio = primerItem?.varianteId ? parseInt(primerItem.varianteId, 10) : 0;
    const cantidad = primerItem?.cantidad ?? 1;

    this.notificacion.info('Estamos generando tu QR de pago, esto puede tardar unos segundos...');

    this.metodosPagoApi
      .generarQrVeripagos({
        idMetodoPago: metodo.id_metodo_pago,
        idPrecio: idPrecio || 1,
        cantidad,
        data: {
          numeroPedido,
          totalUsd: this.total(),
        },
        vigencia: '0/00:10',
        usoUnico: true,
      })
      .subscribe({
        next: (datos) => {
          if (!datos) {
            throw new Error('Respuesta vacía al generar QR VeriPagos');
          }
          const montoOriginal = datos.monto ?? this.total();
          const tipoCambioRespuesta = datos.tipo_cambio;
          const montoBs =
            datos.monto_convertido ??
            (tipoCambioRespuesta != null ? montoOriginal * tipoCambioRespuesta : this.montoEnBs());
          const tipoCambioConfigurado = metodo.tipo_cambio;
          const tipoCambioAplicado =
            tipoCambioRespuesta ??
            tipoCambioConfigurado ??
            (montoOriginal > 0 ? Number((montoBs / montoOriginal).toFixed(4)) : undefined);
          this.datosPago.set({
            monto: montoBs,
            nota: '',
            idMovimiento: String(datos?.movimiento_id ?? ''),
            producto: detalle,
            metodo: 'qr-boliviano',
            montoOriginal,
            monedaOriginal: 'USD',
            tipoCambioAplicado,
          });
          this.qrImagen.set(this.normalizarQrImagen(datos.qr));
          this.mostrarQR.set(true);
          this.estadoPago.set('esperando');
          this.tiempoRestante.set(600);
          this.iniciarCuentaRegresiva();
          this.iniciarVerificacionVeripagos();
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al generar QR VeriPagos:', error);
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
          const mensajeError = error?.error?.mensaje || error?.message || 'No se pudo generar el QR de pago.';
          this.notificacion.error(mensajeError);
        },
      });
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
        this.estadoPago.set('expirado');
        this.notificacion.advertencia(
          'El tiempo para realizar el pago (10 minutos) ha expirado. Te devolveremos al checkout para que lo intentes de nuevo.',
        );
        this.detenerVerificacionPago();
        this.volverAtras();
        return;
      }
      this.tiempoRestante.update((t) => t - 1);
    }, 1000);
  }

  // FASE 13: Formatear tiempo
  formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    const mm = minutos.toString().padStart(2, '0');
    const ss = segs.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  // FASE 14: Verificar pago
  verificarPago(): void {
    const datos = this.datosPago();
    const metodo = this.metodoPagoActual();

    if (!datos || !metodo) {
      this.notificacion.advertencia('No hay un pago pendiente para verificar.');
      return;
    }

    if (datos.metodo === 'binance') {
      this.verificarPagoBinanceUnaVez();
    } else if (datos.metodo === 'qr-boliviano') {
      this.verificarPagoVeripagosUnaVez();
    }
  }

  private iniciarVerificacionBinance(): void {
    this.detenerVerificacionPago();
    const datos = this.datosPago();
    const metodo = this.metodoPagoActual();
    if (!datos || !metodo) return;

    this.intervaloVerificacion = setInterval(() => {
      this.metodosPagoApi
        .verificarPagoBinance({
          idMetodoPago: metodo.id_metodo_pago,
          nota: datos.nota,
        })
        .subscribe({
          next: (r) => {
            if (r.exito && r.pagado) {
              this.estadoPago.set('pagado');
              this.detenerVerificacionPago();
              this.finalizarPedidoTrasPagoExterno();
            }
          },
          error: (error) => {
            console.error('Error al verificar pago Binance:', error);
          },
        });
    }, 30000);
  }

  private verificarPagoBinanceUnaVez(): void {
    const datos = this.datosPago();
    const metodo = this.metodoPagoActual();
    if (!datos || !metodo) return;

    this.metodosPagoApi
      .verificarPagoBinance({
        idMetodoPago: metodo.id_metodo_pago,
        nota: datos.nota,
      })
      .subscribe({
        next: (r) => {
          if (r.exito && r.pagado) {
            this.estadoPago.set('pagado');
            this.detenerVerificacionPago();
            this.finalizarPedidoTrasPagoExterno();
          } else {
            this.notificacion.advertencia('Aún no se registra tu pago en Binance. Intenta de nuevo en unos segundos.');
          }
        },
        error: (error) => {
          console.error('Error al verificar pago Binance (manual):', error);
          this.notificacion.error('No se pudo verificar el pago en este momento. Intenta nuevamente.');
        },
      });
  }

  private iniciarVerificacionVeripagos(): void {
    this.detenerVerificacionPago();
    const datos = this.datosPago();
    const metodo = this.metodoPagoActual();
    if (!datos || !metodo || !datos.idMovimiento) return;

    const movimientoId = datos.idMovimiento;

    this.intervaloVerificacion = setInterval(() => {
      this.metodosPagoApi
        .verificarQrVeripagos({
          idMetodoPago: metodo.id_metodo_pago,
          movimientoId,
        })
        .subscribe({
          next: (r) => {
            const estado = (r.datos?.estado ?? '').toString().toLowerCase();
            if (r.exito && r.pagado && estado === 'completado') {
              this.estadoPago.set('pagado');
              this.detenerVerificacionPago();
              this.finalizarPedidoTrasPagoExterno();
            }
          },
          error: (error) => {
            console.error('Error al verificar QR VeriPagos:', error);
          },
        });
    }, 30000);
  }

  private verificarPagoVeripagosUnaVez(): void {
    const datos = this.datosPago();
    const metodo = this.metodoPagoActual();
    if (!datos || !metodo || !datos.idMovimiento) return;

    const movimientoId = datos.idMovimiento;

    this.metodosPagoApi
      .verificarQrVeripagos({
        idMetodoPago: metodo.id_metodo_pago,
        movimientoId,
      })
      .subscribe({
        next: (r) => {
          const estado = (r.datos?.estado ?? '').toString().toLowerCase();
          if (r.exito && r.pagado && estado === 'completado') {
            this.estadoPago.set('pagado');
            this.detenerVerificacionPago();
            this.finalizarPedidoTrasPagoExterno();
          } else {
            this.notificacion.advertencia('Aún no se registra tu pago con QR. Intenta de nuevo en unos segundos.');
          }
        },
        error: (error) => {
          console.error('Error al verificar QR VeriPagos (manual):', error);
          this.notificacion.error('No se pudo verificar el pago en este momento. Intenta nuevamente.');
        },
      });
  }

  private finalizarPedidoTrasPagoExterno(): void {
    // Si es una recarga, finalizar recarga en lugar de crear pedido
    if (this.esRecarga()) {
      this.finalizarRecarga();
      return;
    }

    try {
      const fecha = new Date();
      const numeroPedido = `PED-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;

      const detalles = this.items().map((item: ItemCarrito) => {
        const idPrecio = item.varianteId ? parseInt(item.varianteId, 10) : 0;

        return {
          idPrecio: idPrecio || 1,
          idCodigo: null,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.precioTotal,
          valoresCampos: item.camposDinamicos ?? (item.servidor ? { servidor: item.servidor } : {}),
        };
      });

      const idUsuario = this.sesion.usuarioActual()?.id || 1;

      const cuerpo: CrearPedidoCuerpo = {
        idUsuario: idUsuario,
        numeroPedido: numeroPedido,
        subtotal: this.subtotal(),
        descuento: 0,
        total: this.total(),
        idMetodoPago: this.metodoPagoSeleccionado(),
        notaInterna: `Cliente: ${this.datosCliente().nombre} - ${this.datosCliente().email}`,
        detalles: detalles,
      };

      this.pedidosApi.crearPedido(cuerpo).subscribe({
        next: () => {
          this.carritoServicio.limpiarCarrito();
          this.mostrarQR.set(false);
          this.estaProcesando.set(false);
          this.tiempoRestante.set(600);
          this.datosPago.set(null);
          this.qrImagen.set(null);
          this.estadoPago.set('pagado');
          this.cdr.detectChanges();
          this.notificacion.exito('Pago recibido y pedido registrado correctamente.');
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error al crear pedido después de pago externo:', error);
          this.estaProcesando.set(false);
          this.cdr.detectChanges();
          const mensajeError = error?.error?.mensaje || error?.message || 'Error desconocido';
          this.notificacion.error(
            `Tu pago se registró, pero hubo un problema al crear el pedido: ${mensajeError}.`,
          );
        },
      });
    } catch (error) {
      console.error('Error al finalizar pedido tras pago externo:', error);
      this.estaProcesando.set(false);
      this.cdr.detectChanges();
      this.notificacion.error('Tu pago se registró, pero ocurrió un error al crear el pedido.');
    }
  }

  private detenerVerificacionPago(): void {
    if (this.intervaloVerificacion) {
      clearInterval(this.intervaloVerificacion);
      this.intervaloVerificacion = null;
    }
  }

  // Normaliza la cadena del QR para que siempre sea una URL válida de imagen
  private normalizarQrImagen(qr: string | null | undefined): string | null {
    if (!qr) return null;
    const limpio = qr.trim();
    if (!limpio) return null;
    if (limpio.startsWith('data:image')) return limpio;
    if (limpio.startsWith('http://') || limpio.startsWith('https://')) return limpio;
    return `data:image/png;base64,${limpio}`;
  }

  // Copia el código de nota de Binance al portapapeles
  copiarCodigoNota(): void {
    const nota = this.datosPago()?.nota;
    if (!nota) {
      this.notificacion.advertencia('No hay un código de nota para copiar.');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(nota)
        .then(() => this.notificacion.exito('Código copiado al portapapeles.'))
        .catch(() => this.notificacion.error('No se pudo copiar el código. Copia el código manualmente.'));
    } else {
      this.notificacion.advertencia('Tu navegador no permite copiar automáticamente. Copia el código manualmente.');
    }
  }

  // FASE 15: Volver atrás (desde QR)
  volverAtras(): void {
    if (this.intervaloCuentaRegresiva) {
      clearInterval(this.intervaloCuentaRegresiva);
      this.intervaloCuentaRegresiva = null;
    }
    this.detenerVerificacionPago();
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
    this.detenerVerificacionPago();
    this.mostrarQR.set(false);
    this.estaProcesando.set(false);
    this.datosPago.set(null);
    this.tiempoRestante.set(600);
    this.metodoPagoSeleccionado.set(null);
    this.estaEditandoDatos.set(false);
    this.datosClienteTemporal.set({
      nombre: '',
      email: '',
      telefono: '',
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

  obtenerPrecioActual(item: ItemCarrito): number {
    return this.carritoServicio.obtenerPrecioActual(item);
  }

  obtenerPrecioTotalActual(item: ItemCarrito): number {
    return this.carritoServicio.obtenerPrecioTotalActual(item);
  }

  ngOnInit(): void {
    // Verificar si es una recarga de billetera (viene con query params)
    this.route.queryParams.subscribe((params) => {
      if (params['tipo'] === 'recarga' && params['monto']) {
        this.esRecarga.set(true);
        this.montoRecarga.set(parseFloat(params['monto']) || 0);
        if (params['metodoPago']) {
          this.metodoPagoSeleccionado.set(parseInt(params['metodoPago'], 10));
        }
      }

      // Si no es recarga y no hay items en el carrito, redirigir al inicio
      if (!this.esRecarga() && this.items().length === 0) {
        this.notificacion.advertencia('Tu carrito está vacío.');
        this.router.navigate(['/']);
        return;
      }
    });

    this.cargarDatosCliente();
    this.metodosPagoApi.listar(true).subscribe({
      next: (lista) => this.metodosPago.set(lista),
      error: () => this.notificacion.error('No se pudieron cargar los métodos de pago'),
    });
  }

  ngOnDestroy(): void {
    if (this.intervaloCuentaRegresiva) {
      clearInterval(this.intervaloCuentaRegresiva);
      this.intervaloCuentaRegresiva = null;
    }
    this.detenerVerificacionPago();
  }
}
