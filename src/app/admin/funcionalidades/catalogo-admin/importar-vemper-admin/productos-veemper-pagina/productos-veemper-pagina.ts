import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface ProductoVemper {
  id: string;
  nombre: string;
  precioBase: string;
  stock: number;
  categoriaId: string;
}

const NOMBRES_CATEGORIAS: Record<string, string> = {
  '1': 'Electrónica',
  '2': 'Ropa',
  '3': 'Hogar',
  '4': 'Deportes',
  '5': 'Libros',
  '6': 'Juguetes',
  '7': 'Belleza',
  '8': 'Alimentos',
  '9': 'Música',
  '10': 'Jardín',
};

const PRODUCTOS_MOCK: ProductoVemper[] = [
  { id: 'v1', nombre: 'Producto Vemper A', precioBase: '9.99', stock: 50, categoriaId: '1' },
  { id: 'v2', nombre: 'Producto Vemper B', precioBase: '19.50', stock: 120, categoriaId: '1' },
  { id: 'v3', nombre: 'Producto Vemper C', precioBase: '5.00', stock: 0, categoriaId: '1' },
  { id: 'v4', nombre: 'Producto Vemper D', precioBase: '29.99', stock: 25, categoriaId: '1' },
  { id: 'v5', nombre: 'Producto Vemper E', precioBase: '12.00', stock: 80, categoriaId: '1' },
  { id: 'v6', nombre: 'Producto Vemper F', precioBase: '8.50', stock: 45, categoriaId: '2' },
  { id: 'v7', nombre: 'Producto Vemper G', precioBase: '15.00', stock: 10, categoriaId: '2' },
  { id: 'v8', nombre: 'Producto Vemper H', precioBase: '22.00', stock: 30, categoriaId: '3' },
  { id: 'v9', nombre: 'Producto Vemper I', precioBase: '11.99', stock: 60, categoriaId: '3' },
  { id: 'v10', nombre: 'Producto Vemper J', precioBase: '7.50', stock: 100, categoriaId: '4' },
];

@Component({
  selector: 'app-productos-veemper-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos-veemper-pagina.html',
  styleUrl: './productos-veemper-pagina.css',
})
export class ProductosVemperPagina {
  private route = inject(ActivatedRoute);
  Math = Math;

  idCategoria = signal<string>('');
  nombreCategoria = computed(() => NOMBRES_CATEGORIAS[this.idCategoria()] ?? 'Categoría');

  todosProductos = signal<ProductoVemper[]>(PRODUCTOS_MOCK);
  productosFiltrados = computed(() => {
    const id = this.idCategoria();
    if (!id) return [];
    return this.todosProductos().filter(p => p.categoriaId === id);
  });

  textoBusqueda = signal('');
  filtrosVisibles = signal<boolean>(false);

  productosVisibles = computed(() => {
    let lista = this.productosFiltrados();
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    if (busqueda) {
      lista = lista.filter(p => p.nombre.toLowerCase().includes(busqueda));
    }
    return lista;
  });

  paginaActual = signal(1);
  productosPorPagina = signal(12);
  totalProductos = computed(() => this.productosVisibles().length);
  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalProductos() / this.productosPorPagina()))
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

  importados = signal<Set<string>>(new Set());

  constructor() {
    const idInicial = this.route.snapshot.paramMap.get('id');
    this.idCategoria.set(idInicial ?? '');
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.idCategoria.set(id ?? '');
      this.paginaActual.set(1);
    });
  }

  importar(producto: ProductoVemper) {
    if (this.importados().has(producto.id)) return;
    if (confirm('¿Importar el producto "' + producto.nombre + '" al catálogo?')) {
      this.importados.update(set => {
        const nuevo = new Set(set);
        nuevo.add(producto.id);
        return nuevo;
      });
    }
  }

  yaImportado(productoId: string): boolean {
    return this.importados().has(productoId);
  }

  alternarFiltros() {
    this.filtrosVisibles.update(v => !v);
  }

  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.paginaActual.set(1);
  }

  actualizarBusqueda(valor: string) {
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaActual.set(pagina);
  }
  paginaAnterior() {
    if (this.paginaActual() > 1) this.paginaActual.update(p => p - 1);
  }
  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update(p => p + 1);
  }
}
