import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, OnDestroy, OnInit, output, signal } from '@angular/core';

// Define el modelo de un item del carrito
interface ItemCarrito {
  id: string;
  imagen: string;
  titulo: string;
  precio: number;
  cantidad: number;
  precioTotal: number;
}

@Component({
  selector: 'app-drawer-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer-carrito.html',
  styleUrl: './drawer-carrito.css',
})
export class DrawerCarrito implements OnInit, OnDestroy {
  // ENTRADAS Y SALIDAS
  estaAbierto = input<boolean>(false);
  cerrar = output<void>();

  // ESTADO INTERNO
  items = signal<ItemCarrito[]>([
    {
      id: '1',
      imagen: '/imagenes/juego1.png',
      titulo: 'PUBG MOBILE (Global) - 660 UC',
      precio: 299,
      cantidad: 1,
      precioTotal: 299
    },
    {
      id: '2',
      imagen: '/imagenes/juego2.png',
      titulo: 'Call of Duty Mobile - 2400 CP',
      precio: 350,
      cantidad: 2,
      precioTotal: 700
    },
    {
      id: '3',
      imagen: '/imagenes/juego3.png',
      titulo: 'Free Fire MAX - 1080 Diamantes',
      precio: 250,
      cantidad: 1,
      precioTotal: 250
    },
    {
      id: '4',
      imagen: '/imagenes/juego4.png',
      titulo: 'Genshin Impact - 6480 Cristales',
      precio: 420,
      cantidad: 1,
      precioTotal: 420
    },
    {
      id: '5',
      imagen: '/imagenes/juego5.png',
      titulo: 'Apex Legends - 11500 Coins',
      precio: 380,
      cantidad: 3,
      precioTotal: 1140
    },
    {
      id: '6',
      imagen: '/imagenes/juego6.png',
      titulo: 'Clash Royale - 14000 Gemas',
      precio: 299,
      cantidad: 1,
      precioTotal: 299
    },
    {
      id: '7',
      imagen: '/imagenes/juego7.png',
      titulo: 'Fortnite - 13500 V-Bucks',
      precio: 450,
      cantidad: 2,
      precioTotal: 900
    }
  ]);

  // COMPUTED: Calcular totales
  subtotal = computed(() =>
    this.items().reduce((suma, item) => suma + item.precioTotal, 0)
  );

  descuento = computed(() => 0);

  total = computed(() => this.subtotal() - this.descuento());

  cantidadItems = computed(() =>
    this.items().reduce((suma, item) => suma + item.cantidad, 0)
  );

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
    this.items.update(items => items.filter(item => item.id !== id));
  }

  aumentarCantidad(id: string) {
    this.items.update(items =>
      items.map(item => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + 1;
          return {
            ...item,
            cantidad: nuevaCantidad,
            precioTotal: item.precio * nuevaCantidad
          };
        }
        return item;
      })
    );
  }

  disminuirCantidad(id: string) {
    this.items.update(items =>
      items.map(item => {
        if (item.id === id && item.cantidad > 1) {
          const nuevaCantidad = item.cantidad - 1;
          return {
            ...item,
            cantidad: nuevaCantidad,
            precioTotal: item.precio * nuevaCantidad
          };
        }
        return item;
      })
    );
  }

  irAlCheckout() {
    console.log('Ir al checkout con items:', this.items());
  }

  ngOnDestroy() {
    // Limpiar estilos al destruir el componente
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
  }
}
