import { Injectable, computed, signal } from '@angular/core';

// Modelo de un item del carrito
export interface ItemCarrito {
  id: string;
  imagen: string;
  titulo: string;
  precio: number;
  cantidad: number;
  precioTotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoServicio {
  // Estado del carrito usando signals
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

  // Computed: Cantidad total de items (suma de cantidades)
  cantidadItems = computed(() =>
    this.items().reduce((suma, item) => suma + item.cantidad, 0)
  );

  // Computed: Subtotal
  subtotal = computed(() =>
    this.items().reduce((suma, item) => suma + item.precioTotal, 0)
  );

  // Computed: Total
  total = computed(() => this.subtotal());

  // Agregar item al carrito
  agregarItem(item: Omit<ItemCarrito, 'id' | 'precioTotal'>): void {
    const nuevoItem: ItemCarrito = {
      ...item,
      id: `item-${Date.now()}-${Math.random()}`,
      precioTotal: item.precio * item.cantidad
    };
    this.items.update(items => [...items, nuevoItem]);
  }

  // Eliminar item del carrito
  eliminarItem(id: string): void {
    this.items.update(items => items.filter(item => item.id !== id));
  }

  // Aumentar cantidad de un item
  aumentarCantidad(id: string): void {
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

  // Disminuir cantidad de un item
  disminuirCantidad(id: string): void {
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

  // Limpiar carrito
  limpiarCarrito(): void {
    this.items.set([]);
  }
}
