import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto, PRODUCTOS } from '../../../../../compartido/datos/productos.datos';

@Component({
  selector: 'app-productos-admin-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './productos-admin-pagina.html',
  styleUrl: './productos-admin-pagina.css',
})
export class ProductosAdminPagina {
  Math = Math;

  // FASE 2: Estado de los dropdowns (abierto/cerrado)
  dropdownCategoriaAbierto = signal(false);
  dropdownEstadoAbierto = signal(false);
  dropdownDisponibilidadAbierto = signal(false);

  // FASE 3: Valores seleccionados en cada filtro
  categoriaSeleccionada = signal<string>('Todas las categorías');
  estadoSeleccionado = signal<string>('Todos');
  disponibilidadSeleccionada = signal<string>('Todos');
  textoBusqueda = signal<string>('');

  // FASE 4: Opciones disponibles para cada filtro
  opcionesCategoria = [
    'Todas las categorías',
    'Electrónica',
    'Ropa',
    'Hogar',
    'Deportes'
  ];

  opcionesEstado = [
    'Todos',
    'Activo',
    'Borrador',
    'Archivado',
    'Pausado'
  ];

  opcionesDisponibilidad = [
    'Todos',
    'En stock',
    'Sin stock',
    'Bajo stock'
  ];

  productos = signal<Producto[]>([...PRODUCTOS]);

  // FASE 6: Paginación
  paginaActual = signal(1);
  productosPorPagina = signal(10);
  totalProductos = computed(() => this.productos().length);

  // FASE 7: Calcular total de páginas
  totalPaginas = computed(() => {
    return Math.ceil(this.totalProductos() / this.productosPorPagina());
  });

  // FASE 8: Calcular productos a mostrar en la página actual
  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    const fin = inicio + this.productosPorPagina();
    return this.productos().slice(inicio, fin);
  });

  // FASE 9: Obtener números de página a mostrar
  paginasAMostrar = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(total);
      } else if (actual >= total - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = total - 4; i <= total; i++) {
          paginas.push(i);
        }
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = actual - 1; i <= actual + 1; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(total);
      }
    }
    return paginas;
  });

  // FASE 10: Truncar texto del producto
  truncarTexto(texto: string, limite: number): string {
    if (texto.length <= limite) {
      return texto;
    }
    return texto.substring(0, limite) + '...';
  }

  // FASE 11: Formatear fecha
  formatearFecha(fecha: Date): string {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${año}-${mes}-${dia} ${horas}:${minutos}`;
  }

  // FASE 12: Cambiar a página específica
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  // FASE 13: Ir a página anterior
  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(pag => pag - 1);
    }
  }

  // FASE 14: Ir a página siguiente
  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(pag => pag + 1);
    }
  }

  // FASE 15: Alternar visibilidad del dropdown de categoría
  alternarCategoria() {
    this.dropdownCategoriaAbierto.update(abierto => !abierto);
    this.dropdownEstadoAbierto.set(false);
    this.dropdownDisponibilidadAbierto.set(false);
  }

  // FASE 16: Alternar visibilidad del dropdown de estado
  alternarEstado() {
    this.dropdownEstadoAbierto.update(abierto => !abierto);
    this.dropdownCategoriaAbierto.set(false);
    this.dropdownDisponibilidadAbierto.set(false);
  }

  // FASE 17: Alternar visibilidad del dropdown de disponibilidad
  alternarDisponibilidad() {
    this.dropdownDisponibilidadAbierto.update(abierto => !abierto);
    this.dropdownCategoriaAbierto.set(false);
    this.dropdownEstadoAbierto.set(false);
  }

  // FASE 18: Seleccionar una categoría
  seleccionarCategoria(opcion: string) {
    this.categoriaSeleccionada.set(opcion);
    this.dropdownCategoriaAbierto.set(false);
    this.paginaActual.set(1);
  }

  // FASE 19: Seleccionar un estado
  seleccionarEstado(opcion: string) {
    this.estadoSeleccionado.set(opcion);
    this.dropdownEstadoAbierto.set(false);
    this.paginaActual.set(1);
  }

  // FASE 20: Seleccionar una disponibilidad
  seleccionarDisponibilidad(opcion: string) {
    this.disponibilidadSeleccionada.set(opcion);
    this.dropdownDisponibilidadAbierto.set(false);
    this.paginaActual.set(1);
  }

  // FASE 21: Cerrar todos los dropdowns al hacer click fuera
  cerrarTodosLosDropdowns() {
    this.dropdownCategoriaAbierto.set(false);
    this.dropdownEstadoAbierto.set(false);
    this.dropdownDisponibilidadAbierto.set(false);
  }

  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.categoriaSeleccionada.set('Todas las categorías');
    this.estadoSeleccionado.set('Todos');
    this.disponibilidadSeleccionada.set('Todos');
    this.paginaActual.set(1);
  }

  // FASE 22: Editar producto
  editarProducto(id: string) {
    console.log('Editar producto:', id);
    // Aquí navegarías a la página de edición
  }

  // FASE 23: Eliminar producto
  eliminarProducto(id: string) {
    console.log('Eliminar producto:', id);
    // Aquí mostrarías confirmación y eliminarías el producto
  }
}
