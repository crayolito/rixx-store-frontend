import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BloqueEstadoTablaComponente } from '../../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { ProductoApi } from '../../../../../compartido/modelos/producto.modelo';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

@Component({
  selector: 'app-productos-admin-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink, BloqueEstadoTablaComponente],
  templateUrl: './productos-admin-pagina.html',
  styleUrl: './productos-admin-pagina.css',
})
export class ProductosAdminPagina implements OnInit {
  Math = Math;
  private productosApi = inject(ProductosApiServicio);
  private categoriasApi = inject(CategoriasApiServicio);

  estaCargando = signal(false);
  filtrosVisibles = signal(true);
  dropdownCategoriaAbierto = signal(false);
  dropdownEstadoAbierto = signal(false);
  dropdownTipoProcesoAbierto = signal(false);

  categoriaSeleccionada = signal<string>('Todas las categorias');
  estadoSeleccionado = signal<string>('Todos');
  tipoProcesoSeleccionado = signal<string>('Todos');
  textoBusqueda = signal<string>('');

  opcionesEstado = signal<string[]>(['Todos']);
  opcionesCategoria = signal<string[]>(['Todas las categorias']);
  opcionesTipoProceso = signal<string[]>(['Todos']);

  productos = signal<ProductoApi[]>([]);

  productosFiltrados = computed(() => {
    const lista = this.productos();
    const busqueda = (this.textoBusqueda() ?? '').trim().toLowerCase();
    const categoria = this.categoriaSeleccionada();
    const estado = this.estadoSeleccionado();
    const tipoProceso = this.tipoProcesoSeleccionado();
    return lista.filter((p) => {
      if (busqueda && !(p.titulo ?? '').toLowerCase().includes(busqueda)) return false;
      if (categoria !== 'Todas las categorias' && !(p.categorias ?? []).includes(categoria))
        return false;
      if (estado !== 'Todos' && p.estado !== estado) return false;
      if (tipoProceso !== 'Todos' && p.tipoProceso !== tipoProceso) return false;
      return true;
    });
  });

  paginaActual = signal(1);
  productosPorPagina = signal(15);
  totalProductos = computed(() => this.productosFiltrados().length);
  totalPaginas = computed(() => Math.ceil(this.totalProductos() / this.productosPorPagina()));

  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    const fin = inicio + this.productosPorPagina();
    return this.productosFiltrados().slice(inicio, fin);
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
    this.estaCargando.set(true);
    this.productosApi.obtenerImportados().subscribe({
      next: (lista) => {
        this.productos.set(lista);
        const estadosUnicos = [...new Set(lista.map((p) => p.estado).filter(Boolean))].sort();
        this.opcionesEstado.set(['Todos', ...estadosUnicos]);
        const procesosUnicos = [...new Set(lista.map((p) => p.tipoProceso).filter(Boolean))].sort();
        this.opcionesTipoProceso.set(['Todos', ...procesosUnicos]);
        this.estaCargando.set(false);
      },
      error: () => this.estaCargando.set(false),
    });
    this.categoriasApi.obtenerTodas().subscribe({
      next: (categorias) => {
        const nombres = categorias.map((c) => c.nombre);
        this.opcionesCategoria.set(['Todas las categorias', ...nombres]);
      },
    });
  }

  truncarTexto(texto: string, limite: number): string {
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  }

  primeraLetraMayuscula(texto: string): string {
    if (!texto || !texto.length) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  categoriasTexto(producto: ProductoApi): string {
    return (producto.categorias ?? []).join(', ');
  }

  formatearFecha(fecha: Date): string {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${año}-${mes}-${dia} ${horas}:${minutos}`;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((pag) => pag - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((pag) => pag + 1);
    }
  }

  alternarFiltros(): void {
    this.filtrosVisibles.update((v) => !v);
  }

  alternarCategoria(): void {
    this.dropdownCategoriaAbierto.update((abierto) => !abierto);
    this.dropdownEstadoAbierto.set(false);
    this.dropdownTipoProcesoAbierto.set(false);
  }

  alternarEstado(): void {
    this.dropdownEstadoAbierto.update((abierto) => !abierto);
    this.dropdownCategoriaAbierto.set(false);
    this.dropdownTipoProcesoAbierto.set(false);
  }

  alternarTipoProceso(): void {
    this.dropdownTipoProcesoAbierto.update((abierto) => !abierto);
    this.dropdownCategoriaAbierto.set(false);
    this.dropdownEstadoAbierto.set(false);
  }

  seleccionarCategoria(opcion: string): void {
    this.categoriaSeleccionada.set(opcion);
    this.dropdownCategoriaAbierto.set(false);
    this.paginaActual.set(1);
  }

  seleccionarEstado(opcion: string): void {
    this.estadoSeleccionado.set(opcion);
    this.dropdownEstadoAbierto.set(false);
    this.paginaActual.set(1);
  }

  seleccionarTipoProceso(opcion: string): void {
    this.tipoProcesoSeleccionado.set(opcion);
    this.dropdownTipoProcesoAbierto.set(false);
    this.paginaActual.set(1);
  }

  cerrarTodosLosDropdowns(): void {
    this.dropdownCategoriaAbierto.set(false);
    this.dropdownEstadoAbierto.set(false);
    this.dropdownTipoProcesoAbierto.set(false);
  }

  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.categoriaSeleccionada.set('Todas las categorias');
    this.estadoSeleccionado.set('Todos');
    this.tipoProcesoSeleccionado.set('Todos');
    this.paginaActual.set(1);
  }

  eliminarProducto(handle: string): void {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productosApi.eliminar(handle).subscribe({
      next: (r) => {
        if (r?.exito) {
          this.productos.update((lista) => lista.filter((p) => p.handle !== handle));
        }
      },
    });
  }
}
