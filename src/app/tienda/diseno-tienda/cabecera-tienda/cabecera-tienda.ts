import { Component, computed, HostListener, inject, OnInit, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoServicio } from '../../../compartido/servicios/carrito.servicio';
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

interface Categoria {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-cabecera-tienda',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cabecera-tienda.html',
  styleUrl: './cabecera-tienda.css',
})
export class CabeceraTienda implements OnInit {
  // Servicios
  private carritoServicio = inject(CarritoServicio);
  private sesion = inject(Sesion);

  // Outputs para comunicar con el layout
  abrirModal = output<void>();
  abrirCarrito = output<void>();

  // Cantidad de items en el carrito
  cantidadItemsCarrito = this.carritoServicio.cantidadItems;

  // FASE 1: Estado de autenticación
  usuarioActual = this.sesion.usuarioActual;
  estaLogueado = this.sesion.estaLogueado;

  // Lógica de scroll
  barraVisible = signal(true);
  blurActivo = signal(false);
  paddingTopBarra = signal('var(--espaciado-xxs)');

  // Idiomas
  readonly idiomas: Idioma[] = [
    { codigo: 'es', etiqueta: 'ES' },
    { codigo: 'en', etiqueta: 'EN' },
  ];
  idiomaActivo = signal<string>('es');

  // Países
  readonly paises: Pais[] = [
    { codigo: 'mx', nombre: 'México', bandera: '/imagenes/mexico.png' },
    { codigo: 'ar', nombre: 'Argentina', bandera: '/imagenes/argentina.png' },
    { codigo: 'co', nombre: 'Colombia', bandera: '/imagenes/colombia.png' },
    { codigo: 'pe', nombre: 'Perú', bandera: '/imagenes/peru.png' },
    { codigo: 'cl', nombre: 'Chile', bandera: '/imagenes/chile.png' },
    { codigo: 'ec', nombre: 'Ecuador', bandera: '/imagenes/ecuador.png' },
    { codigo: 've', nombre: 'Venezuela', bandera: '/imagenes/venezuela.png' },
    { codigo: 'bo', nombre: 'Bolivia', bandera: '/imagenes/bolivia.png' },
    { codigo: 'gt', nombre: 'Guatemala', bandera: '/imagenes/guatemala.png' },
    { codigo: 'br', nombre: 'Brasil', bandera: '/imagenes/brasil.png' },
  ];
  paisActivo = signal<string>('mx');

  // Categorías
  readonly categorias: Categoria[] = [
    { id: '1', nombre: 'Categorías' },
    { id: '2', nombre: 'Ofertas' },
    { id: '3', nombre: 'Nuevos' },
  ];

  readonly promoTexto = '¡RECARGA INSTANTÁNEA! ¡JUEGO INSTANTÁNEO!';

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
}
