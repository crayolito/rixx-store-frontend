import { Component, computed, HostListener, inject, OnInit, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { SeccionEncabezado } from '../../../compartido/modelos/configuracion.modelo';
import { CarritoServicio } from '../../../compartido/servicios/carrito.servicio';
import { ConfiguracionServicio } from '../../../compartido/servicios/configuracion.servicio';
import { Sesion } from '../../../nucleo/servicios/sesion';
import { ProductosApiServicio } from '../../../nucleo/servicios/productos-api.servicio';

interface Idioma {
  codigo: string;
  etiqueta: string;
}

interface Pais {
  codigo: string;
  nombre: string;
  bandera: string;
}

export interface ItemBusqueda {
  id: string;
  imagen: string;
  titulo: string;
  categoria: string;
}

const LIMITE_RESULTADOS_BUSQUEDA = 6;
const IMAGEN_POR_DEFECTO = '/imagenes/imagen-nodisponible.jpg';

@Component({
  selector: 'app-cabecera-tienda',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cabecera-tienda.html',
  styleUrl: './cabecera-tienda.css',
})
export class CabeceraTienda implements OnInit {
  private carritoServicio = inject(CarritoServicio);
  private sesion = inject(Sesion);
  private router = inject(Router);
  private configuracion = inject(ConfiguracionServicio);
  private productosApi = inject(ProductosApiServicio);

  private busquedaInput$ = new Subject<string>();

  abrirModal = output<void>();
  abrirCarrito = output<void>();

  cantidadItemsCarrito = this.carritoServicio.cantidadItems;
  usuarioActual = this.sesion.usuarioActual;
  estaLogeado = this.sesion.estaLogueado;
  nombreCorto = computed(() => {
    const n = this.usuarioActual()?.nombre?.trim();
    if (!n) return '';
    const palabras = n.split(/\s+/);
    return palabras.length > 1 ? palabras[0] + ' ' + palabras[1].charAt(0) + '.' : n;
  });

  dropdownCategoriaAbierto = signal<string | null>(null);
  barraVisible = signal(true);
  blurActivo = signal(false);
  paddingTopBarra = signal('var(--espaciado-xxs)');

  readonly idiomas: Idioma[] = [
    { codigo: 'es', etiqueta: 'ES' },
    { codigo: 'en', etiqueta: 'EN' },
  ];
  idiomaActivo = signal<string>('es');

  readonly paises: Pais[] = [
    { codigo: 'bo', nombre: 'Bolivia', bandera: '/imagenes/bolivia.png' },
    { codigo: 'mx', nombre: 'México', bandera: '/imagenes/mexico.png' },
    { codigo: 'ar', nombre: 'Argentina', bandera: '/imagenes/argentina.png' },
    { codigo: 'co', nombre: 'Colombia', bandera: '/imagenes/colombia.png' },
    { codigo: 'pe', nombre: 'Perú', bandera: '/imagenes/peru.png' },
    { codigo: 'cl', nombre: 'Chile', bandera: '/imagenes/chile.png' },
    { codigo: 'ec', nombre: 'Ecuador', bandera: '/imagenes/ecuador.png' },
    { codigo: 've', nombre: 'Venezuela', bandera: '/imagenes/venezuela.png' },
    { codigo: 'gt', nombre: 'Guatemala', bandera: '/imagenes/guatemala.png' },
    { codigo: 'br', nombre: 'Brasil', bandera: '/imagenes/brasil.png' },
  ];
  paisActivo = signal<string>('bo');

  readonly encabezado = this.configuracion.encabezadoActual;
  promoTexto = computed(() => this.encabezado()?.tituloPromocion ?? '');
  seccionesNav = computed((): SeccionEncabezado[] => {
    const enc = this.encabezado();
    if (!enc?.secciones?.length) {
      return [];
    }
    return enc.secciones.filter((s) => {
      if (s.esDinamico) return !!s.categorias?.length;
      return !!s.redireccionCategoria?.handle;
    });
  });
  logoUrl = computed(() => this.encabezado()?.logoUrl ?? '/logo.png');

  textoBusqueda = signal('');
  busquedaDropdownVisible = signal(false);
  resultadosBusqueda = signal<ItemBusqueda[]>([]);
  busquedaCargando = signal(false);
  readonly placeholderBusqueda = 'Buscar productos...';
  menuUsuarioAbierto = signal(false);

  ngOnInit() {
    this.manejarScroll();
    this.busquedaInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) => {
          if (!texto?.trim()) {
            this.resultadosBusqueda.set([]);
            return of([]);
          }
          this.busquedaCargando.set(true);
          return this.productosApi
            .listarParaBusqueda(LIMITE_RESULTADOS_BUSQUEDA, texto.trim())
            .pipe(
              map((productos) =>
                productos.map((p) => ({
                  id: p.handle,
                  imagen:
                    p.imagenes?.smallSquare ??
                    p.imagenes?.square ??
                    p.imagenes?.rectangular ??
                    IMAGEN_POR_DEFECTO,
                  titulo: p.titulo ?? '',
                  categoria: (p.categorias ?? [])[0] ?? '',
                })),
              ),
              catchError(() => of([])),
            );
        }),
      )
      .subscribe((items) => {
        this.resultadosBusqueda.set(items);
        this.busquedaCargando.set(false);
      });
  }

  @HostListener('window:scroll')
  manejarScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > 50) {
      this.barraVisible.set(false);
      this.blurActivo.set(true);
      this.paddingTopBarra.set('var(--espaciado-md)');
    } else {
      this.barraVisible.set(true);
      this.blurActivo.set(false);
      this.paddingTopBarra.set('var(--espaciado-xxs)');
    }
  }

  seleccionarIdioma(codigo: string) {
    this.idiomaActivo.set(codigo);
  }

  seleccionarPais(codigo: string) {
    this.paisActivo.set(codigo);
  }

  paisPorCodigo(codigo: string): Pais | undefined {
    return this.paises.find((p) => p.codigo === codigo);
  }

  emitirAbrirModal() {
    this.abrirModal.emit();
  }

  emitirAbrirCarrito() {
    this.abrirCarrito.emit();
  }

  onBusquedaFocus() {
    this.busquedaDropdownVisible.set(true);
  }

  onBusquedaInput(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.textoBusqueda.set(valor);
    this.busquedaDropdownVisible.set(true);
    this.busquedaInput$.next(valor);
  }

  cerrarBusquedaDropdown() {
    this.busquedaDropdownVisible.set(false);
  }

  seleccionarResultado(item: ItemBusqueda) {
    this.router.navigate(['/producto', item.id]);
    this.cerrarBusquedaDropdown();
    this.textoBusqueda.set('');
  }

  alternarMenuUsuario() {
    this.menuUsuarioAbierto.update((v) => !v);
  }

  cerrarMenuUsuario() {
    this.menuUsuarioAbierto.set(false);
  }

  irAPerfil(seccion?: 'perfil' | 'pedidos' | 'billetera') {
    this.cerrarMenuUsuario();
    if (seccion && seccion !== 'perfil') {
      this.router.navigate(['/perfil'], { queryParams: { seccion } });
    } else {
      this.router.navigate(['/perfil']);
    }
  }

  alternarDropdownCategoria(id: string) {
    this.dropdownCategoriaAbierto.update((actual) => (actual === id ? null : id));
  }

  cerrarDropdownCategoria() {
    this.dropdownCategoriaAbierto.set(null);
  }

  irACategoria(handle: string) {
    this.router.navigate(['/categoria', handle]);
    this.cerrarDropdownCategoria();
  }

  cerrarSesion() {
    this.sesion.cerrarSesion();
    this.cerrarMenuUsuario();
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  cerrarDropdownsAlClickExterior(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.tienda-header__busqueda-contenedor')) {
      this.cerrarBusquedaDropdown();
    }
    if (!target.closest('.tienda-header__usuario-contenedor')) {
      this.cerrarMenuUsuario();
    }
    if (!target.closest('.tienda-header__categoria-dropdown')) {
      this.cerrarDropdownCategoria();
    }
  }
}
