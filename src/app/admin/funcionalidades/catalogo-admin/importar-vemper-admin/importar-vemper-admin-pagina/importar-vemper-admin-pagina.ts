import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BloqueEstadoTablaComponente } from '../../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';

/** Categoría mostrada en Importar Vemper (solo las que tienen idVemper) */
interface CategoriaVemper {
  id: string;
  nombre: string;
  productos: number;
}

@Component({
  selector: 'app-importar-veemper-admin-pagina',
  standalone: true,
  imports: [CommonModule, BloqueEstadoTablaComponente],
  templateUrl: './importar-vemper-admin-pagina.html',
  styleUrl: './importar-vemper-admin-pagina.css',
})
export class ImportarVemperAdminPagina implements OnInit {
  private router = inject(Router);
  private categoriasApi = inject(CategoriasApiServicio);
  private notificacion = inject(NotificacionServicio);

  Math = Math;

  /** Estado de carga inicial */
  estaCargando = signal(false);
  /** Texto del buscador */
  textoBusqueda = signal<string>('');
  /** Lista de categorías con Vemper (idVemper no null) */
  categorias = signal<CategoriaVemper[]>([]);
  /** Muestra u oculta el panel de filtros */
  filtrosVisibles = signal<boolean>(true);
  /** Página actual de la paginación */
  paginaActual = signal(1);
  /** Cantidad de categorías por página */
  categoriasPorPagina = signal(12);

  /** Categorías filtradas por el texto de búsqueda */
  categoriasFiltradas = computed(() => {
    const lista = this.categorias();
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    if (!busqueda) return lista;
    return lista.filter((cat) => cat.nombre.toLowerCase().includes(busqueda));
  });

  totalCategorias = computed(() => this.categoriasFiltradas().length);
  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalCategorias() / this.categoriasPorPagina())),
  );
  /** Categorías de la página actual */
  categoriasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.categoriasPorPagina();
    const fin = inicio + this.categoriasPorPagina();
    return this.categoriasFiltradas().slice(inicio, fin);
  });
  /** Números de página a mostrar en la paginación */
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
    this.cargarCategorias();
  }

  /** Carga las categorías desde la API y deja solo las que tienen idVemper */
  cargarCategorias(): void {
    this.estaCargando.set(true);
    this.categoriasApi.obtenerTodas().subscribe({
      next: (lista) => {
        const conVemper = lista.filter((c) => c.idVemper != null && c.idVemper !== '');
        this.categorias.set(
          conVemper.map((c) => ({
            id: String(c.id_categoria),
            nombre: c.nombre,
            productos: c.cantidadProductos ?? 0,
          })),
        );
      },
      error: () => {
        this.estaCargando.set(false);
        this.notificacion.error('No se pudieron cargar las categorías');
      },
      complete: () => this.estaCargando.set(false),
    });
  }

  /** Actualiza el texto de búsqueda y vuelve a la primera página */
  actualizarBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  /** Muestra u oculta el panel de filtros */
  alternarFiltros(): void {
    this.filtrosVisibles.update((v) => !v);
  }

  /** Limpia el buscador y vuelve a la primera página */
  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.paginaActual.set(1);
  }

  /** Va a la página indicada si está dentro del rango */
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  /** Pasa a la página anterior */
  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((p) => p - 1);
    }
  }

  /** Pasa a la página siguiente */
  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((p) => p + 1);
    }
  }

  /** Navega a la página de productos Vemper de la categoría */
  verProductos(categoria: CategoriaVemper): void {
    this.router.navigate(['/admin/catalogo/importar-vemper/categoria', categoria.id, 'productos']);
  }
}
