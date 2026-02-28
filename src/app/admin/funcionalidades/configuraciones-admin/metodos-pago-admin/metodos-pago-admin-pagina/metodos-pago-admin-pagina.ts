import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BloqueEstadoTablaComponente } from '../../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { Modal } from '../../../../../compartido/componentes/modal/modal';
import { NotificacionServicio } from '../../../../../compartido/servicios/notificacion';
import { CloudinaryApiServicio } from '../../../../../nucleo/servicios/cloudinary-api.servicio';
import type { CuerpoCrearMetodoPago, MetodoPagoUINormalizado } from '../../../../../nucleo/servicios/metodos-pago-api.servicio';
import { MetodosPagoApiServicio } from '../../../../../nucleo/servicios/metodos-pago-api.servicio';

/** Modelo local para edición o creación. */
interface MetodoPagoEdicion extends MetodoPagoUINormalizado {
  apiKey?: string;
  secretKey?: string;
  tasaCambio?: number;
  qrTipo?: '' | 'estatico' | 'dinamico';
  qrImagen?: string;
}

@Component({
  selector: 'app-metodos-pago-admin-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, BloqueEstadoTablaComponente],
  templateUrl: './metodos-pago-admin-pagina.html',
  styleUrls: ['./metodos-pago-admin-pagina.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetodosPagoAdminPaginaComponente implements OnInit {
  private metodosPagoApi = inject(MetodosPagoApiServicio);
  private notificacion = inject(NotificacionServicio);
  private cloudinaryApi = inject(CloudinaryApiServicio);

  metodosPago = signal<MetodoPagoUINormalizado[]>([]);
  cargando = signal(true);
  errorAlCargar = signal(false);
  guardando = signal(false);
  subiendoLogo = signal(false);
  subiendoQr = signal(false);

  modalAbierto = signal(false);
  modoCreacion = signal(false);
  metodoEnEdicion = signal<MetodoPagoEdicion | null>(null);

  mostrarApiKey = signal(false);
  mostrarSecretKey = signal(false);

  ngOnInit(): void {
    this.cargarMetodos();
  }

  cargarMetodos(): void {
    this.cargando.set(true);
    this.errorAlCargar.set(false);
    this.metodosPagoApi.listar(false).subscribe({
      next: (lista) => {
        this.metodosPago.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.errorAlCargar.set(true);
        this.cargando.set(false);
        this.notificacion.error('No se pudieron cargar los métodos de pago. Revisa tu conexión e intenta de nuevo.');
      },
    });
  }

  /** Abre el modal para crear un método de pago nuevo. */
  abrirModalCrear(): void {
    this.modoCreacion.set(true);
    this.metodoEnEdicion.set({
      id_metodo_pago: 0,
      nombre: '',
      descripcion: '',
      logo: '',
      apiKey: '',
      secretKey: '',
      tasaCambio: undefined,
      qrTipo: '',
      qrImagen: '',
    });
    this.modalAbierto.set(true);
    this.mostrarApiKey.set(false);
    this.mostrarSecretKey.set(false);
  }

  abrirModalEdicion(metodo: MetodoPagoUINormalizado): void {
    this.modoCreacion.set(false);
    this.metodoEnEdicion.set({
      ...metodo,
      apiKey: '',
      secretKey: '',
      tasaCambio: metodo.tipo_cambio,
    });
    this.modalAbierto.set(true);
    this.mostrarApiKey.set(false);
    this.mostrarSecretKey.set(false);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.modoCreacion.set(false);
    this.metodoEnEdicion.set(null);
    this.mostrarApiKey.set(false);
    this.mostrarSecretKey.set(false);
  }

  alternarVisibilidadApiKey(): void {
    this.mostrarApiKey.update((v) => !v);
  }

  alternarVisibilidadSecretKey(): void {
    this.mostrarSecretKey.update((v) => !v);
  }

  cambiarEstado(idMetodo: number): void {
    this.metodosPago.update((metodos) =>
      metodos.map((m) => (m.id_metodo_pago === idMetodo ? { ...m, activo: !m.activo } : m)),
    );
  }

  guardarCambios(): void {
    const metodo = this.metodoEnEdicion();
    if (!metodo) return;
    if (!metodo.nombre?.trim()) {
      this.notificacion.advertencia('El nombre del método de pago es obligatorio.');
      return;
    }
    if (metodo.qrTipo === 'estatico' && !metodo.qrImagen?.trim()) {
      this.notificacion.advertencia('Cuando el tipo de QR es estático debes subir la imagen del QR.');
      return;
    }

    if (this.modoCreacion()) {
      this.guardando.set(true);
      const cuerpo: CuerpoCrearMetodoPago = {
        nombre: metodo.nombre.trim(),
        descripcion: metodo.descripcion?.trim() || null,
        logo: metodo.logo?.trim() || undefined,
        apiKey: metodo.apiKey?.trim() || undefined,
        secretKey: metodo.secretKey?.trim() || undefined,
        qrTipo: metodo.qrTipo === 'estatico' || metodo.qrTipo === 'dinamico' ? metodo.qrTipo : undefined,
        qrImagen: metodo.qrTipo === 'estatico' && metodo.qrImagen?.trim() ? metodo.qrImagen.trim() : undefined,
        tipoCambio: metodo.tasaCambio ?? metodo.tipo_cambio ?? null,
      };
      this.metodosPagoApi.crear(cuerpo).subscribe({
        next: (creado) => {
          const normalizado = this.metodosPagoApi.normalizarParaUI(creado);
          this.metodosPago.update((lista) => [...lista, normalizado]);
          this.guardando.set(false);
          this.cerrarModal();
          this.notificacion.exito('Método de pago creado correctamente.');
        },
        error: (err) => {
          this.guardando.set(false);
          this.notificacion.error(err?.error?.mensaje ?? 'No se pudo crear el método de pago. Intenta de nuevo.');
        },
      });
      return;
    }

    this.metodosPago.update((metodos) =>
      metodos.map((m) =>
        m.id_metodo_pago === metodo.id_metodo_pago
          ? { ...metodo, descripcion: metodo.descripcion ?? '', logo: metodo.logo ?? '' }
          : m,
      ),
    );
    this.cerrarModal();
    this.notificacion.exito('Cambios guardados.');
  }

  actualizarCampo(campo: keyof MetodoPagoEdicion, valor: unknown): void {
    const actual = this.metodoEnEdicion();
    if (!actual) return;
    const valorFinal = campo === 'tasaCambio' ? (typeof valor === 'number' ? valor : parseFloat(String(valor)) || 0) : valor;
    const siguiente = { ...actual, [campo]: valorFinal };
    if (campo === 'qrTipo' && valor !== 'estatico') {
      siguiente.qrImagen = '';
    }
    this.metodoEnEdicion.set(siguiente);
  }

  /** Sube el logo a Cloudinary y guarda la URL. No se muestra la imagen, solo mensaje de éxito. */
  subirLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.notificacion.advertencia('Selecciona una imagen (PNG, JPG, SVG).');
      return;
    }
    this.subiendoLogo.set(true);
    this.cloudinaryApi.subirImagen(file).subscribe({
      next: (url) => {
        this.subiendoLogo.set(false);
        if (url) {
          this.actualizarCampo('logo', url);
          this.notificacion.exito('Logo subido correctamente.');
        } else {
          this.notificacion.error('No se pudo subir el logo.');
        }
        input.value = '';
      },
      error: () => {
        this.subiendoLogo.set(false);
        this.notificacion.error('Error al subir el logo.');
        input.value = '';
      },
    });
  }

  /** Sube la imagen del QR a Cloudinary (solo cuando qrTipo es estatico). No se muestra la imagen, solo mensaje de éxito. */
  subirQrImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.notificacion.advertencia('Selecciona una imagen del QR (PNG, JPG).');
      return;
    }
    this.subiendoQr.set(true);
    this.cloudinaryApi.subirImagen(file).subscribe({
      next: (url) => {
        this.subiendoQr.set(false);
        if (url) {
          this.actualizarCampo('qrImagen', url);
          this.notificacion.exito('Imagen del QR subida correctamente.');
        } else {
          this.notificacion.error('No se pudo subir la imagen del QR.');
        }
        input.value = '';
      },
      error: () => {
        this.subiendoQr.set(false);
        this.notificacion.error('Error al subir la imagen del QR.');
        input.value = '';
      },
    });
  }

  cerrarTodosLosDropdowns(): void {}
}
