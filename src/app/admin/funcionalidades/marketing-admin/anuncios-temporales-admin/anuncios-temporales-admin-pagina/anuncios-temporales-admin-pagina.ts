import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { CategoriaConfiguracion } from '../../../../../compartido/modelos/configuracion.modelo';
import {
  AnuncioTemporal,
  handleATitulo,
  TipoDestinoAnuncio,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { ProductoApi } from '../../../../../compartido/modelos/producto.modelo';
import { ConfiguracionApiServicio } from '../../../../../compartido/servicios/configuracion-api.servicio';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CategoriasApiServicio } from '../../../../../nucleo/servicios/categorias-api.servicio';
import { CloudinaryApiServicio } from '../../../../../nucleo/servicios/cloudinary-api.servicio';
import { ProductosApiServicio } from '../../../../../nucleo/servicios/productos-api.servicio';

const MIN_ANUNCIOS = 0;
const MAX_ANUNCIOS = 5;

@Component({
  selector: 'app-anuncios-temporales-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anuncios-temporales-admin-pagina.html',
  styleUrl: './anuncios-temporales-admin-pagina.css',
})
export class AnunciosTemporalesAdminPagina implements OnInit {
  private router = inject(Router);
  private categoriasApi = inject(CategoriasApiServicio);
  private productosApi = inject(ProductosApiServicio);
  private cloudinaryApi = inject(CloudinaryApiServicio);
  private configuracionApi = inject(ConfiguracionApiServicio);
  private notificacion = inject(NotificacionServicio);

  readonly productosDisponibles = signal<ProductoApi[]>([]);
  readonly categoriasDisponibles = signal<CategoriaConfiguracion[]>([]);
  readonly minAnuncios = MIN_ANUNCIOS;
  readonly maxAnuncios = MAX_ANUNCIOS;
  readonly handleATitulo = handleATitulo;

  anuncios = signal<AnuncioTemporal[]>([]);
  busquedaProducto = signal<Record<number, string>>({});
  busquedaCategoria = signal<Record<number, string>>({});
  guardando = signal(false);

  /** Estado guardado para comparar y restaurar en Descartar. */
  private estadoGuardado = signal<AnuncioTemporal[]>([]);

  /** True si hay cambios respecto al último estado guardado. */
  hayCambiosPendientes = computed(() => {
    return JSON.stringify(this.anuncios()) !== JSON.stringify(this.estadoGuardado());
  });

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
        const conf = config?.anuncioTemporal;
        if (conf && Array.isArray(conf.anuncios)) {
          const anunciosNormalizados = this.normalizarAnuncios(conf.anuncios);
          this.anuncios.set(anunciosNormalizados);
          this.guardarEstadoComoOriginal();
        } else {
          this.anuncios.set([]);
          this.guardarEstadoComoOriginal();
        }
      },
      error: () => {
        this.anuncios.set([]);
        this.guardarEstadoComoOriginal();
      },
    });
  }

  private normalizarAnuncios(lista: AnuncioTemporal[]): AnuncioTemporal[] {
    const recortada = lista.length > MAX_ANUNCIOS ? lista.slice(0, MAX_ANUNCIOS) : lista;
    return recortada.map((a) => ({
      id: a.id,
      activo: a.activo ?? true,
      imagenMovil: a.imagenMovil ?? '',
      imagenDesktop: a.imagenDesktop ?? '',
      fechaInicio: a.fechaInicio ?? '',
      fechaFin: a.fechaFin ?? '',
      tipoDestino: (a.tipoDestino ?? 'ninguno') as TipoDestinoAnuncio,
      destinoHandle: a.tipoDestino !== 'ninguno' ? a.destinoHandle : undefined,
    }));
  }

  /** Guarda el estado actual como referencia para Descartar. */
  private guardarEstadoComoOriginal(): void {
    this.estadoGuardado.set(JSON.parse(JSON.stringify(this.anuncios())));
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  /** Restaura el formulario al último estado guardado. */
  cancelarCambios(): void {
    this.anuncios.set(JSON.parse(JSON.stringify(this.estadoGuardado())));
    this.notificacion.info('Cambios descartados');
  }

  guardarConfiguracion(): void {
    const lista = this.anuncios();
    if (lista.length > MAX_ANUNCIOS) {
      this.notificacion.advertencia(`Máximo ${MAX_ANUNCIOS} anuncios permitidos.`);
      return;
    }

    const incompleto = lista.some(
      (a) => !a.imagenMovil?.trim() || !a.imagenDesktop?.trim() || !a.fechaInicio || !a.fechaFin
    );
    if (incompleto) {
      this.notificacion.advertencia('Cada anuncio debe tener imágenes y fechas de inicio/fin.');
      return;
    }

    const sinDestino = lista.some(
      (a) => (a.tipoDestino === 'producto' || a.tipoDestino === 'categoria') && !a.destinoHandle?.trim()
    );
    if (sinDestino) {
      this.notificacion.advertencia('En anuncios con destino producto/categoría, debes seleccionar uno.');
      return;
    }

    console.log('[Anuncios] Iniciando guardado, lista:', lista);
    this.guardando.set(true);
    this.configuracionApi.actualizarAnuncioTemporal({ anuncios: lista }).subscribe({
      next: (respuesta) => {
        console.log('[Anuncios] Respuesta exitosa del servidor:', respuesta);
        this.guardando.set(false);
        this.guardarEstadoComoOriginal();
        this.notificacion.exito('Configuración guardada correctamente.');
      },
      error: (err) => {
        console.error('[Anuncios] Error del servidor:', err);
        this.guardando.set(false);
        this.notificacion.error('Error al guardar la configuración.');
      },
      complete: () => {
        console.log('[Anuncios] Observable completado');
      }
    });
  }

  puedeAgregarAnuncio(): boolean {
    return this.anuncios().length < MAX_ANUNCIOS;
  }

  puedeQuitarAnuncio(): boolean {
    return this.anuncios().length > MIN_ANUNCIOS;
  }

  agregarAnuncio(): void {
    if (!this.puedeAgregarAnuncio()) return;
    const id = 'anuncio-' + Date.now();
    this.anuncios.update((lista) => [
      ...lista,
      {
        id,
        activo: true,
        imagenMovil: '',
        imagenDesktop: '',
        fechaInicio: '',
        fechaFin: '',
        tipoDestino: 'ninguno' as TipoDestinoAnuncio,
      },
    ]);
  }

  quitarAnuncio(indice: number): void {
    if (!this.puedeQuitarAnuncio()) return;
    const lista = this.anuncios().filter((_, i) => i !== indice);
    this.anuncios.set(lista);
    this.busquedaProducto.update((r) => this.reindexarBusqueda(r, indice));
    this.busquedaCategoria.update((r) => this.reindexarBusqueda(r, indice));
  }

  private reindexarBusqueda(actual: Record<number, string>, indiceQuitado: number): Record<number, string> {
    const next: Record<number, string> = {};
    Object.entries(actual).forEach(([k, v]) => {
      const i = Number(k);
      if (i < indiceQuitado) next[i] = v;
      if (i > indiceQuitado) next[i - 1] = v;
    });
    return next;
  }

  toggleActivo(indice: number): void {
    this.anuncios.update((lista) =>
      lista.map((a, i) => (i === indice ? { ...a, activo: !a.activo } : a))
    );
  }

  actualizarImagenMovil(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    this.cloudinaryApi.subirImagen(file).subscribe({
      next: (url) => {
        if (!url) return;
        this.anuncios.update((lista) =>
          lista.map((a, i) => (i === indice ? { ...a, imagenMovil: url } : a))
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
        this.anuncios.update((lista) =>
          lista.map((a, i) => (i === indice ? { ...a, imagenDesktop: url } : a))
        );
      },
    });
    input.value = '';
  }

  actualizarFechaInicio(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const valor = input.value;
    this.anuncios.update((lista) =>
      lista.map((a, i) => (i === indice ? { ...a, fechaInicio: valor ? new Date(valor).toISOString() : '' } : a))
    );
  }

  actualizarFechaFin(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const valor = input.value;
    this.anuncios.update((lista) =>
      lista.map((a, i) => (i === indice ? { ...a, fechaFin: valor ? new Date(valor).toISOString() : '' } : a))
    );
  }

  obtenerFechaLocal(fechaISO: string): string {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    const offset = fecha.getTimezoneOffset();
    const local = new Date(fecha.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  actualizarTipoDestino(indice: number, valor: TipoDestinoAnuncio): void {
    this.anuncios.update((lista) =>
      lista.map((a, i) =>
        i === indice
          ? { ...a, tipoDestino: valor, destinoHandle: valor === 'ninguno' ? undefined : a.destinoHandle }
          : a
      )
    );
  }

  setBusquedaProducto(indice: number, valor: string): void {
    this.busquedaProducto.update((r) => ({ ...r, [indice]: valor }));
  }

  setBusquedaCategoria(indice: number, valor: string): void {
    this.busquedaCategoria.update((r) => ({ ...r, [indice]: valor }));
  }

  productosFiltradosPara(indice: number): ProductoApi[] {
    const texto = (this.busquedaProducto()[indice] ?? '').trim().toLowerCase();
    const lista = this.productosDisponibles();
    if (!texto) return lista;
    return lista.filter(
      (p) => p.titulo.toLowerCase().includes(texto) || (p.handle ?? '').toLowerCase().includes(texto)
    );
  }

  categoriasFiltradasPara(indice: number): CategoriaConfiguracion[] {
    const texto = (this.busquedaCategoria()[indice] ?? '').trim().toLowerCase();
    const lista = this.categoriasDisponibles();
    if (!texto) return lista;
    return lista.filter(
      (c) => c.handle.toLowerCase().includes(texto) || handleATitulo(c.handle).toLowerCase().includes(texto)
    );
  }

  asignarDestinoProducto(indice: number, producto: ProductoApi): void {
    this.anuncios.update((lista) =>
      lista.map((a, i) =>
        i === indice ? { ...a, tipoDestino: 'producto' as const, destinoHandle: producto.handle } : a
      )
    );
  }

  asignarDestinoCategoria(indice: number, handle: string): void {
    this.anuncios.update((lista) =>
      lista.map((a, i) =>
        i === indice ? { ...a, tipoDestino: 'categoria' as const, destinoHandle: handle } : a
      )
    );
  }

  nombreProductoPorHandle(handle: string): string {
    return this.productosDisponibles().find((p) => p.handle === handle)?.titulo ?? handle;
  }
}
