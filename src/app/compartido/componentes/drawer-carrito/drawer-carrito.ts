import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnDestroy, OnInit, output } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoServicio } from '../../servicios/carrito.servicio';

@Component({
  selector: 'app-drawer-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer-carrito.html',
  styleUrl: './drawer-carrito.css',
})
export class DrawerCarrito implements OnInit, OnDestroy {
  // Servicios
  private carritoServicio = inject(CarritoServicio);
  private router = inject(Router);

  // ENTRADAS Y SALIDAS
  estaAbierto = input<boolean>(false);
  cerrar = output<void>();

  // Estado del carrito desde el servicio
  items = this.carritoServicio.items;
  cantidadItems = this.carritoServicio.cantidadItems;
  subtotal = this.carritoServicio.subtotal;
  total = this.carritoServicio.total;

  // Effect para controlar el scroll del body
  private scrollEffect = effect(() => {
    const abierto = this.estaAbierto();

    if (abierto) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY) * -1);
      }
    }
  });

  // MÉTODOS
  ngOnInit() {
    // Effect ya se ejecuta automáticamente
  }

  cerrarDrawer() {
    this.cerrar.emit();
  }

  eliminarItem(id: string) {
    this.carritoServicio.eliminarItem(id);
  }

  aumentarCantidad(id: string) {
    this.carritoServicio.aumentarCantidad(id);
  }

  disminuirCantidad(id: string) {
    this.carritoServicio.disminuirCantidad(id);
  }

  irAlCheckout() {
    this.cerrarDrawer();
    this.router.navigate(['/checkout']);
  }

  ngOnDestroy() {
    // Limpiar estilos al destruir el componente
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
  }
}
