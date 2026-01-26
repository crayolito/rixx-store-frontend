import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Categoria {
  id: string;
  nombre: string;
  cantidadProductos: number;
}

interface ProductoCategoria {
  id: string;
  imagen: string;
  titulo: string;
}

@Component({
  selector: 'app-categoria-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categoria-pagina.html',
  styleUrl: './categoria-pagina.css',
})
export class CategoriaPagina {
  Math = Math;

  categorias = signal<Categoria[]>([
    { id: '1', nombre: 'Battle Royale', cantidadProductos: 24 },
    { id: '2', nombre: 'MOBA', cantidadProductos: 18 },
    { id: '3', nombre: 'FPS', cantidadProductos: 32 },
    { id: '4', nombre: 'RPG', cantidadProductos: 15 },
    { id: '5', nombre: 'Estrategia', cantidadProductos: 21 },
    { id: '6', nombre: 'Deportes', cantidadProductos: 12 },
    { id: '7', nombre: 'Carreras', cantidadProductos: 9 },
  ]);

  categoriaSeleccionada = signal<string>('1');

  productos = signal<ProductoCategoria[]>([
    {
      id: '1',
      imagen: '/imagenes/juego1.png',
      titulo: 'PUBG MOBILE (Global)',
    },
    {
      id: '2',
      imagen: '/imagenes/juego2.png',
      titulo: 'Call of Duty Mobile',
    },
    {
      id: '3',
      imagen: '/imagenes/juego3.png',
      titulo: 'Genshin Impact',
    },
    {
      id: '4',
      imagen: '/imagenes/juego4.png',
      titulo: 'Free Fire MAX',
    },
    {
      id: '5',
      imagen: '/imagenes/juego5.png',
      titulo: 'Apex Legends Mobile',
    },
    {
      id: '6',
      imagen: '/imagenes/juego6.png',
      titulo: 'Clash Royale',
    },
    {
      id: '7',
      imagen: '/imagenes/juego7.png',
      titulo: 'Mobile Legends',
    },
    {
      id: '8',
      imagen: '/imagenes/juego8.png',
      titulo: 'Brawl Stars',
    },
    {
      id: '9',
      imagen: '/imagenes/juego9.png',
      titulo: 'Fortnite Mobile',
    },
    {
      id: '10',
      imagen: '/imagenes/juego10.png',
      titulo: 'League of Legends',
    },
    {
      id: '11',
      imagen: '/imagenes/juego1.png',
      titulo: 'Valorant',
    },
    {
      id: '12',
      imagen: '/imagenes/juego2.png',
      titulo: 'Overwatch 2',
    },
    {
      id: '13',
      imagen: '/imagenes/juego3.png',
      titulo: 'Fortnite Mobile',
    },
    {
      id: '14',
      imagen: '/imagenes/juego4.png',
      titulo: 'Fortnite Mobile',
    },
    {
      id: '15',
      imagen: '/imagenes/juego5.png',
      titulo: 'Fortnite Mobile',
    }
  ]);

  // Paginación
  paginaActual = signal(1);
  productosPorPagina = signal(8);

  totalProductos = computed(() => this.productos().length);
  totalPaginas = computed(() => Math.ceil(this.totalProductos() / this.productosPorPagina()));

  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    const fin = inicio + this.productosPorPagina();
    return this.productos().slice(inicio, fin);
  });

  paginasAMostrar = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(total);
      } else if (actual >= total - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = total - 4; i <= total; i++) {
          paginas.push(i);
        }
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = actual - 1; i <= actual + 1; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(total);
      }
    }
    return paginas;
  });

  seleccionarCategoria(id: string): void {
    this.categoriaSeleccionada.set(id);
    this.paginaActual.set(1);
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.set(this.paginaActual() - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.set(this.paginaActual() + 1);
    }
  }
}
