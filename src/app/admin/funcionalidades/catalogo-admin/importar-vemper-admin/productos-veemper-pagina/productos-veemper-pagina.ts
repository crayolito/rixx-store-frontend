import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BloqueEstadoTablaComponente } from '../../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { ProductoApi } from '../../../../../compartido/modelos/producto.modelo';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

@Component({
  selector: 'app-productos-veemper-pagina',
  standalone: true,
  imports: [CommonModule, BloqueEstadoTablaComponente],
  templateUrl: './productos-veemper-pagina.html',
  styleUrl: './productos-veemper-pagina.css',
})
export class ProductosVemperPagina {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoriasApi = inject(CategoriasApiServicio);
  private productosApi = inject(ProductosApiServicio);
  private notificacion = inject(NotificacionServicio);

  Math = Math;

  idCategoria = signal<string>('');
  nombreCategoria = signal<string>('Categoría');
  productosVemper = signal<ProductoApi[]>([]);
  estaCargando = signal(false);
  importados = signal<Set<string>>(new Set());
  importandoHandle = signal<string | null>(null);

  textoBusqueda = signal<string>('');
  filtrosVisibles = signal<boolean>(true);
  paginaActual = signal(1);
  productosPorPagina = signal(12);

  /** Productos filtrados por categoria: coinciden con el nombre de la categoría */
  productosFiltrados = computed(() => {
    const idCat = this.idCategoria();
    const nombreCat = this.nombreCategoria();
    const lista = this.productosVemper();
    if (!idCat || !nombreCat || nombreCat == 'Categoría') return lista;
    return lista.filter((p) => (p.categorias ?? []).includes(nombreCat));
  });

  /** Productos visibles tras aplicar búsqueda */
  productosVisibles = computed(() => {
    let lista = this.productosFiltrados();
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    if (busqueda) {
      lista = lista.filter((p) => p.titulo?.toLowerCase().includes(busqueda));
    }
    return lista;
  });

  totalProductos = computed(() => this.productosVisibles().length);
  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalProductos() / this.productosPorPagina())),
  );
  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    const fin = inicio + this.productosPorPagina();
    return this.productosVisibles().slice(inicio, fin);
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

  constructor() {
    const idInicial = this.route.snapshot.paramMap.get('id');
    this.idCategoria.set(idInicial ?? '');
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.idCategoria.set(id ?? '');
      this.paginaActual.set(1);
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  /** Carga categoría y productos Vemper */
  cargarDatos(): void {
    const id = this.idCategoria();
    if (!id) return;

    this.estaCargando.set(true);

    this.categoriasApi.obtenerTodas().subscribe({
      next: (categorias) => {
        const cat = categorias.find((c) => String(c.id_categoria) === id);
        this.nombreCategoria.set(cat?.nombre ?? 'Categoría');
      },
      error: () => {
        this.estaCargando.set(false);
        this.notificacion.error('No se pudo cargar la categoría');
      },
    });

    this.productosApi.obtenerVemper().subscribe({
      next: (productos) => {
        this.productosVemper.set(productos);
        const yaImportados = new Set<string>();
        productos.forEach((p) => {
          if (p.importado) yaImportados.add(p.handle);
        });
        this.importados.set(yaImportados);
      },
      error: () => {
        this.estaCargando.set(false);
        this.notificacion.error('No se pudieron cargar los productos');
      },
      complete: () => this.estaCargando.set(false),
    });
  }

  /** Marca el producto como importado vía API */
  importar(producto: ProductoApi): void {
    if (this.importados().has(producto.handle) || this.importandoHandle()) return;

    this.importandoHandle.set(producto.handle);
    this.productosApi.marcarComoImportado(producto.handle).subscribe({
      next: () => {
        this.importados.update((s) => {
          const nuevo = new Set(s);
          nuevo.add(producto.handle);
          return nuevo;
        });
        this.notificacion.exito('Producto importado correctamente');
      },
      error: () => {
        this.notificacion.error('No se pudo importar el producto');
      },
      complete: () => this.importandoHandle.set(null),
    });
  }

  /** Indica si el producto ya está importado */
  yaImportado(handle: string): boolean {
    return this.importados().has(handle);
  }

  /** Indica si se está procesando la importación */
  estaImportando(handle: string): boolean {
    return this.importandoHandle() === handle;
  }

  alternarFiltros(): void {
    this.filtrosVisibles.update((v) => !v);
  }

  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.paginaActual.set(1);
  }

  actualizarBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaActual.set(pagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) this.paginaActual.update((p) => p - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update((p) => p + 1);
  }

  /** Navega de vuelta a la lista de categorías Importar Vemper */
  volver(): void {
    this.router.navigate(['/admin/catalogo/importar-vemper']);
  }
}
