/**
 * Modelos compartidos para la funcionalidad de perfil.
 * Agrupa interfaces de pedidos, billetera y datos de entrega.
 */

export interface DatosEntrega {
  idJugador?: string;
  idServer?: string;
  [k: string]: string | undefined;
}

export interface ProductoPedido {
  id: string;
  nombre: string;
  imagen?: string;
  cantidad: number;
}

export interface PedidoAutomatico {
  id: string;
  tipo: 'automatico';
  productos: ProductoPedido[];
  total_compra: number;
  estado: string;
  fecha_compra: string;
  datosEntrega?: DatosEntrega;
}

export interface CodigoGiftCard {
  serial?: string;
  pin?: string;
  valor?: number;
}

export interface PedidoGiftCard {
  id: string;
  tipo: 'gift_card';
  nombre: string;
  fechaEmision: string;
  codigos: CodigoGiftCard[];
  valorTotal: number;
  instrucciones?: string;
}

export type Pedido = PedidoAutomatico | PedidoGiftCard;

export interface TransaccionBilletera {
  id: string;
  fecha: string;
  tipo: 'recarga' | 'compra' | 'reembolso';
  descripcion: string;
  monto: number;
  saldoResultante?: number;
}
