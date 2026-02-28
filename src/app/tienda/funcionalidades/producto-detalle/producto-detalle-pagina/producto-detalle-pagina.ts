import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { PrecioApi, ProductoDetalleApi } from '../../../../compartido/modelos/producto.modelo';
import { CarritoServicio } from '../../../../compartido/servicios/carrito.servicio';
import { NotificacionServicio } from '../../../../compartido/servicios/notificacion';
import { ProductosApiServicio } from '../../../../nucleo/servicios/productos-api.servicio';
import { Sesion } from '../../../../nucleo/servicios/sesion';

/* ─── Interfaces locales ─── */
interface VarianteProducto {
  id: string;
  nombre: string;
  precio: number;
  inventario: number | null;
  disponible: boolean;
}

@Component({
  selector: 'app-producto-detalle-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './producto-detalle-pagina.html',
  styleUrl: './producto-detalle-pagina.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoDetallePagina implements OnInit {
  /* ─── Servicios ─── */
  private route = inject(ActivatedRoute);
  private productosApi = inject(ProductosApiServicio);
  private carritoServicio = inject(CarritoServicio);
  private router = inject(Router);
  private notificacion = inject(NotificacionServicio);
  readonly sesion = inject(Sesion);

  /* ─── Estado del producto (API) ─── */
  readonly producto = signal<ProductoDetalleApi | null>(null);
  readonly estaCargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly servidoresDisponibles = signal<Record<string, string>>({});

  /* ─── Estado del formulario ─── */
  readonly valoresCamposDinamicos = signal<Record<string, string>>({});
  varianteSeleccionada = signal<string>('');
  cantidad = signal<number>(1);
  servidor = signal<string>('');
  descripcionAbierta = signal<boolean>(false);
  instruccionesAbierta = signal<boolean>(false);
  terminosAbierta = signal<boolean>(false);
  bottomSheetVariantesAbierto = signal<boolean>(false);

  /* ─── Computed: reglas de negocio ─── */
  readonly estaLogueado = computed(() => this.sesion.estaLogueado());
  readonly requiereLogin = computed(() => !this.estaLogueado());
  /** Solo "Comprar ahora" exige estar logueado; "Agregar al carrito" no. */
  readonly puedeComprarAhora = computed(() => this.estaLogueado());

  /* ─── Computed: variantes desde precios del producto. Inventario null = stock ilimitado. ─── */
  readonly variantes = computed((): VarianteProducto[] => {
    const p = this.producto();
    if (!p?.precios?.length) return [];
    const mapeadas = p.precios
      .filter((pr) => pr.estado === 'activo')
      .map((pr) => {
        const inv = pr.inventario;
        const disponible = inv == null ? true : inv > 0;
        return {
          id: String(pr.id_precio),
          nombre: pr.nombre,
          precio: this.precioDesdePrecioApi(pr),
          inventario: pr.inventario,
          disponible,
        };
      });
    // Con stock primero, agotadas al final
    return [...mapeadas].sort((a, b) => (a.disponible === b.disponible ? 0 : a.disponible ? -1 : 1));
  });

  /** Producto sin stock en ninguno de sus precios */
  readonly productoTodoAgotado = computed(() => {
    const vars = this.variantes();
    return vars.length > 0 && vars.every((v) => !v.disponible);
  });

  /** Variantes con stock disponible */
  readonly variantesConStock = computed(() => this.variantes().filter((v) => v.disponible));

  /** Variantes agotadas (sin stock) */
  readonly variantesAgotadas = computed(() => this.variantes().filter((v) => !v.disponible));

  /** Cantidad ya en el carrito para el producto y variante actuales (mismo handle + varianteId) */
  readonly cantidadEnCarritoParaVarianteActual = computed(() => {
    const p = this.producto();
    const va = this.varianteActual();
    const items = this.carritoServicio.items();
    if (!p?.handle || !va?.id) return 0;
    return items
      .filter((i) => i.handleProducto === p.handle && i.varianteId === va.id)
      .reduce((sum, i) => sum + i.cantidad, 0);
  });

  /* ─── Computed: opciones del selector de servidor (Vemper o fijas) ─── */
  readonly opcionesServidor = computed(() => {
    const srv = this.servidoresDisponibles();
    const claves = Object.keys(srv);
    if (claves.length > 0) return claves;
    return ['Entrega inmediata', 'Stream', 'Activación Stream'];
  });

  /* ─── Computed: variante actual y total ─── */
  readonly varianteActual = computed(() => {
    const vars = this.variantes();
    const sel = this.varianteSeleccionada();
    const encontrada = vars.find((v) => v.id === sel);
    // Solo devolver variante si está disponible; si es agotada, usar primera disponible
    if (encontrada?.disponible) return encontrada;
    return vars.find((v) => v.disponible) ?? null;
  });

  /** Cantidad máxima que se puede agregar: inventario menos lo que ya está en el carrito (evita superar stock) */
  readonly cantidadMaxima = computed(() => {
    const va = this.varianteActual();
    const enCarrito = this.cantidadEnCarritoParaVarianteActual();
    if (!va || va.inventario == null) return Math.max(1, 999 - enCarrito);
    const disponible = Math.max(0, va.inventario - enCarrito);
    return disponible;
  });

  constructor() {
    effect(() => {
      const max = this.cantidadMaxima();
      const cant = this.cantidad();
      if (max === 0 || cant > max) this.cantidad.set(max);
    });
  }

  readonly precioTotal = computed(() => {
    const variante = this.varianteActual();
    return variante ? variante.precio * this.cantidad() : 0;
  });
  readonly camposDinamicosVisibles = computed(() => {
    const p = this.producto();
    const campos = p?.camposDinamicos ?? [];
    if (!p || p.servidorDinamico !== true) return campos;
    return campos.filter(
      (c) => c.handle?.toLowerCase() !== 'server' && c.handle?.toLowerCase() !== 'servidor',
    );
  });

  /* ─── Carga producto por handle desde la ruta ─── */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const handle = params.get('slug');
          if (!handle) return of(null);
          return this.productosApi.obtenerPorHandle(handle);
        }),
      )
      .subscribe({
        next: (p) => {
          this.producto.set(p ?? null);
          this.estaCargando.set(false);
          if (!p) {
            this.errorCarga.set('Producto no encontrado');
          } else {
            this.errorCarga.set(null);
            if (p.servidorDinamico && p.handle) {
              this.productosApi.obtenerServidores(p.handle).subscribe({
                next: (srv: Record<string, string>) => this.servidoresDisponibles.set(srv),
                error: () => this.servidoresDisponibles.set({}),
              });
            }
            const preciosActivos = p.precios?.filter((pr) => pr.estado === 'activo') ?? [];
            const primerDisponible = preciosActivos.find(
              (pr) => pr.inventario == null || (pr.inventario ?? 0) > 0,
            );
            const precioInicial = primerDisponible ?? preciosActivos[0];
            if (precioInicial) this.varianteSeleccionada.set(String(precioInicial.id_precio));
          }
        },
        error: () => {
          this.estaCargando.set(false);
          this.errorCarga.set('Error al cargar el producto');
        },
      });
  }

  /* ─── Obtiene la imagen principal del producto ─── */
  obtenerImagenBanner(p: ProductoDetalleApi): string {
    const img = p.imagenes?.rectangular ?? p.imagenes?.square ?? null;
    return img || '/imagenes/imagen-nodisponible.jpg';
  }

  /* ─── Obtiene la imagen pequeña del producto ─── */
  obtenerImagenJuego(p: ProductoDetalleApi): string {
    const img = p.imagenes?.smallSquare ?? p.imagenes?.square ?? null;
    return img || '/imagenes/imagen-nodisponible.jpg';
  }

  /* ─── Calcula precio cliente: precioBase + margenCliente ─── */
  private precioDesdePrecioApi(pr: PrecioApi): number {
    const base = parseFloat(pr.precioBase ?? '0');
    const margen = parseFloat(pr.margenCliente ?? '0');
    return base + margen;
  }

  /* ─── Devuelve manual o automatico según idVemper y tipoProceso ─── */
  tipoEntrega(producto: ProductoDetalleApi): 'manual' | 'automatico' {
    if (producto.idVemper != null && producto.idVemper !== '') return 'automatico';
    const t = (producto.tipoProceso ?? 'manual').toLowerCase();
    return t === 'automatico' ? 'automatico' : 'manual';
  }

  /* ─── Guarda el valor de un campo dinámico ─── */
  actualizarCampoDinamico(handle: string, valor: string): void {
    this.valoresCamposDinamicos.update((v) => ({ ...v, [handle]: valor }));
  }

  /* ─── Acciones: variantes y dropdowns ─── */
  seleccionarVariante(id: string): void {
    this.varianteSeleccionada.set(id);
  }
  alternarDescripcion(): void {
    this.descripcionAbierta.update((abierto) => !abierto);
  }
  alternarInstrucciones(): void {
    this.instruccionesAbierta.update((abierto) => !abierto);
  }
  alternarTerminos(): void {
    this.terminosAbierta.update((abierto) => !abierto);
  }
  abrirBottomSheetVariantes(): void {
    this.bottomSheetVariantesAbierto.set(true);
  }
  cerrarBottomSheetVariantes(): void {
    this.bottomSheetVariantesAbierto.set(false);
  }
  confirmarPaquete(): void {
    this.bottomSheetVariantesAbierto.set(false);
  }

  /* ─── Acciones: cantidad (respetando inventario) ─── */
  incrementarCantidad(): void {
    const max = this.cantidadMaxima();
    this.cantidad.update((cant) => (cant < max ? cant + 1 : cant));
  }
  decrementarCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update((cant) => cant - 1);
    }
  }

  /* ─── Agrega el item al carrito (no exige login; sí exige campos dinámicos si los hay) ─── */
  agregarAlCarrito(): void {
    const p = this.producto();
    const variante = this.varianteActual();
    if (!p || !variante) return;
    if (this.productoTodoAgotado()) {
      this.notificacion.advertencia('Este producto no tiene stock disponible. No puedes agregarlo al carrito.');
      return;
    }
    if (!this.validarInventarioParaCantidad()) return;
    if (!this.validarCamposRequeridos()) return;

    const img = this.obtenerImagenJuego(p);
    const camposDinamicos: Record<string, string> = { ...this.valoresCamposDinamicos() };
    if (p.servidorDinamico === true && this.servidor()?.trim()) {
      camposDinamicos['servidor'] = this.servidor();
    }

    this.carritoServicio.agregarItem({
      imagen: img,
      titulo: p.titulo,
      precio: variante.precio,
      cantidad: this.cantidad(),
      varianteId: variante.id,
      varianteNombre: variante.nombre,
      handleProducto: p.handle,
      camposDinamicos: Object.keys(camposDinamicos).length ? camposDinamicos : undefined,
      servidor: p.servidorDinamico === true ? this.servidor() : undefined,
    });
    this.notificacion.exito('Producto agregado al carrito');
  }

  /* ─── Valida que la cantidad a agregar + lo ya en carrito no supere el inventario ─── */
  private validarInventarioParaCantidad(): boolean {
    const variante = this.varianteActual();
    const cant = this.cantidad();
    const enCarrito = this.cantidadEnCarritoParaVarianteActual();
    if (!variante || variante.inventario == null) return true;
    const totalSolicitado = enCarrito + cant;
    if (totalSolicitado > variante.inventario) {
      this.notificacion.advertencia(
        `Solo hay ${variante.inventario} unidad(es) disponibles de "${variante.nombre}". Ya tienes ${enCarrito} en el carrito. Puedes agregar como máximo ${variante.inventario - enCarrito} más.`,
      );
      return false;
    }
    return true;
  }

  /* ─── Valida inventario solo contra la cantidad seleccionada (modo comprar ahora) ─── */
  private validarInventarioParaCantidadComprarAhora(): boolean {
    const variante = this.varianteActual();
    const cant = this.cantidad();
    if (!variante || variante.inventario == null) return true;
    if (cant > variante.inventario) {
      this.notificacion.advertencia(
        `Solo hay ${variante.inventario} unidad(es) disponibles de "${variante.nombre}".`,
      );
      return false;
    }
    return true;
  }

  /* ─── Valida solo campos obligatorios del producto (servidor, campos dinámicos); no exige login ─── */
  private validarCamposRequeridos(): boolean {
    const p = this.producto();
    if (!p) return false;

    const camposRequeridos = (p.camposDinamicos ?? []).filter((c) => c.requerido);
    const valores = this.valoresCamposDinamicos();
    const faltantes: string[] = [];

    camposRequeridos.forEach((c) => {
      const handle = c.handle?.toLowerCase();
      if ((handle === 'server' || handle === 'servidor') && p.servidorDinamico === true) {
        if (!this.servidor()?.trim()) faltantes.push(c.etiqueta);
      } else if (!valores[c.handle]?.trim()) {
        faltantes.push(c.etiqueta);
      }
    });

    if (p.servidorDinamico === true && !this.servidor()?.trim()) {
      const yaIncluido = faltantes.some((e) => /servidor/i.test(e));
      if (!yaIncluido) faltantes.push('Servidor');
    }

    if (faltantes.length > 0) {
      this.notificacion.advertencia(
        `Completa los campos obligatorios: ${faltantes.join(', ')}.`,
      );
      this.scrollYResaltarSeccionDatos();
      return false;
    }

    return true;
  }

  private scrollYResaltarSeccionDatos(): void {
    const seccion = document.getElementById('seccion-ingresa-tus-datos');
    if (seccion) {
      seccion.scrollIntoView({ behavior: 'smooth', block: 'center' });
      seccion.classList.add('tienda-producto-detalle__seccion--resaltar');
      setTimeout(
        () => seccion.classList.remove('tienda-producto-detalle__seccion--resaltar'),
        2000,
      );
    }
  }

  /* ─── Agrega al carrito y navega al checkout; exige estar logueado y campos dinámicos si los hay ─── */
  comprarAhora(): void {
    const p = this.producto();
    const variante = this.varianteActual();
    if (!p || !variante) return;
    if (this.productoTodoAgotado()) {
      this.notificacion.advertencia('Este producto no tiene stock disponible.');
      return;
    }
    if (!this.sesion.estaLogueado()) {
      this.notificacion.advertencia('Debes iniciar sesión o registrarte para comprar ahora.');
      return;
    }
    if (!this.validarInventarioParaCantidadComprarAhora()) return;
    if (!this.validarCamposRequeridos()) return;

    this.carritoServicio.limpiarCarrito();

    const img = this.obtenerImagenJuego(p);
    const camposDinamicos: Record<string, string> = { ...this.valoresCamposDinamicos() };
    if (p.servidorDinamico === true && this.servidor()?.trim()) {
      camposDinamicos['servidor'] = this.servidor();
    }

    this.carritoServicio.agregarItem({
      imagen: img,
      titulo: p.titulo,
      precio: variante.precio,
      cantidad: this.cantidad(),
      varianteId: variante.id,
      varianteNombre: variante.nombre,
      handleProducto: p.handle,
      camposDinamicos: Object.keys(camposDinamicos).length ? camposDinamicos : undefined,
      servidor: p.servidorDinamico === true ? this.servidor() : undefined,
    });
    this.router.navigate(['/checkout']);
  }
}
