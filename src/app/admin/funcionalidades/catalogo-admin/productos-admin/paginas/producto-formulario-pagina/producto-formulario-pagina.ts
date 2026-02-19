import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Modal } from '../../../../../../compartido/componentes/modal/modal';
import type { CategoriaApi } from '../../../../../../compartido/modelos/categoria.modelo';
import type { ProductoDetalleApi } from '../../../../../../compartido/modelos/producto.modelo';
import { NotificacionServicio } from '../../../../../../compartido/servicios/notificacion';
import { CategoriasApiServicio } from '../../../../../../nucleo/servicios/categorias-api.servicio';
import { CloudinaryApiServicio } from '../../../../../../nucleo/servicios/cloudinary-api.servicio';
import {
  ActualizarProductoCuerpo,
  CampoDinamicoCuerpo,
  CrearProductoCuerpo,
  ProductosApiServicio,
} from '../../../../../../nucleo/servicios/productos-api.servicio';

// Modelos de datos locales
interface Categoria {
  id: string;
  nombre: string;
  seleccionada: boolean;
}

interface CampoAdicional {
  id: string;
  etiqueta: string;
  identificador: string;
  tipo: 'texto' | 'numero';
  requerido: boolean;
}

interface Precio {
  id: string;
  id_precio?: number;
  nombre: string;
  precioBase: number;
  margenClienteFinal: number;
  margenRevendedor: number;
  margenMayorista: number;
  porcentajeDescuento: number;
  soloClienteFinal: boolean;
  precioActivo: boolean;
  stock?: number;
  orden?: number;
}

@Component({
  selector: 'app-producto-formulario-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './producto-formulario-pagina.html',
  styleUrl: './producto-formulario-pagina.css',
})
export class ProductoFormularioPagina {
  // Datos del formulario
  titulo = signal<string>('');
  descripcion = signal<string>('');
  instrucciones = signal<string>('');
  terminos = signal<string>('');
  estadoProducto = signal<'activo' | 'inactivo'>('activo');

  // Listado de categorías
  categorias = signal<Categoria[]>([]);

  buscarCategoria = signal<string>('');
  mostrarOpcionesCategorias = signal<boolean>(false);

  // Campos adicionales
  camposAdicionales = signal<CampoAdicional[]>([]);
  /** Respaldo al desmarcar "Proceso manual"; se restaura si vuelve a marcar antes de guardar. */
  camposAdicionalesRespaldo = signal<CampoAdicional[]>([]);

  // Precios y estado general
  precios = signal<Precio[]>([]);
  handleProducto = signal<string | null>(null);
  esEdicion = computed(() => !!this.handleProducto());
  /** Solo productos sin id Vemper y con "Proceso manual" activado pueden agregar campos dinámicos. */
  puedeAgregarCampos = computed(() => !this.tieneCodigoVemper() && this.procesoManual());
  cargando = signal(true);
  guardando = signal(false);
  tituloOriginal = signal('');
  descripcionOriginal = signal('');
  instruccionesOriginal = signal('');
  terminosOriginal = signal('');
  idCategoriasOriginal = signal<number[]>([]);
  preciosOriginal = signal<Precio[]>([]);
  estadoOriginal = signal<'activo' | 'inactivo'>('activo');
  imagenPortadaOriginal = signal<string>('');
  imagenBannerOriginal = signal<string>('');
  sincronizacionAutomatica = signal<boolean>(true);
  sincronizacionAutomaticaOriginal = signal<boolean>(true);
  tieneCodigoVemper = signal<boolean>(false);
  /** Si es true, el producto usa proceso manual y permite campos adicionales y recargas manuales. Solo aplica a productos sin id Vemper. */
  procesoManual = signal<boolean>(true);
  private route = inject(ActivatedRoute);

  /** Al desmarcar proceso manual: vacía campos adicionales en pantalla (respaldo para restaurar si vuelve a marcar). Al marcar de nuevo: restaura desde respaldo. No guarda en servidor hasta Guardar. */
  alCambiarProcesoManual(checked: boolean) {
    this.procesoManual.set(checked);
    if (!checked) {
      const actuales = this.camposAdicionales();
      if (actuales.length > 0) {
        this.camposAdicionalesRespaldo.set([...actuales]);
        this.camposAdicionales.set([]);
      }
    } else {
      const respaldo = this.camposAdicionalesRespaldo();
      if (respaldo.length > 0) {
        this.camposAdicionales.set([...respaldo]);
        this.camposAdicionalesRespaldo.set([]);
      }
    }
  }
  private productosApi = inject(ProductosApiServicio);
  private categoriasApi = inject(CategoriasApiServicio);
  private cloudinaryApi = inject(CloudinaryApiServicio);
  private notificacion = inject(NotificacionServicio);
  private router = inject(Router);

  imagenPortada = signal<string>('');
  imagenBanner = signal<string>('');
  subiendoPortada = signal(false);
  subiendoBanner = signal(false);

  // Estado del modal de campos adicionales
  modalTipoCampoAbierto = signal<boolean>(false);
  campoAdicionalEditando = signal<CampoAdicional | null>(null);
  etiquetaCampo = signal<string>('');
  tipoCampoSeleccionado = signal<'texto' | 'numero'>('texto');
  campoRequerido = signal<boolean>(true);

  // Estado del modal de precios
  modalPrecioAbierto = signal<boolean>(false);
  precioEditando = signal<Precio | null>(null);
  nombrePrecio = signal<string>('');
  precioBase = signal<number>(0);
  porcentajeDescuento = signal<number>(0);
  margenClienteFinal = signal<number>(0);
  margenRevendedor = signal<number>(0);
  margenMayorista = signal<number>(0);
  soloClienteFinal = signal<boolean>(false);
  precioActivo = signal<boolean>(true);

  // Estado para drag and drop
  elementoArrastrando = signal<string | null>(null);
  tipoArrastrando = signal<'campo' | 'precio' | null>(null);
  indiceArrastrando = signal<number | null>(null);

  // Derivados del formulario
  categoriasSeleccionadas = computed(() => this.categorias().filter((cat) => cat.seleccionada));

  categoriasFiltradas = computed(() => {
    const busqueda = this.buscarCategoria().toLowerCase();
    if (!busqueda) return this.categorias();
    return this.categorias().filter((cat) => cat.nombre.toLowerCase().includes(busqueda));
  });

  hayResultadosBusqueda = computed(() => this.categoriasFiltradas().length > 0);

  // Calcula el monto en dólares del margen de cliente
  margenClienteEnDolares = computed(() => {
    const base = this.precioBase();
    const porcentaje = this.margenClienteFinal() / 100;
    return base * porcentaje;
  });

  precioClienteFinalCalculado = computed(() => {
    const base = this.precioBase();
    const margen = this.margenClienteFinal() / 100;
    return base * (1 + margen);
  });

  precioRevendedorCalculado = computed(() => {
    const base = this.precioBase();
    const margen = this.margenRevendedor() / 100;
    return base * (1 + margen);
  });

  idsCategoriasSeleccionadas = computed(() =>
    this.categoriasSeleccionadas().map((c) => Number(c.id)),
  );

  hayCambiosPendientes = computed(() => {
    if (this.cargando()) return false;
    const t = this.titulo().trim();
    const to = this.tituloOriginal().trim();
    const d = this.descripcion().trim();
    const do_ = this.descripcionOriginal().trim();
    const inst = this.instrucciones().trim();
    const instO = this.instruccionesOriginal().trim();
    const term = this.terminos().trim();
    const termO = this.terminosOriginal().trim();
    const estado = this.estadoProducto();
    const estadoO = this.estadoOriginal();
    const portada = this.imagenPortada();
    const portadaO = this.imagenPortadaOriginal();
    const banner = this.imagenBanner();
    const bannerO = this.imagenBannerOriginal();
    const ids = this.idsCategoriasSeleccionadas();
    const idsO = this.idCategoriasOriginal();
    const idsOk = ids.length === idsO.length && ids.every((id, i) => id === idsO[i]);
    const precios = this.precios();
    const preciosO = this.preciosOriginal();
    const preciosOk =
      precios.length === preciosO.length &&
      precios.every((p, i) => {
        const o = preciosO[i];
        return o && p.nombre === o.nombre && p.precioBase === o.precioBase;
      });
    const syncCambio =
      this.tieneCodigoVemper() &&
      this.sincronizacionAutomatica() !== this.sincronizacionAutomaticaOriginal();
    return (
      t !== to ||
      d !== do_ ||
      inst !== instO ||
      term !== termO ||
      estado !== estadoO ||
      portada !== portadaO ||
      banner !== bannerO ||
      syncCambio ||
      !idsOk ||
      !preciosOk
    );
  });

  puedeGuardar = computed(() => {
    const base = this.titulo().trim() !== '' && this.idsCategoriasSeleccionadas().length > 0;
    const conPrecios = this.precios().length > 0 || (this.esEdicion() && this.tieneCodigoVemper());
    return base && conPrecios;
  });

  // Configura la pantalla cargando el handle y los datos iniciales
  constructor() {
    this.establecerHandleDesdeRuta();
    this.cargarCategoriasIniciales();
  }

  // Obtiene el handle desde la URL para habilitar el modo edición
  private establecerHandleDesdeRuta() {
    const handle = this.route.snapshot.paramMap.get('handle');
    if (handle) this.handleProducto.set(handle);
  }

  // Descarga las categorías y conmuta la carga del producto si corresponde
  private cargarCategoriasIniciales() {
    this.categoriasApi.obtenerTodas().subscribe((lista) => {
      this.hidratarCategorias(lista, this.idCategoriasOriginal());
      const handle = this.handleProducto();
      if (handle) {
        this.cargarProductoParaEdicion(handle);
      } else {
        this.cargando.set(false);
      }
    });
  }

  // Convierte la respuesta de categorías a la forma que usa el formulario
  private hidratarCategorias(lista: CategoriaApi[], idsSeleccionados: number[]) {
    this.categorias.set(
      lista.map((c) => ({
        id: String(c.id_categoria),
        nombre: c.nombre,
        seleccionada: idsSeleccionados.includes(c.id_categoria),
      })),
    );
  }

  // Carga los datos del producto para poblar el formulario en modo edición
  private cargarProductoParaEdicion(handle: string) {
    this.productosApi.obtenerPorHandle(handle).subscribe((producto) => {
      if (producto) {
        this.aplicarInformacionProducto(producto);
      }
      this.cargando.set(false);
    });
  }

  // Actualiza todas las señales con la información que trae el API
  private aplicarInformacionProducto(producto: ProductoDetalleApi) {
    const esVemper = this.esProductoVemper(producto);
    this.tieneCodigoVemper.set(esVemper);
    const sync = producto.sincronizado ?? true;
    this.sincronizacionAutomatica.set(sync);
    this.sincronizacionAutomaticaOriginal.set(sync);
    if (!esVemper) {
      // Si viene tipoProceso del API, usarlo; sino inferir desde campos dinámicos
      const tipoProceso = producto.tipoProceso?.toLowerCase();
      if (tipoProceso === 'manual' || tipoProceso === 'automatico') {
        this.procesoManual.set(tipoProceso === 'manual');
      } else {
        // Fallback: inferir desde campos dinámicos (comportamiento anterior)
        this.procesoManual.set((producto.camposDinamicos?.length ?? 0) > 0);
      }
    }
    this.titulo.set(producto.titulo);
    this.descripcion.set(producto.descripcion ?? '');
    this.instrucciones.set(producto.comoCanjear ?? '');
    this.terminos.set(producto.terminosCondiciones ?? '');
    const estado = producto.estado === 'inactivo' ? 'inactivo' : 'activo';
    this.estadoProducto.set(estado);
    this.estadoOriginal.set(estado);
    this.tituloOriginal.set(producto.titulo);
    this.descripcionOriginal.set(producto.descripcion ?? '');
    this.instruccionesOriginal.set(producto.comoCanjear ?? '');
    this.terminosOriginal.set(producto.terminosCondiciones ?? '');
    this.actualizarImagenesProducto(producto);
    this.camposAdicionales.set(this.crearCamposAdicionales(producto));
    const idsCategorias = this.obtenerIdsCategoriasDesdeNombres(producto.categorias ?? []);
    this.idCategoriasOriginal.set(idsCategorias);
    const precios = this.crearPreciosDesdeRespuesta(producto);
    this.preciosOriginal.set(precios);
    this.precios.set(precios);
    this.sincronizarCategoriasConIds(idsCategorias);
  }

  // Copia las imágenes del producto a las señales locales y a los valores originales
  private actualizarImagenesProducto(producto: ProductoDetalleApi) {
    const imgs = producto.imagenes;
    if (!imgs) return;
    const portada = imgs.square ?? '';
    const banner = imgs.rectangular ?? '';
    this.imagenPortada.set(portada);
    this.imagenBanner.set(banner);
    this.imagenPortadaOriginal.set(portada);
    this.imagenBannerOriginal.set(banner);
  }

  // Genera los campos adicionales que vienen desde Vemper
  private crearCamposAdicionales(producto: ProductoDetalleApi): CampoAdicional[] {
    return (producto.camposDinamicos ?? []).map((cd, idx) => ({
      id: cd.handle || `campo-${idx}`,
      etiqueta: cd.etiqueta,
      identificador: cd.handle,
      tipo: (cd.tipo === 'numero' ? 'numero' : 'texto') as 'texto' | 'numero',
      requerido: cd.requerido,
    }));
  }

  // Convierte los nombres de categorías del API a los ids locales
  private obtenerIdsCategoriasDesdeNombres(nombres: string[]): number[] {
    return nombres
      .map((nombre) => this.categorias().find((c) => c.nombre === nombre)?.id)
      .filter((id): id is string => id != null)
      .map(Number);
  }

  // Marca las categorías que pertenecen al producto cargado
  private sincronizarCategoriasConIds(idsSeleccionados: number[]) {
    this.categorias.update((cats) =>
      cats.map((c) => ({
        ...c,
        seleccionada: idsSeleccionados.includes(Number(c.id)),
      })),
    );
  }

  // Construye el array de campos dinámicos para el API: tipo, orden, handle, etiqueta, requerido
  private construirCamposDinamicosParaApi(): CampoDinamicoCuerpo[] {
    return this.camposAdicionales().map((c, orden) => ({
      tipo: c.tipo === 'numero' ? 'numero' : 'text',
      orden,
      handle: c.identificador,
      etiqueta: c.etiqueta,
      requerido: c.requerido,
    }));
  }

  // Convierte los precios del API al modelo interno
  private crearPreciosDesdeRespuesta(producto: ProductoDetalleApi): Precio[] {
    return (producto.precios ?? []).map((pr, indice) => ({
      id: String(pr.id_precio),
      id_precio: pr.id_precio,
      nombre: pr.nombre,
      precioBase: Number(pr.precioBase),
      margenClienteFinal: Number(pr.margenCliente),
      margenRevendedor: Number(pr.margenRevendedor),
      margenMayorista: Number(pr.margenMayorista),
      porcentajeDescuento: 0,
      soloClienteFinal: false,
      precioActivo: pr.estado === 'activo',
      stock: pr.stock ?? undefined,
      orden: indice,
    }));
  }

  // Determina si el producto proviene de Vemper según los campos recibidos
  private esProductoVemper(producto: ProductoDetalleApi): boolean {
    return !!(producto.idVemper != null && producto.idVemper !== '');
  }

  // Maneja la subida de imágenes y sincroniza el resultado con las señales locales
  manejarSubirImagen(tipo: 'portada' | 'banner', event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      this.notificacion.error('Solo se permiten archivos de imagen');
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      this.notificacion.error('La imagen no debe superar 10MB');
      return;
    }
    if (tipo === 'portada') this.subiendoPortada.set(true);
    else this.subiendoBanner.set(true);
    this.notificacion.info('Subiendo imagen...');
    this.cloudinaryApi.subirImagen(archivo).subscribe({
      next: (url) => {
        if (tipo === 'portada') this.subiendoPortada.set(false);
        else this.subiendoBanner.set(false);
        if (!url) {
          this.notificacion.error('Error al subir la imagen');
          return;
        }
        if (tipo === 'portada') this.imagenPortada.set(url);
        else this.imagenBanner.set(url);
        this.notificacion.exito('Imagen subida correctamente');
      },
      error: () => {
        if (tipo === 'portada') this.subiendoPortada.set(false);
        else this.subiendoBanner.set(false);
        this.notificacion.error('Error al subir la imagen');
      },
    });
    input.value = '';
  }

  // Elimina la imagen almacenada según el tipo elegido
  quitarImagen(tipo: 'portada' | 'banner') {
    if (tipo === 'portada') this.imagenPortada.set('');
    else this.imagenBanner.set('');
  }

  // Navega de regreso a la lista de productos
  volver() {
    this.router.navigate(['/admin/catalogo/productos']);
  }

  // Pide confirmación y elimina el producto actual
  confirmarEliminarProducto() {
    const handle = this.handleProducto();
    if (!handle) return;
    const confirmar = window.confirm(
      '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
    );
    if (!confirmar) return;
    this.guardando.set(true);
    this.productosApi.eliminar(handle).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res?.exito) {
          this.notificacion.exito('Producto eliminado');
          this.router.navigate(['/admin/catalogo/productos']);
        } else {
          this.notificacion.error(res?.mensaje ?? 'No se pudo eliminar el producto');
        }
      },
      error: () => {
        this.guardando.set(false);
        this.notificacion.error('No se pudo eliminar el producto');
      },
    });
  }

  // Restaura los valores originales del formulario y notifica al usuario
  cancelarCambios() {
    this.titulo.set(this.tituloOriginal());
    this.descripcion.set(this.descripcionOriginal());
    this.instrucciones.set(this.instruccionesOriginal());
    this.terminos.set(this.terminosOriginal());
    this.estadoProducto.set(this.estadoOriginal());
    this.imagenPortada.set(this.imagenPortadaOriginal());
    this.imagenBanner.set(this.imagenBannerOriginal());
    if (this.tieneCodigoVemper()) {
      this.sincronizacionAutomatica.set(this.sincronizacionAutomaticaOriginal());
    }
    this.precios.set([...this.preciosOriginal()]);
    const idsO = this.idCategoriasOriginal();
    this.categorias.update((cats) =>
      cats.map((c) => ({
        ...c,
        seleccionada: idsO.includes(Number(c.id)),
      })),
    );
    this.notificacion.info('Cambios descartados');
  }

  // Ejecuta la lógica de guardado diferenciando entre creación y edición
  ejecutarGuardar() {
    if (!this.puedeGuardar()) {
      this.notificacion.advertencia('Completa título, al menos una categoría y al menos un precio');
      return;
    }
    // PASO 1: Preparamos los datos base del formulario
    this.guardando.set(true);
    const titulo = this.titulo().trim();
    const descripcion = this.descripcion().trim();
    const comoCanjear = this.instrucciones().trim();
    const terminosCondiciones = this.terminos().trim();
    const idCategorias = this.idsCategoriasSeleccionadas();
    const preciosForm = this.precios();
    const estado = this.estadoProducto();

    // PASO 2: Armamos el objeto de imágenes (square, rectangular, smallSquare) sin alt
    const portada = this.imagenPortada() || '';
    const banner = this.imagenBanner() || '';
    const imagenes =
      portada || banner
        ? { square: portada, rectangular: banner, smallSquare: portada }
        : undefined;

    if (this.esEdicion()) {
      // PASO 3: Convertimos los precios existentes o nuevos para el API de actualización
      const handle = this.handleProducto()!;
      const precios: ActualizarProductoCuerpo['precios'] = preciosForm.map((p, orden) =>
        p.id_precio != null
          ? {
              id_precio: p.id_precio,
              nombre: p.nombre,
              precioBase: p.precioBase,
              stock: p.stock ?? 0,
              estado: p.precioActivo ? 'activo' : 'inactivo',
              orden,
            }
          : {
              nombre: p.nombre,
              handle: this.generarIdentificador(p.nombre),
              precioBase: p.precioBase,
              margenCliente: p.margenClienteFinal,
              margenRevendedor: p.margenRevendedor,
              margenMayorista: p.margenMayorista,
              stock: p.stock ?? 0,
              orden,
              estado: p.precioActivo ? 'activo' : 'inactivo',
            },
      );

      const camposDinamicos = this.construirCamposDinamicosParaApi();

      // Determina el tipo de proceso basado en el checkbox
      const tipoProceso = this.procesoManual() ? 'manual' : 'automatico';

      // PASO 4: Llamamos al API de actualización y manejamos la respuesta
      this.productosApi
        .actualizarPorHandle(handle, {
          titulo,
          descripcion: descripcion || undefined,
          comoCanjear: comoCanjear || undefined,
          terminosCondiciones: terminosCondiciones || undefined,
          idCategorias,
          estado,
          tipoProceso,
          precios,
          imagenes,
          camposDinamicos: camposDinamicos.length ? camposDinamicos : undefined,
        })
        .subscribe({
          next: (res) => {
            this.guardando.set(false);
            if (res?.exito && res.datos) {
              this.tituloOriginal.set(res.datos.titulo);
              this.descripcionOriginal.set(res.datos.descripcion ?? '');
              this.instruccionesOriginal.set(res.datos.comoCanjear ?? '');
              this.terminosOriginal.set(res.datos.terminosCondiciones ?? '');
              this.estadoOriginal.set(this.estadoProducto());
              this.imagenPortadaOriginal.set(this.imagenPortada());
              this.imagenBannerOriginal.set(this.imagenBanner());
              this.sincronizacionAutomaticaOriginal.set(this.sincronizacionAutomatica());
              this.idCategoriasOriginal.set(this.idsCategoriasSeleccionadas());
              this.preciosOriginal.set(this.precios().map((p) => ({ ...p })));
              this.handleProducto.set(res.datos.handle);
              this.notificacion.exito('Producto actualizado');
            }
          },
          error: () => {
            this.guardando.set(false);
            this.notificacion.error('No se pudo actualizar el producto');
          },
        });
    } else {
      // PASO 3: Construimos los precios para el API de creación (orden = índice, respeta drag)
      const precios: CrearProductoCuerpo['precios'] = preciosForm.map((p, orden) => ({
        nombre: p.nombre,
        handle: this.generarIdentificador(p.nombre),
        precioBase: p.precioBase,
        margenCliente: p.margenClienteFinal,
        margenRevendedor: p.margenRevendedor,
        margenMayorista: p.margenMayorista,
        stock: p.stock ?? 0,
        orden,
        estado: p.precioActivo ? 'activo' : 'inactivo',
      }));

      const camposDinamicos = this.construirCamposDinamicosParaApi();

      // Determina el tipo de proceso basado en el checkbox
      const tipoProceso = this.procesoManual() ? 'manual' : 'automatico';

      // PASO 4: Invocamos la creación y notificamos el resultado
      this.productosApi
        .crear({
          titulo,
          descripcion: descripcion || undefined,
          comoCanjear: comoCanjear || undefined,
          terminosCondiciones: terminosCondiciones || undefined,
          estado,
          tipoProceso,
          precios,
          idCategorias,
          imagenes,
          camposDinamicos: camposDinamicos.length ? camposDinamicos : undefined,
        })
        .subscribe({
          next: (res) => {
            this.guardando.set(false);
            if (res?.exito) {
              this.notificacion.exito('Producto creado');
              this.router.navigate(['/admin/catalogo/productos']);
            }
          },
          error: () => {
            this.guardando.set(false);
            this.notificacion.error('No se pudo crear el producto');
          },
        });
    }
  }

  // Cambia el estado seleccionado de una categoría puntual
  toggleCategoria(categoria: Categoria) {
    this.categorias.update((cats) =>
      cats.map((cat) =>
        cat.id === categoria.id ? { ...cat, seleccionada: !cat.seleccionada } : cat,
      ),
    );
  }

  // Quita una categoría del conjunto seleccionado
  eliminarCategoria(categoria: Categoria) {
    this.categorias.update((cats) =>
      cats.map((cat) => (cat.id === categoria.id ? { ...cat, seleccionada: false } : cat)),
    );
  }

  // Prepara los valores para crear un nuevo campo adicional
  abrirModalAgregarCampo() {
    this.campoAdicionalEditando.set(null);
    this.etiquetaCampo.set('');
    this.tipoCampoSeleccionado.set('texto');
    this.campoRequerido.set(true);
    this.modalTipoCampoAbierto.set(true);
  }

  // Rellena el modal con los datos del campo que se quiere editar
  abrirModalEditarCampo(campo: CampoAdicional) {
    this.campoAdicionalEditando.set(campo);
    this.etiquetaCampo.set(campo.etiqueta);
    this.tipoCampoSeleccionado.set(campo.tipo);
    this.campoRequerido.set(campo.requerido);
    this.modalTipoCampoAbierto.set(true);
  }

  // Cierra el modal de campos adicionales
  cerrarModalTipoCampo() {
    this.modalTipoCampoAbierto.set(false);
  }

  // Convierte una etiqueta a un identificador simple sin acentos
  generarIdentificador(etiqueta: string): string {
    return etiqueta
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Valida y guarda un campo adicional nuevo o editado
  guardarCampoAdicional() {
    const etiqueta = this.etiquetaCampo().trim();
    if (!etiqueta) {
      alert('Debes ingresar una etiqueta para el campo');
      return;
    }

    const identificador = this.generarIdentificador(etiqueta);

    const nuevoCampo: CampoAdicional = {
      id: Date.now().toString(),
      etiqueta,
      identificador,
      tipo: this.tipoCampoSeleccionado(),
      requerido: this.campoRequerido(),
    };

    if (this.campoAdicionalEditando()) {
      this.camposAdicionales.update((campos) =>
        campos.map((campo) =>
          campo.id === this.campoAdicionalEditando()!.id ? { ...nuevoCampo, id: campo.id } : campo,
        ),
      );
    } else {
      this.camposAdicionales.update((campos) => [...campos, nuevoCampo]);
    }

    this.cerrarModalTipoCampo();
  }

  // Elimina un campo adicional por su identificador
  eliminarCampoAdicional(campoId: string) {
    this.camposAdicionales.update((campos) => campos.filter((campo) => campo.id !== campoId));
  }

  // Inicializa el modal para registrar un nuevo precio
  abrirModalAgregarPrecio() {
    this.precioEditando.set(null);
    this.nombrePrecio.set('');
    this.precioBase.set(0);
    this.porcentajeDescuento.set(0);
    this.margenClienteFinal.set(0);
    this.margenRevendedor.set(0);
    this.margenMayorista.set(0);
    this.soloClienteFinal.set(false);
    this.precioActivo.set(true);
    this.modalPrecioAbierto.set(true);
  }

  // Carga la información de un precio para editarlo
  abrirModalEditarPrecio(precio: Precio) {
    this.precioEditando.set(precio);
    this.nombrePrecio.set(precio.nombre);
    this.precioBase.set(precio.precioBase);
    this.porcentajeDescuento.set(0);
    this.margenClienteFinal.set(precio.margenClienteFinal);
    this.margenRevendedor.set(precio.margenRevendedor);
    this.margenMayorista.set(0);
    this.soloClienteFinal.set(false);
    this.precioActivo.set(precio.precioActivo);
    this.modalPrecioAbierto.set(true);
  }

  // Cierra el modal de precios
  cerrarModalPrecio() {
    this.modalPrecioAbierto.set(false);
  }

  // Valida y guarda un precio nuevo o editado
  guardarPrecio() {
    const nombre = this.nombrePrecio().trim();
    if (!nombre) {
      alert('Debes ingresar un nombre para el precio');
      return;
    }

    if (this.precioBase() <= 0) {
      alert('El precio base debe ser mayor a 0');
      return;
    }

    const nuevoPrecio: Precio = {
      id: this.precioEditando()?.id ?? Date.now().toString(),
      id_precio: this.precioEditando()?.id_precio,
      nombre,
      precioBase: this.precioBase(),
      margenClienteFinal: this.margenClienteFinal(),
      margenRevendedor: this.margenRevendedor(),
      margenMayorista: 0,
      porcentajeDescuento: 0,
      soloClienteFinal: false,
      precioActivo: this.precioActivo(),
      orden: this.precios().length,
    };

    if (this.precioEditando()) {
      this.precios.update((precios) =>
        precios.map((precio) =>
          precio.id === this.precioEditando()!.id ? { ...nuevoPrecio, id: precio.id } : precio,
        ),
      );
    } else {
      this.precios.update((precios) => [...precios, nuevoPrecio]);
    }

    this.cerrarModalPrecio();
  }

  // Quita un precio de la lista del formulario
  eliminarPrecio(precioId: string) {
    this.precios.update((precios) => precios.filter((precio) => precio.id !== precioId));
  }

  // Inicia el arrastre de un campo adicional para reordenarlo
  iniciarArrastreCampo(event: DragEvent, campoId: string, indice: number) {
    this.elementoArrastrando.set(campoId);
    this.tipoArrastrando.set('campo');
    this.indiceArrastrando.set(indice);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', campoId);
    }
  }

  // Habilita que el contenedor reciba el campo arrastrado
  permitirSoltarCampo(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Inserta el campo arrastrado en la posición destino
  soltarCampo(event: DragEvent, indiceDestino: number) {
    event.preventDefault();
    event.stopPropagation();

    const indiceOrigen = this.indiceArrastrando();
    if (indiceOrigen === null || this.tipoArrastrando() !== 'campo') return;

    if (indiceOrigen === indiceDestino) {
      this.limpiarArrastre();
      return;
    }

    this.camposAdicionales.update((campos) => {
      const nuevoArray = [...campos];
      const [elementoMovido] = nuevoArray.splice(indiceOrigen, 1);
      nuevoArray.splice(indiceDestino, 0, elementoMovido);
      return nuevoArray;
    });

    this.limpiarArrastre();
  }

  // Inicia el arrastre de un precio para cambiar su orden
  iniciarArrastrePrecio(event: DragEvent, precioId: string, indice: number) {
    this.elementoArrastrando.set(precioId);
    this.tipoArrastrando.set('precio');
    this.indiceArrastrando.set(indice);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', precioId);
    }
  }

  // Permite que el contenedor acepte el precio arrastrado
  permitirSoltarPrecio(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Ubica el precio arrastrado en el lugar deseado
  soltarPrecio(event: DragEvent, indiceDestino: number) {
    event.preventDefault();
    event.stopPropagation();

    const indiceOrigen = this.indiceArrastrando();
    if (indiceOrigen === null || this.tipoArrastrando() !== 'precio') return;

    if (indiceOrigen === indiceDestino) {
      this.limpiarArrastre();
      return;
    }

    this.precios.update((precios) => {
      const nuevoArray = [...precios];
      const [elementoMovido] = nuevoArray.splice(indiceOrigen, 1);
      nuevoArray.splice(indiceDestino, 0, elementoMovido);
      return nuevoArray;
    });

    this.limpiarArrastre();
  }

  // Reinicia el estado del drag and drop
  limpiarArrastre() {
    this.elementoArrastrando.set(null);
    this.tipoArrastrando.set(null);
    this.indiceArrastrando.set(null);
  }

  // Indica si un campo específico se está arrastrando
  estaArrastrando(campoId: string): boolean {
    return this.elementoArrastrando() === campoId;
  }

  // Indica si un precio específico se está arrastrando
  estaArrastrandoPrecio(precioId: string): boolean {
    return this.elementoArrastrando() === precioId;
  }
}
