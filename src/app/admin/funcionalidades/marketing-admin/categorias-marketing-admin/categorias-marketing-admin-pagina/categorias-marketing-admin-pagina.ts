import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { PrecioApi, ProductoApi, ProductoDetalleApi } from '../../../../../compartido/modelos/producto.modelo';
import {
  CategoriaMarketing,
  ConfiguracionCategoriasMarketing,
  ConfiguracionGlobal,
  ProductoCategoriaMarketing,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { ConfiguracionApiServicio } from '../../../../../compartido/servicios/configuracion-api.servicio';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

const CLAVE_CONFIGURACION_GLOBAL = 'configuracion-global';

/** Variante de precio para selector (API no tiene precioOferta; se usa null) */
export interface PrecioVarianteMarketing {
  id: string;
  nombre: string;
  precioBase: number;
  precioOferta: number | null;
}

function tituloAHandle(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Convierte PrecioApi a formato usado en el selector (precioOferta null si el backend no lo envía). */
function precioApiAVariante(pr: PrecioApi): PrecioVarianteMarketing {
  return {
    id: String(pr.id_precio),
    nombre: pr.nombre,
    precioBase: Number(pr.precioBase),
    precioOferta: null,
  };
}

/** Construye un ítem de categoría marketing desde producto API y la variante de precio elegida. */
function precioAItem(
  p: ProductoApi,
  precio: PrecioVarianteMarketing,
  usarOferta: boolean,
  imagen: string,
  descripcion: string,
  fechaCreacion: string
): ProductoCategoriaMarketing {
  return {
    handle: p.handle,
    titulo: p.titulo,
    imagen,
    descripcion,
    fechaCreacion,
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
  private configuracionApi = inject(ConfiguracionApiServicio);
  private categoriasApi = inject(CategoriasApiServicio);
  private productosApi = inject(ProductosApiServicio);

  guardando = signal(false);
  /** Última configuración guardada (servidor/localStorage) para restaurar al cancelar. */
  ultimaConfiguracionGuardada = signal<CategoriaMarketing[]>([]);

  categorias = signal<{ id: string; nombre: string; handle: string }[]>([]);
  productosDisponibles = signal<ProductoApi[]>([]);
  /** Precios por handle (se rellenan al cargar detalle al agregar producto). */
  preciosPorProducto = signal<Map<string, PrecioVarianteMarketing[]>>(new Map());
  cargandoDatos = signal(true);
  /** Handle del producto cuyos precios se están cargando (al agregar). */
  cargandoPreciosHandle = signal<string | null>(null);

  categoriasConfiguradas = signal<CategoriaMarketing[]>([]);
  categoriaSeleccionada = signal<string | null>(null);
  items = signal<ProductoCategoriaMarketing[]>([]);
  textoBusqueda = signal('');
  indiceArrastrando = signal<number | null>(null);

  categoriasConCantidad = computed(() => {
    const cats = this.categorias();
    const productos = this.productosDisponibles();
    return cats
      .map((cat) => {
        const cantidad = productos.filter((p) => (p.categorias ?? []).includes(cat.nombre)).length;
        return { nombre: cat.nombre, cantidad };
      })
      .filter((c) => c.cantidad > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  productosDeCategoria = computed(() => {
    const cat = this.categoriaSeleccionada();
    if (!cat) return [];
    const texto = this.textoBusqueda().trim().toLowerCase();
    let lista = this.productosDisponibles().filter((p) => (p.categorias ?? []).includes(cat));
    if (texto) {
      lista = lista.filter(
        (p) =>
          p.titulo.toLowerCase().includes(texto) ||
          p.handle.toLowerCase().includes(texto) ||
          (p.descripcion ?? '').toLowerCase().includes(texto)
      );
    }
    return lista;
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  /** Carga categorías y productos importados desde la API; luego aplica configuración guardada. */
  private cargarDatos(): void {
    this.cargandoDatos.set(true);
    let pendientes = 2;

    const listo = () => {
      pendientes--;
      if (pendientes === 0) {
        this.cargandoDatos.set(false);
        this.intentarAplicarConfiguracion();
      }
    };

    this.categoriasApi.obtenerTodas().subscribe({
      next: (lista) => {
        this.categorias.set(
          lista.map((c) => ({
            id: String(c.id_categoria),
            nombre: c.nombre,
            handle: c.handle,
          }))
        );
        listo();
      },
      error: () => {
        this.categorias.set([]);
        listo();
      },
    });

    this.productosApi.obtenerImportados().subscribe({
      next: (lista) => {
        this.productosDisponibles.set(lista.filter((p) => p.activo));
        listo();
      },
      error: () => {
        this.productosDisponibles.set([]);
        listo();
      },
    });
  }

  private obtenerConfiguracionGlobal(): ConfiguracionGlobal {
    try {
      const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
      if (raw) return JSON.parse(raw) as ConfiguracionGlobal;
    } catch {}
    return {};
  }

  private normalizarItem(item: ProductoCategoriaMarketing): ProductoCategoriaMarketing {
    if (item.precioId && item.nombrePrecio) return item;
    return { ...item, precioId: item.precioId ?? 'default', nombrePrecio: item.nombrePrecio ?? 'Estándar' };
  }

  private intentarAplicarConfiguracion(): void {
    const aplicar = (global: ConfiguracionGlobal) => {
      const cm = global?.categoriasMarketing?.categorias;
      if (Array.isArray(cm)) {
        const normalizadas = cm.map((c) => {
          const prods = c.productosOrdenados ?? c.productos ?? [];
          return {
            ...c,
            productosOrdenados: prods.map((i: ProductoCategoriaMarketing) => this.normalizarItem(i)),
          };
        });
        this.categoriasConfiguradas.set(normalizadas);
        this.ultimaConfiguracionGuardada.set(normalizadas.map((c) => ({ ...c })));
        const cat = this.categoriaSeleccionada();
        if (cat) {
          const handle = tituloAHandle(cat);
          const existente = normalizadas.find((c) => c.handle === handle);
          if (existente) {
            const prods = existente.productosOrdenados ?? existente.productos ?? [];
            this.items.set(prods.map((i: ProductoCategoriaMarketing) => this.normalizarItem(i)));
          }
        }
        return true;
      }
      return false;
    };
    this.configuracionApi.obtenerConfiguracion().subscribe({
      next: (global) => {
        if (aplicar(global as ConfiguracionGlobal)) return;
        const local = this.obtenerConfiguracionGlobal();
        if (aplicar(local)) return;
        this.categoriasConfiguradas.set([]);
        this.ultimaConfiguracionGuardada.set([]);
      },
      error: () => {
        const local = this.obtenerConfiguracionGlobal();
        if (aplicar(local)) return;
        this.categoriasConfiguradas.set([]);
        this.ultimaConfiguracionGuardada.set([]);
      },
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

  /** Devuelve la URL de imagen preferida del producto (smallSquare, rectangular o square). */
  imagenProducto(p: ProductoApi): string {
    const img = p.imagenes;
    if (!img) return '';
    return img.smallSquare ?? img.rectangular ?? img.square ?? '';
  }

  estaSeleccionado(p: ProductoApi): boolean {
    return this.items().some((i) => i.handle === p.handle);
  }

  puedeQuitarSeleccion(): boolean {
    return this.items().length > 0;
  }

  preciosDelProducto(p: ProductoApi): PrecioVarianteMarketing[] {
    return this.preciosPorProducto().get(p.handle) ?? [];
  }

  preciosParaItem(item: ProductoCategoriaMarketing): PrecioVarianteMarketing[] {
    return this.preciosPorProducto().get(item.handle) ?? [];
  }

  /** Agrega o quita producto. Si se agrega y no hay precios, carga el detalle del producto. */
  toggleSeleccion(p: ProductoApi, precio?: PrecioVarianteMarketing, usarOfertaInicial = false): void {
    const list = this.items();
    const yaEsta = list.some((i) => i.handle === p.handle);
    if (yaEsta) {
      this.items.set(list.filter((i) => i.handle !== p.handle));
      return;
    }

    const precios = this.preciosPorProducto().get(p.handle);
    if (precios?.length) {
      const precioElegir = precio ?? precios[0];
      const usarOferta = precioElegir.precioOferta != null ? usarOfertaInicial : false;
      const imagen = this.imagenProducto(p);
      this.items.update((l) => [
        ...l,
        precioAItem(p, precioElegir, usarOferta, imagen, p.descripcion ?? '', p.fechaCreacion ?? ''),
      ]);
      return;
    }

    this.cargandoPreciosHandle.set(p.handle);
    this.productosApi.obtenerPorHandle(p.handle).subscribe({
      next: (detalle: ProductoDetalleApi | null) => {
        this.cargandoPreciosHandle.set(null);
        if (!detalle?.precios?.length) {
          this.notificacion.advertencia('El producto no tiene precios configurados.');
          return;
        }
        const variantes = detalle.precios.map(precioApiAVariante);
        this.preciosPorProducto.update((m) => {
          const next = new Map(m);
          next.set(p.handle, variantes);
          return next;
        });
        const precioElegir = precio && variantes.some((v) => v.id === precio.id) ? precio! : variantes[0];
        const usarOferta = precioElegir.precioOferta != null ? usarOfertaInicial : false;
        const imagen = this.imagenProducto(p);
        this.items.update((l) => [
          ...l,
          precioAItem(p, precioElegir, usarOferta, imagen, p.descripcion ?? '', p.fechaCreacion ?? ''),
        ]);
      },
      error: () => {
        this.cargandoPreciosHandle.set(null);
        this.notificacion.error('No se pudieron cargar los precios del producto.');
      },
    });
  }

  cambiarPrecioVariante(indice: number, precioId: string): void {
    const item = this.items()[indice];
    if (!item) return;
    const p = this.productosDisponibles().find((x) => x.handle === item.handle);
    if (!p) return;
    const precios = this.preciosPorProducto().get(p.handle);
    if (!precios) return;
    const precio = precios.find((pr) => pr.id === precioId);
    if (!precio) return;
    const usarOferta = precio.precioOferta != null;
    const imagen = this.imagenProducto(p);
    this.items.update((list) =>
      list.map((i, idx) =>
        idx === indice
          ? precioAItem(p, precio, usarOferta, imagen, p.descripcion ?? '', p.fechaCreacion ?? '')
          : i
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

  /** Indica si hay cambios sin guardar respecto a la última configuración guardada. */
  hayCambiosPendientes = computed(() => {
    const guardada = this.ultimaConfiguracionGuardada();
    const actual = this.categoriasConfiguradas();
    if (guardada.length !== actual.length) return true;
    const cat = this.categoriaSeleccionada();
    if (!cat) return JSON.stringify(guardada) !== JSON.stringify(actual);
    const handle = tituloAHandle(cat);
    const savedCat = guardada.find((c) => c.handle === handle);
    const currentItems = this.items();
    const savedItems = savedCat?.productosOrdenados ?? savedCat?.productos ?? [];
    if (currentItems.length !== savedItems.length) return true;
    for (let i = 0; i < currentItems.length; i++) {
      const a = currentItems[i];
      const b = savedItems[i];
      if (!b || a.handle !== b.handle || a.precioId !== b.precioId || a.usarPrecioOferta !== b.usarPrecioOferta)
        return true;
    }
    const actualResto = actual.filter((c) => c.handle !== handle);
    const guardadaResto = guardada.filter((c) => c.handle !== handle);
    return JSON.stringify(actualResto) !== JSON.stringify(guardadaResto);
  });

  /** Restaura la configuración al último estado guardado (servidor/localStorage). */
  cancelarCambios(): void {
    const guardada = this.ultimaConfiguracionGuardada();
    this.categoriasConfiguradas.set(guardada.length ? guardada.map((c) => ({ ...c })) : []);
    const cat = this.categoriaSeleccionada();
    if (cat) {
      const handle = tituloAHandle(cat);
      const existente = guardada.find((c) => c.handle === handle);
      const prods = existente?.productosOrdenados ?? existente?.productos ?? [];
      this.items.set(prods.map((i) => this.normalizarItem(i)));
    }
    this.notificacion.exito('Cambios descartados.');
  }

  /** Guarda la configuración en el servidor y en localStorage; el precio elegido sigue siendo editable. */
  guardarConfiguracion(): void {
    const cat = this.categoriaSeleccionada();
    if (!cat) {
      this.notificacion.advertencia('Selecciona una categoría.');
      return;
    }
    const handle = tituloAHandle(cat);
    const list = this.items();
    const nuevaCategoria: CategoriaMarketing = {
      handle,
      titulo: cat,
      productosOrdenados: [...list],
    };
    const actuales = this.categoriasConfiguradas();
    const resto = actuales.filter((c) => c.handle !== handle);
    const categorias: CategoriaMarketing[] = [...resto, nuevaCategoria];
    const datos: ConfiguracionCategoriasMarketing = { categorias };

    this.guardando.set(true);
    this.configuracionApi.actualizarCategoriasMarketing(datos).subscribe({
      next: () => {
        const global = this.obtenerConfiguracionGlobal();
        global.categoriasMarketing = datos;
        localStorage.setItem(CLAVE_CONFIGURACION_GLOBAL, JSON.stringify(global));
        this.categoriasConfiguradas.set(categorias);
        this.ultimaConfiguracionGuardada.set(categorias.map((c) => ({ ...c })));
        this.guardando.set(false);
        this.notificacion.exito('Configuración guardada correctamente.');
      },
      error: () => {
        this.guardando.set(false);
        this.notificacion.error('No se pudo guardar en el servidor. Revisa la conexión.');
      },
    });
  }

  precioAMostrar(item: ProductoCategoriaMarketing): number {
    return item.usarPrecioOferta && item.precioOferta != null ? item.precioOferta : item.precioBase;
  }

  quitarItem(indice: number): void {
    const list = this.items();
    this.items.set(list.filter((_, i) => i !== indice));
  }

  estaCargandoPrecios(p: ProductoApi): boolean {
    return this.cargandoPreciosHandle() === p.handle;
  }
}
