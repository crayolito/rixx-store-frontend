import { Component, effect, inject, signal } from '@angular/core';
import { ConfCarrusel, ConfCategorias, ConfPromocion } from '../../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionServicio } from '../../../../compartido/servicios/configuracion.servicio';
import { SeccionCarrusel } from '../../secciones-dinamicas/componentes/seccion-carrusel/seccion-carrusel';

@Component({
  selector: 'app-inicio-pagina',
  standalone: true,
  imports: [SeccionCarrusel],
  templateUrl: './inicio-pagina.html',
  styleUrl: './inicio-pagina.css',
})
export class InicioPagina {
  private configuracion = inject(ConfiguracionServicio);

  readonly carrusel = signal<ConfCarrusel>({ slides: [] });
  readonly promocion = signal<ConfPromocion>({ titulo: '', items: [] });
  readonly categoria = signal<ConfCategorias>({ categorias: [] });

  constructor() {
    effect(() => {
      const config = this.configuracion.configuracionActual();
      if (!config) return;
      console.log(config);

      if (config.carrusel) this.carrusel.set(config.carrusel);
      if (config.promocion) this.promocion.set(config.promocion);
      if (config.categoria) this.categoria.set(config.categoria);
    });
  }
}
