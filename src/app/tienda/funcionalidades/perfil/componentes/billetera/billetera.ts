import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PAQUETES_BILLETERA } from '../../../../../compartido/datos/paquetes-billetera.datos';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import type { PaqueteBilletera } from '../../../../../compartido/datos/paquetes-billetera.datos';
import { BilleteraApiServicio } from '../../../../../nucleo/servicios/billetera-api.servicio';
import { Sesion } from '../../../../../nucleo/servicios/sesion';
import type { TransaccionBilletera } from '../../modelos/perfil.modelo';

/**
 * Billetera del usuario: saldo desde sesión, recargas e historial desde API.
 * Al recargar, navega al checkout con los datos de la recarga.
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

  readonly paquetes = PAQUETES_BILLETERA;

  private billeteraApi = inject(BilleteraApiServicio);
  private notificacion = inject(NotificacionServicio);
  private sesion = inject(Sesion);
  private router = inject(Router);

  ngOnInit(): void {
    const u = this.sesion.usuarioActual();
    if (u?.saldo != null) this.saldoActual.set(u.saldo);
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

  puedeRecargar(): boolean {
    const monto = this.paqueteSeleccionado()?.monto || parseFloat(this.cantidadEspecial());
    return monto > 0;
  }

  /** Navega al checkout con los datos de la recarga. */
  recargarBilletera(): void {
    const monto = this.paqueteSeleccionado()?.monto || parseFloat(this.cantidadEspecial());
    if (!monto || monto <= 0) {
      this.notificacion.advertencia('Selecciona un paquete o ingresa una cantidad');
      return;
    }
    const idUsuario = this.sesion.usuarioActual()?.id;
    if (idUsuario == null) {
      this.notificacion.error('Debes iniciar sesión para recargar');
      return;
    }

    // Navega al checkout con los datos de la recarga
    this.router.navigate(['/checkout'], {
      queryParams: {
        tipo: 'recarga',
        monto: monto,
      },
    });
  }
}
