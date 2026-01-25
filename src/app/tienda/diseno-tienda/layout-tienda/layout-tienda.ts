import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DrawerCarrito } from '../../../compartido/componentes/drawer-carrito/drawer-carrito';
import { ModalAutenticacion } from '../../../compartido/componentes/modal-autenticacion/modal-autenticacion';
import { PopupBienvenida } from '../../../compartido/componentes/popup-bienvenida/popup-bienvenida';
import { CabeceraTienda } from '../cabecera-tienda/cabecera-tienda';
import { PieTienda } from '../pie-tienda/pie-tienda';

@Component({
  selector: 'app-layout-tienda',
  standalone: true,
  imports: [RouterOutlet, CabeceraTienda, PieTienda, ModalAutenticacion, PopupBienvenida, DrawerCarrito],
  templateUrl: './layout-tienda.html',
  styleUrl: './layout-tienda.css',
})
export class LayoutTienda {
  modalAutenticacionAbierto = signal(false);
  drawerCarritoAbierto = signal(false);
}
