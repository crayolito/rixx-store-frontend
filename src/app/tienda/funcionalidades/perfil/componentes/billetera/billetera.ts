import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { METODOS_PAGO } from '../../../../../compartido/datos/metodos-pago.datos';
import { PAQUETES_BILLETERA } from '../../../../../compartido/datos/paquetes-billetera.datos';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import type { PaqueteBilletera } from '../../../../../compartido/datos/paquetes-billetera.datos';
import type { TransaccionBilletera } from '../../modelos/perfil.modelo';

/**
 * Billetera del usuario: saldo, paquetes de recarga, métodos de pago e historial.
 * Gestiona recargas de forma local (pendiente integración con API).
 */
@Component({
  selector: 'app-billetera',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billetera.html',
  styleUrl: './billetera.css',
})
export class Billetera {
  transaccionesBilletera = signal<TransaccionBilletera[]>([]);
  saldoActual = signal(0);
  paqueteSeleccionado = signal<PaqueteBilletera | null>(null);
  cantidadEspecial = signal('');
  metodoPagoSeleccionado = signal('');

  readonly paquetes = PAQUETES_BILLETERA;
  readonly metodosPago = METODOS_PAGO;

  private notificacion = inject(NotificacionServicio);

  seleccionarPaquete(paquete: PaqueteBilletera | null): void {
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
      this.notificacion.advertencia('Selecciona un paquete o ingresa una cantidad');
      return;
    }
    if (!this.metodoPagoSeleccionado()) {
      this.notificacion.advertencia('Selecciona un método de pago');
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
      saldoResultante: nuevoSaldo,
    });
    this.transaccionesBilletera.set(transacciones);
    this.notificacion.exito(`Se recargaron $${monto} USD a tu billetera`);
    this.paqueteSeleccionado.set(null);
    this.cantidadEspecial.set('');
    this.metodoPagoSeleccionado.set('');
  }
}
