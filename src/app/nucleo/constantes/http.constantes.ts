// Timeout para peticiones HTTP (milisegundos)
export const HTTP_TIMEOUT_MS = 10000;

// Numeor maximo de reintentos ante errores recuperables
export const HTTP_REINTENTOS_MAX = 3;

// Tiempo base de espera entre reintentos (milisegundos)
export const HTTP_BACKOFF_BASE_MS = 1000;

// Codigos de estado que SI se reintentan (errores transitorios/servidor)
export const CODIGOS_RECUPERABLES: number[] = [502, 503, 504];

// Mensaje generico cuando falla la peticion tras todos los reintentos
export const MENSAJE_ERROR_FETCH = 'No se pudo cargar la información. Intenta más tarde.';

// URL base de la API (backend)
export const API_BASE_URL = 'http://sixx-store-backend-0wkwh5-25dd15-72-60-156-101.traefik.me';
