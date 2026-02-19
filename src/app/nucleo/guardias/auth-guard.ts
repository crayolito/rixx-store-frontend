import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion } from '../servicios/sesion';

export const authGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  if (sesion.estaLogueado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};
