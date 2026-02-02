import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRODUCTOS } from '../../../../../compartido/datos/productos.datos';
import type { Producto } from '../../../../../compartido/datos/productos.datos';
import {
  ConfiguracionGlobal,
  ConfiguracionPromocion,
  ItemPromocion,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';

const CLAVE_CONFIGURACION_GLOBAL = 'configuracion-global';
const MIN_ITEMS = 5;
const MAX_ITEMS = 12;
const PRODUCTOS_POR_PAGINA = 10;

@Component({
  selector: 'app-promocion-admin-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './promocion-admin-pagina.html',
  styleUrl: './promocion-admin-pagina.css',
})
export class PromocionAdminPagina implements OnInit {
  private notificacion = inject(NotificacionServicio);

  readonly productosDisponibles = PRODUCTOS;
  readonly minItems = MIN_ITEMS;
  readonly maxItems = MAX_ITEMS;
  readonly productosPorPagina = PRODUCTOS_POR_PAGINA;

  titulo = signal('');
  items = signal<ItemPromocion[]>([]);
  textoBusqueda = signal('');
  paginaActual = signal(1);

  setBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  productosFiltrados = computed(() => {
    const texto = this.textoBusqueda().trim().toLowerCase();
    if (!texto) return this.productosDisponibles;
    return this.productosDisponibles.filter(
      (p) => p.nombre.toLowerCase().includes(texto) || p.id.toLowerCase().includes(texto)
    );
  });

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productosFiltrados().length / this.productosPorPagina))
  );

  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.productosPorPagina);
  });

  ngOnInit(): void {
    this.cargarDesdeJson();
  }

  private obtenerConfiguracionGlobal(): ConfiguracionGlobal {
    try {
      const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
      if (raw) return JSON.parse(raw) as ConfiguracionGlobal;
    } catch { }
    return {};
  }

  private cargarDesdeJson(): void {
    const aplicarPromocion = (global: ConfiguracionGlobal) => {
      const p = global?.promocion;
      if (p && Array.isArray(p.items)) {
        this.titulo.set(p.titulo ?? '');
        this.items.set(p.items.length >= MIN_ITEMS ? [...p.items] : this.obtenerItemsPorDefecto());
        return true;
      }
      return false;
    };
    fetch('/configuracion.json')
      .then((r) => r.json())
      .then((global: ConfiguracionGlobal) => {
        if (aplicarPromocion(global)) return;
        const local = this.obtenerConfiguracionGlobal();
        if (aplicarPromocion(local)) return;
        this.titulo.set('Productos en promoción');
        this.items.set(this.obtenerItemsPorDefecto());
      })
      .catch(() => {
        const local = this.obtenerConfiguracionGlobal();
        if (aplicarPromocion(local)) return;
        this.titulo.set('Productos en promoción');
        this.items.set(this.obtenerItemsPorDefecto());
      });
  }

  private obtenerItemsPorDefecto(): ItemPromocion[] {
    return PRODUCTOS.slice(0, MIN_ITEMS).map((p) => ({
      handle: p.id,
      titulo: p.nombre,
      imagen: p.imagen,
    }));
  }

  guardarConfiguracion(): void {
    const list = this.items();
    if (list.length < MIN_ITEMS || list.length > MAX_ITEMS) {
      this.notificacion.advertencia(`Debes tener entre ${MIN_ITEMS} y ${MAX_ITEMS} ítems.`);
      return;
    }
    const datos: ConfiguracionPromocion = { titulo: this.titulo(), items: list };
    const global = this.obtenerConfiguracionGlobal();
    global.promocion = datos;
    localStorage.setItem(CLAVE_CONFIGURACION_GLOBAL, JSON.stringify(global));
    this.notificacion.exito('Configuración guardada correctamente.');
  }

  estaSeleccionado(producto: Producto): boolean {
    return this.items().some((i) => i.handle === producto.id);
  }

  puedeSeleccionarMas(): boolean {
    return this.items().length < MAX_ITEMS;
  }

  puedeQuitarSeleccion(): boolean {
    return this.items().length > MIN_ITEMS;
  }

  toggleSeleccion(producto: Producto): void {
    const list = this.items();
    const yaEsta = list.some((i) => i.handle === producto.id);
    if (yaEsta) {
      if (list.length <= MIN_ITEMS) {
        this.notificacion.advertencia(`Mínimo ${MIN_ITEMS} productos. No puedes quitar más.`);
        return;
      }
      this.items.set(list.filter((i) => i.handle !== producto.id));
    } else {
      if (list.length >= MAX_ITEMS) {
        this.notificacion.advertencia(`Máximo ${MAX_ITEMS} productos. No puedes agregar más.`);
        return;
      }
      this.items.update((l) => [
        ...l,
        { handle: producto.id, titulo: producto.nombre, imagen: producto.imagen },
      ]);
    }
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaActual.set(pagina);
  }
}
