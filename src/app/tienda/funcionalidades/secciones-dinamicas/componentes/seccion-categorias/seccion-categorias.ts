import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaDestacada, ProductoCategoria } from '../../../../../compartido/modelos/configuracion.modelo';

@Component({
  selector: 'app-seccion-categorias',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seccion-categorias.html',
  styleUrl: './seccion-categorias.css',
})
export class SeccionCategorias {
  categoria = input.required<CategoriaDestacada>();

  obtenerEtiqueta(producto: ProductoCategoria): string | null {
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
