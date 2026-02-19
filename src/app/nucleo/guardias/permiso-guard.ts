import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

/** Contexto para abrir el modal de login al redirigir (ej: 'checkout', 'perfil') */
export type ContextoLogin = 'checkout' | 'perfil' | string;

export function crearGuardPorPermiso(permisoRequerido: string, contextoRedirect?: ContextoLogin): CanActivateFn {
  return () => {
    const sesion = inject(Sesion);
    const router = inject(Router);
    if (!sesion.estaLogueado()) {
      const queryParams = contextoRedirect ? { login: contextoRedirect } : undefined;
      const urlActual = router.url.split('?')[0];
      const esRutaProtegida = (url: string) => url === '/checkout' || url === '/perfil' || url.startsWith('/checkout') || url.startsWith('/perfil');
      const urlDondeEstaba = esRutaProtegida(urlActual) ? '/' : urlActual;
      const segmentos = urlDondeEstaba === '/' ? [] : urlDondeEstaba.slice(1).split('/').filter(Boolean);
      const destino = segmentos.length > 0 ? segmentos : ['/'];
      return router.createUrlTree(destino, { queryParams });
    }
    if (sesion.tienePermiso(permisoRequerido)) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
}
