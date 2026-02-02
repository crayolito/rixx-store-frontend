import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, retry, timer } from "rxjs";
import { NotificacionServicio } from "../../compartido/servicios/notificacion";
import { API_BASE_URL, CODIGOS_RECUPERABLES, HTTP_BACKOFF_BASE_MS, HTTP_REINTENTOS_MAX, MENSAJE_ERROR_FETCH } from "../constantes/http.constantes";

@Injectable({
  providedIn: 'root',
})
export class HttpBaseServicio {
  private http = inject(HttpClient);
  private notificacion = inject(NotificacionServicio);

  obtener<T>(url: string): Observable<T> {
    return this.http.get<T>(`${API_BASE_URL}${url}`).pipe(this.reintentarConBackoff());
  }

  actualizarParcial<T>(url: string, cuerpo: Record<string, unknown>): Observable<T> {
    return this.http.patch<T>(`${API_BASE_URL}${url}`, cuerpo).pipe(this.reintentarConBackoff());
  };

  private reintentarConBackoff<T>() {
    return retry<T>({
      count: HTTP_REINTENTOS_MAX,
      delay: (error, retryCount) => {
        const esRecuperable = this.esErrorRecuperable(error);
        if (!esRecuperable || retryCount > HTTP_REINTENTOS_MAX) {
          this.notificacion.error(MENSAJE_ERROR_FETCH);
          throw error;
        }
        return timer(HTTP_BACKOFF_BASE_MS * retryCount);
      },
    });
  }

  private esErrorRecuperable(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      return CODIGOS_RECUPERABLES.includes((error as { status: number }).status);
    }
    return true;
  }
}

