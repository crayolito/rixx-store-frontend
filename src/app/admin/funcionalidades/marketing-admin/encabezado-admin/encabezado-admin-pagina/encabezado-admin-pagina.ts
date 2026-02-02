import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CategoriaConfiguracion,
  CategoriaRef,
  ConfiguracionEncabezado,
  ConfiguracionGlobal,
  handleATitulo,
  SeccionEncabezado,
} from '../../../../../compartido/modelos/configuracion.modelo';

interface ConfiguracionEncabezadoCompleta extends ConfiguracionEncabezado {
  secciones: SeccionEncabezado[];
}

const CLAVE_CONFIGURACION_GLOBAL = 'configuracion-global';
const MIN_SECCIONES = 1;
const MAX_SECCIONES = 5;

@Component({
  selector: 'app-encabezado-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './encabezado-admin-pagina.html',
  styleUrl: './encabezado-admin-pagina.css',
})
export class EncabezadoAdminPagina implements OnInit {
  private router = inject(Router);

  tituloPromocion = signal('');
  logoUrl = signal('');
  categorias = signal<CategoriaConfiguracion[]>([]);
  secciones = signal<SeccionEncabezado[]>([]);

  busquedaRedireccion = signal<Record<number, string>>({});
  busquedaCategorias = signal<Record<number, string>>({});
  mensajeGuardado = signal<string | null>(null);

  readonly minSecciones = MIN_SECCIONES;
  readonly maxSecciones = MAX_SECCIONES;
  readonly handleATitulo = handleATitulo;

  ngOnInit(): void {
    this.cargarDesdeJson();
  }

  private aplicarDatos(datos: ConfiguracionEncabezadoCompleta): void {
    this.tituloPromocion.set(datos.tituloPromocion ?? '');
    this.logoUrl.set(datos.logoUrl ?? '');
    const sec = Array.isArray(datos.secciones) && datos.secciones.length >= MIN_SECCIONES
      ? this.normalizarSecciones(datos.secciones)
      : this.obtenerSeccionesPorDefecto();
    this.secciones.set(sec);
  }

  private normalizarSecciones(sec: SeccionEncabezado[]): SeccionEncabezado[] {
    const cat = this.categorias();
    return sec.map((s) => {
      const dato = s as SeccionEncabezado & {
        categoriaHandles?: string[];
        categoriaIds?: string[];
        redireccionCategoriaHandle?: string;
        redireccionCategoriaId?: string;
      };
      let categorias: CategoriaRef[] | undefined;
      if (s.categorias?.length) {
        categorias = s.categorias;
      } else if (dato.categoriaHandles?.length) {
        categorias = dato.categoriaHandles.map((h) => ({ handle: h, titulo: handleATitulo(h) }));
      } else if (dato.categoriaIds?.length) {
        categorias = dato.categoriaIds
          .map((id) => cat.find((c) => c.id === id))
          .filter((c): c is CategoriaConfiguracion => !!c)
          .map((c) => ({ handle: c.handle, titulo: handleATitulo(c.handle) }));
      }
      let redireccionCategoria: CategoriaRef | undefined;
      if (s.redireccionCategoria) {
        redireccionCategoria = s.redireccionCategoria;
      } else if (dato.redireccionCategoriaHandle) {
        redireccionCategoria = { handle: dato.redireccionCategoriaHandle, titulo: handleATitulo(dato.redireccionCategoriaHandle) };
      } else if (dato.redireccionCategoriaId) {
        const c = cat.find((x) => x.id === dato.redireccionCategoriaId);
        if (c) redireccionCategoria = { handle: c.handle, titulo: handleATitulo(c.handle) };
      }
      return {
        id: s.id,
        tituloBase: s.tituloBase ?? '',
        esDinamico: s.esDinamico ?? false,
        categorias,
        redireccionCategoria,
      };
    });
  }

  private obtenerSeccionesPorDefecto(): SeccionEncabezado[] {
    return [
      {
        id: 'sec-1', tituloBase: 'Juegos móviles', esDinamico: true, categorias: [
          { handle: 'free-fire', titulo: 'Free Fire' },
          { handle: 'mobile-legends', titulo: 'Mobile Legends' },
          { handle: 'clash-of-clans', titulo: 'Clash Of Clans' },
          { handle: 'clash-royale', titulo: 'Clash Royale' },
        ]
      },
      { id: 'sec-2', tituloBase: 'Ofertas', esDinamico: false, redireccionCategoria: { handle: 'free-fire', titulo: 'Free Fire' } },
      {
        id: 'sec-3', tituloBase: 'Streaming', esDinamico: true, categorias: [
          { handle: 'netflix', titulo: 'Netflix' },
          { handle: 'spotify', titulo: 'Spotify' },
          { handle: 'youtube-premium', titulo: 'Youtube Premium' },
        ]
      },
    ];
  }

  private cargarDesdeJson(): void {
    const aplicarSiEncabezado = (global: ConfiguracionGlobal) => {
      const enc = global?.encabezado;
      if (enc && Array.isArray(enc.secciones) && enc.secciones.length >= MIN_SECCIONES) {
        this.aplicarDatos({
          tituloPromocion: enc.tituloPromocion ?? '',
          logoUrl: enc.logoUrl ?? '',
          secciones: enc.secciones,
        });
        return true;
      }
      return false;
    };
    fetch('/configuracion.json')
      .then((r) => r.json())
      .then((global: ConfiguracionGlobal) => {
        if (aplicarSiEncabezado(global)) return;
        const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
        if (raw) {
          try {
            if (aplicarSiEncabezado(JSON.parse(raw) as ConfiguracionGlobal)) return;
          } catch { }
        }
        this.tituloPromocion.set('¡RECARGA INSTANTÁNEA! ¡JUEGO INSTANTÁNEO!');
        this.logoUrl.set('/logo.png');
        this.secciones.set(this.obtenerSeccionesPorDefecto());
      })
      .catch(() => {
        const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
        if (raw) {
          try {
            if (aplicarSiEncabezado(JSON.parse(raw) as ConfiguracionGlobal)) return;
          } catch { }
        }
        this.tituloPromocion.set('¡RECARGA INSTANTÁNEA! ¡JUEGO INSTANTÁNEO!');
        this.logoUrl.set('/logo.png');
        this.secciones.set(this.obtenerSeccionesPorDefecto());
      });
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  guardarConfiguracion(): void {
    const sec = this.secciones();
    const invalidas = sec.some((s) => this.seccionInvalida(s));
    if (invalidas) {
      this.mensajeGuardado.set('Hay secciones incompletas. Revisa las categorías o el texto base.');
      setTimeout(() => this.mensajeGuardado.set(null), 4000);
      return;
    }
    const encabezado: ConfiguracionEncabezadoCompleta = {
      tituloPromocion: this.tituloPromocion(),
      logoUrl: this.logoUrl(),
      secciones: sec,
    };
    let global: ConfiguracionGlobal = {};
    try {
      const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
      if (raw) global = JSON.parse(raw) as ConfiguracionGlobal;
    } catch { }
    global.encabezado = encabezado;
    localStorage.setItem(CLAVE_CONFIGURACION_GLOBAL, JSON.stringify(global));
    this.mensajeGuardado.set('Configuración guardada correctamente.');
    setTimeout(() => this.mensajeGuardado.set(null), 3000);
  }

  seccionInvalida(s: SeccionEncabezado): boolean {
    if (s.esDinamico) {
      return !(s.categorias?.length ?? 0);
    }
    const tieneTitulo = !!String(s.tituloBase ?? '').trim();
    const tieneRedireccion = !!s.redireccionCategoria;
    return !tieneTitulo && !tieneRedireccion;
  }

  puedeAgregarSeccion(): boolean {
    return this.secciones().length < MAX_SECCIONES;
  }

  puedeQuitarSeccion(): boolean {
    return this.secciones().length > MIN_SECCIONES;
  }

  agregarSeccion(): void {
    if (!this.puedeAgregarSeccion()) return;
    const id = 'sec-' + Date.now();
    this.secciones.update((list) => [...list, { id, tituloBase: '', esDinamico: false, categorias: [] }]);
  }

  quitarSeccion(index: number): void {
    if (!this.puedeQuitarSeccion()) return;
    const list = this.secciones().filter((_, i) => i !== index);
    this.secciones.set(list);
    this.busquedaRedireccion.update((r) => {
      const next: Record<number, string> = {};
      list.forEach((_, j) => {
        if (j < index && r[j] !== undefined) next[j] = r[j];
        if (j >= index && r[j + 1] !== undefined) next[j] = r[j + 1];
      });
      return next;
    });
    this.busquedaCategorias.update((r) => {
      const next: Record<number, string> = {};
      list.forEach((_, j) => {
        if (j < index && r[j] !== undefined) next[j] = r[j];
        if (j >= index && r[j + 1] !== undefined) next[j] = r[j + 1];
      });
      return next;
    });
  }

  actualizarTituloBase(index: number, valor: string): void {
    this.secciones.update((list) =>
      list.map((s, i) => (i === index ? { ...s, tituloBase: valor } : s))
    );
  }

  actualizarDinamico(index: number, valor: boolean): void {
    this.secciones.update((list) =>
      list.map((s, i) =>
        i === index
          ? { ...s, esDinamico: valor, redireccionCategoria: valor ? undefined : s.redireccionCategoria, categorias: valor ? s.categorias ?? [] : undefined }
          : s
      )
    );
  }

  setBusquedaRedireccion(index: number, valor: string): void {
    this.busquedaRedireccion.update((r) => ({ ...r, [index]: valor }));
  }

  setBusquedaCategorias(index: number, valor: string): void {
    this.busquedaCategorias.update((r) => ({ ...r, [index]: valor }));
  }

  categoriasFiltradasPorNombre(texto: string): CategoriaConfiguracion[] {
    const t = texto.trim().toLowerCase();
    if (!t) return this.categorias();
    return this.categorias().filter((c) => c.handle.toLowerCase().includes(t) || handleATitulo(c.handle).toLowerCase().includes(t));
  }

  categoriasFiltradasParaRedireccion(index: number): CategoriaConfiguracion[] {
    const texto = this.busquedaRedireccion()[index] ?? '';
    return this.categoriasFiltradasPorNombre(texto);
  }

  categoriasFiltradasParaSeccion(index: number): CategoriaConfiguracion[] {
    const texto = this.busquedaCategorias()[index] ?? '';
    return this.categoriasFiltradasPorNombre(texto);
  }

  actualizarRedireccion(index: number, cat: CategoriaConfiguracion): void {
    const ref: CategoriaRef = { handle: cat.handle, titulo: handleATitulo(cat.handle) };
    this.secciones.update((list) =>
      list.map((s, i) => (i === index ? { ...s, redireccionCategoria: ref } : s))
    );
  }

  toggleCategoriaEnSeccion(index: number, cat: CategoriaConfiguracion): void {
    const ref: CategoriaRef = { handle: cat.handle, titulo: handleATitulo(cat.handle) };
    this.secciones.update((list) =>
      list.map((s, i) => {
        if (i !== index) return s;
        const cats = s.categorias ?? [];
        const tiene = cats.some((c) => c.handle === cat.handle);
        return { ...s, categorias: tiene ? cats.filter((c) => c.handle !== cat.handle) : [...cats, ref] };
      })
    );
  }

  categoriaSeleccionadaEnSeccion(seccion: SeccionEncabezado, catHandle: string): boolean {
    return (seccion.categorias ?? []).some((c) => c.handle === catHandle);
  }

  manejarCambioLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.logoUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }
}
