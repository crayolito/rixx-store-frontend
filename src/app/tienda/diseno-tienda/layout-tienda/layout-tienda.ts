import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { DrawerCarrito } from '../../../compartido/componentes/drawer-carrito/drawer-carrito';
import { ModalAutenticacion } from '../../../compartido/componentes/modal-autenticacion/modal-autenticacion';
import { NotificacionToast } from '../../../compartido/componentes/notificacion-toast/notificacion-toast';
import { NotificacionServicio } from '../../../compartido/servicios/notificacion';
import { ConfiguracionApiServicio } from '../../../compartido/servicios/configuracion-api.servicio';
import { ConfiguracionServicio } from '../../../compartido/servicios/configuracion.servicio';
import { CabeceraTienda } from '../cabecera-tienda/cabecera-tienda';
import { PieTienda } from '../pie-tienda/pie-tienda';

@Component({
  selector: 'app-layout-tienda',
  standalone: true,
  imports: [RouterOutlet, CabeceraTienda, PieTienda, ModalAutenticacion, DrawerCarrito, NotificacionToast],
  templateUrl: './layout-tienda.html',
  styleUrl: './layout-tienda.css',
})
export class LayoutTienda implements OnInit {
  private configuracionApi = inject(ConfiguracionApiServicio);
  private configuracion = inject(ConfiguracionServicio);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificacion = inject(NotificacionServicio);

  modalAutenticacionAbierto = signal(false);
  drawerCarritoAbierto = signal(false);

  private readonly mensajesLogin: Record<string, string> = {
    checkout: 'Por favor inicia sesión para finalizar tu compra.',
    perfil: 'Por favor inicia sesión para ver tu perfil.',
  };

  ngOnInit(): void {
    this.configuracionApi.obtenerConfiguracion().subscribe({
      next: (config) => {
        if (config && typeof config === 'object') {
          this.configuracion.establecerConfiguracion(config);
        }
      },
      error: (err) => console.error('Error al cargar configuración:', err),
    });
    this.route.queryParams.subscribe((params) => {
      const login = params['login'];
      if (login != null) {
        this.abrirModalConMensaje(login);
      }
    });
  }

  private abrirModalConMensaje(contexto: string): void {
    const mensaje = this.mensajesLogin[contexto] ?? 'Por favor inicia sesión.';
    this.notificacion.info(mensaje);
    this.modalAutenticacionAbierto.set(true);
    this.router.navigate([], { queryParams: {}, queryParamsHandling: '' });
  }
}
