import { Component, computed, signal } from '@angular/core';
import { Modal } from '../../../../../compartido/componentes/modal/modal';

interface Codigo {
  id: string;
  codigo: string;
  nombre_producto: string;
  precio_producto: string;
  cliente_email: string;
  cliente_nombre: string;
  estado: 'disponible' | 'vendido' | 'expirado' | 'usado' | 'reservado';
  fecha_creacion: string;
  fecha_expiracion: string;
  informacion_adicional?: string;
}

interface PrecioProducto {
  id: string;
  nombre: string;
  precio: number;
  bonificacion?: string;
}

interface ProductoConPrecios {
  id: string;
  nombre: string;
  precios: PrecioProducto[];
}

@Component({
  selector: 'app-codigos-admin-pagina',
  imports: [Modal],
  templateUrl: './codigos-admin-pagina.html',
  styleUrl: './codigos-admin-pagina.css',
})
export class CodigosAdminPagina {
  Math = Math;

  // FASE 1: Estados para filtros superiores (badges de colores) - AGREGADO TOTAL
  estadosFiltro = [
    { nombre: 'Total', valor: 'total', color: 'morado' },
    { nombre: 'Disponible', valor: 'disponible', color: 'verde' },
    { nombre: 'Vendido', valor: 'vendido', color: 'azul' },
    { nombre: 'Expirado', valor: 'expirado', color: 'rojo' },
    { nombre: 'Usado', valor: 'usado', color: 'gris' },
    { nombre: 'Reservado', valor: 'reservado', color: 'amarillo' }
  ];
  estadoActivoFiltro = signal<string | null>(null);

  // FASE 2: Controles de visibilidad
  modalAgregarAbierto = signal(false);
  filtrosVisibles = signal(true);

  // FASE 2.1: Estados del modal de agregar código
  productoSeleccionado = signal<string>('');
  precioSeleccionado = signal<string>('');
  sinFechaExpiracion = signal<boolean>(false);
  fechaExpiracionCodigo = signal<string>('');
  productosDisponibles = signal<ProductoConPrecios[]>([
    {
      id: '1',
      nombre: 'Pines Free Latam',
      precios: [
        { id: '1-1', nombre: '1200 + 218 diamantes bonus', precio: 1200, bonificacion: '218 diamantes bonus' },
        { id: '1-2', nombre: '2400 + 450 diamantes bonus', precio: 2400, bonificacion: '450 diamantes bonus' },
        { id: '1-3', nombre: '5000 + 1000 diamantes bonus', precio: 5000, bonificacion: '1000 diamantes bonus' }
      ]
    },
    {
      id: '2',
      nombre: 'Recarga Movistar 50',
      precios: [
        { id: '2-1', nombre: '$50.00', precio: 50 },
        { id: '2-2', nombre: '$100.00', precio: 100 },
        { id: '2-3', nombre: '$200.00', precio: 200 }
      ]
    },
    {
      id: '3',
      nombre: 'Netflix Premium',
      precios: [
        { id: '3-1', nombre: '1 Mes - $120.00', precio: 120 },
        { id: '3-2', nombre: '3 Meses - $350.00', precio: 350 },
        { id: '3-3', nombre: '6 Meses - $650.00', precio: 650 }
      ]
    }
  ]);

  preciosDisponibles = computed(() => {
    if (!this.productoSeleccionado()) {
      return [];
    }
    const producto = this.productosDisponibles().find(p => p.id === this.productoSeleccionado());
    return producto ? producto.precios : [];
  });

  precioSelectHabilitado = computed(() => {
    return this.productoSeleccionado() !== '';
  });

  // FASE 3: Filtros de búsqueda avanzada - MODIFICADO
  textoBusqueda = signal<string>(''); // Solo busca código
  productoFiltroSeleccionado = signal<string>(''); // Nuevo: filtro por producto
  precioFiltroSeleccionado = signal<string>(''); // Nuevo: filtro por precio

  // FASE 4: Control de dropdowns
  dropdownProductoAbierto = signal(false);
  dropdownPrecioAbierto = signal(false);

  // FASE 5: Datos de códigos (temporal)
  codigos = signal<Codigo[]>([
    {
      id: 'df846764-246b-4470-914f-910a6068242d',
      codigo: 'ABC123|pass123|info adicional',
      nombre_producto: 'Pines Free Latam',
      precio_producto: '1200 + 218 diamantes bonus',
      cliente_email: 'josalejandroapp2017@gmail.com',
      cliente_nombre: 'José Alejandro',
      estado: 'disponible',
      fecha_creacion: '2026-01-20 10:00:00',
      fecha_expiracion: '2026-01-25 12:00:00',
    },
    {
      id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
      codigo: 'XYZ789|secreto789',
      nombre_producto: 'Recarga Movistar 50',
      precio_producto: '$50.00',
      cliente_email: 'maria.lopez@gmail.com',
      cliente_nombre: 'María López',
      estado: 'vendido',
      fecha_creacion: '2026-01-19 14:30:00',
      fecha_expiracion: '2026-01-24 14:30:00',
    },
    {
      id: 'b2c3d4e5-6789-01bc-def2-234567890abc',
      codigo: 'DEF456|clave456|datos extras',
      nombre_producto: 'Netflix Premium 1 Mes',
      precio_producto: '$120.00',
      cliente_email: 'carlos.martinez@hotmail.com',
      cliente_nombre: 'Carlos Martínez',
      estado: 'expirado',
      fecha_creacion: '2026-01-10 09:15:00',
      fecha_expiracion: '2026-01-18 09:15:00',
    },
    {
      id: 'c3d4e5f6-7890-12cd-ef34-34567890abcd',
      codigo: 'GHI789|password789',
      nombre_producto: 'Spotify Premium 3 Meses',
      precio_producto: '$99.00',
      cliente_email: 'ana.garcia@yahoo.com',
      cliente_nombre: 'Ana García',
      estado: 'usado',
      fecha_creacion: '2026-01-18 11:45:00',
      fecha_expiracion: '2026-01-28 11:45:00',
    },
    {
      id: 'd4e5f6g7-8901-23de-f456-4567890abcde',
      codigo: 'JKL012|key012',
      nombre_producto: 'Xbox Game Pass 1 Mes',
      precio_producto: '$150.00',
      cliente_email: 'luis.hernandez@outlook.com',
      cliente_nombre: 'Luis Hernández',
      estado: 'reservado',
      fecha_creacion: '2026-01-21 08:20:00',
      fecha_expiracion: '2026-01-26 08:20:00',
    },
    {
      id: 'e5f6g7h8-9012-34ef-5678-567890abcdef',
      codigo: 'MNO345|pass345|más información',
      nombre_producto: 'Steam Wallet $20',
      precio_producto: '$20.00',
      cliente_email: 'sofia.ramirez@gmail.com',
      cliente_nombre: 'Sofía Ramírez',
      estado: 'disponible',
      fecha_creacion: '2026-01-21 12:10:00',
      fecha_expiracion: '2026-01-30 12:10:00',
    },
    {
      id: 'f6g7h8i9-0123-45fg-6789-67890abcdefg',
      codigo: 'PQR678|secret678',
      nombre_producto: 'Amazon Gift Card $50',
      precio_producto: '$50.00',
      cliente_email: 'pedro.fernandez@gmail.com',
      cliente_nombre: 'Pedro Fernández',
      estado: 'vendido',
      fecha_creacion: '2026-01-20 16:30:00',
      fecha_expiracion: '2026-01-27 16:30:00',
    },
    {
      id: 'g7h8i9j0-1234-56gh-7890-7890abcdefgh',
      codigo: 'STU901|clave901',
      nombre_producto: 'PlayStation Plus 1 Mes',
      precio_producto: '$160.00',
      cliente_email: 'laura.diaz@hotmail.com',
      cliente_nombre: 'Laura Díaz',
      estado: 'disponible',
      fecha_creacion: '2026-01-21 09:50:00',
      fecha_expiracion: '2026-01-29 09:50:00',
    },
  ]);

  // FASE 6: Paginación
  paginaActual = signal(1);
  codigosPorPagina = signal(10);

  // FASE 7: Códigos filtrados según criterios - MODIFICADO
  codigosFiltrados = computed(() => {
    let resultado = this.codigos();

    // Filtrar por estado badge superior (excepto total)
    if (this.estadoActivoFiltro() && this.estadoActivoFiltro() !== 'total') {
      resultado = resultado.filter(c => c.estado === this.estadoActivoFiltro());
    }

    // Filtrar por búsqueda (solo código)
    const busqueda = this.textoBusqueda().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(c =>
        c.codigo.toLowerCase().includes(busqueda)
      );
    }

    // Filtrar por producto
    if (this.productoFiltroSeleccionado()) {
      const producto = this.productosDisponibles().find(p => p.id === this.productoFiltroSeleccionado());
      if (producto) {
        resultado = resultado.filter(c => c.nombre_producto === producto.nombre);
      }
    }

    // Filtrar por precio
    if (this.precioFiltroSeleccionado()) {
      const precio = this.obtenerPrecioPorId(this.precioFiltroSeleccionado());
      if (precio) {
        resultado = resultado.filter(c => c.precio_producto === precio.nombre);
      }
    }

    return resultado;
  });

  // FASE 7.0: Códigos filtrados solo por producto/precio (para badges) - NUEVO
  codigosFiltradosPorProductoPrecio = computed(() => {
    let resultado = this.codigos();

    // Filtrar por producto
    if (this.productoFiltroSeleccionado()) {
      const producto = this.productosDisponibles().find(p => p.id === this.productoFiltroSeleccionado());
      if (producto) {
        resultado = resultado.filter(c => c.nombre_producto === producto.nombre);
      }
    }

    // Filtrar por precio
    if (this.precioFiltroSeleccionado()) {
      const precio = this.obtenerPrecioPorId(this.precioFiltroSeleccionado());
      if (precio) {
        resultado = resultado.filter(c => c.precio_producto === precio.nombre);
      }
    }

    return resultado;
  });

  // FASE 7.1: Obtener precio por ID
  obtenerPrecioPorId(precioId: string): PrecioProducto | null {
    for (const producto of this.productosDisponibles()) {
      const precio = producto.precios.find(p => p.id === precioId);
      if (precio) return precio;
    }
    return null;
  }

  // FASE 7.2: Obtener todos los precios disponibles para el dropdown
  todosLosPreciosDisponibles = computed(() => {
    const precios: { id: string; nombre: string; productoNombre: string }[] = [];
    for (const producto of this.productosDisponibles()) {
      for (const precio of producto.precios) {
        precios.push({
          id: precio.id,
          nombre: precio.nombre,
          productoNombre: producto.nombre
        });
      }
    }
    return precios;
  });

  totalCodigos = computed(() => this.codigosFiltrados().length);
  totalPaginas = computed(() =>
    Math.ceil(this.totalCodigos() / this.codigosPorPagina())
  );

  // FASE 8: Códigos paginados
  codigosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.codigosPorPagina();
    const fin = inicio + this.codigosPorPagina();
    return this.codigosFiltrados().slice(inicio, fin);
  });

  // FASE 9: Calcular totales por estado (para badges superiores) - MODIFICADO
  contadorPorEstado(estado: string): number {
    // Usar códigos filtrados por producto/precio si hay filtros activos
    const codigosBase = this.codigosFiltradosPorProductoPrecio();

    if (estado === 'total') {
      return codigosBase.length;
    }
    return codigosBase.filter(c => c.estado === estado).length;
  }

  // FASE 10: Funciones de navegación
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

  // FASE 11: Funciones de paginación
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(pag => pag - 1);
    }
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(pag => pag + 1);
    }
  }

  // FASE 14: Filtrar por badge de estado superior - MODIFICADO
  filtrarPorEstado(estado: string) {
    if (this.estadoActivoFiltro() === estado) {
      this.estadoActivoFiltro.set(null);
    } else {
      this.estadoActivoFiltro.set(estado);
    }
    this.paginaActual.set(1);
  }

  // FASE 16: Limpiar filtros - MODIFICADO
  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.productoFiltroSeleccionado.set('');
    this.precioFiltroSeleccionado.set('');
    this.estadoActivoFiltro.set(null);
    this.paginaActual.set(1);
  }

  // FASE 17: Abrir modal para agregar código
  abrirModalAgregar() {
    this.modalAgregarAbierto.set(true);
    this.productoSeleccionado.set('');
    this.precioSeleccionado.set('');
    this.sinFechaExpiracion.set(false);
    this.fechaExpiracionCodigo.set('');
  }

  cerrarModalAgregar() {
    this.modalAgregarAbierto.set(false);
    this.productoSeleccionado.set('');
    this.precioSeleccionado.set('');
    this.sinFechaExpiracion.set(false);
    this.fechaExpiracionCodigo.set('');
  }

  // FASE 17.1: Manejar selección de producto
  onProductoSeleccionado(event: Event) {
    const select = event.target as HTMLSelectElement;
    const productoId = select.value;
    this.productoSeleccionado.set(productoId);
    this.precioSeleccionado.set('');
  }

  // FASE 17.2: Manejar selección de precio
  onPrecioSeleccionado(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.precioSeleccionado.set(select.value);
  }

  // FASE 17.3: Alternar checkbox de sin fecha de expiración
  alternarSinFechaExpiracion() {
    this.sinFechaExpiracion.update(valor => !valor);
    if (this.sinFechaExpiracion()) {
      this.fechaExpiracionCodigo.set('');
    }
  }

  // Alternar visibilidad de filtros
  alternarFiltros() {
    this.filtrosVisibles.update(visible => !visible);
  }

  // FASE 18: Acciones con códigos
  eliminarCodigo(id: string) {
    console.log('Eliminar código:', id);
  }

  truncarTexto(texto: string, limite: number): string {
    if (texto.length <= limite) {
      return texto;
    }
    return texto.substring(0, limite) + '...';
  }

  // FASE 19: Funciones para dropdowns de filtros - NUEVO
  alternarDropdownProducto() {
    this.dropdownProductoAbierto.update(abierto => !abierto);
    this.dropdownPrecioAbierto.set(false);
  }

  alternarDropdownPrecio() {
    this.dropdownPrecioAbierto.update(abierto => !abierto);
    this.dropdownProductoAbierto.set(false);
  }

  seleccionarProductoFiltro(productoId: string) {
    this.productoFiltroSeleccionado.set(productoId);
    this.precioFiltroSeleccionado.set(''); // Limpiar precio cuando cambia producto
    this.dropdownProductoAbierto.set(false);
    this.estadoActivoFiltro.set(null); // Limpiar filtro de estado
    this.paginaActual.set(1);
  }

  seleccionarPrecioFiltro(precioId: string) {
    this.precioFiltroSeleccionado.set(precioId);
    this.dropdownPrecioAbierto.set(false);
    this.estadoActivoFiltro.set(null); // Limpiar filtro de estado
    this.paginaActual.set(1);
  }

  obtenerNombreProductoFiltro(): string {
    if (!this.productoFiltroSeleccionado()) return 'Todos los productos';
    const producto = this.productosDisponibles().find(p => p.id === this.productoFiltroSeleccionado());
    return producto ? producto.nombre : 'Todos los productos';
  }

  obtenerNombrePrecioFiltro(): string {
    if (!this.precioFiltroSeleccionado()) return 'Todos los precios';
    const precio = this.obtenerPrecioPorId(this.precioFiltroSeleccionado());
    return precio ? precio.nombre : 'Todos los precios';
  }

  // Cerrar todos los dropdowns
  cerrarTodosLosDropdowns() {
    this.dropdownProductoAbierto.set(false);
    this.dropdownPrecioAbierto.set(false);
  }
}
