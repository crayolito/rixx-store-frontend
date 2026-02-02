import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Producto } from '../../../../../compartido/datos/productos.datos';
import { PRODUCTOS } from '../../../../../compartido/datos/productos.datos';
import type { CategoriaConfiguracion } from '../../../../../compartido/modelos/configuracion.modelo';
import {
  ConfiguracionCarrusel,
  ConfiguracionGlobal,
  handleATitulo,
  SlideCarrusel,
  TipoDestinoCarrusel,
} from '../../../../../compartido/modelos/configuracion.modelo';
const CLAVE_CONFIGURACION_GLOBAL = 'configuracion-global';
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

  readonly productosDisponibles = PRODUCTOS;
  readonly categoriasDisponibles: CategoriaConfiguracion[] = [];
  readonly minSlides = MIN_SLIDES;
  readonly maxSlides = MAX_SLIDES;
  readonly handleATitulo = handleATitulo;

  slides = signal<SlideCarrusel[]>([]);
  busquedaProducto = signal<Record<number, string>>({});
  busquedaCategoria = signal<Record<number, string>>({});
  mensajeGuardado = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDesdeJson();
  }

  private obtenerConfiguracionGlobal(): ConfiguracionGlobal {
    try {
      const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
      if (raw) return JSON.parse(raw) as ConfiguracionGlobal;
    } catch { }
    return {};
  }

  private cargarDesdeJson(): void {
    const aplicarCarrusel = (global: ConfiguracionGlobal) => {
      const c = global?.carrusel;
      if (c && Array.isArray(c.slides) && c.slides.length >= MIN_SLIDES) {
        const normalizados = this.normalizarSlides(c.slides);
        this.slides.set(normalizados);
        return true;
      }
      return false;
    };
    fetch('/configuracion.json')
      .then((r) => r.json())
      .then((global: ConfiguracionGlobal) => {
        if (aplicarCarrusel(global)) return;
        const local = this.obtenerConfiguracionGlobal();
        if (aplicarCarrusel(local)) return;
        this.slides.set(this.obtenerSlidesPorDefecto());
      })
      .catch(() => {
        const local = this.obtenerConfiguracionGlobal();
        if (aplicarCarrusel(local)) return;
        this.slides.set(this.obtenerSlidesPorDefecto());
      });
  }

  private normalizarSlides(lista: SlideCarrusel[]): SlideCarrusel[] {
    const recortada =
      lista.length > MAX_SLIDES ? lista.slice(0, MAX_SLIDES) : lista;
    return recortada.map((s) => ({
      id: s.id,
      imagenMovil: s.imagenMovil ?? '',
      imagenDesktop: s.imagenDesktop ?? '',
      tipoDestino: (s.tipoDestino ?? 'ninguno') as TipoDestinoCarrusel,
      destinoHandle: s.tipoDestino !== 'ninguno' ? s.destinoHandle : undefined,
    }));
  }

  private obtenerSlidesPorDefecto(): SlideCarrusel[] {
    return [
      {
        id: 'slide-1',
        imagenMovil: '/imagenes/banner-juego1.jpg',
        imagenDesktop: '/imagenes/banner-juego1.jpg',
        tipoDestino: 'ninguno',
      },
      {
        id: 'slide-2',
        imagenMovil: '/imagenes/banner-juego2.png',
        imagenDesktop: '/imagenes/banner-juego2.png',
        tipoDestino: 'ninguno',
      },
      {
        id: 'slide-3',
        imagenMovil: '/imagenes/banner-juego3.jpg',
        imagenDesktop: '/imagenes/banner-juego3.jpg',
        tipoDestino: 'ninguno',
      },
    ];
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  guardarConfiguracion(): void {
    const list = this.slides();
    if (list.length < MIN_SLIDES || list.length > MAX_SLIDES) {
      this.mensajeGuardado.set(
        `Debes tener entre ${MIN_SLIDES} y ${MAX_SLIDES} slides.`
      );
      setTimeout(() => this.mensajeGuardado.set(null), 5000);
      return;
    }
    const incompleto = list.some(
      (s) => !s.imagenMovil?.trim() || !s.imagenDesktop?.trim()
    );
    if (incompleto) {
      this.mensajeGuardado.set(
        'Cada slide debe tener imagen móvil e imagen desktop.'
      );
      setTimeout(() => this.mensajeGuardado.set(null), 5000);
      return;
    }
    const sinDestino = list.some(
      (s) =>
        (s.tipoDestino === 'producto' || s.tipoDestino === 'categoria') &&
        !s.destinoHandle?.trim()
    );
    if (sinDestino) {
      this.mensajeGuardado.set(
        'En los slides con "Ir a producto" o "Ir a categoría" debes seleccionar uno.'
      );
      setTimeout(() => this.mensajeGuardado.set(null), 5000);
      return;
    }
    const datos: ConfiguracionCarrusel = { slides: list };
    const global = this.obtenerConfiguracionGlobal();
    global.carrusel = datos;
    localStorage.setItem(CLAVE_CONFIGURACION_GLOBAL, JSON.stringify(global));
    this.mensajeGuardado.set('Configuración guardada correctamente.');
    setTimeout(() => this.mensajeGuardado.set(null), 3000);
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
    this.slides.update((list) => [
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
    const list = this.slides().filter((_, i) => i !== indice);
    this.slides.set(list);
    this.busquedaProducto.update((r) => this.reindexarBusqueda(r, indice));
    this.busquedaCategoria.update((r) => this.reindexarBusqueda(r, indice));
  }

  private reindexarBusqueda(
    actual: Record<number, string>,
    indiceQuitado: number
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
    const reader = new FileReader();
    reader.onload = () => {
      this.slides.update((list) =>
        list.map((s, i) =>
          i === indice ? { ...s, imagenMovil: reader.result as string } : s
        )
      );
    };
    reader.readAsDataURL(file);
  }

  actualizarImagenDesktop(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.slides.update((list) =>
        list.map((s, i) =>
          i === indice ? { ...s, imagenDesktop: reader.result as string } : s
        )
      );
    };
    reader.readAsDataURL(file);
  }

  actualizarTipoDestino(indice: number, valor: TipoDestinoCarrusel): void {
    this.slides.update((list) =>
      list.map((s, i) =>
        i === indice
          ? {
            ...s,
            tipoDestino: valor,
            destinoHandle:
              valor === 'ninguno' ? undefined : s.destinoHandle,
          }
          : s
      )
    );
  }

  setBusquedaProducto(indice: number, valor: string): void {
    this.busquedaProducto.update((r) => ({ ...r, [indice]: valor }));
  }

  setBusquedaCategoria(indice: number, valor: string): void {
    this.busquedaCategoria.update((r) => ({ ...r, [indice]: valor }));
  }

  productosFiltradosPara(indice: number): Producto[] {
    const texto = (this.busquedaProducto()[indice] ?? '').trim().toLowerCase();
    if (!texto) return this.productosDisponibles;
    return this.productosDisponibles.filter(
      (p) =>
        p.nombre.toLowerCase().includes(texto) ||
        p.id.toLowerCase().includes(texto)
    );
  }

  categoriasFiltradasPara(indice: number): CategoriaConfiguracion[] {
    const texto = (this.busquedaCategoria()[indice] ?? '').trim().toLowerCase();
    if (!texto) return this.categoriasDisponibles;
    return this.categoriasDisponibles.filter(
      (c: CategoriaConfiguracion) =>
        c.handle.toLowerCase().includes(texto) ||
        handleATitulo(c.handle).toLowerCase().includes(texto)
    );
  }

  asignarDestinoProducto(indice: number, producto: Producto): void {
    this.slides.update((list) =>
      list.map((s, i) =>
        i === indice
          ? {
            ...s,
            tipoDestino: 'producto' as const,
            destinoHandle: producto.id,
          }
          : s
      )
    );
  }

  asignarDestinoCategoria(indice: number, handle: string): void {
    this.slides.update((list) =>
      list.map((s, i) =>
        i === indice
          ? {
            ...s,
            tipoDestino: 'categoria' as const,
            destinoHandle: handle,
          }
          : s
      )
    );
  }

  nombreProductoPorHandle(handle: string): string {
    return this.productosDisponibles.find((p) => p.id === handle)?.nombre ?? handle;
  }
}
