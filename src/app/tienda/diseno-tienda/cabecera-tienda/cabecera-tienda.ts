import { Component, computed, HostListener, inject, OnInit, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SeccionEncabezado } from '../../../compartido/modelos/configuracion.modelo';
import { CarritoServicio } from '../../../compartido/servicios/carrito.servicio';
import { ConfiguracionServicio } from '../../../compartido/servicios/configuracion.servicio';
import { Sesion } from '../../../nucleo/servicios/sesion';

interface Idioma {
  codigo: string;
  etiqueta: string;
}

interface Pais {
  codigo: string;
  nombre: string;
  bandera: string;
}

interface ItemBusqueda {
  id: string;
  imagen: string;
  titulo: string;
  categoria: string;
}

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

  abrirModal = output<void>();
  abrirCarrito = output<void>();

  cantidadItemsCarrito = this.carritoServicio.cantidadItems;
  usuarioActual = this.sesion.usuarioActual;
  estaLogeado = this.sesion.estaLogueado;

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
  readonly resultadosBusqueda: ItemBusqueda[] = [
    { id: '1', imagen: '/imagenes/juego1.png', titulo: 'Pines Free Fire 1200 Diamantes', categoria: 'Juegos' },
    { id: '2', imagen: '/imagenes/juego2.png', titulo: 'Diamantes Mobile Legends 500', categoria: 'Juegos' },
    { id: '3', imagen: '/imagenes/juego3.png', titulo: 'Netflix Premium 3 Meses', categoria: 'Streaming' },
    { id: '4', imagen: '/imagenes/juego4.png', titulo: 'Spotify Premium 6 Meses', categoria: 'Streaming' },
  ];
  menuUsuarioAbierto = signal(false);

  ngOnInit() {
    this.manejarScroll();
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
