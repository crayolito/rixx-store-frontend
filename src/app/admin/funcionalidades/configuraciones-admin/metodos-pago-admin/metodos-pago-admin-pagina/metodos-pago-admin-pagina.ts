import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../../../../compartido/componentes/modal/modal';

// PASO 1: Definimos los modelos
interface MetodoPago {
  id: string;
  nombre: string;
  descripcion: string;
  logo: string;
  tipo: 'binance' | 'qr-boliviano';
  apiKey: string;
  secretKey: string;
  activo: boolean;
  tasaCambio?: number; // Solo para QR Boliviano
}

@Component({
  selector: 'app-metodos-pago-admin-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './metodos-pago-admin-pagina.html',
  styleUrls: ['./metodos-pago-admin-pagina.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetodosPagoAdminPaginaComponente {
  // PASO 2: Señales para manejar el estado
  metodosPago = signal<MetodoPago[]>([
    {
      id: '1',
      nombre: 'Binance Pay',
      descripcion: 'Pago con criptomoneda | Rápido y seguro | Mundial',
      logo: '/logo-binance.png',
      tipo: 'binance',
      apiKey: '',
      secretKey: '',
      activo: true,
    },
    {
      id: '2',
      nombre: 'QR Boliviano',
      descripcion: 'Pago con QR desde tu banco | TC=1$ = 10,7 Bs | Solo Bolivia',
      logo: '/logo-veripagos.svg',
      tipo: 'qr-boliviano',
      apiKey: '',
      secretKey: '',
      activo: false,
      tasaCambio: 10.7,
    },
  ]);

  modalAbierto = signal<boolean>(false);
  metodoEnEdicion = signal<MetodoPago | null>(null);

  // Señales para mostrar/ocultar credenciales
  mostrarApiKey = signal<boolean>(false);
  mostrarSecretKey = signal<boolean>(false);

  // FASE 1: Abrir modal de edición
  abrirModalEdicion(metodo: MetodoPago): void {
    // Creamos una copia del método para no modificar el original hasta guardar
    this.metodoEnEdicion.set({ ...metodo });
    this.modalAbierto.set(true);
    this.mostrarApiKey.set(false);
    this.mostrarSecretKey.set(false);
  }

  // FASE 2: Cerrar modal
  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.metodoEnEdicion.set(null);
    this.mostrarApiKey.set(false);
    this.mostrarSecretKey.set(false);
  }

  // FASE 3: Alternar visibilidad de credenciales
  alternarVisibilidadApiKey(): void {
    this.mostrarApiKey.update(valor => !valor);
  }

  alternarVisibilidadSecretKey(): void {
    this.mostrarSecretKey.update(valor => !valor);
  }

  // FASE 4: Cambiar estado del método de pago
  cambiarEstado(metodoId: string): void {
    this.metodosPago.update(metodos =>
      metodos.map(metodo =>
        metodo.id === metodoId
          ? { ...metodo, activo: !metodo.activo }
          : metodo
      )
    );
  }

  // FASE 5: Guardar cambios del modal
  guardarCambios(): void {
    const metodoEditado = this.metodoEnEdicion();
    if (!metodoEditado) return;

    // Validamos que los campos obligatorios estén completos
    if (!metodoEditado.nombre || !metodoEditado.descripcion) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Actualizamos el método en la lista
    this.metodosPago.update(metodos =>
      metodos.map(metodo =>
        metodo.id === metodoEditado.id
          ? { ...metodoEditado }
          : metodo
      )
    );

    this.cerrarModal();
  }

  // FASE 6: Actualizar campo del método en edición
  actualizarCampo(campo: keyof MetodoPago, valor: any): void {
    const metodoActual = this.metodoEnEdicion();
    if (!metodoActual) return;

    // Si el campo es tasaCambio, convertimos a número
    const valorFinal = campo === 'tasaCambio' ? parseFloat(valor) || 0 : valor;

    this.metodoEnEdicion.set({
      ...metodoActual,
      [campo]: valorFinal,
    });
  }

  cerrarTodosLosDropdowns(): void {
    // Implementación si necesitas dropdowns en el futuro
  }
}
