import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

/**
 * Bloquea el acceso a la tienda para usuarios administradores.
 * Si el usuario tiene permiso acceder_admin, redirige a /admin/inicio.
 */
export const bloquearAdminGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  const router = inject(Router);
  if (sesion.tienePermiso('acceder_admin')) {
    return router.createUrlTree(['/admin/inicio']);
  }
  return true;
};
