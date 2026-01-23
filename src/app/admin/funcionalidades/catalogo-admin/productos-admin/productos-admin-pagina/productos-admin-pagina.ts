import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

// FASE 1: Modelo de producto
interface Producto {
  id: string;
  nombre: string;
  imagen: string;
  categoria: string;
  estado: 'Activo' | 'Inactivo' | 'Agotado';
  fuente: string;
  inventario: number;
}

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

  // FASE 5: Datos de productos (temporal, vendrá del servicio)
  productos = signal<Producto[]>([
    {
      id: '1',
      nombre: 'Laptop Gaming Ultra Pro con Procesador Intel i9 y Tarjeta Gráfica RTX 4090',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 500,
      fuente: 'Manual'
    },
    {
      id: '2',
      nombre: 'Smartphone Android',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Inactivo',
      inventario: 0,
      fuente: 'Manual'
    },
    {
      id: '3',
      nombre: 'Auriculares Inalámbricos Premium',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Agotado',
      inventario: 25,
      fuente: 'Manual'
    },
    {
      id: '4',
      nombre: 'Teclado Mecánico RGB',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Inactivo',
      inventario: 150,
      fuente: 'Manual'
    },
    {
      id: '5',
      nombre: 'Monitor 4K Ultra HD de 32 Pulgadas con Tecnología HDR y Frecuencia de Refresco de 144Hz',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 75,
      fuente: 'Manual'
    },
    {
      id: '6',
      nombre: 'Mouse Inalámbrico Ergonómico',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 200,
      fuente: 'Manual'
    },
    {
      id: '7',
      nombre: 'Webcam Full HD 1080p',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 80,
      fuente: 'Manual'
    },
    {
      id: '8',
      nombre: 'Tablet Android de 10 Pulgadas',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Inactivo',
      inventario: 0,
      fuente: 'Manual'
    },
    {
      id: '9',
      nombre: 'Altavoz Bluetooth Portátil',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 120,
      fuente: 'Manual'
    },
    {
      id: '10',
      nombre: 'Cámara Digital Profesional',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Inactivo',
      inventario: 15,
      fuente: 'Manual'
    },
    {
      id: '11',
      nombre: 'Disco Duro Externo 2TB',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 90,
      fuente: 'Manual'
    },
    {
      id: '12',
      nombre: 'Router WiFi 6 de Alta Velocidad',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 60,
      fuente: 'Manual'
    },
    {
      id: '13',
      nombre: 'Smartwatch con Monitor de Salud',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Inactivo',
      inventario: 0,
      fuente: 'Manual'
    },
    {
      id: '14',
      nombre: 'Impresora Multifuncional',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Activo',
      inventario: 40,
      fuente: 'Manual'
    },
    {
      id: '15',
      nombre: 'Micrófono USB para Streaming',
      imagen: '/imagenes/images1.jpg',
      categoria: 'Electrónica',
      estado: 'Inactivo',
      inventario: 30,
      fuente: 'Manual'
    }
  ]);

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
