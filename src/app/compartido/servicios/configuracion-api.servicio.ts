import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { HttpBaseServicio } from "../../nucleo/servicios/http-base.servicio";
import { ConfGeneral } from './../modelos/configuracion.modelo';

const RUTA_CONFIGURACION = '/configuracion';

// Repuesta de GET /configuracion - ajusta si tu API devuelve otra estructura
interface RespuestaConfiguracion {
  exito: boolean;
  datos?: ConfGeneral;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionApiServicio {
  private httpBase = inject(HttpBaseServicio);

  obtenerConfiguracion(): Observable<ConfGeneral> {
    return this.httpBase.obtener<RespuestaConfiguracion | ConfGeneral>(RUTA_CONFIGURACION).pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'exito' in data &&
          data.exito === true &&
          'datos' in data
        ) {
          return (data as RespuestaConfiguracion).datos ?? {};
        }
        return (data as ConfGeneral) ?? {};
      })
    )
  }

  actualizarCarrusel(slides: unknown[]): Observable<unknown> {
    return this.httpBase.actualizarParcial(RUTA_CONFIGURACION, {
      datos: { carrusel: { slides } }
    })
  }
}
