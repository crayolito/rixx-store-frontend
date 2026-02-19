import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { HttpBaseServicio } from "../../nucleo/servicios/http-base.servicio";
import type {
  ConfCarrusel,
  ConfEncabezado,
  ConfGeneral,
  ConfPieDePagina,
  ConfPromocion,
  ConfiguracionCategoriasMarketing,
  SeccionEncabezado,
  SlideCarrusel,
  TipoDestinoCarrusel,
} from './../modelos/configuracion.modelo';
import { handleATitulo } from './../modelos/configuracion.modelo';

const RUTA_CONFIGURACION = '/configuracion';

// Repuesta de GET /configuracion - ajusta si tu API devuelve otra estructura
interface RespuestaConfiguracion {
  exito: boolean;
  datos?: ConfGeneral;
}

/**
 * Normaliza secciones del encabezado.
 * PISA con lo que vino del servidor: si el servidor envía "categorias", se usa SOLO eso (nunca rellenar con categoriaHandles).
 * Así no se mezcla data real con data de prueba/basura.
 */
function normalizarEncabezado(enc: ConfEncabezado | undefined): ConfEncabezado | undefined {
  if (!enc?.secciones?.length) return enc;
  const secciones: SeccionEncabezado[] = enc.secciones.map((s) => {
    const dato = s as SeccionEncabezado & {
      categoriaHandles?: string[];
      redireccionCategoriaHandle?: string;
    };
    let categorias: { handle: string; titulo: string }[];
    if (Array.isArray(s.categorias)) {
      categorias = s.categorias.map((c) => ({ handle: c.handle, titulo: c.titulo ?? c.handle }));
    } else if (dato.categoriaHandles?.length) {
      categorias = dato.categoriaHandles.map((h) => ({ handle: h, titulo: handleATitulo(h) }));
    } else {
      categorias = [];
    }
    let redireccionCategoria = s.redireccionCategoria;
    if (!redireccionCategoria?.handle && dato.redireccionCategoriaHandle) {
      redireccionCategoria = {
        handle: dato.redireccionCategoriaHandle,
        titulo: handleATitulo(dato.redireccionCategoriaHandle),
      };
    }
    return {
      id: s.id,
      tituloBase: s.tituloBase ?? '',
      esDinamico: s.esDinamico ?? false,
      categorias,
      redireccionCategoria,
    };
  });
  return { ...enc, secciones };
}

/**
 * Normaliza slides del carrusel para que la tienda siempre reciba el formato esperado.
 */
function normalizarCarrusel(carrusel: ConfCarrusel | undefined): ConfCarrusel | undefined {
  if (!carrusel?.slides?.length) return carrusel;
  const slides: SlideCarrusel[] = carrusel.slides.map((s, i) => {
    const tipo = (s.tipoDestino ?? 'ninguno') as TipoDestinoCarrusel;
    const destinoHandle =
      tipo === 'producto' || tipo === 'categoria' ? s.destinoHandle : undefined;
    return {
      id: s.id ?? `slide-${i + 1}`,
      imagenMovil: s.imagenMovil ?? '',
      imagenDesktop: s.imagenDesktop ?? '',
      tipoDestino: tipo,
      destinoHandle,
    };
  });
  return { ...carrusel, slides };
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionApiServicio {
  private httpBase = inject(HttpBaseServicio);

  obtenerConfiguracion(): Observable<ConfGeneral> {
    return this.httpBase.obtener<RespuestaConfiguracion | ConfGeneral>(RUTA_CONFIGURACION).pipe(
      map((data) => {
        let config: ConfGeneral;
        if (
          data &&
          typeof data === 'object' &&
          'exito' in data &&
          data.exito === true &&
          'datos' in data
        ) {
          config = (data as RespuestaConfiguracion).datos ?? {};
        } else {
          config = (data as ConfGeneral) ?? {};
        }
        if (config.encabezado) {
          config = { ...config, encabezado: normalizarEncabezado(config.encabezado) ?? config.encabezado };
        }
        if (config.carrusel) {
          config = { ...config, carrusel: normalizarCarrusel(config.carrusel) ?? config.carrusel };
        }
        return config;
      })
    );
  }

  /** PATCH configuración: body con propiedad contenido (no datos). */
  actualizarCarrusel(slides: unknown[]): Observable<unknown> {
    return this.httpBase.actualizarParcial(RUTA_CONFIGURACION, {
      contenido: { carrusel: { slides } }
    });
  }

  /** PATCH configuración: body con propiedad contenido (no datos). */
  actualizarEncabezado(encabezado: ConfEncabezado): Observable<unknown> {
    return this.httpBase.actualizarParcial(RUTA_CONFIGURACION, {
      contenido: { encabezado }
    });
  }

  /** PATCH configuración: body con propiedad contenido (no datos). */
  actualizarPromocion(promocion: ConfPromocion): Observable<unknown> {
    return this.httpBase.actualizarParcial(RUTA_CONFIGURACION, {
      contenido: { promocion }
    });
  }

  /** PATCH configuración: envía categorías marketing al servidor. */
  actualizarCategoriasMarketing(datos: ConfiguracionCategoriasMarketing): Observable<unknown> {
    return this.httpBase.actualizarParcial(RUTA_CONFIGURACION, {
      contenido: { categoriasMarketing: datos }
    });
  }

  /** PATCH configuración: envía pie de página al servidor. */
  actualizarPieDePagina(pie: ConfPieDePagina): Observable<unknown> {
    return this.httpBase.actualizarParcial(RUTA_CONFIGURACION, {
      contenido: { pieDePagina: pie }
    });
  }
}
