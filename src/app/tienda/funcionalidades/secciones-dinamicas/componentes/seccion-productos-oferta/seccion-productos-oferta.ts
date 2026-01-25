import { Component, ElementRef, input, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Producto {
  id: string;
  imagen: string;
  titulo: string;
}

@Component({
  selector: 'app-seccion-productos-oferta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seccion-productos-oferta.html',
  styleUrl: './seccion-productos-oferta.css',
})
export class SeccionProductosOferta {
  productos = input.required<Producto[]>();

  @ViewChild('contenedorProductos', { read: ElementRef }) contenedorProductos!: ElementRef;

  desplazamientoProductos = signal(0);
  private anchoProducto = 240;
  private gapProductos = 16;

  moverProductosIzquierda() {
    const nuevoDesplazamiento = this.desplazamientoProductos() + (this.anchoProducto + this.gapProductos);
    const maxDesplazamiento = 0;
    this.desplazamientoProductos.set(Math.min(maxDesplazamiento, nuevoDesplazamiento));
  }

  moverProductosDerecha() {
    const nuevoDesplazamiento = this.desplazamientoProductos() - (this.anchoProducto + this.gapProductos);
    const totalAncho = this.productos().length * (this.anchoProducto + this.gapProductos) - this.gapProductos;
    const minDesplazamiento = -(totalAncho - (this.anchoProducto * 4 + this.gapProductos * 3));
    this.desplazamientoProductos.set(Math.max(minDesplazamiento, nuevoDesplazamiento));
  }
}
