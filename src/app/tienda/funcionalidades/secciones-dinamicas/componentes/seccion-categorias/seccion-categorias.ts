import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaDestacada, ProductoCategoria } from '../../../../../compartido/modelos/configuracion.modelo';

/** Producto con etiqueta asignada de forma aleatoria para la vista (Nuevo/Oferta). */
export type ProductoCategoriaConEtiqueta = ProductoCategoria & { etiquetaVista?: 'Nuevo' | 'Oferta' };

const CANTIDAD_ETIQUETA_NUEVO = 2;
const CANTIDAD_ETIQUETA_OFERTA = 2;

/** Hash simple y estable a partir del handle para asignar etiquetas de forma determinista. */
function hashHandle(handle: string): number {
  let h = 0;
  for (let i = 0; i < handle.length; i++) {
    h = (h << 5) - h + handle.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

@Component({
  selector: 'app-seccion-categorias',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seccion-categorias.html',
  styleUrl: './seccion-categorias.css',
})
export class SeccionCategorias {
  categoria = input.required<CategoriaDestacada>();

  /** Lista de productos con etiquetas Nuevo/Oferta asignadas de forma estable (2 nuevos, 1-2 ofertas). */
  productosConEtiquetas = computed(() => {
    const lista = this.categoria().productos ?? this.categoria().productosOrdenados ?? [];
    if (lista.length === 0) return [];
    const conHash = lista.map((p) => ({ producto: p, hash: hashHandle(p.handle) }));
    conHash.sort((a, b) => a.hash - b.hash);
    const resultado: ProductoCategoriaConEtiqueta[] = conHash.map(({ producto }) => ({ ...producto }));
    const maxNuevo = Math.min(CANTIDAD_ETIQUETA_NUEVO, resultado.length);
    const maxOferta = Math.min(CANTIDAD_ETIQUETA_OFERTA, Math.max(0, resultado.length - maxNuevo));
    for (let i = 0; i < maxNuevo; i++) resultado[i].etiquetaVista = 'Nuevo';
    for (let i = maxNuevo; i < maxNuevo + maxOferta; i++) resultado[i].etiquetaVista = 'Oferta';
    return resultado;
  });

  obtenerEtiqueta(producto: ProductoCategoriaConEtiqueta): string | null {
    if (producto.etiquetaVista) return producto.etiquetaVista;
    const tieneOferta = producto.precioOferta != null && producto.precioOferta > 0;
    if (tieneOferta) return 'Oferta';
    if (this.esNuevo(producto.fechaCreacion)) return 'Nuevo';
    return null;
  }

  private esNuevo(fechaCreacion: string): boolean {
    const fecha = new Date(fechaCreacion).getTime();
    const haceUnMes = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return fecha >= haceUnMes;
  }

  calcularPorcentajeDescuento(precioBase: number, precioOferta: number | null): number | null {
    if (precioOferta == null || precioOferta <= 0) return null;
    return Math.round(((precioBase - precioOferta) / precioBase) * 100);
  }
}
