import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { PrecioVariante, ProductoTienda } from '../../../../../compartido/datos/productos-tienda.datos';
import { PRODUCTOS_TIENDA } from '../../../../../compartido/datos/productos-tienda.datos';
import {
  CategoriaMarketing,
  ConfiguracionCategoriasMarketing,
  ConfiguracionGlobal,
  ProductoCategoriaMarketing,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';

const CLAVE_CONFIGURACION_GLOBAL = 'configuracion-global';
const MIN_PRODUCTOS = 5;

function tituloAHandle(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function precioAItem(p: ProductoTienda, precio: PrecioVariante, usarOferta: boolean): ProductoCategoriaMarketing {
  return {
    handle: p.id,
    titulo: p.nombre,
    imagen: p.imagen,
    descripcion: p.descripcion,
    fechaCreacion: p.fechaCreacion,
    precioId: precio.id,
    nombrePrecio: precio.nombre,
    precioBase: precio.precioBase,
    precioOferta: precio.precioOferta,
    usarPrecioOferta: precio.precioOferta != null && usarOferta,
  };
}

@Component({
  selector: 'app-categorias-marketing-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias-marketing-admin-pagina.html',
  styleUrl: './categorias-marketing-admin-pagina.css',
})
export class CategoriasMarketingAdminPagina implements OnInit {
  private router = inject(Router);
  private notificacion = inject(NotificacionServicio);

  readonly productosDisponibles = PRODUCTOS_TIENDA;
  readonly minProductos = MIN_PRODUCTOS;

  categoriasConfiguradas = signal<CategoriaMarketing[]>([]);
  categoriaSeleccionada = signal<string | null>(null);
  items = signal<ProductoCategoriaMarketing[]>([]);
  textoBusqueda = signal('');
  indiceArrastrando = signal<number | null>(null);

  categoriasConCantidad = computed(() => {
    const porCategoria = new Map<string, number>();
    for (const p of this.productosDisponibles) {
      porCategoria.set(p.categoria, (porCategoria.get(p.categoria) ?? 0) + 1);
    }
    return Array.from(porCategoria.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  productosDeCategoria = computed(() => {
    const cat = this.categoriaSeleccionada();
    if (!cat) return [];
    const texto = this.textoBusqueda().trim().toLowerCase();
    let lista = this.productosDisponibles.filter((p) => p.categoria === cat);
    if (texto) {
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(texto) ||
          p.id.toLowerCase().includes(texto) ||
          p.descripcion.toLowerCase().includes(texto)
      );
    }
    return lista;
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

  private normalizarItem(item: ProductoCategoriaMarketing): ProductoCategoriaMarketing {
    if (item.precioId && item.nombrePrecio) return item;
    return { ...item, precioId: item.precioId ?? 'default', nombrePrecio: item.nombrePrecio ?? 'Estándar' };
  }

  private cargarDesdeJson(): void {
    const aplicar = (global: ConfiguracionGlobal) => {
      const cm = global?.categoriasMarketing?.categorias;
      if (Array.isArray(cm) && cm.length > 0) {
        this.categoriasConfiguradas.set(cm.map((c) => {
          const prods = c.productosOrdenados ?? c.productos ?? [];
          return {
            ...c,
            productosOrdenados: prods.map((i: ProductoCategoriaMarketing) => this.normalizarItem(i)),
          };
        }));
        const cat = this.categoriaSeleccionada();
        if (cat) {
          const handle = tituloAHandle(cat);
          const existente = cm.find((c) => c.handle === handle);
          if (existente) {
            const prods = existente.productosOrdenados ?? existente.productos ?? [];
            this.items.set(prods.map((i: ProductoCategoriaMarketing) => this.normalizarItem(i)));
          }
        }
        return true;
      }
      return false;
    };
    fetch('/configuracion.json')
      .then((r) => r.json())
      .then((global: ConfiguracionGlobal) => {
        if (aplicar(global)) return;
        const local = this.obtenerConfiguracionGlobal();
        if (aplicar(local)) return;
        this.categoriasConfiguradas.set([]);
      })
      .catch(() => {
        const local = this.obtenerConfiguracionGlobal();
        if (aplicar(local)) return;
        this.categoriasConfiguradas.set([]);
      });
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  seleccionarCategoria(nombre: string): void {
    this.categoriaSeleccionada.set(nombre);
    this.textoBusqueda.set('');
    const handle = tituloAHandle(nombre);
    const existente = this.categoriasConfiguradas().find((c) => c.handle === handle);
    if (existente) {
      const prods = existente.productosOrdenados ?? existente.productos ?? [];
      this.items.set(prods.map((i: ProductoCategoriaMarketing) => this.normalizarItem(i)));
    } else {
      this.items.set([]);
    }
  }

  setBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
  }

  estaSeleccionado(p: ProductoTienda): boolean {
    return this.items().some((i) => i.handle === p.id);
  }

  puedeQuitarSeleccion(): boolean {
    return this.items().length > MIN_PRODUCTOS;
  }

  preciosDelProducto(p: ProductoTienda): PrecioVariante[] {
    return p.precios ?? [];
  }

  preciosParaItem(item: ProductoCategoriaMarketing): PrecioVariante[] {
    const p = this.productosDisponibles.find((x) => x.id === item.handle);
    return p?.precios ?? [];
  }

  toggleSeleccion(p: ProductoTienda, precio?: PrecioVariante, usarOfertaInicial = false): void {
    const list = this.items();
    const yaEsta = list.some((i) => i.handle === p.id);
    if (yaEsta) {
      if (list.length <= MIN_PRODUCTOS) {
        this.notificacion.advertencia(`Mínimo ${MIN_PRODUCTOS} productos.`);
        return;
      }
      this.items.set(list.filter((i) => i.handle !== p.id));
    } else {
      const precios = p.precios ?? [];
      const precioElegir = precio ?? precios[0];
      if (!precioElegir) return;
      const usarOferta = precioElegir.precioOferta != null ? usarOfertaInicial : false;
      this.items.update((l) => [...l, precioAItem(p, precioElegir, usarOferta)]);
    }
  }

  cambiarPrecioVariante(indice: number, precioId: string): void {
    const item = this.items()[indice];
    if (!item) return;
    const p = this.productosDisponibles.find((x) => x.id === item.handle);
    if (!p) return;
    const precio = p.precios.find((pr) => pr.id === precioId);
    if (!precio) return;
    const usarOferta = precio.precioOferta != null;
    this.items.update((list) =>
      list.map((i, idx) =>
        idx === indice ? precioAItem(p, precio, usarOferta) : i
      )
    );
  }

  cambiarPrecioMostrar(indice: number, usarOferta: boolean): void {
    const item = this.items()[indice];
    if (!item || item.precioOferta == null) return;
    this.items.update((list) =>
      list.map((i, idx) => (idx === indice ? { ...i, usarPrecioOferta: usarOferta } : i))
    );
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

  guardarConfiguracion(): void {
    const cat = this.categoriaSeleccionada();
    if (!cat) {
      this.notificacion.advertencia('Selecciona una categoría.');
      return;
    }
    const list = this.items();
    if (list.length < MIN_PRODUCTOS) {
      this.notificacion.advertencia(`Mínimo ${MIN_PRODUCTOS} productos por categoría.`);
      return;
    }
    const handle = tituloAHandle(cat);
    const nuevaCategoria: CategoriaMarketing = {
      handle,
      titulo: cat,
      productosOrdenados: list,
    };
    const actuales = this.categoriasConfiguradas();
    const resto = actuales.filter((c) => c.handle !== handle);
    const categorias: CategoriaMarketing[] = [...resto, nuevaCategoria];
    const datos: ConfiguracionCategoriasMarketing = { categorias };
    const global = this.obtenerConfiguracionGlobal();
    global.categoriasMarketing = datos;
    localStorage.setItem(CLAVE_CONFIGURACION_GLOBAL, JSON.stringify(global));
    this.categoriasConfiguradas.set(categorias);
    this.notificacion.exito('Configuración guardada correctamente.');
  }

  precioAMostrar(item: ProductoCategoriaMarketing): number {
    return item.usarPrecioOferta && item.precioOferta != null ? item.precioOferta : item.precioBase;
  }

  quitarItem(indice: number): void {
    const list = this.items();
    if (list.length <= MIN_PRODUCTOS) return;
    this.items.set(list.filter((_, i) => i !== indice));
  }
}
