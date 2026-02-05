import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  CategoriaMarketing,
  ConfiguracionGlobal,
  ProductoCategoriaMarketing
} from '../../../../compartido/modelos/configuracion.modelo';

const CLAVE_CONFIGURACION_GLOBAL = 'configuracion-global';

interface CategoriaVista {
  id: string;
  nombre: string;
  cantidadProductos: number;
}

@Component({
  selector: 'app-categoria-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categoria-pagina.html',
  styleUrl: './categoria-pagina.css',
})
export class CategoriaPagina implements OnInit {
  private route = inject(ActivatedRoute);

  Math = Math;
  usaConfig = signal(false);

  categoriasMarketing = signal<CategoriaMarketing[]>([]);
  categorias = signal<CategoriaVista[]>([]);
  categoriaSeleccionada = signal<string>('');
  productos = signal<ProductoCategoriaMarketing[]>([]);

  paginaActual = signal(1);
  productosPorPagina = signal(8);

  totalProductos = computed(() => this.productos().length);
  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalProductos() / this.productosPorPagina()))
  );

  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    const fin = inicio + this.productosPorPagina();
    return this.productos().slice(inicio, fin);
  });

  paginasAMostrar = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) paginas.push(i);
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      } else if (actual >= total - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = total - 4; i <= total; i++) paginas.push(i);
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = actual - 1; i <= actual + 1; i++) paginas.push(i);
        paginas.push(-1);
        paginas.push(total);
      }
    }
    return paginas;
  });

  ngOnInit(): void {
    const slugInicial = this.route.snapshot.params['slug'] as string | undefined;
    this.cargarConfiguracion(slugInicial);
    this.route.params.subscribe((params) => {
      const slug = params['slug'] as string | undefined;
      if (slug) this.seleccionarPorHandle(slug);
    });
  }

  private cargarConfiguracion(slugDesdeRuta?: string): void {
    const aplicar = (global: ConfiguracionGlobal) => {
      const cm = global?.categorias ?? global?.categoria?.categorias;
      if (Array.isArray(cm) && cm.length > 0) {
        this.categoriasMarketing.set(cm);
        this.categorias.set(
          cm.map((c) => {
            const prods = c.productos ?? c.productosOrdenados ?? [];
            return {
              id: c.handle,
              nombre: c.titulo,
              cantidadProductos: prods.length,
            };
          })
        );
        const aSeleccionar = slugDesdeRuta
          ? cm.find((c) => c.handle === slugDesdeRuta)
          : cm[0];
        if (aSeleccionar) {
          this.categoriaSeleccionada.set(aSeleccionar.handle);
          const prods = aSeleccionar.productos ?? aSeleccionar.productosOrdenados ?? [];
          this.productos.set([...prods]);
        }
        this.usaConfig.set(true);
        return true;
      }
      return false;
    };
    fetch('/configuracion.json')
      .then((r) => r.json())
      .then((global: ConfiguracionGlobal) => {
        if (aplicar(global)) return;
        try {
          const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
          if (raw) aplicar(JSON.parse(raw) as ConfiguracionGlobal);
        } catch { }
        if (!this.usaConfig()) this.cargarDatosFallback();
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
          if (raw) aplicar(JSON.parse(raw) as ConfiguracionGlobal);
        } catch { }
        if (!this.usaConfig()) this.cargarDatosFallback();
      });
  }

  private cargarDatosFallback(): void {
    this.categorias.set([
      { id: '1', nombre: 'Battle Royale', cantidadProductos: 24 },
      { id: '2', nombre: 'MOBA', cantidadProductos: 18 },
      { id: '3', nombre: 'Electrónica', cantidadProductos: 15 },
    ]);
    this.categoriaSeleccionada.set('1');
    this.productos.set([
      { handle: '1', titulo: 'PUBG MOBILE (Global)', imagen: '/imagenes/juego1.png', descripcion: '', fechaCreacion: '', precioId: 'd1', nombrePrecio: 'Estándar', precioBase: 299, precioOferta: 284, usarPrecioOferta: true },
      { handle: '2', titulo: 'Call of Duty Mobile', imagen: '/imagenes/juego2.png', descripcion: '', fechaCreacion: '', precioId: 'd2', nombrePrecio: 'Estándar', precioBase: 350, precioOferta: null, usarPrecioOferta: false },
      { handle: '3', titulo: 'Genshin Impact', imagen: '/imagenes/juego3.png', descripcion: '', fechaCreacion: '', precioId: 'd3', nombrePrecio: 'Estándar', precioBase: 250, precioOferta: null, usarPrecioOferta: false },
    ]);
  }

  seleccionarPorHandle(handle: string): void {
    const cm = this.categoriasMarketing();
    const cat = cm.find((c) => c.handle === handle);
    if (cat) {
      this.categoriaSeleccionada.set(handle);
      const prods = cat.productos ?? cat.productosOrdenados ?? [];
      this.productos.set([...prods]);
      this.paginaActual.set(1);
    }
  }

  seleccionarCategoria(id: string): void {
    this.categoriaSeleccionada.set(id);
    if (this.usaConfig()) {
      const cat = this.categoriasMarketing().find((c) => c.handle === id);
      if (cat) {
        const prods = cat.productos ?? cat.productosOrdenados ?? [];
        this.productos.set([...prods]);
      }
    }
    this.paginaActual.set(1);
  }

  precioAMostrar(p: ProductoCategoriaMarketing): number {
    return p.usarPrecioOferta && p.precioOferta != null ? p.precioOferta : p.precioBase;
  }

  mostrarOferta(p: ProductoCategoriaMarketing): boolean {
    return Boolean(p.usarPrecioOferta && p.precioOferta != null);
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaActual.set(pagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) this.paginaActual.set(this.paginaActual() - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas())
      this.paginaActual.set(this.paginaActual() + 1);
  }
}
