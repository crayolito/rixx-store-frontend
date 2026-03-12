import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificacionToast } from '../../../../compartido/componentes/notificacion-toast/notificacion-toast';

interface DetalleAgradecimiento {
  numeroPedido: string | null;
  total: number | null;
  metodoPago: string | null;
  totalBs?: number | null;
  tipoCambio?: number | null;
  monedaOriginal?: string | null;
}

@Component({
  selector: 'app-gracias-compra-pagina',
  standalone: true,
  imports: [CommonModule, NotificacionToast],
  templateUrl: './gracias-compra-pagina.html',
  styleUrl: './gracias-compra-pagina.css',
})
export class GraciasCompraPagina implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private numeroPedidoInterno = signal<string | null>(null);
  private totalInterno = signal<number | null>(null);
  private metodoPagoInterno = signal<string | null>(null);
  private totalBsInterno = signal<number | null>(null);
  private tipoCambioInterno = signal<number | null>(null);
  private monedaOriginalInterna = signal<string | null>(null);

  detalle = computed<DetalleAgradecimiento>(() => ({
    numeroPedido: this.numeroPedidoInterno(),
    total: this.totalInterno(),
    metodoPago: this.metodoPagoInterno(),
    totalBs: this.totalBsInterno(),
    tipoCambio: this.tipoCambioInterno(),
    monedaOriginal: this.monedaOriginalInterna(),
  }));

  ngOnInit(): void {
    // PASO 1: Intentamos leer desde query params (más estable)
    this.route.queryParams.subscribe((params) => {
      const numeroPedidoParam = params['numeroPedido'] || null;
      const totalParam = params['total'];
      const metodoParam = params['metodoPago'] || params['metodo'] || null;
      const totalBsParam = params['totalBs'];
      const tipoCambioParam = params['tipoCambio'];
      const monedaOriginalParam = params['monedaOriginal'] || null;

      if (numeroPedidoParam) {
        this.numeroPedidoInterno.set(String(numeroPedidoParam));
      }

      if (totalParam != null && totalParam !== '') {
        const totalNumero = Number(totalParam);
        if (!Number.isNaN(totalNumero)) {
          this.totalInterno.set(totalNumero);
        }
      }

      if (metodoParam) {
        this.metodoPagoInterno.set(String(metodoParam));
      }

      if (totalBsParam != null && totalBsParam !== '') {
        const totalBsNumero = Number(totalBsParam);
        if (!Number.isNaN(totalBsNumero)) {
          this.totalBsInterno.set(totalBsNumero);
        }
      }

      if (tipoCambioParam != null && tipoCambioParam !== '') {
        const tipoCambioNumero = Number(tipoCambioParam);
        if (!Number.isNaN(tipoCambioNumero)) {
          this.tipoCambioInterno.set(tipoCambioNumero);
        }
      }

      if (monedaOriginalParam) {
        this.monedaOriginalInterna.set(String(monedaOriginalParam));
      }
    });

    // PASO 2: Como respaldo, usamos el state de navegación si existe
    const navigation = this.router.getCurrentNavigation();
    const stateNavegacion = navigation?.extras?.state as Partial<DetalleAgradecimiento> | undefined;
    const stateHistorial = (typeof window !== 'undefined' ? (window.history.state as Partial<DetalleAgradecimiento>) : undefined) || {};

    const posibleNumero = stateNavegacion?.numeroPedido ?? stateHistorial.numeroPedido;
    const posibleTotal = stateNavegacion?.total ?? stateHistorial.total;
    const posibleMetodo = stateNavegacion?.metodoPago ?? stateHistorial.metodoPago;
    const posibleTotalBs = stateNavegacion?.totalBs ?? stateHistorial.totalBs;
    const posibleTipoCambio = stateNavegacion?.tipoCambio ?? stateHistorial.tipoCambio;
    const posibleMonedaOriginal = stateNavegacion?.monedaOriginal ?? stateHistorial.monedaOriginal;

    if (!this.numeroPedidoInterno() && posibleNumero) {
      this.numeroPedidoInterno.set(String(posibleNumero));
    }
    if (this.totalInterno() == null && posibleTotal != null) {
      const totalNumero = Number(posibleTotal);
      if (!Number.isNaN(totalNumero)) {
        this.totalInterno.set(totalNumero);
      }
    }
    if (!this.metodoPagoInterno() && posibleMetodo) {
      this.metodoPagoInterno.set(String(posibleMetodo));
    }

    if (this.totalBsInterno() == null && posibleTotalBs != null) {
      const totalBsNumero = Number(posibleTotalBs);
      if (!Number.isNaN(totalBsNumero)) {
        this.totalBsInterno.set(totalBsNumero);
      }
    }

    if (this.tipoCambioInterno() == null && posibleTipoCambio != null) {
      const tipoCambioNumero = Number(posibleTipoCambio);
      if (!Number.isNaN(tipoCambioNumero)) {
        this.tipoCambioInterno.set(tipoCambioNumero);
      }
    }

    if (!this.monedaOriginalInterna() && posibleMonedaOriginal) {
      this.monedaOriginalInterna.set(String(posibleMonedaOriginal));
    }

    // Evitamos que el usuario vuelva al checkout con el botón atrás del navegador
    if (typeof window !== 'undefined' && window.history && window.addEventListener) {
      const urlActual = window.location.href;
      window.history.pushState(null, '', urlActual);
      window.addEventListener('popstate', () => {
        this.irAlInicio();
      });
    }
  }

  obtenerTextoMetodo(): string {
    const metodo = this.metodoPagoInterno();
    if (!metodo) return 'Método de pago seleccionado';
    if (metodo === 'billetera') return 'Billetera virtual';
    if (metodo === 'binance') return 'Binance Pay';
    if (metodo === 'qr-boliviano') return 'QR Boliviano';
    return metodo;
  }

  irAlInicio(): void {
    this.router.navigate(['/']);
  }
}

