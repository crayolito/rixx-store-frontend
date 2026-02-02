import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Modal } from '../../../../../compartido/componentes/modal/modal';

// FASE 1: Modelo de categoría
interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  estado: 'activo' | 'inactivo';
  fechaActualizacion: string;
  productos: number;
}

@Component({
  selector: 'app-categorias-admin-pagina',
  standalone: true,
  imports: [CommonModule, Modal],
  templateUrl: './categorias-admin-pagina.html',
  styleUrl: './categorias-admin-pagina.css',
})
export class CategoriasAdminPagina {
  Math = Math;

  // FASE 2: Estado de visibilidad de filtros
  filtrosVisibles = signal<boolean>(false);

  // FASE 3: Estado de los dropdowns (abierto/cerrado)
  dropdownEstadoAbierto = signal(false);

  // FASE 4: Valores seleccionados en cada filtro
  estadoSeleccionado = signal<string>('Todos');
  textoBusqueda = signal<string>('');

  // FASE 5: Opciones disponibles para cada filtro
  opcionesEstado = [
    'Todos',
    'Activo',
    'Inactivo'
  ];

  // FASE 6: Datos de categorías (temporal, vendrá del servicio)
  categorias = signal<Categoria[]>([
    {
      id: '1',
      nombre: 'Electrónica',
      descripcion: 'Dispositivos electrónicos y tecnología',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-20 14:20:00',
      productos: 45
    },
    {
      id: '2',
      nombre: 'Ropa',
      descripcion: 'Prendas de vestir para todas las edades',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-18 16:45:00',
      productos: 32
    },
    {
      id: '3',
      nombre: 'Hogar',
      descripcion: 'Artículos para el hogar y decoración',
      imagen: '/imagenes/images1.jpg',
      estado: 'inactivo',
      fechaActualizacion: '2024-01-19 10:30:00',
      productos: 18
    },
    {
      id: '4',
      nombre: 'Deportes',
      descripcion: 'Equipamiento deportivo y fitness',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-21 15:10:00',
      productos: 27
    },
    {
      id: '5',
      nombre: 'Libros',
      descripcion: 'Libros físicos y digitales',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-22 09:30:00',
      productos: 12
    },
    {
      id: '6',
      nombre: 'Juguetes',
      descripcion: 'Juguetes para niños y niñas',
      imagen: '/imagenes/images1.jpg',
      estado: 'inactivo',
      fechaActualizacion: '2024-01-23 11:20:00',
      productos: 8
    },
    {
      id: '7',
      nombre: 'Belleza',
      descripcion: 'Productos de belleza y cuidado personal',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-24 16:00:00',
      productos: 35
    },
    {
      id: '8',
      nombre: 'Alimentos',
      descripcion: 'Productos alimenticios y bebidas',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-25 10:15:00',
      productos: 22
    },
    {
      id: '9',
      nombre: 'Música',
      descripcion: 'Instrumentos musicales y accesorios',
      imagen: '/imagenes/images1.jpg',
      estado: 'inactivo',
      fechaActualizacion: '2024-01-26 14:45:00',
      productos: 15
    },
    {
      id: '10',
      nombre: 'Jardín',
      descripcion: 'Herramientas y plantas para jardín',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-27 12:30:00',
      productos: 19
    },
    {
      id: '11',
      nombre: 'Automotriz',
      descripcion: 'Accesorios y repuestos para vehículos',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-28 15:00:00',
      productos: 14
    },
    {
      id: '12',
      nombre: 'Mascotas',
      descripcion: 'Productos para mascotas',
      imagen: '/imagenes/images1.jpg',
      estado: 'activo',
      fechaActualizacion: '2024-01-29 09:45:00',
      productos: 21
    }
  ]);

  // FASE 7: Categorías filtradas según los filtros aplicados
  categoriasFiltradas = computed(() => {
    let resultado = this.categorias();

    // FASE 7.1: Filtrar por texto de búsqueda
    if (this.textoBusqueda().trim()) {
      const busqueda = this.textoBusqueda().toLowerCase().trim();
      resultado = resultado.filter(categoria =>
        categoria.nombre.toLowerCase().includes(busqueda) ||
        categoria.descripcion.toLowerCase().includes(busqueda)
      );
    }

    // FASE 7.2: Filtrar por estado
    if (this.estadoSeleccionado() !== 'Todos') {
      const estadoFiltro = this.estadoSeleccionado().toLowerCase();
      resultado = resultado.filter(categoria =>
        categoria.estado === estadoFiltro
      );
    }

    return resultado;
  });

  // FASE 8: Paginación
  paginaActual = signal(1);
  categoriasPorPagina = signal(10);
  totalCategorias = computed(() => this.categoriasFiltradas().length);

  // FASE 9: Calcular total de páginas
  totalPaginas = computed(() => {
    return Math.ceil(this.totalCategorias() / this.categoriasPorPagina());
  });

  // FASE 10: Calcular categorías a mostrar en la página actual
  categoriasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.categoriasPorPagina();
    const fin = inicio + this.categoriasPorPagina();
    return this.categoriasFiltradas().slice(inicio, fin);
  });

  // FASE 11: Obtener números de página a mostrar
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

  // FASE 12: Truncar texto de la categoría
  truncarTexto(texto: string, limite: number): string {
    if (texto.length <= limite) {
      return texto;
    }
    return texto.substring(0, limite) + '...';
  }

  // FASE 13: Formatear fecha
  formatearFecha(fecha: string): string {
    return fecha;
  }

  // FASE 14: Cambiar a página específica
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  // FASE 15: Ir a página anterior
  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(pag => pag - 1);
    }
  }

  // FASE 16: Ir a página siguiente
  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(pag => pag + 1);
    }
  }

  // FASE 17: Alternar visibilidad de filtros
  alternarFiltros() {
    this.filtrosVisibles.update(visible => !visible);
  }

  // FASE 18: Alternar visibilidad del dropdown de estado
  alternarEstado() {
    this.dropdownEstadoAbierto.update(abierto => !abierto);
  }

  // FASE 19: Seleccionar un estado
  seleccionarEstado(opcion: string) {
    this.estadoSeleccionado.set(opcion);
    this.dropdownEstadoAbierto.set(false);
    this.paginaActual.set(1);
  }

  // FASE 20: Cerrar todos los dropdowns al hacer click fuera
  cerrarTodosLosDropdowns() {
    this.dropdownEstadoAbierto.set(false);
  }

  // FASE 21: Limpiar filtros
  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.estadoSeleccionado.set('Todos');
    this.paginaActual.set(1);
  }

  // FASE 22: Modal para agregar/editar categoría
  modalTipoCampoAbierto = signal<boolean>(false);
  categoriaEditando = signal<Categoria | null>(null);
  nombreCategoria = signal<string>('');
  descripcionCategoria = signal<string>('');
  imagenCategoria = signal<string>('');
  estadoCategoria = signal<'activo' | 'inactivo'>('activo');

  // FASE 23: Abrir modal para agregar categoría
  abrirModalAgregar() {
    this.categoriaEditando.set(null);
    this.nombreCategoria.set('');
    this.descripcionCategoria.set('');
    this.imagenCategoria.set('');
    this.estadoCategoria.set('activo');
    this.modalTipoCampoAbierto.set(true);
  }

  // FASE 24: Abrir modal para editar categoría
  abrirModalEditar(categoria: Categoria) {
    this.categoriaEditando.set(categoria);
    this.nombreCategoria.set(categoria.nombre);
    this.descripcionCategoria.set(categoria.descripcion);
    this.imagenCategoria.set(categoria.imagen);
    this.estadoCategoria.set(categoria.estado);
    this.modalTipoCampoAbierto.set(true);
  }

  // FASE 25: Cerrar modal
  cerrarModalTipoCampo() {
    this.modalTipoCampoAbierto.set(false);
    this.categoriaEditando.set(null);
  }

  // FASE 26: Guardar categoría
  guardarCategoria() {
    if (!this.nombreCategoria().trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    if (this.categoriaEditando()) {
      // FASE 26.1: Actualizar categoría existente
      this.categorias.update(lista =>
        lista.map(cat =>
          cat.id === this.categoriaEditando()!.id
            ? {
              ...cat,
              nombre: this.nombreCategoria(),
              descripcion: this.descripcionCategoria(),
              imagen: this.imagenCategoria() || '/imagenes/images1.jpg',
              estado: this.estadoCategoria(),
              fechaActualizacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
            }
            : cat
        )
      );
    } else {
      // FASE 26.2: Crear nueva categoría
      const nuevaCategoria: Categoria = {
        id: Date.now().toString(),
        nombre: this.nombreCategoria(),
        descripcion: this.descripcionCategoria(),
        imagen: this.imagenCategoria() || '/imagenes/images1.jpg',
        estado: this.estadoCategoria(),
        fechaActualizacion: new Date().toISOString().slice(0, 19).replace('T', ' '),
        productos: 0
      };
      this.categorias.update(lista => [...lista, nuevaCategoria]);
    }

    this.cerrarModalTipoCampo();
  }

  // FASE 27: Manejar cambio de imagen
  manejarCambioImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenCategoria.set(e.target.result);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // FASE 28: Eliminar categoría
  eliminarCategoria(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      this.categorias.update(lista => lista.filter(cat => cat.id !== id));
    }
  }
}
