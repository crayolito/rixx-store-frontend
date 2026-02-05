import { Component, effect, inject, signal } from '@angular/core';
import { CategoriaDestacada, ConfCarrusel, ConfPromocion } from '../../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionServicio } from '../../../../compartido/servicios/configuracion.servicio';
import { SeccionCarrusel } from '../../secciones-dinamicas/componentes/seccion-carrusel/seccion-carrusel';
import { SeccionCategorias } from '../../secciones-dinamicas/componentes/seccion-categorias/seccion-categorias';
import { SeccionPromocion } from '../../secciones-dinamicas/componentes/seccion-promocion/seccion-promocion';

@Component({
  selector: 'app-inicio-pagina',
  standalone: true,
  imports: [SeccionCarrusel, SeccionPromocion, SeccionCategorias],
  templateUrl: './inicio-pagina.html',
  styleUrl: './inicio-pagina.css',
})
export class InicioPagina {
  private configuracion = inject(ConfiguracionServicio);

  readonly carrusel = signal<ConfCarrusel>({ slides: [] });
  readonly promocion = signal<ConfPromocion>({ titulo: '', items: [] });
  readonly categorias = signal<CategoriaDestacada[]>([]);

  constructor() {
    effect(() => {
      const config = this.configuracion.configuracionActual();
      if (!config) return;

      if (config.carrusel) this.carrusel.set(config.carrusel);
      if (config.promocion) this.promocion.set(config.promocion);
      if (Array.isArray(config.categorias) && config.categorias.length > 0) {
        this.categorias.set(config.categorias);
      }
    });
  }

}
