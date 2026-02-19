import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { Sesion } from './nucleo/servicios/sesion';

/** Carga la sesión desde localStorage antes de la primera navegación para que los guards tengan datos. */
function inicializarSesion(sesion: Sesion) {
  return () => {
    sesion.cargarSesion();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideNoopAnimations(),
    provideHttpClient(),
    { provide: APP_INITIALIZER, useFactory: inicializarSesion, deps: [Sesion], multi: true },
  ]
};
