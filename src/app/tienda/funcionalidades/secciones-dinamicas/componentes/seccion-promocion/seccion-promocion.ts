import { Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemPromocion } from '../../../../../compartido/modelos/configuracion.modelo';

@Component({
  selector: 'app-seccion-promocion',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seccion-promocion.html',
  styleUrl: './seccion-promocion.css',
})
export class SeccionPromocion {
  titulo = input.required<string>();
  items = input.required<ItemPromocion[]>();

  // Referencia al contenedor para calcular el desplazamiento
  contenedorProductos = viewChild<ElementRef>('contenedorProductos');

  desplazamientoProductos = signal(0);
  private readonly anchoItem = 240; // Ancho de cada item + gap
  private readonly gap = 16; // Gap entre items (var(--espaciado-md))

  // Mover productos a la izquierda
  moverProductosIzquierda(): void {
    const desplazamiento = this.desplazamientoProductos();
    const nuevoDesplazamiento = Math.min(0, desplazamiento + (this.anchoItem + this.gap) * 2);
    this.desplazamientoProductos.set(nuevoDesplazamiento);
  }

  // Mover productos a la derecha
  moverProductosDerecha(): void {
    const totalItems = this.items().length;
    const contenedor = this.contenedorProductos()?.nativeElement;
    if (!contenedor) return;

    const anchoContenedor = contenedor.offsetWidth;
    const anchoTotal = totalItems * (this.anchoItem + this.gap);
    const maxDesplazamiento = -(anchoTotal - anchoContenedor + this.gap);

    const desplazamiento = this.desplazamientoProductos();
    const nuevoDesplazamiento = Math.max(
      maxDesplazamiento,
      desplazamiento - (this.anchoItem + this.gap) * 2
    );
    this.desplazamientoProductos.set(nuevoDesplazamiento);
  }
}
