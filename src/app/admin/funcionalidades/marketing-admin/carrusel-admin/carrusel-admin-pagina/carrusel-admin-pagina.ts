import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { CategoriaConfiguracion } from '../../../../../compartido/modelos/configuracion.modelo';
import {
  handleATitulo,
  SlideCarrusel,
  TipoDestinoCarrusel,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { ProductoApi } from '../../../../../compartido/modelos/producto.modelo';
import { ConfiguracionApiServicio } from '../../../../../compartido/servicios/configuracion-api.servicio';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';
import { CloudinaryApiServicio } from '../../../../../nucleo/servicios/cloudinary-api.servicio';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

const MIN_SLIDES = 3;
const MAX_SLIDES = 8;

@Component({
  selector: 'app-carrusel-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrusel-admin-pagina.html',
  styleUrl: './carrusel-admin-pagina.css',
})
export class CarruselAdminPagina implements OnInit {
  private router = inject(Router);
  private categoriasApi = inject(CategoriasApiServicio);
  private productosApi = inject(ProductosApiServicio);
  private cloudinaryApi = inject(CloudinaryApiServicio);
  private configuracionApi = inject(ConfiguracionApiServicio);

  readonly productosDisponibles = signal<ProductoApi[]>([]);
  readonly categoriasDisponibles = signal<CategoriaConfiguracion[]>([]);
  readonly minSlides = MIN_SLIDES;
  readonly maxSlides = MAX_SLIDES;
  readonly handleATitulo = handleATitulo;

  slides = signal<SlideCarrusel[]>([
    { id: 'slide-1', imagenMovil: '', imagenDesktop: '', tipoDestino: 'ninguno' },
    { id: 'slide-2', imagenMovil: '', imagenDesktop: '', tipoDestino: 'ninguno' },
    { id: 'slide-3', imagenMovil: '', imagenDesktop: '', tipoDestino: 'ninguno' },
  ]);
  busquedaProducto = signal<Record<number, string>>({});
  busquedaCategoria = signal<Record<number, string>>({});
  mensajeGuardado = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
    this.cargarConfiguracion();
  }

  private cargarCategorias(): void {
    this.categoriasApi.obtenerTodas().subscribe({
      next: (lista) => {
        const mapeadas: CategoriaConfiguracion[] = lista.map((c) => ({
          id: String(c.id_categoria),
          handle: c.handle,
          titulo: c.nombre,
        }));
        this.categoriasDisponibles.set(mapeadas);
      },
    });
  }

  private cargarProductos(): void {
    this.productosApi.obtenerImportados().subscribe({
      next: (lista) => this.productosDisponibles.set(lista),
    });
  }

  private cargarConfiguracion(): void {
    this.configuracionApi.obtenerConfiguracion().subscribe({
      next: (config) => {
        const c = config?.carrusel;
        if (c && Array.isArray(c.slides) && c.slides.length >= MIN_SLIDES) {
          this.slides.set(this.normalizarSlides(c.slides));
        } else {
          this.slides.set(this.obtenerSlidesPorDefecto());
        }
      },
      error: () => this.slides.set(this.obtenerSlidesPorDefecto()),
    });
  }

  private normalizarSlides(lista: SlideCarrusel[]): SlideCarrusel[] {
    const recortada = lista.length > MAX_SLIDES ? lista.slice(0, MAX_SLIDES) : lista;
    return recortada.map((s) => ({
      id: s.id,
      imagenMovil: s.imagenMovil ?? '',
      imagenDesktop: s.imagenDesktop ?? '',
      tipoDestino: (s.tipoDestino ?? 'ninguno') as TipoDestinoCarrusel,
      destinoHandle: s.tipoDestino !== 'ninguno' ? s.destinoHandle : undefined,
    }));
  }

  /** Devuelve 3 slides vacíos cuando no hay configuración guardada. */
  private obtenerSlidesPorDefecto(): SlideCarrusel[] {
    return [
      { id: 'slide-1', imagenMovil: '', imagenDesktop: '', tipoDestino: 'ninguno' },
      { id: 'slide-2', imagenMovil: '', imagenDesktop: '', tipoDestino: 'ninguno' },
      { id: 'slide-3', imagenMovil: '', imagenDesktop: '', tipoDestino: 'ninguno' },
    ];
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  guardarConfiguracion(): void {
    const list = this.slides();
    if (list.length < MIN_SLIDES || list.length > MAX_SLIDES) {
      this.mensajeGuardado.set(`Debes tener entre ${MIN_SLIDES} y ${MAX_SLIDES} slides.`);
      setTimeout(() => this.mensajeGuardado.set(null), 5000);
      return;
    }
    const incompleto = list.some((s: SlideCarrusel) => !s.imagenMovil?.trim() || !s.imagenDesktop?.trim());
    if (incompleto) {
      this.mensajeGuardado.set('Cada slide debe tener imagen móvil e imagen desktop.');
      setTimeout(() => this.mensajeGuardado.set(null), 5000);
      return;
    }
    const sinDestino = list.some(
      (s: SlideCarrusel) =>
        (s.tipoDestino === 'producto' || s.tipoDestino === 'categoria') && !s.destinoHandle?.trim(),
    );
    if (sinDestino) {
      this.mensajeGuardado.set(
        'En los slides con "Ir a producto" o "Ir a categoría" debes seleccionar uno.',
      );
      setTimeout(() => this.mensajeGuardado.set(null), 5000);
      return;
    }
    this.configuracionApi.actualizarCarrusel(list).subscribe({
      next: () => {
        this.mensajeGuardado.set('Configuración guardada correctamente.');
        setTimeout(() => this.mensajeGuardado.set(null), 3000);
      },
      error: () => {
        this.mensajeGuardado.set('Error al guardar la configuración.');
        setTimeout(() => this.mensajeGuardado.set(null), 5000);
      },
    });
  }

  puedeAgregarSlide(): boolean {
    return this.slides().length < MAX_SLIDES;
  }

  puedeQuitarSlide(): boolean {
    return this.slides().length > MIN_SLIDES;
  }

  agregarSlide(): void {
    if (!this.puedeAgregarSlide()) return;
    const id = 'slide-' + Date.now();
    this.slides.update((list: SlideCarrusel[]) => [
      ...list,
      {
        id,
        imagenMovil: '',
        imagenDesktop: '',
        tipoDestino: 'ninguno',
      },
    ]);
  }

  quitarSlide(indice: number): void {
    if (!this.puedeQuitarSlide()) return;
    const list = this.slides().filter((_: SlideCarrusel, i: number) => i !== indice);
    this.slides.set(list);
    this.busquedaProducto.update((r: Record<number, string>) => this.reindexarBusqueda(r, indice));
    this.busquedaCategoria.update((r: Record<number, string>) => this.reindexarBusqueda(r, indice));
  }

  private reindexarBusqueda(
    actual: Record<number, string>,
    indiceQuitado: number,
  ): Record<number, string> {
    const next: Record<number, string> = {};
    Object.entries(actual).forEach(([k, v]) => {
      const i = Number(k);
      if (i < indiceQuitado) next[i] = v;
      if (i > indiceQuitado) next[i - 1] = v;
    });
    return next;
  }

  actualizarImagenMovil(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    this.cloudinaryApi.subirImagen(file).subscribe({
      next: (url) => {
        if (!url) return;
        this.slides.update((list: SlideCarrusel[]) =>
          list.map((s: SlideCarrusel, i: number) => (i === indice ? { ...s, imagenMovil: url } : s)),
        );
      },
    });
    input.value = '';
  }

  actualizarImagenDesktop(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    this.cloudinaryApi.subirImagen(file).subscribe({
      next: (url) => {
        if (!url) return;
        this.slides.update((list: SlideCarrusel[]) =>
          list.map((s: SlideCarrusel, i: number) => (i === indice ? { ...s, imagenDesktop: url } : s)),
        );
      },
    });
    input.value = '';
  }

  actualizarTipoDestino(indice: number, valor: TipoDestinoCarrusel): void {
    this.slides.update((list: SlideCarrusel[]) =>
      list.map((s: SlideCarrusel, i: number) =>
        i === indice
          ? {
              ...s,
              tipoDestino: valor,
              destinoHandle: valor === 'ninguno' ? undefined : s.destinoHandle,
            }
          : s,
      ),
    );
  }

  setBusquedaProducto(indice: number, valor: string): void {
    this.busquedaProducto.update((r: Record<number, string>) => ({ ...r, [indice]: valor }));
  }

  setBusquedaCategoria(indice: number, valor: string): void {
    this.busquedaCategoria.update((r: Record<number, string>) => ({ ...r, [indice]: valor }));
  }

  productosFiltradosPara(indice: number): ProductoApi[] {
    const texto = (this.busquedaProducto()[indice] ?? '').trim().toLowerCase();
    const lista = this.productosDisponibles();
    if (!texto) return lista;
    return lista.filter(
      (p) =>
        p.titulo.toLowerCase().includes(texto) || (p.handle ?? '').toLowerCase().includes(texto),
    );
  }

  categoriasFiltradasPara(indice: number): CategoriaConfiguracion[] {
    const texto = (this.busquedaCategoria()[indice] ?? '').trim().toLowerCase();
    const lista = this.categoriasDisponibles();
    if (!texto) return lista;
    return lista.filter(
      (c) =>
        c.handle.toLowerCase().includes(texto) ||
        handleATitulo(c.handle).toLowerCase().includes(texto),
    );
  }

  asignarDestinoProducto(indice: number, producto: ProductoApi): void {
    this.slides.update((list: SlideCarrusel[]) =>
      list.map((s: SlideCarrusel, i: number) =>
        i === indice
          ? { ...s, tipoDestino: 'producto' as const, destinoHandle: producto.handle }
          : s,
      ),
    );
  }

  asignarDestinoCategoria(indice: number, handle: string): void {
    this.slides.update((list: SlideCarrusel[]) =>
      list.map((s: SlideCarrusel, i: number) =>
        i === indice
          ? {
              ...s,
              tipoDestino: 'categoria' as const,
              destinoHandle: handle,
            }
          : s,
      ),
    );
  }

  nombreProductoPorHandle(handle: string): string {
    return this.productosDisponibles().find((p) => p.handle === handle)?.titulo ?? handle;
  }
}
