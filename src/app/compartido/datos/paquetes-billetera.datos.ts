/** Paquetes de recarga disponibles para la billetera. */

export interface PaqueteBilletera {
  id: string;
  monto: number;
}

export const PAQUETES_BILLETERA: PaqueteBilletera[] = [
  { id: 'paq-1', monto: 10 },
  { id: 'paq-2', monto: 25 },
  { id: 'paq-3', monto: 50 },
  { id: 'paq-4', monto: 100 },
  { id: 'paq-5', monto: 200 },
  { id: 'paq-6', monto: 500 },
];
