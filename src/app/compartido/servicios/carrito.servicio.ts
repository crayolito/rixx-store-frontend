import { Injectable, computed, signal } from '@angular/core';

const CLAVE_CARRITO = 'carrito_tienda';
const VIGENCIA_CARRITO_MS = 2 * 60 * 60 * 1000; // 2 horas

// Modelo de un item del carrito
export interface ItemCarrito {
  id: string;
  imagen: string;
  titulo: string;
  precio: number;
  cantidad: number;
  precioTotal: number;
  varianteId?: string;
  varianteNombre?: string;
  handleProducto?: string;
  camposDinamicos?: Record<string, string>;
  servidor?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CarritoServicio {
  // Estado del carrito usando signals (vacío por defecto o restaurado desde localStorage)
  items = signal<ItemCarrito[]>([]);

  constructor() {
    this.cargarDesdeStorage();
  }

  // Computed: Cantidad total de items (suma de cantidades)
  cantidadItems = computed(() => this.items().reduce((suma, item) => suma + item.cantidad, 0));

  // Computed: Subtotal
  subtotal = computed(() => this.items().reduce((suma, item) => suma + item.precioTotal, 0));

  // Computed: Total
  total = computed(() => this.subtotal());

  // Agregar item al carrito
  agregarItem(item: Omit<ItemCarrito, 'id' | 'precioTotal'>): void {
    const nuevoItem: ItemCarrito = {
      ...item,
      id: `item-${Date.now()}-${Math.random()}`,
      precioTotal: item.precio * item.cantidad,
    };
    this.items.update((items) => [...items, nuevoItem]);
    this.guardarEnStorage();
  }

  // Eliminar item del carrito
  eliminarItem(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
    this.guardarEnStorage();
  }

  // Aumentar cantidad de un item
  aumentarCantidad(id: string): void {
    this.items.update((items) =>
      items.map((item) => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad + 1;
          return {
            ...item,
            cantidad: nuevaCantidad,
            precioTotal: item.precio * nuevaCantidad,
          };
        }
        return item;
      }),
    );
    this.guardarEnStorage();
  }

  // Disminuir cantidad de un item
  disminuirCantidad(id: string): void {
    this.items.update((items) =>
      items.map((item) => {
        if (item.id === id && item.cantidad > 1) {
          const nuevaCantidad = item.cantidad - 1;
          return {
            ...item,
            cantidad: nuevaCantidad,
            precioTotal: item.precio * nuevaCantidad,
          };
        }
        return item;
      }),
    );
    this.guardarEnStorage();
  }

  // Limpiar carrito
  limpiarCarrito(): void {
    this.items.set([]);
    this.guardarEnStorage();
  }

  // Restaura el carrito desde localStorage si no han pasado más de 2 horas
  private cargarDesdeStorage(): void {
    try {
      const raw = localStorage.getItem(CLAVE_CARRITO);
      if (!raw) return;
      const datos = JSON.parse(raw) as { items: ItemCarrito[]; timestamp?: number };
      if (!Array.isArray(datos?.items)) return;
      const timestamp = datos.timestamp ?? 0;
      const vigente = Date.now() - timestamp < VIGENCIA_CARRITO_MS;
      if (!vigente) {
        localStorage.removeItem(CLAVE_CARRITO);
        return;
      }
      this.items.set(datos.items);
    } catch {
      localStorage.removeItem(CLAVE_CARRITO);
    }
  }

  // Guarda el carrito en localStorage con timestamp actual
  private guardarEnStorage(): void {
    const items = this.items();
    if (items.length === 0) {
      localStorage.removeItem(CLAVE_CARRITO);
      return;
    }
    const datos = { items, timestamp: Date.now() };
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(datos));
  }
}
