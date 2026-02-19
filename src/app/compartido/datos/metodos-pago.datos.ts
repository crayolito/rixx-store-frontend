/** Métodos de pago disponibles para recargas de billetera. */

export interface MetodoPago {
  id: string;
  nombre: string;
  logo: string;
  descripcion: string;
}

export const METODOS_PAGO: MetodoPago[] = [
  {
    id: 'binance',
    nombre: 'Binance Pay',
    logo: '/logo-binance.png',
    descripcion: 'Pago con criptomonedas',
  },
  {
    id: 'veripagos',
    nombre: 'Veripagos',
    logo: '/logo-veripagos.svg',
    descripcion: 'Transferencia bancaria',
  },
];
