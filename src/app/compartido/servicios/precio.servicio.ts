import { computed, inject, Injectable } from '@angular/core';
import { Sesion } from '../../nucleo/servicios/sesion';

export interface DatosPrecio {
  precioBase: number | string;
  margenCliente?: number | string | null;
  margenRevendedor?: number | string | null;
}

/**
 * Servicio para calcular precios según el rol del usuario.
 * - Cliente final o sin login: base * (1 + margenCliente/100)
 * - Revendedor: base * (1 + margenRevendedor/100)
 */
@Injectable({ providedIn: 'root' })
export class PrecioServicio {
  private sesion = inject(Sesion);

  /** Rol actual del usuario en minúsculas. */
  readonly rolUsuario = computed(() => (this.sesion.usuarioActual()?.rol ?? '').toLowerCase());

  /** Indica si el usuario actual es revendedor. */
  readonly esRevendedor = computed(() => this.rolUsuario().includes('revendedor'));

  /**
   * Calcula el precio final según el rol del usuario.
   * @param datos Objeto con precioBase, margenCliente y margenRevendedor
   * @returns Precio calculado: base * (1 + margen/100)
   */
  calcularPrecio(datos: DatosPrecio): number {
    const base = typeof datos.precioBase === 'string' 
      ? parseFloat(datos.precioBase) || 0 
      : datos.precioBase || 0;

    if (this.esRevendedor()) {
      const margen = this.parseMargen(datos.margenRevendedor);
      return base * (1 + margen / 100);
    }

    const margen = this.parseMargen(datos.margenCliente);
    return base * (1 + margen / 100);
  }

  /**
   * Calcula el precio para un rol específico (sin depender del usuario actual).
   */
  calcularPrecioParaRol(datos: DatosPrecio, rol: 'cliente' | 'revendedor'): number {
    const base = typeof datos.precioBase === 'string' 
      ? parseFloat(datos.precioBase) || 0 
      : datos.precioBase || 0;

    const margenKey = rol === 'revendedor' ? datos.margenRevendedor : datos.margenCliente;
    const margen = this.parseMargen(margenKey);
    return base * (1 + margen / 100);
  }

  private parseMargen(margen: number | string | null | undefined): number {
    if (margen == null) return 0;
    return typeof margen === 'string' ? parseFloat(margen) || 0 : margen;
  }
}
