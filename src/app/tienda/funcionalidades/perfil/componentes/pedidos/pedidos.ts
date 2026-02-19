import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Modal } from '../../../../../compartido/componentes/modal/modal';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import type { PedidoAutomatico, PedidoGiftCard } from '../../modelos/perfil.modelo';

/**
 * Listado de pedidos: recarga directa y Gift Cards.
 * Incluye filtros, expansión de productos y modal de verificación para códigos.
 */
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, Modal],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  /** Pedidos de compra directa/recarga */
  pedidosAutomaticos = input<PedidoAutomatico[]>([]);
  /** Pedidos de Gift Card */
  pedidosGiftCard = input<PedidoGiftCard[]>([]);

  tipoPedidoVista = signal<'recarga_directa' | 'gift_cards'>('recarga_directa');
  filtroFechaDesde = signal('');
  filtroFechaHasta = signal('');
  filtroNombreProducto = signal('');
  pedidosExpandidos = signal<Set<string>>(new Set());
  modalVerificarIdentidadAbierto = signal(false);
  contrasenaVerificacion = signal('');
  identidadVerificada = signal(false);

  readonly limiteProductosVisibles = 2;

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

  private router = inject(Router);
  private notificacion = inject(NotificacionServicio);

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
      this.notificacion.advertencia('Ingresa tu contraseña');
      return;
    }
    this.identidadVerificada.set(true);
    this.cerrarModalVerificarIdentidad();
    this.notificacion.exito('Identidad verificada correctamente');
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
      pedido.instrucciones ? `Instrucciones: ${pedido.instrucciones}` : '',
    ];
    navigator.clipboard.writeText(lineas.filter(Boolean).join('\n')).then(() =>
      this.notificacion.exito('Copiado al portapapeles')
    );
  }

  copiarCodigoIndividual(texto: string): void {
    navigator.clipboard.writeText(texto).then(() =>
      this.notificacion.exito('Código copiado al portapapeles')
    );
  }
}
