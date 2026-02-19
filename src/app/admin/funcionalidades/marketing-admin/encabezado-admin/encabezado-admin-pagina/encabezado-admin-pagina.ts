import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CategoriaConfiguracion,
  CategoriaRef,
  ConfiguracionEncabezado,
  handleATitulo,
  SeccionEncabezado,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionApiServicio } from '../../../../../compartido/servicios/configuracion-api.servicio';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';

interface ConfiguracionEncabezadoCompleta extends ConfiguracionEncabezado {
  secciones: SeccionEncabezado[];
}

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
  private categoriasApi = inject(CategoriasApiServicio);
  private configuracionApi = inject(ConfiguracionApiServicio);
  private notificacion = inject(NotificacionServicio);

  tituloPromocion = signal('');
  logoUrl = signal('');
  categorias = signal<CategoriaConfiguracion[]>([]);
  secciones = signal<SeccionEncabezado[]>([]);

  busquedaRedireccion = signal<Record<number, string>>({});
  busquedaCategorias = signal<Record<number, string>>({});
  guardando = signal(false);

  /** Estado guardado (carga o guardar exitoso); para comparar y restaurar en Cancelar. */
  private estadoGuardado = signal<{ tituloPromocion: string; logoUrl: string; secciones: SeccionEncabezado[] } | null>(null);

  /** True si el formulario tiene cambios respecto al último estado guardado. */
  hayCambiosPendientes = computed(() => {
    const g = this.estadoGuardado();
    if (!g) return false;
    return (
      this.tituloPromocion() !== g.tituloPromocion ||
      this.logoUrl() !== g.logoUrl ||
      JSON.stringify(this.secciones()) !== JSON.stringify(g.secciones)
    );
  });

  readonly minSecciones = MIN_SECCIONES;
  readonly maxSecciones = MAX_SECCIONES;
  readonly handleATitulo = handleATitulo;

  ngOnInit(): void {
    this.cargarCategoriasYConfiguracion();
  }

  /** Carga categorías y configuración del servidor; aplica el encabezado real para no pisar con datos por defecto. */
  private cargarCategoriasYConfiguracion(): void {
    forkJoin({
      categorias: this.categoriasApi.obtenerTodas(),
      config: this.configuracionApi.obtenerConfiguracion(),
    }).subscribe({
      next: ({ categorias: lista, config }) => {
        const mapeadas: CategoriaConfiguracion[] = lista.map((c) => ({
          id: String(c.id_categoria),
          handle: c.handle,
          titulo: c.nombre,
        }));
        this.categorias.set(mapeadas);

        const enc = config?.encabezado;
        if (enc && Array.isArray(enc.secciones) && enc.secciones.length >= MIN_SECCIONES) {
          this.aplicarDatos({
            tituloPromocion: enc.tituloPromocion ?? '',
            logoUrl: enc.logoUrl ?? '',
            secciones: JSON.parse(JSON.stringify(enc.secciones)),
          });
        } else {
          this.tituloPromocion.set('');
          this.logoUrl.set('');
          this.secciones.set(this.obtenerSeccionesPorDefecto());
          this.guardarEstadoComoOriginal();
        }
      },
      error: () => {
        this.tituloPromocion.set('');
        this.logoUrl.set('');
        this.secciones.set(this.obtenerSeccionesPorDefecto());
        this.guardarEstadoComoOriginal();
      },
    });
  }

  /** Guarda el estado actual como referencia para Descartar. */
  private guardarEstadoComoOriginal(): void {
    this.estadoGuardado.set({
      tituloPromocion: this.tituloPromocion(),
      logoUrl: this.logoUrl(),
      secciones: JSON.parse(JSON.stringify(this.secciones())),
    });
  }

  /** Pisa el formulario por completo con lo que vino del servidor (solo data real, sin mezclar basura). */
  private aplicarDatos(datos: ConfiguracionEncabezadoCompleta): void {
    this.tituloPromocion.set(datos.tituloPromocion ?? '');
    this.logoUrl.set(datos.logoUrl ?? '');
    const sec = Array.isArray(datos.secciones) && datos.secciones.length >= MIN_SECCIONES
      ? this.normalizarSecciones(datos.secciones)
      : this.obtenerSeccionesPorDefecto();
    this.secciones.set(sec);
    this.busquedaRedireccion.set({});
    this.busquedaCategorias.set({});
    this.guardarEstadoComoOriginal();
  }

  /**
   * Normaliza secciones usando SOLO lo que vino del servidor.
   * Si el servidor envía categorias (aunque sea []), se usa solo eso; no se rellena desde categoriaHandles ni de la lista global.
   */
  private normalizarSecciones(sec: SeccionEncabezado[]): SeccionEncabezado[] {
    const cat = this.categorias();
    return sec.map((s) => {
      const dato = s as SeccionEncabezado & {
        categoriaHandles?: string[];
        categoriaIds?: string[];
        redireccionCategoriaHandle?: string;
        redireccionCategoriaId?: string;
      };
      let categorias: CategoriaRef[];
      if (Array.isArray(s.categorias)) {
        categorias = s.categorias.map((c) => ({ handle: c.handle, titulo: c.titulo ?? c.handle }));
      } else if (dato.categoriaHandles?.length) {
        categorias = dato.categoriaHandles.map((h) => ({ handle: h, titulo: handleATitulo(h) }));
      } else if (dato.categoriaIds?.length) {
        categorias = dato.categoriaIds
          .map((id) => cat.find((c) => c.id === id))
          .filter((c): c is CategoriaConfiguracion => !!c)
          .map((c) => ({ handle: c.handle, titulo: handleATitulo(c.handle) }));
      } else {
        categorias = [];
      }
      let redireccionCategoria: CategoriaRef | undefined;
      if (s.redireccionCategoria?.handle) {
        redireccionCategoria = {
          handle: s.redireccionCategoria.handle,
          titulo: s.redireccionCategoria.titulo ?? s.redireccionCategoria.handle,
        };
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

  /** Una sección vacía por defecto cuando no hay configuración guardada. */
  private obtenerSeccionesPorDefecto(): SeccionEncabezado[] {
    return [
      { id: 'sec-1', tituloBase: '', esDinamico: false, categorias: [] },
    ];
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  /** Restaura el formulario al último estado guardado (igual que editar producto). */
  cancelarCambios(): void {
    const g = this.estadoGuardado();
    if (!g) return;
    this.tituloPromocion.set(g.tituloPromocion);
    this.logoUrl.set(g.logoUrl);
    this.secciones.set(JSON.parse(JSON.stringify(g.secciones)));
    this.busquedaRedireccion.set({});
    this.busquedaCategorias.set({});
    this.notificacion.info('Cambios descartados');
  }

  /**
   * Construye el payload del encabezado según el contrato PATCH /configuracion.
   * Dinámica: id, tituloBase, esDinamico, categorias (sin redireccionCategoria).
   * No dinámica: id, tituloBase, esDinamico, categorias: [], redireccionCategoria: { handle, titulo }.
   */
  private construirEncabezadoParaApi(): ConfiguracionEncabezadoCompleta {
    const secciones = this.secciones().map((s) => {
      const id = s.id;
      const tituloBase = String(s.tituloBase ?? '').trim();
      const esDinamico = !!s.esDinamico;

      if (esDinamico) {
        const categorias = (Array.isArray(s.categorias) ? s.categorias : []).map((c) => ({
          handle: c.handle,
          titulo: c.titulo ?? c.handle,
        }));
        return { id, tituloBase, esDinamico, categorias };
      }

      const categorias: CategoriaRef[] = [];
      if (s.redireccionCategoria?.handle) {
        return {
          id,
          tituloBase,
          esDinamico,
          categorias,
          redireccionCategoria: {
            handle: s.redireccionCategoria.handle,
            titulo: s.redireccionCategoria.titulo ?? s.redireccionCategoria.handle,
          },
        };
      }
      return { id, tituloBase, esDinamico, categorias };
    });

    return {
      tituloPromocion: this.tituloPromocion().trim(),
      logoUrl: this.logoUrl().trim(),
      secciones,
    };
  }

  guardarConfiguracion(): void {
    const sec = this.secciones();
    const invalidas = sec.some((s: SeccionEncabezado) => this.seccionInvalida(s));
    if (invalidas) {
      this.notificacion.advertencia('Hay secciones incompletas. Revisa las categorías o el texto base.');
      return;
    }
    const encabezado = this.construirEncabezadoParaApi();
    this.guardando.set(true);
    this.configuracionApi.actualizarEncabezado(encabezado).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardarEstadoComoOriginal();
        this.notificacion.exito('Configuración guardada correctamente');
      },
      error: () => {
        this.guardando.set(false);
        this.notificacion.error('No se pudo guardar la configuración');
      },
    });
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
    this.secciones.update((list: SeccionEncabezado[]) => [...list, { id, tituloBase: '', esDinamico: false, categorias: [] }]);
  }

  quitarSeccion(index: number): void {
    if (!this.puedeQuitarSeccion()) return;
    const list = this.secciones().filter((_: SeccionEncabezado, i: number) => i !== index);
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

  /** Sube la sección una posición (intercambia con la anterior). */
  moverSeccionArriba(index: number): void {
    if (index <= 0) return;
    const list = [...this.secciones()];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    this.secciones.set(list);
    this.reasignarBusquedasAlReordenar(index, index - 1);
  }

  /** Baja la sección una posición (intercambia con la siguiente). */
  moverSeccionAbajo(index: number): void {
    const list = this.secciones();
    if (index >= list.length - 1) return;
    const nueva = [...list];
    [nueva[index], nueva[index + 1]] = [nueva[index + 1], nueva[index]];
    this.secciones.set(nueva);
    this.reasignarBusquedasAlReordenar(index, index + 1);
  }

  /** Actualiza los mapas de búsqueda al intercambiar dos índices de sección. */
  private reasignarBusquedasAlReordenar(indiceA: number, indiceB: number): void {
    this.busquedaRedireccion.update((r) => {
      const a = r[indiceA];
      const b = r[indiceB];
      const next = { ...r };
      if (a !== undefined) next[indiceB] = a;
      if (b !== undefined) next[indiceA] = b;
      return next;
    });
    this.busquedaCategorias.update((r) => {
      const a = r[indiceA];
      const b = r[indiceB];
      const next = { ...r };
      if (a !== undefined) next[indiceB] = a;
      if (b !== undefined) next[indiceA] = b;
      return next;
    });
  }

  actualizarTituloBase(index: number, valor: string): void {
    this.secciones.update((list: SeccionEncabezado[]) =>
      list.map((s: SeccionEncabezado, i: number) => (i === index ? { ...s, tituloBase: valor } : s))
    );
  }

  actualizarDinamico(index: number, valor: boolean): void {
    this.secciones.update((list: SeccionEncabezado[]) =>
      list.map((s: SeccionEncabezado, i: number) =>
        i === index
          ? { ...s, esDinamico: valor, redireccionCategoria: valor ? undefined : s.redireccionCategoria, categorias: valor ? s.categorias ?? [] : undefined }
          : s
      )
    );
  }

  setBusquedaRedireccion(index: number, valor: string): void {
    this.busquedaRedireccion.update((r: Record<number, string>) => ({ ...r, [index]: valor }));
  }

  setBusquedaCategorias(index: number, valor: string): void {
    this.busquedaCategorias.update((r: Record<number, string>) => ({ ...r, [index]: valor }));
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
    this.secciones.update((list: SeccionEncabezado[]) =>
      list.map((s: SeccionEncabezado, i: number) => (i === index ? { ...s, redireccionCategoria: ref } : s))
    );
  }

  toggleCategoriaEnSeccion(index: number, cat: CategoriaConfiguracion): void {
    const ref: CategoriaRef = { handle: cat.handle, titulo: handleATitulo(cat.handle) };
    this.secciones.update((list: SeccionEncabezado[]) =>
      list.map((s: SeccionEncabezado, i: number) => {
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

  /** Carga el logo como base64 (preview local, no Cloudinary). */
  manejarCambioLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.logoUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }
}
