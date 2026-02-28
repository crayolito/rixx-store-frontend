import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { PAQUETES_BILLETERA } from '../../../../../compartido/datos/paquetes-billetera.datos';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import type { PaqueteBilletera } from '../../../../../compartido/datos/paquetes-billetera.datos';
import { BilleteraApiServicio } from '../../../../../nucleo/servicios/billetera-api.servicio';
import type { MetodoPagoUINormalizado } from '../../../../../nucleo/servicios/metodos-pago-api.servicio';
import { MetodosPagoApiServicio } from '../../../../../nucleo/servicios/metodos-pago-api.servicio';
import { Sesion } from '../../../../../nucleo/servicios/sesion';
import type { TransaccionBilletera } from '../../modelos/perfil.modelo';

/**
 * Billetera del usuario: saldo desde sesión, recargas e historial desde API.
 */
@Component({
  selector: 'app-billetera',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billetera.html',
  styleUrl: './billetera.css',
})
export class Billetera implements OnInit {
  transaccionesBilletera = signal<TransaccionBilletera[]>([]);
  saldoActual = signal(0);
  paqueteSeleccionado = signal<PaqueteBilletera | null>(null);
  cantidadEspecial = signal('');
  metodoPagoSeleccionado = signal<number | null>(null);
  recargando = signal(false);

  readonly paquetes = PAQUETES_BILLETERA;
  metodosPago = signal<MetodoPagoUINormalizado[]>([]);

  private billeteraApi = inject(BilleteraApiServicio);
  private metodosPagoApi = inject(MetodosPagoApiServicio);
  private notificacion = inject(NotificacionServicio);
  private sesion = inject(Sesion);

  ngOnInit(): void {
    const u = this.sesion.usuarioActual();
    if (u?.saldo != null) this.saldoActual.set(u.saldo);
    this.metodosPagoApi.listar(true).subscribe({
      next: (lista) => this.metodosPago.set(lista),
      error: () => this.notificacion.error('No se pudieron cargar los métodos de pago'),
    });
    this.cargarHistorial();
  }

  /** Carga el historial de transacciones desde la API. */
  cargarHistorial(): void {
    this.billeteraApi.listarTransacciones({ limite: 50 }).subscribe({
      next: (datos) => {
        const lista = (datos?.datos ?? []).map((t) => ({
          id: String(t.id_transaccion),
          fecha: t.fecha_creacion,
          tipo: t.tipo as 'recarga' | 'compra' | 'reembolso',
          descripcion: t.descripcion ?? t.tipo,
          monto: t.tipo === 'recarga' ? t.monto : -t.monto,
          saldoResultante: t.saldo_nuevo,
        }));
        this.transaccionesBilletera.set(lista);
      },
      error: () => {},
    });
  }

  seleccionarPaquete(paquete: PaqueteBilletera | null): void {
    this.paqueteSeleccionado.set(paquete);
    if (paquete) this.cantidadEspecial.set('');
  }

  actualizarCantidadEspecial(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.cantidadEspecial.set(target.value);
    if (target.value) this.paqueteSeleccionado.set(null);
  }

  seleccionarMetodoPago(idMetodo: number): void {
    this.metodoPagoSeleccionado.set(idMetodo);
  }

  puedeRecargar(): boolean {
    const monto = this.paqueteSeleccionado()?.monto || parseFloat(this.cantidadEspecial());
    return monto > 0 && this.metodoPagoSeleccionado() != null && !this.recargando();
  }

  recargarBilletera(): void {
    const monto = this.paqueteSeleccionado()?.monto || parseFloat(this.cantidadEspecial());
    if (!monto || monto <= 0) {
      this.notificacion.advertencia('Selecciona un paquete o ingresa una cantidad');
      return;
    }
    if (this.metodoPagoSeleccionado() == null) {
      this.notificacion.advertencia('Selecciona un método de pago');
      return;
    }
    const idUsuario = this.sesion.usuarioActual()?.id;
    if (idUsuario == null) {
      this.notificacion.error('Debes iniciar sesión para recargar');
      return;
    }
    this.recargando.set(true);
    this.billeteraApi
      .crearTransaccion({
        idUsuario,
        tipo: 'recarga',
        monto,
        descripcion: 'Recarga billetera',
      })
      .subscribe({
        next: (resp) => {
          this.recargando.set(false);
          if (resp.datos?.saldo_nuevo != null) {
            this.sesion.actualizarSaldo(resp.datos.saldo_nuevo);
            this.saldoActual.set(resp.datos.saldo_nuevo);
          } else {
            this.saldoActual.update((s) => s + monto);
          }
          const tx = resp.datos;
          if (tx) {
            this.transaccionesBilletera.update((list) => [
              {
                id: String(tx.id_transaccion),
                fecha: tx.fecha_creacion,
                tipo: 'recarga',
                descripcion: tx.descripcion ?? 'Recarga billetera',
                monto: tx.monto,
                saldoResultante: tx.saldo_nuevo,
              },
              ...list,
            ]);
          }
          this.notificacion.exito(`Se recargaron $${monto} USD a tu billetera`);
          this.paqueteSeleccionado.set(null);
          this.cantidadEspecial.set('');
          this.metodoPagoSeleccionado.set(null);
        },
        error: (err) => {
          this.recargando.set(false);
          this.notificacion.error(err?.error?.mensaje ?? 'Error al procesar la recarga');
        },
      });
  }
}
