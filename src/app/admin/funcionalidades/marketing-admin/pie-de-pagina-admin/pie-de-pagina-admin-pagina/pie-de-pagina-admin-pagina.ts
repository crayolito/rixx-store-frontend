import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ConfPieDePagina,
  OpcionSeccionPie,
  RedSocialPie,
  SeccionPie,
  SeccionPieDePagina,
  TipoOpcionPie,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionApiServicio } from '../../../../../compartido/servicios/configuracion-api.servicio';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';
import { CloudinaryApiServicio } from '../../../../../nucleo/servicios/cloudinary-api.servicio';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

const NUM_SECCIONES = 4;

export type TipoEnlacePie = 'inicio' | 'perfil' | 'checkout' | 'categoria' | 'producto' | 'privacidad' | 'terminos' | 'otra';

export interface PaginaTienda {
  id: TipoEnlacePie;
  path: string;
  titulo: string;
  conSlug?: boolean;
  customPath?: boolean;
}

export const PAGINAS_TIENDA: PaginaTienda[] = [
  { id: 'inicio', path: '/', titulo: 'Inicio' },
  { id: 'perfil', path: '/perfil', titulo: 'Mi perfil' },
  { id: 'categoria', path: '/categoria/', titulo: 'Categoría (slug)', conSlug: true },
  { id: 'producto', path: '/producto/', titulo: 'Producto (slug)', conSlug: true },
  { id: 'privacidad', path: '/privacidad', titulo: 'Privacidad' },
  { id: 'terminos', path: '/terminos', titulo: 'Términos de servicio' },
  { id: 'otra', path: '', titulo: 'Otra URL', customPath: true },
];

/** Páginas que no deben mostrarse en el selector de enlaces del pie (checkout, carrito, etc.). */
const IDS_PAGINAS_SENSIBLES: TipoEnlacePie[] = ['checkout'];

/** Lista para el selector de enlaces: excluye checkout y otras páginas delicadas. */
export const PAGINAS_TIENDA_ENLACES = PAGINAS_TIENDA.filter((p) => !IDS_PAGINAS_SENSIBLES.includes(p.id));

export type TipoSeccionPie = 'acerca' | 'enlaces' | 'mi_cuenta' | 'ayuda';

const TITULOS_SECCION_POR_DEFECTO: Record<TipoSeccionPie, string> = {
  acerca: 'Acerca de la tienda',
  enlaces: 'Enlaces',
  mi_cuenta: 'Mi cuenta',
  ayuda: 'Ayuda',
};

const REDES_POR_DEFECTO: RedSocialPie[] = [
  { id: 'facebook', url: '' },
  { id: 'instagram', url: '' },
  { id: 'twitter', url: '' },
  { id: 'youtube', url: '' },
  { id: 'linkedin', url: '' },
];

const ETIQUETAS_REDES: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
};

interface EstadoGuardadoPie {
  logoUrl: string;
  redesSociales: RedSocialPie[];
  secciones: SeccionPie[];
}

/** Item para selector de categoría en enlaces del pie */
export interface CategoriaParaEnlace {
  handle: string;
  nombre: string;
}

/** Item para selector de producto en enlaces del pie */
export interface ProductoParaEnlace {
  handle: string;
  titulo: string;
}

@Component({
  selector: 'app-pie-de-pagina-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-de-pagina-admin-pagina.html',
  styleUrl: './pie-de-pagina-admin-pagina.css',
})
export class PieDePaginaAdminPagina implements OnInit {
  private router = inject(Router);
  private configuracionApi = inject(ConfiguracionApiServicio);
  private notificacion = inject(NotificacionServicio);
  private categoriasApi = inject(CategoriasApiServicio);
  private cloudinaryApi = inject(CloudinaryApiServicio);
  private productosApi = inject(ProductosApiServicio);

  logoUrl = signal('');
  redesSociales = signal<RedSocialPie[]>([]);
  secciones = signal<SeccionPie[]>([]);
  guardando = signal(false);

  /** Listas para selectores de enlace: categoría y producto (slug = handle). */
  categoriasParaEnlace = signal<CategoriaParaEnlace[]>([]);
  productosParaEnlace = signal<ProductoParaEnlace[]>([]);

  /** Estado guardado (carga o guardar exitoso); para comparar y restaurar en Cancelar. */
  private estadoGuardado = signal<EstadoGuardadoPie | null>(null);

  /** True si el formulario tiene cambios respecto al último estado guardado. */
  hayCambiosPendientes = computed(() => {
    const g = this.estadoGuardado();
    if (!g) return false;
    return (
      this.logoUrl() !== g.logoUrl ||
      JSON.stringify(this.redesSociales()) !== JSON.stringify(g.redesSociales) ||
      JSON.stringify(this.secciones()) !== JSON.stringify(g.secciones)
    );
  });

  readonly numSecciones = NUM_SECCIONES;
  readonly etiquetasRedes = ETIQUETAS_REDES;
  readonly paginasTienda = PAGINAS_TIENDA_ENLACES;
  readonly titulosSeccionPorDefecto = TITULOS_SECCION_POR_DEFECTO;
  readonly tiposOpcion: TipoOpcionPie[] = ['enlace', 'telefono', 'correo'];

  ngOnInit(): void {
    this.cargarListasParaEnlaces();
    this.cargarConfiguracion();
  }

  /** Carga categorías y productos para los selectores de enlace (categoría/producto). */
  private cargarListasParaEnlaces(): void {
    forkJoin({
      categorias: this.categoriasApi.obtenerTodas(),
      productos: this.productosApi.obtenerImportados(),
    }).subscribe({
      next: ({ categorias, productos }) => {
        this.categoriasParaEnlace.set(
          categorias.map((c) => ({ handle: c.handle, nombre: c.nombre }))
        );
        this.productosParaEnlace.set(
          productos.map((p) => ({ handle: p.handle, titulo: p.titulo }))
        );
      },
      error: () => {
        this.categoriasParaEnlace.set([]);
        this.productosParaEnlace.set([]);
      },
    });
  }

  /** Carga el pie de página desde la API; si no hay datos, aplica valores por defecto. */
  private cargarConfiguracion(): void {
    this.configuracionApi.obtenerConfiguracion().subscribe({
      next: (config) => {
        const pie = config?.pieDePagina;
        if (pie && Array.isArray(pie.secciones) && pie.secciones.length >= NUM_SECCIONES) {
          const redes = REDES_POR_DEFECTO.map((r) => ({
            id: r.id,
            url: (pie.redesSociales ?? []).find((x: RedSocialPie) => x.id === r.id)?.url ?? '',
          }));
          this.logoUrl.set(pie.logoUrl ?? '');
          this.redesSociales.set(redes);
          this.secciones.set(this.normalizarSecciones(pie.secciones));
        } else {
          this.aplicarPorDefecto();
        }
        this.guardarEstadoComoOriginal();
      },
      error: () => {
        this.aplicarPorDefecto();
        this.guardarEstadoComoOriginal();
      },
    });
  }

  /** Guarda el estado actual como referencia para Cancelar. */
  private guardarEstadoComoOriginal(): void {
    this.estadoGuardado.set({
      logoUrl: this.logoUrl(),
      redesSociales: JSON.parse(JSON.stringify(this.redesSociales())),
      secciones: JSON.parse(JSON.stringify(this.secciones())),
    });
  }

  private normalizarSecciones(lista: SeccionPie[] | SeccionPieDePagina[]): SeccionPie[] {
    const tipos: TipoSeccionPie[] = ['acerca', 'enlaces', 'mi_cuenta', 'ayuda'];
    const base = lista.length >= NUM_SECCIONES
      ? lista.slice(0, NUM_SECCIONES)
      : [...lista, ...Array(NUM_SECCIONES - lista.length).fill(null)].slice(0, NUM_SECCIONES);
    return base.map((s, idx) => {
      const tipo = tipos[idx];
      const tituloDef = TITULOS_SECCION_POR_DEFECTO[tipo];
      if (!s) {
        return this.obtenerSeccionPorDefecto(tipo, 'sec-' + (idx + 1) + '-' + Date.now());
      }
      return {
        id: s.id ?? 'sec-' + (idx + 1),
        titulo: (s.titulo ?? '').trim() || tituloDef,
        descripcion: s.descripcion ?? '',
        opciones: (s.opciones ?? []).map((o: Partial<OpcionSeccionPie>) => this.normalizarOpcion(o)),
      };
    });
  }

  private normalizarOpcion(o: Partial<OpcionSeccionPie>): OpcionSeccionPie {
    return {
      id: o.id ?? 'op-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      tipo: (o.tipo ?? 'enlace') as TipoOpcionPie,
      etiqueta: o.etiqueta ?? '',
      path: o.path ?? '',
      numero: o.numero ?? '',
      correo: o.correo ?? '',
    };
  }

  private aplicarPorDefecto(): void {
    this.redesSociales.set(REDES_POR_DEFECTO.map((r) => ({ ...r })));
    this.logoUrl.set('');
    this.secciones.set(this.obtenerSeccionesPorDefecto());
  }

  private obtenerSeccionPorDefecto(tipo: TipoSeccionPie, id: string): SeccionPie {
    const titulo = TITULOS_SECCION_POR_DEFECTO[tipo];
    if (tipo === 'acerca') {
      return { id, titulo, descripcion: '', opciones: [] };
    }
    if (tipo === 'enlaces') {
      return {
        id,
        titulo,
        descripcion: '',
        opciones: [
          this.normalizarOpcion({ tipo: 'enlace', etiqueta: 'Productos', path: '/' }),
          this.normalizarOpcion({ tipo: 'enlace', etiqueta: 'Categorías', path: '/' }),
          this.normalizarOpcion({ tipo: 'enlace', etiqueta: 'Privacidad', path: '/privacidad' }),
          this.normalizarOpcion({ tipo: 'enlace', etiqueta: 'Términos de servicio', path: '/terminos' }),
        ],
      };
    }
    if (tipo === 'mi_cuenta') {
      return {
        id,
        titulo,
        descripcion: '',
        opciones: [this.normalizarOpcion({ tipo: 'enlace', etiqueta: 'Mi perfil', path: '/perfil' })],
      };
    }
    return { id, titulo, descripcion: '', opciones: [] };
  }

  private obtenerSeccionesPorDefecto(): SeccionPie[] {
    const tipos: TipoSeccionPie[] = ['acerca', 'enlaces', 'mi_cuenta', 'ayuda'];
    return tipos.map((tipo, idx) => this.obtenerSeccionPorDefecto(tipo, 'sec-' + (idx + 1)));
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  /** Restaura el formulario al último estado guardado. */
  cancelarCambios(): void {
    const g = this.estadoGuardado();
    if (!g) return;
    this.logoUrl.set(g.logoUrl);
    this.redesSociales.set(JSON.parse(JSON.stringify(g.redesSociales)));
    this.secciones.set(JSON.parse(JSON.stringify(g.secciones)));
    this.notificacion.info('Cambios descartados');
  }

  guardarConfiguracion(): void {
    const sec = this.secciones();
    const invalidas = sec.some((s) => !String(s.titulo ?? '').trim());
    if (invalidas) {
      this.notificacion.advertencia('Cada sección debe tener un título.');
      return;
    }
    const opcionesInvalidas = sec.some((s, idx) => {
      if (this.tipoSeccion(idx) === 'acerca') return false;
      return (s.opciones ?? []).some((o) => !this.opcionValida(o));
    });
    if (opcionesInvalidas) {
      this.notificacion.advertencia('Revisa cada opción: enlace (texto y página), teléfono (número), correo (email).');
      return;
    }
    const pie = this.construirPieParaApi();
    this.guardando.set(true);
    this.configuracionApi.actualizarPieDePagina(pie).subscribe({
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

  /** Construye el payload del pie según el contrato PATCH /configuracion. */
  private construirPieParaApi(): ConfPieDePagina {
    const sec = this.secciones();
    const seccionesGuardar = sec.map((s, idx) => {
      if (this.tipoSeccion(idx) === 'acerca') {
        return { id: s.id, titulo: s.titulo, descripcion: s.descripcion, opciones: [] };
      }
      const opciones = (s.opciones ?? []).map((o: OpcionSeccionPie) => ({
        id: o.id,
        tipo: o.tipo,
        etiqueta: o.etiqueta,
        path: o.path ?? '',
        ...(o.numero !== undefined && { numero: o.numero }),
        ...(o.correo !== undefined && { correo: o.correo }),
      }));
      return { id: s.id, titulo: s.titulo, descripcion: s.descripcion, opciones };
    });
    return {
      logoUrl: this.logoUrl().trim(),
      redesSociales: this.redesSociales(),
      secciones: seccionesGuardar as SeccionPieDePagina[],
    } as ConfPieDePagina;
  }

  opcionValida(o: OpcionSeccionPie): boolean {
    if (!String(o.etiqueta ?? '').trim()) return false;
    switch (o.tipo) {
      case 'enlace':
        return !!String(o.path ?? '').trim();
      case 'telefono':
        return !!String(o.numero ?? '').trim();
      case 'correo':
        return !!String(o.correo ?? '').trim();
      default:
        return true;
    }
  }

  tipoSeccion(index: number): TipoSeccionPie {
    const tipos: TipoSeccionPie[] = ['acerca', 'enlaces', 'mi_cuenta', 'ayuda'];
    return tipos[index] ?? 'acerca';
  }

  soloEnlaces(index: number): boolean {
    return this.tipoSeccion(index) === 'enlaces' || this.tipoSeccion(index) === 'mi_cuenta';
  }

  soloAyuda(index: number): boolean {
    return this.tipoSeccion(index) === 'ayuda';
  }

  tiposOpcionParaSeccion(index: number): TipoOpcionPie[] {
    if (this.soloEnlaces(index)) return ['enlace'];
    if (this.soloAyuda(index)) return ['telefono', 'correo'];
    return [];
  }

  actualizarTitulo(index: number, valor: string): void {
    this.secciones.update((list) =>
      list.map((s, i) => (i === index ? { ...s, titulo: valor } : s))
    );
  }

  actualizarDescripcion(index: number, valor: string): void {
    this.secciones.update((list) =>
      list.map((s, i) => (i === index ? { ...s, descripcion: valor } : s))
    );
  }

  agregarOpcion(seccionIndex: number): void {
    const tipos = this.tiposOpcionParaSeccion(seccionIndex);
    const tipoInicial: TipoOpcionPie = tipos[0] ?? 'enlace';
    const nueva: OpcionSeccionPie = {
      id: 'op-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      tipo: tipoInicial,
      etiqueta: '',
      path: tipoInicial === 'enlace' ? '/' : '',
      numero: '',
      correo: '',
    };
    this.secciones.update((list) =>
      list.map((s, i) =>
        i === seccionIndex ? { ...s, opciones: [...(s.opciones ?? []), nueva] } : s
      )
    );
  }

  moverOpcionArriba(seccionIndex: number, opcionIndex: number): void {
    if (opcionIndex <= 0) return;
    this.secciones.update((list) =>
      list.map((s, i) => {
        if (i !== seccionIndex) return s;
        const opciones = [...(s.opciones ?? [])];
        [opciones[opcionIndex - 1], opciones[opcionIndex]] = [opciones[opcionIndex], opciones[opcionIndex - 1]];
        return { ...s, opciones };
      })
    );
  }

  moverOpcionAbajo(seccionIndex: number, opcionIndex: number): void {
    const list = this.secciones();
    const opciones = list[seccionIndex]?.opciones ?? [];
    if (opcionIndex >= opciones.length - 1) return;
    this.secciones.update((l) =>
      l.map((s, i) => {
        if (i !== seccionIndex) return s;
        const ops = [...(s.opciones ?? [])];
        [ops[opcionIndex], ops[opcionIndex + 1]] = [ops[opcionIndex + 1], ops[opcionIndex]];
        return { ...s, opciones: ops };
      })
    );
  }

  quitarOpcion(seccionIndex: number, opcionIndex: number): void {
    this.secciones.update((list) =>
      list.map((s, i) =>
        i === seccionIndex
          ? { ...s, opciones: (s.opciones ?? []).filter((_: OpcionSeccionPie, j: number) => j !== opcionIndex) }
          : s
      )
    );
  }

  actualizarOpcion(
    seccionIndex: number,
    opcionIndex: number,
    campo: keyof OpcionSeccionPie,
    valor: string
  ): void {
    this.secciones.update((list) =>
      list.map((s, i) => {
        if (i !== seccionIndex) return s;
        const opciones = (s.opciones ?? []).map((o: OpcionSeccionPie, j: number) =>
          j === opcionIndex ? { ...o, [campo]: valor } : o
        );
        return { ...s, opciones };
      })
    );
  }

  actualizarTipoOpcion(seccionIndex: number, opcionIndex: number, tipo: TipoOpcionPie): void {
    const permitidos = this.tiposOpcionParaSeccion(seccionIndex);
    if (!permitidos.includes(tipo)) return;
    this.secciones.update((list) =>
      list.map((s, i) => {
        if (i !== seccionIndex) return s;
        const opciones = (s.opciones ?? []).map((o: OpcionSeccionPie, j: number) =>
          j === opcionIndex
            ? {
              ...o,
              tipo,
              path: tipo === 'enlace' ? (o.path ?? '/') : '',
              numero: tipo === 'telefono' ? (o.numero ?? '') : '',
              correo: tipo === 'correo' ? (o.correo ?? '') : '',
            }
            : o
        );
        return { ...s, opciones };
      })
    );
  }

  actualizarPathEnlace(seccionIndex: number, opcionIndex: number, paginaId: TipoEnlacePie, valorSlugOPath: string): void {
    const pag = PAGINAS_TIENDA.find((p) => p.id === paginaId);
    let path = '';
    if (pag?.conSlug) path = pag.path + (valorSlugOPath ?? '').trim();
    else if (pag?.customPath) path = (valorSlugOPath ?? '').trim();
    else if (pag) path = pag.path;
    this.secciones.update((list) =>
      list.map((s, i) => {
        if (i !== seccionIndex) return s;
        const opciones = (s.opciones ?? []).map((o: OpcionSeccionPie, j: number) =>
          j === opcionIndex ? { ...o, path } : o
        );
        return { ...s, opciones };
      })
    );
  }

  /** Tipo de enlace para el selector; páginas sensibles se mapean a 'otra' para no mostrarlas en la lista. */
  getTipoEnlace(path: string | undefined): TipoEnlacePie {
    const p = (path ?? '').trim();
    if (p === '/') return 'inicio';
    if (p === '/perfil') return 'perfil';
    if (p === '/checkout') return 'otra';
    if (p === '/privacidad') return 'privacidad';
    if (p === '/terminos') return 'terminos';
    if (p.startsWith('/categoria/')) return 'categoria';
    if (p.startsWith('/producto/')) return 'producto';
    return 'otra';
  }

  getSlugOPathParaEnlace(path: string | undefined): string {
    const p = (path ?? '').trim();
    if (p.startsWith('/categoria/')) return p.slice('/categoria/'.length);
    if (p.startsWith('/producto/')) return p.slice('/producto/'.length);
    if (p === '/' || p === '/perfil' || p === '/privacidad' || p === '/terminos') return '';
    return p;
  }

  actualizarUrlRed(index: number, url: string): void {
    this.redesSociales.update((list) =>
      list.map((r, i) => (i === index ? { ...r, url } : r))
    );
  }

  /** Sube el logo del pie a Cloudinary y asigna la URL. */
  manejarCambioLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    this.cloudinaryApi.subirImagen(file).subscribe({
      next: (url) => {
        if (url) this.logoUrl.set(url);
      },
    });
    input.value = '';
  }

  etiquetaTipo(tipo: TipoOpcionPie): string {
    const map: Record<TipoOpcionPie, string> = {
      enlace: 'Enlace a página',
      telefono: 'Teléfono',
      correo: 'Correo',
    };
    return map[tipo] ?? tipo;
  }
}
