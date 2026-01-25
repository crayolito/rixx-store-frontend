import { Component, signal } from '@angular/core';
import { SeccionCarrusel } from '../../secciones-dinamicas/componentes/seccion-carrusel/seccion-carrusel';
import { SeccionProductosCategoria } from '../../secciones-dinamicas/componentes/seccion-productos-categoria/seccion-productos-categoria';
import { SeccionProductosOferta } from '../../secciones-dinamicas/componentes/seccion-productos-oferta/seccion-productos-oferta';

interface SlideCarrusel {
  id: string;
  src: string;
  alt: string;
}

interface Producto {
  id: string;
  imagen: string;
  titulo: string;
}

interface ProductoCategoria {
  id: string;
  imagen: string;
  etiqueta: 'Nuevo' | 'Oferta' | null;
  titulo: string;
  descripcion: string;
  precioBase: number;
  precioOferta: number | null;
  porcentajeDescuento: number | null;
}

@Component({
  selector: 'app-inicio-pagina',
  standalone: true,
  imports: [SeccionCarrusel, SeccionProductosOferta, SeccionProductosCategoria],
  templateUrl: './inicio-pagina.html',
  styleUrl: './inicio-pagina.css',
})
export class InicioPagina {
  // Datos del carrusel
  readonly slides = signal<SlideCarrusel[]>([
    { id: '1', src: '/imagenes/banner-juego1.jpg', alt: 'Banner juego 1' },
    { id: '2', src: '/imagenes/banner-juego2.png', alt: 'Banner juego 2' },
    { id: '3', src: '/imagenes/banner-juego3.jpg', alt: 'Banner juego 3' },
    { id: '4', src: '/imagenes/banner-juego4.jpg', alt: 'Banner juego 4' },
    { id: '5', src: '/imagenes/banner-juego5.png', alt: 'Banner juego 5' },
  ]);

  // Datos de productos en oferta
  readonly productosOferta = signal<Producto[]>([
    { id: '1', imagen: '/imagenes/juego1.png', titulo: 'PUBG MOBILE (Global)' },
    { id: '2', imagen: '/imagenes/juego2.png', titulo: 'Call of Duty Mobile' },
    { id: '3', imagen: '/imagenes/juego3.png', titulo: 'Genshin Impact' },
    { id: '4', imagen: '/imagenes/juego4.png', titulo: 'Free Fire MAX' },
    { id: '5', imagen: '/imagenes/juego5.png', titulo: 'Apex Legends Mobile' },
    { id: '6', imagen: '/imagenes/juego6.png', titulo: 'Clash Royale' },
    { id: '7', imagen: '/imagenes/juego7.png', titulo: 'Mobile Legends' },
    { id: '8', imagen: '/imagenes/juego8.png', titulo: 'Brawl Stars' },
    { id: '9', imagen: '/imagenes/juego9.png', titulo: 'Fortnite Mobile' },
    { id: '10', imagen: '/imagenes/juego10.png', titulo: 'League of Legends' },
    { id: '11', imagen: '/imagenes/juego11.png', titulo: 'Valorant' },
    { id: '12', imagen: '/imagenes/juego12.png', titulo: 'Overwatch 2' },
  ]);

  // Datos de productos destacados
  readonly productosDestacados = signal<ProductoCategoria[]>([
    {
      id: '1',
      imagen: '/imagenes/juego1.png',
      etiqueta: 'Nuevo',
      titulo: 'PUBG MOBILE (Global)',
      descripcion: 'Battle Royale épico con gráficos impresionantes y acción sin límites',
      precioBase: 299,
      precioOferta: 284,
      porcentajeDescuento: 5
    },
    {
      id: '2',
      imagen: '/imagenes/juego2.png',
      etiqueta: 'Oferta',
      titulo: 'Call of Duty Mobile',
      descripcion: 'Experiencia de combate táctico con modos multijugador intensos',
      precioBase: 350,
      precioOferta: 332,
      porcentajeDescuento: 5
    },
    {
      id: '3',
      imagen: '/imagenes/juego3.png',
      etiqueta: null,
      titulo: 'Genshin Impact',
      descripcion: 'Aventura de mundo abierto con elementos RPG y combate dinámico',
      precioBase: 250,
      precioOferta: null,
      porcentajeDescuento: null
    },
    {
      id: '4',
      imagen: '/imagenes/juego4.png',
      etiqueta: 'Oferta',
      titulo: 'Free Fire MAX',
      descripcion: 'Battle Royale rápido con gráficos mejorados y jugabilidad fluida',
      precioBase: 280,
      precioOferta: 266,
      porcentajeDescuento: 5
    },
    {
      id: '5',
      imagen: '/imagenes/juego5.png',
      etiqueta: 'Nuevo',
      titulo: 'Apex Legends Mobile',
      descripcion: 'Hero shooter con habilidades únicas y mapas estratégicos',
      precioBase: 320,
      precioOferta: 304,
      porcentajeDescuento: 5
    },
    {
      id: '6',
      imagen: '/imagenes/juego6.png',
      etiqueta: null,
      titulo: 'Clash Royale',
      descripcion: 'Estrategia en tiempo real con cartas y batallas épicas',
      precioBase: 200,
      precioOferta: null,
      porcentajeDescuento: null
    }
  ]);

  // Datos de nuevos lanzamientos (mismos datos por ahora)
  readonly productosNuevos = signal<ProductoCategoria[]>([
    {
      id: '7',
      imagen: '/imagenes/juego7.png',
      etiqueta: 'Nuevo',
      titulo: 'Mobile Legends',
      descripcion: 'MOBA competitivo con héroes únicos y combates 5v5',
      precioBase: 280,
      precioOferta: 266,
      porcentajeDescuento: 5
    },
    {
      id: '8',
      imagen: '/imagenes/juego8.png',
      etiqueta: 'Oferta',
      titulo: 'Brawl Stars',
      descripcion: 'Acción multijugador con personajes carismáticos',
      precioBase: 220,
      precioOferta: 209,
      porcentajeDescuento: 5
    },
    {
      id: '9',
      imagen: '/imagenes/juego9.png',
      etiqueta: null,
      titulo: 'Fortnite Mobile',
      descripcion: 'Battle Royale con construcción y eventos en vivo',
      precioBase: 300,
      precioOferta: null,
      porcentajeDescuento: null
    },
    {
      id: '10',
      imagen: '/imagenes/juego10.png',
      etiqueta: 'Nuevo',
      titulo: 'League of Legends',
      descripcion: 'El MOBA más popular del mundo ahora en móvil',
      precioBase: 350,
      precioOferta: 332,
      porcentajeDescuento: 5
    },
    {
      id: '11',
      imagen: '/imagenes/juego11.png',
      etiqueta: 'Oferta',
      titulo: 'Valorant',
      descripcion: 'FPS táctico con agentes y habilidades únicas',
      precioBase: 400,
      precioOferta: 380,
      porcentajeDescuento: 5
    },
    {
      id: '12',
      imagen: '/imagenes/juego12.png',
      etiqueta: null,
      titulo: 'Overwatch 2',
      descripcion: 'Hero shooter con trabajo en equipo y estrategia',
      precioBase: 380,
      precioOferta: null,
      porcentajeDescuento: null
    }
  ]);
}
