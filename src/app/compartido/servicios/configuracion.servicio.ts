import { computed, Injectable, signal } from "@angular/core";
import { ConfGeneral } from "../modelos/configuracion.modelo";

@Injectable({ providedIn: 'root' })
export class ConfiguracionServicio {
  private readonly configuracion = signal<ConfGeneral | null>(null);
  readonly configuracionActual = this.configuracion.asReadonly();
  readonly encabezadoActual = computed(() => this.configuracionActual()?.encabezado ?? null);
  readonly pieDePaginaActual = computed(() => this.configuracionActual()?.pieDePagina ?? null);

  establecerConfiguracion(config: ConfGeneral): void {
    this.configuracion.set(config);
  }
}
