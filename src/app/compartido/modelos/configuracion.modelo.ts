// Interfaz General
export interface ConfGeneral {
  encabezado?: ConfEncabezado;
  carrusel?: ConfCarrusel;
  promocion?: ConfPromocion;
  categoria?: ConfCategorias;
  categoriasMarketing?: { categorias: CategoriaMarketing[] };
  destacados?: { titulo: string; items: ItemDestacado[] };
  pieDePagina?: ConfPieDePagina;
}

// Alias para compatibilidad con componentes
export type ConfiguracionGlobal = ConfGeneral;
export type ConfiguracionEncabezado = ConfEncabezado;
export type ConfiguracionCarrusel = ConfCarrusel;
export type ConfiguracionPromocion = ConfPromocion;
export interface ConfiguracionPie {
  logoUrl: string;
  redesSociales: RedSocial[];
  secciones: SeccionPie[];
}

// ConfiguracionPie es compatible con ConfPieDePagina para lectura; el admin escribe SeccionPie[]
export type ConfiguracionCategoriasMarketing = { categorias: CategoriaMarketing[] };
export interface ConfiguracionDestacados {
  titulo: string;
  items: ItemDestacado[];
}
export type TipoDestinoCarrusel = 'ninguno' | 'producto' | 'categoria';
export type ProductoCategoriaMarketing = ProductoDestacado;
export type RedSocialPie = RedSocial;

export interface ItemDestacado {
  handle: string;
  titulo: string;
  imagen: string;
}

export interface CategoriaConfiguracion {
  id: string;
  handle: string;
  titulo: string;
}

export type TipoOpcionPie = 'enlace' | 'telefono' | 'correo';

export interface OpcionSeccionPie {
  id: string;
  tipo: TipoOpcionPie;
  etiqueta: string;
  path: string;
  numero?: string;
  correo?: string;
}

export interface SeccionPie {
  id: string;
  titulo: string;
  descripcion: string;
  opciones: OpcionSeccionPie[];
}

// Interfaz de la configuracion del Encabezado
export interface ConfEncabezado {
  tituloPromocion?: string;
  logoUrl?: string;
  secciones?: SeccionEncabezado[];
}

export interface SeccionEncabezado {
  id: string;
  tituloBase: string;
  esDinamico: boolean;
  categorias?: CategoriaRef[];
  redireccionCategoria?: CategoriaRef;
}

export interface CategoriaRef {
  handle: string;
  titulo: string;
}

export function handleATitulo(handle: string): string {
  return handle
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

// Interfaz de la configuracion del Carrusel
export interface ConfCarrusel {
  slides: SlideCarrusel[];
}

export interface SlideCarrusel {
  id: string;
  imagenMovil: string;
  imagenDesktop: string;
  tipoDestino: string; // 'ninguno' | 'producto' | 'categoria'
  destinoHandle?: string;
}

// Interfaz de la configuracion de la Promocion
export interface ConfPromocion {
  titulo: string;
  items: ItemPromocion[];
}

export interface ItemPromocion {
  handle: string;
  titulo: string;
  imagen: string;
}

// Interfaz de la configuracion de las Categorias
export interface ConfCategorias {
  categorias: CategoriaDestacada[];
}

export interface CategoriaDestacada {
  handle: string;
  titulo: string;
  productos?: ProductoDestacado[];
  productosOrdenados?: ProductoDestacado[];
}

// Alias para categorias marketing (admin)
export interface CategoriaMarketing {
  handle: string;
  titulo: string;
  productos?: ProductoDestacado[];
  productosOrdenados?: ProductoDestacado[];
}

export interface ProductoDestacado {
  handle: string;
  titulo: string;
  imagen: string;
  descripcion: string;
  precioId: string;
  fechaCreacion: string;
  nombrePrecio: string;
  precioBase: number;
  precioOferta: number | null;
  usarPrecioOferta: boolean;
}

// Interfaz de la configuracion del Pie de Pagina
export interface ConfPieDePagina {
  logoUrl: string;
  redesSociales: RedSocial[];
  secciones: SeccionPieDePagina[];
}

export interface RedSocial {
  id: string;
  url: string;
}

export interface SeccionPieDePagina {
  id: string;
  titulo: string;
  descripcion: string;
  opciones: OpcionPieDePagina[];
}

export interface OpcionPieDePagina {
  id: string;
  tipo: string;
  etiqueta: string;
  path: string;
}
