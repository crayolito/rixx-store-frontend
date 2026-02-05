import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DrawerCarrito } from '../../../compartido/componentes/drawer-carrito/drawer-carrito';
import { ModalAutenticacion } from '../../../compartido/componentes/modal-autenticacion/modal-autenticacion';
import { NotificacionToast } from '../../../compartido/componentes/notificacion-toast/notificacion-toast';
import { PopupBienvenida } from '../../../compartido/componentes/popup-bienvenida/popup-bienvenida';
import { ConfiguracionApiServicio } from '../../../compartido/servicios/configuracion-api.servicio';
import { ConfiguracionServicio } from '../../../compartido/servicios/configuracion.servicio';
import { CabeceraTienda } from '../cabecera-tienda/cabecera-tienda';
import { PieTienda } from '../pie-tienda/pie-tienda';

@Component({
  selector: 'app-layout-tienda',
  standalone: true,
  imports: [RouterOutlet, CabeceraTienda, PieTienda, ModalAutenticacion, PopupBienvenida, DrawerCarrito, NotificacionToast],
  templateUrl: './layout-tienda.html',
  styleUrl: './layout-tienda.css',
})
export class LayoutTienda implements OnInit {
  private configuracionApi = inject(ConfiguracionApiServicio);
  private configuracion = inject(ConfiguracionServicio);

  modalAutenticacionAbierto = signal(false);
  drawerCarritoAbierto = signal(false);

  ngOnInit(): void {
    this.configuracionApi.obtenerConfiguracion().subscribe({
      next: (config) => this.configuracion.establecerConfiguracion(config),
      error: (err) => console.error('Error al cargar configuración:', err),
    });
  }
}
