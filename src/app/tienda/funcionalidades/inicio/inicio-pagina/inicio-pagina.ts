import { Component, effect, inject, signal } from '@angular/core';
import { PopupBienvenida } from '../../../../compartido/componentes/popup-bienvenida/popup-bienvenida';
import { AnuncioTemporal, CategoriaDestacada, ConfCarrusel, ConfPromocion } from '../../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionServicio } from '../../../../compartido/servicios/configuracion.servicio';
import { SeccionCarrusel } from '../../secciones-dinamicas/componentes/seccion-carrusel/seccion-carrusel';
import { SeccionCategorias } from '../../secciones-dinamicas/componentes/seccion-categorias/seccion-categorias';
import { SeccionPromocion } from '../../secciones-dinamicas/componentes/seccion-promocion/seccion-promocion';

@Component({
  selector: 'app-inicio-pagina',
  standalone: true,
  imports: [SeccionCarrusel, SeccionPromocion, SeccionCategorias, PopupBienvenida],
  templateUrl: './inicio-pagina.html',
  styleUrl: './inicio-pagina.css',
})
export class InicioPagina {
  private configuracion = inject(ConfiguracionServicio);

  readonly carrusel = signal<ConfCarrusel>({ slides: [] });
  readonly promocion = signal<ConfPromocion>({ titulo: '', items: [] });
  readonly categorias = signal<CategoriaDestacada[]>([]);
  readonly anunciosTemporales = signal<AnuncioTemporal[]>([]);

  constructor() {
    effect(() => {
      const config = this.configuracion.configuracionActual();
      if (!config) return;

      if (config.carrusel) this.carrusel.set(config.carrusel);
      if (config.promocion) this.promocion.set(config.promocion);

      // Anuncios temporales
      if (config.anuncioTemporal?.anuncios) {
        console.log('[Inicio] Anuncios recibidos:', config.anuncioTemporal.anuncios);
        this.anunciosTemporales.set(config.anuncioTemporal.anuncios);
      } else {
        console.log('[Inicio] No hay anuncios en config:', config);
      }

      // Categorías: prioridad categorias → categoria.categorias → categoriasMarketing.categorias (donde guarda el admin)
      const lista =
        (Array.isArray(config.categorias) && config.categorias.length > 0 && config.categorias) ||
        (config.categoria?.categorias?.length && config.categoria.categorias) ||
        (config.categoriasMarketing?.categorias?.length && config.categoriasMarketing.categorias) ||
        [];
      this.categorias.set(lista);
    });
  }
}
