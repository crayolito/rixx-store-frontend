import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarritoServicio } from '../../../../compartido/servicios/carrito.servicio';

// FASE 1: Definimos los modelos de datos
interface VarianteProducto {
  id: string;
  nombre: string;
  precio: number;
  disponible: boolean;
}

interface MetodoPago {
  id: string;
  nombre: string;
  descripcion: string;
  logo: string;
  tipo: 'binance' | 'qr-boliviano';
  activo: boolean;
}

@Component({
  selector: 'app-producto-detalle-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-detalle-pagina.html',
  styleUrl: './producto-detalle-pagina.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoDetallePagina {
  // FASE 2: Servicios
  private carritoServicio = inject(CarritoServicio);
  private router = inject(Router);

  // FASE 2: Datos del producto
  readonly producto = signal({
    id: '1',
    titulo: 'Mobile Legends: Bang Bang',
    imagenBanner: '/imagenes/banner-juego1.jpg',
    imagenJuego: '/imagenes/juego1.png',
    servidor: 'EEUU - LATAM',
    descripcion: 'Entrega inmediata de Steam - Activación Steam',
    descripcionCompleta: 'Mobile Legends: Bang Bang es un MOBA épico con más de 100 héroes únicos, batallas 5v5 en tiempo real y gráficos impresionantes. Compite en ranked, participa en eventos especiales y domina el campo de batalla.',
    instrucciones: '1. Ingresa tu ID de jugador y servidor\n2. Selecciona la variante deseada\n3. Realiza el pago\n4. Recibirás el código en tu correo electrónico\n5. Canjea el código en el juego',
    terminos: 'Los códigos son no reembolsables. El tiempo de entrega puede variar entre 5-30 minutos. Asegúrate de ingresar correctamente tu ID de jugador y servidor.',
    tipoEntrega: 'manual' as 'manual' | 'automatico'
  });

  // FASE 3: Variantes del producto
  readonly variantes = signal<VarianteProducto[]>([
    { id: '1', nombre: '100+10 Diamantes', precio: 600.00, disponible: true },
    { id: '2', nombre: '310+31 Diamantes', precio: 1750.00, disponible: true },
    { id: '3', nombre: '520+52 Diamantes', precio: 2800.00, disponible: true },
    { id: '4', nombre: '1060+106 Diamantes', precio: 5400.00, disponible: true },
    { id: '5', nombre: '2180+218 Diamantes', precio: 10500.00, disponible: true },
    { id: '6', nombre: 'Pase Bootyah', precio: 1065.60, disponible: true },
    { id: '7', nombre: 'Pase Starlight', precio: 1200.00, disponible: true },
    { id: '8', nombre: 'Pase Elite', precio: 1500.00, disponible: true },
    { id: '9', nombre: 'Pack Héroes', precio: 2100.00, disponible: true },
    { id: '10', nombre: 'Pack Skins Épicas', precio: 3500.00, disponible: true }
  ]);

  // FASE 4: Métodos de pago
  readonly metodosPago = signal<MetodoPago[]>([
    {
      id: '1',
      nombre: 'Binance Pay',
      descripcion: 'Pago con criptomoneda | Rápido y seguro | Mundial',
      logo: '/logo-binance.png',
      tipo: 'binance',
      activo: true
    },
    {
      id: '2',
      nombre: 'QR Boliviano',
      descripcion: 'Pago con QR desde tu banco | TC=1$ = 10,7 Bs | Solo Bolivia',
      logo: '/logo-veripagos.svg',
      tipo: 'qr-boliviano',
      activo: true
    }
  ]);

  // FASE 5: Estado del formulario
  varianteSeleccionada = signal<string>('1');
  metodoPagoSeleccionado = signal<string>('');
  cantidad = signal<number>(1);
  servidor = signal<string>('LATAM');
  idJugador = signal<string>('');

  // FASE 6: Estados de dropdowns y bottom sheet (móvil)
  descripcionAbierta = signal<boolean>(false);
  instruccionesAbierta = signal<boolean>(false);
  terminosAbierta = signal<boolean>(false);
  bottomSheetVariantesAbierto = signal<boolean>(false);

  // FASE 7: Cálculos computados
  varianteActual = computed(() => {
    return this.variantes().find(v => v.id === this.varianteSeleccionada()) || this.variantes()[0];
  });

  precioTotal = computed(() => {
    const variante = this.varianteActual();
    return variante ? variante.precio * this.cantidad() : 0;
  });

  saldoDisponible = signal<number>(5000.00);
  saldoSuficiente = computed(() => {
    return this.saldoDisponible() >= this.precioTotal();
  });

  // FASE 8: Funciones de acción
  seleccionarVariante(id: string): void {
    this.varianteSeleccionada.set(id);
  }

  seleccionarMetodoPago(id: string): void {
    this.metodoPagoSeleccionado.set(id);
  }

  alternarDescripcion(): void {
    this.descripcionAbierta.update(abierto => !abierto);
  }

  alternarInstrucciones(): void {
    this.instruccionesAbierta.update(abierto => !abierto);
  }

  alternarTerminos(): void {
    this.terminosAbierta.update(abierto => !abierto);
  }

  abrirBottomSheetVariantes(): void {
    this.bottomSheetVariantesAbierto.set(true);
  }

  cerrarBottomSheetVariantes(): void {
    this.bottomSheetVariantesAbierto.set(false);
  }

  confirmarPaquete(): void {
    this.bottomSheetVariantesAbierto.set(false);
  }

  incrementarCantidad(): void {
    this.cantidad.update(cant => cant + 1);
  }

  decrementarCantidad(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update(cant => cant - 1);
    }
  }

  agregarAlCarrito(): void {
    // TODO: Implementar lógica de agregar al carrito
    console.log('Agregar al carrito:', {
      variante: this.varianteActual(),
      cantidad: this.cantidad(),
      metodoPago: this.metodoPagoSeleccionado(),
      servidor: this.servidor(),
      idJugador: this.idJugador()
    });
  }

  comprarAhora(): void {
    const variante = this.varianteActual();
    if (!variante) return;

    // Agregar al carrito
    this.carritoServicio.agregarItem({
      imagen: this.producto().imagenJuego,
      titulo: `${this.producto().titulo} - ${variante.nombre}`,
      precio: variante.precio,
      cantidad: this.cantidad()
    });

    // Navegar al checkout
    this.router.navigate(['/checkout']);
  }
}
