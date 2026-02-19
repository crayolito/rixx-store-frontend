import { crearGuardPorPermiso } from './permiso-guard';

export const adminGuard = crearGuardPorPermiso('acceder_admin');