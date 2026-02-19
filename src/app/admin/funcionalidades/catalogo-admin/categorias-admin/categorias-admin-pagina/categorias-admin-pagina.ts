import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { BloqueEstadoTablaComponente } from '../../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { Modal } from '../../../../../compartido/componentes/modal/modal';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';

interface Categoria {
  id: string;
  nombre: string;
  handle: string;
  generaCodigo: boolean;
  cantidadProductos: number;
}

@Component({
  selector: 'app-categorias-admin-pagina',
  standalone: true,
  imports: [CommonModule, Modal, BloqueEstadoTablaComponente],
  templateUrl: './categorias-admin-pagina.html',
  styleUrl: './categorias-admin-pagina.css',
})
export class CategoriasAdminPagina implements OnInit {
  Math = Math;

  private categoriasApi = inject(CategoriasApiServicio);
  private notificacion = inject(NotificacionServicio);

  filtrosVisibles = signal(true);
  textoBusqueda = signal<string>('');

  categorias = signal<Categoria[]>([]);
  productos = signal<{ categorias?: string[] }[]>([]);
  estaCargando = signal(false);
  guardando = signal(false);

  categoriasPorPagina = signal(10);
  paginaActual = signal(1);

  categoriasFiltradas = computed(() => {
    const lista = this.categorias();
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    if (!busqueda) return lista;
    return lista.filter((c) => c.nombre.toLowerCase().includes(busqueda));
  });

  totalCategorias = computed(() => this.categoriasFiltradas().length);

  totalPaginas = computed(() => Math.ceil(this.totalCategorias() / this.categoriasPorPagina()));

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

  modalTipoCampoAbierto = signal(false);
  categoriaEditando = signal<Categoria | null>(null);
  nombreCategoria = signal<string>('');
  generaCodigoCategoria = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.estaCargando.set(true);
    this.categoriasApi.obtenerTodas().subscribe({
      next: (categorias) => {
        this.categorias.set(
          categorias.map((c) => ({
            id: String(c.id_categoria),
            nombre: c.nombre,
            handle: c.handle,
            generaCodigo: c.generaCodigo ?? false,
            cantidadProductos: c.cantidadProductos ?? 0,
          })),
        );
      },
      error: () => {
        this.notificacion.error('No se pudieron cargar las categorías');
      },
      complete: () => this.estaCargando.set(false),
    });
  }

  cantidadProductos(categoria: Categoria): number {
    return categoria.cantidadProductos ?? 0;
  }

  actualizarBusqueda(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  alternarFiltros(): void {
    this.filtrosVisibles.update((v) => !v);
  }

  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.paginaActual.set(1);
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((p) => p - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((p) => p + 1);
    }
  }

  abrirModalAgregar(): void {
    this.categoriaEditando.set(null);
    this.nombreCategoria.set('');
    this.generaCodigoCategoria.set(false);
    this.modalTipoCampoAbierto.set(true);
  }

  abrirModalEditar(categoria: Categoria): void {
    this.categoriaEditando.set(categoria);
    this.nombreCategoria.set(categoria.nombre);
    this.generaCodigoCategoria.set(categoria.generaCodigo ?? false);
    this.modalTipoCampoAbierto.set(true);
  }

  cerrarModalTipoCampo(): void {
    this.modalTipoCampoAbierto.set(false);
    this.categoriaEditando.set(null);
  }

  guardarCategoria(): void {
    if (!this.nombreCategoria().trim()) {
      this.notificacion.advertencia('El nombre de la categoría es obligatorio');
      return;
    }
    const nombre = this.nombreCategoria().trim();
    const generaCodigo = this.generaCodigoCategoria();
    const editando = this.categoriaEditando();
    this.guardando.set(true);
    if (editando) {
      this.categoriasApi.actualizar(Number(editando.id), { nombre, generaCodigo }).subscribe({
        next: () => {
          this.notificacion.exito('Categoría actualizada');
          this.cerrarModalTipoCampo();
          this.cargarDatos();
        },
        error: () => {
          this.notificacion.error('No se pudo actualizar la categoría');
        },
        complete: () => this.guardando.set(false),
      });
    } else {
      this.categoriasApi.crear({ nombre, generaCodigo }).subscribe({
        next: () => {
          this.notificacion.exito('Categoría creada');
          this.cerrarModalTipoCampo();
          this.cargarDatos();
        },
        error: () => {
          this.notificacion.error('No se pudo crear la categoría');
        },
        complete: () => this.guardando.set(false),
      });
    }
  }

  /** Elimina la categoría por id (sin confirmación: un clic y se elimina) */
  eliminarCategoria(id: string): void {
    this.guardando.set(true);
    this.categoriasApi.eliminar(Number(id)).subscribe({
      next: () => {
        this.notificacion.exito('Categoría eliminada');
        this.cargarDatos();
      },
      error: () => {
        this.notificacion.error('No se pudo eliminar la categoría');
      },
      complete: () => this.guardando.set(false),
    });
  }
}
