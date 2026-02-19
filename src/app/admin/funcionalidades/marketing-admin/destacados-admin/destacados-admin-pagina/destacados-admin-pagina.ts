import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PRODUCTOS } from '../../../../../compartido/datos/productos.datos';
import type { Producto } from '../../../../../compartido/datos/productos.datos';
import {
  ConfiguracionDestacados,
  ConfiguracionGlobal,
  ItemDestacado,
} from '../../../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionApiServicio } from '../../../../../compartido/servicios/configuracion-api.servicio';

const CLAVE_CONFIGURACION_GLOBAL = 'configuracion-global';

@Component({
  selector: 'app-destacados-admin-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './destacados-admin-pagina.html',
  styleUrl: './destacados-admin-pagina.css',
})
export class DestacadosAdminPagina implements OnInit {
  private router = inject(Router);
  private configuracionApi = inject(ConfiguracionApiServicio);

  readonly productosDisponibles = PRODUCTOS;

  titulo = signal('');
  items = signal<ItemDestacado[]>([]);
  mensajeGuardado = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarDesdeJson();
  }

  private obtenerConfiguracionGlobal(): ConfiguracionGlobal {
    try {
      const raw = localStorage.getItem(CLAVE_CONFIGURACION_GLOBAL);
      if (raw) return JSON.parse(raw) as ConfiguracionGlobal;
    } catch { }
    return {};
  }

  private cargarDesdeJson(): void {
    const aplicarDestacados = (global: ConfiguracionGlobal) => {
      const d = global?.destacados;
      if (d) {
        this.titulo.set(d.titulo ?? '');
        this.items.set(Array.isArray(d.items) ? [...d.items] : []);
        return true;
      }
      return false;
    };
    const aplicarFallback = () => {
      const local = this.obtenerConfiguracionGlobal();
      if (aplicarDestacados(local)) return;
      this.titulo.set('Productos destacados');
      const primero = this.productosDisponibles[0];
      this.items.set(primero ? [{ handle: primero.id, titulo: primero.nombre, imagen: primero.imagen }] : []);
    };
    this.configuracionApi.obtenerConfiguracion().subscribe({
      next: (global) => {
        if (aplicarDestacados(global as ConfiguracionGlobal)) return;
        aplicarFallback();
      },
      error: aplicarFallback,
    });
  }

  volver(): void {
    this.router.navigate(['/admin/inicio']);
  }

  guardarConfiguracion(): void {
    const datos: ConfiguracionDestacados = {
      titulo: this.titulo(),
      items: this.items(),
    };
    const global = this.obtenerConfiguracionGlobal();
    global.destacados = datos;
    localStorage.setItem(CLAVE_CONFIGURACION_GLOBAL, JSON.stringify(global));
    this.mensajeGuardado.set('Configuración guardada correctamente.');
    setTimeout(() => this.mensajeGuardado.set(null), 3000);
  }

  agregarItem(): void {
    this.items.update((list) => [
      ...list,
      { handle: '', titulo: '', imagen: '' },
    ]);
  }

  quitarItem(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  alCambiarProducto(index: number, productoId: string): void {
    const producto = this.productosDisponibles.find((p) => p.id === productoId);
    if (!producto) return;
    this.items.update((list) =>
      list.map((item, i) =>
        i === index
          ? { handle: producto.id, titulo: producto.nombre, imagen: producto.imagen }
          : item
      )
    );
  }

  productoParaItem(item: ItemDestacado): Producto | undefined {
    return this.productosDisponibles.find((p) => p.id === item.handle);
  }
}
