import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import type { ConfPromocion, ItemPromocion } from '../../../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionApiServicio } from '../../../../../compartido/servicios/configuracion-api.servicio';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import type { ProductoApi } from '../../../../../compartido/modelos/producto.modelo';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

const MIN_ITEMS = 5;
const MAX_ITEMS = 12;
const PRODUCTOS_POR_PAGINA = 10;

@Component({
  selector: 'app-promocion-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promocion-admin-pagina.html',
  styleUrl: './promocion-admin-pagina.css',
})
export class PromocionAdminPagina implements OnInit {
  private router = inject(Router);
  private configuracionApi = inject(ConfiguracionApiServicio);
  private productosApi = inject(ProductosApiServicio);
  private notificacion = inject(NotificacionServicio);

  readonly minItems = MIN_ITEMS;
  readonly maxItems = MAX_ITEMS;
  readonly productosPorPagina = PRODUCTOS_POR_PAGINA;

  productosDisponibles = signal<ProductoApi[]>([]);
  titulo = signal('');
  items = signal<ItemPromocion[]>([]);
  textoBusqueda = signal('');
  paginaActual = signal(1);
  guardando = signal(false);
  indiceArrastrando = signal<number | null>(null);

  /** Estado guardado (carga o guardar exitoso); para comparar y restaurar en Descartar. */
  private estadoGuardado = signal<{ titulo: string; items: ItemPromocion[] } | null>(null);

  /** True si el formulario tiene cambios respecto al último estado guardado. */
  hayCambiosPendientes = computed(() => {
    const g = this.estadoGuardado();
    if (!g) return false;
    return (
      this.titulo() !== g.titulo ||
      JSON.stringify(this.items()) !== JSON.stringify(g.items)
    );
  });

  setBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  /** Productos que coinciden con la búsqueda y aún no están en la lista de elegidos. */
  productosFiltrados = computed(() => {
    const texto = this.textoBusqueda().trim().toLowerCase();
    const lista = this.productosDisponibles();
    const handlesElegidos = new Set(this.items().map((i) => i.handle));
    const disponibles = lista.filter((p) => !handlesElegidos.has(p.handle));
    if (!texto) return disponibles;
    return disponibles.filter(
      (p) =>
        p.titulo.toLowerCase().includes(texto) ||
        (p.handle ?? '').toLowerCase().includes(texto)
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
    this.cargarProductosYConfiguracion();
  }

  /** Carga productos importados y configuración del servidor. */
  private cargarProductosYConfiguracion(): void {
    forkJoin({
      productos: this.productosApi.obtenerImportados(),
      config: this.configuracionApi.obtenerConfiguracion(),
    }).subscribe({
      next: ({ productos: lista, config }) => {
        const soloActivos = lista.filter((p) => p.activo === true);
        this.productosDisponibles.set(soloActivos);
        const p = config?.promocion;
        if (p && Array.isArray(p.items) && p.items.length >= MIN_ITEMS) {
          this.titulo.set(p.titulo ?? '');
          this.items.set(
            p.items.length > MAX_ITEMS ? p.items.slice(0, MAX_ITEMS) : [...p.items]
          );
        } else {
          this.titulo.set('');
          this.items.set([]);
        }
        this.guardarEstadoComoOriginal();
      },
      error: () => {
        this.productosDisponibles.set([]);
        this.titulo.set('');
        this.items.set([]);
        this.guardarEstadoComoOriginal();
      },
    });
  }

  /** Guarda el estado actual como referencia para Descartar. */
  private guardarEstadoComoOriginal(): void {
    this.estadoGuardado.set({
      titulo: this.titulo(),
      items: JSON.parse(JSON.stringify(this.items())),
    });
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  /** Restaura el formulario al último estado guardado. */
  cancelarCambios(): void {
    const g = this.estadoGuardado();
    if (!g) return;
    this.titulo.set(g.titulo);
    this.items.set(JSON.parse(JSON.stringify(g.items)));
    this.notificacion.info('Cambios descartados');
  }

  guardarConfiguracion(): void {
    const list = this.items();
    if (list.length < MIN_ITEMS || list.length > MAX_ITEMS) {
      this.notificacion.advertencia(`Debes tener entre ${MIN_ITEMS} y ${MAX_ITEMS} ítems.`);
      return;
    }
    const datos: ConfPromocion = { titulo: this.titulo().trim(), items: list };
    this.guardando.set(true);
    this.configuracionApi.actualizarPromocion(datos).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardarEstadoComoOriginal();
        this.notificacion.exito('Configuración guardada correctamente.');
      },
      error: () => {
        this.guardando.set(false);
        this.notificacion.error('No se pudo guardar la configuración.');
      },
    });
  }

  /** Devuelve la URL de imagen preferida de un producto (rectangular, square o smallSquare). */
  imagenProducto(p: ProductoApi): string {
    const img = p.imagenes;
    const url = img ? (img.rectangular ?? img.square ?? img.smallSquare ?? '') || '' : '';
    return url || '/imagenes/imagen-nodisponible.jpg';
  }

  /** Devuelve las categorías del producto como texto, o guión si no tiene. */
  categoriasTexto(p: ProductoApi): string {
    const cats = p.categorias;
    if (!cats?.length) return '—';
    return cats.join(', ');
  }

  /** Devuelve la categoría del ítem de promoción (busca el producto por handle). */
  categoriasParaItem(item: ItemPromocion): string {
    const p = this.productosDisponibles().find((x) => x.handle === item.handle);
    return p ? this.categoriasTexto(p) : '—';
  }

  estaSeleccionado(producto: ProductoApi): boolean {
    return this.items().some((i) => i.handle === producto.handle);
  }

  puedeSeleccionarMas(): boolean {
    return this.items().length < MAX_ITEMS;
  }

  puedeQuitarSeleccion(): boolean {
    return this.items().length > MIN_ITEMS;
  }

  toggleSeleccion(producto: ProductoApi): void {
    const list = this.items();
    const yaEsta = list.some((i) => i.handle === producto.handle);
    if (yaEsta) {
      if (list.length <= MIN_ITEMS) {
        this.notificacion.advertencia(`Mínimo ${MIN_ITEMS} productos. No puedes quitar más.`);
        return;
      }
      this.items.set(list.filter((i) => i.handle !== producto.handle));
    } else {
      if (list.length >= MAX_ITEMS) {
        this.notificacion.advertencia(`Máximo ${MAX_ITEMS} productos. No puedes agregar más.`);
        return;
      }
      const imagen = this.imagenProducto(producto);
      this.items.update((l) => [
        ...l,
        { handle: producto.handle, titulo: producto.titulo, imagen },
      ]);
    }
  }

  /** Quita un ítem de la lista de elegidos por índice. */
  quitarItem(indice: number): void {
    const list = this.items();
    if (list.length <= MIN_ITEMS) return;
    this.items.set(list.filter((_, i) => i !== indice));
  }

  iniciarArrastre(event: DragEvent, indice: number): void {
    this.indiceArrastrando.set(indice);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(indice));
    }
  }

  permitirSoltar(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  soltar(event: DragEvent, indiceDestino: number): void {
    event.preventDefault();
    event.stopPropagation();
    const indiceOrigen = this.indiceArrastrando();
    if (indiceOrigen === null || indiceOrigen === indiceDestino) {
      this.indiceArrastrando.set(null);
      return;
    }
    this.items.update((list) => {
      const copia = [...list];
      const [elem] = copia.splice(indiceOrigen, 1);
      copia.splice(indiceDestino, 0, elem);
      return copia;
    });
    this.indiceArrastrando.set(null);
  }

  finArrastre(): void {
    this.indiceArrastrando.set(null);
  }

  estaArrastrando(indice: number): boolean {
    return this.indiceArrastrando() === indice;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaActual.set(pagina);
  }
}
