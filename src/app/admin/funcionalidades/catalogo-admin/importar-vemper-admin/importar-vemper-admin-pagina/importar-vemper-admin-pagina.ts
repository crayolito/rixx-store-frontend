import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

interface CategoriaVemper {
  id: string;
  nombre: string;
  productos: number;
}

@Component({
  selector: 'app-importar-veemper-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './importar-vemper-admin-pagina.html',
  styleUrl: './importar-vemper-admin-pagina.css',
})
export class ImportarVemperAdminPagina {
  private router = inject(Router);
  Math = Math;

  textoBusqueda = signal<string>('');

  categorias = signal<CategoriaVemper[]>([
    { id: '1', nombre: 'Electrónica', productos: 45 },
    { id: '2', nombre: 'Ropa', productos: 32 },
    { id: '3', nombre: 'Hogar', productos: 18 },
    { id: '4', nombre: 'Deportes', productos: 27 },
    { id: '5', nombre: 'Libros', productos: 12 },
    { id: '6', nombre: 'Juguetes', productos: 8 },
    { id: '7', nombre: 'Belleza', productos: 35 },
    { id: '8', nombre: 'Alimentos', productos: 22 },
    { id: '9', nombre: 'Música', productos: 15 },
    { id: '10', nombre: 'Jardín', productos: 19 },
  ]);

  categoriasFiltradas = computed(() => {
    let lista = this.categorias();
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    if (busqueda) {
      lista = lista.filter(cat => cat.nombre.toLowerCase().includes(busqueda));
    }
    return lista;
  });

  paginaActual = signal(1);
  categoriasPorPagina = signal(12);
  totalCategorias = computed(() => this.categoriasFiltradas().length);
  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalCategorias() / this.categoriasPorPagina()))
  );
  categoriasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.categoriasPorPagina();
    const fin = inicio + this.categoriasPorPagina();
    return this.categoriasFiltradas().slice(inicio, fin);
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

  filtrosVisibles = signal<boolean>(false);

  actualizarBusqueda(valor: string) {
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  alternarFiltros() {
    this.filtrosVisibles.update(v => !v);
  }

  limpiarFiltros() {
    this.textoBusqueda.set('');
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

  verProductos(categoria: CategoriaVemper) {
    this.router.navigate(['/admin/catalogo/importar-vemper/categoria', categoria.id, 'productos']);
  }
}
