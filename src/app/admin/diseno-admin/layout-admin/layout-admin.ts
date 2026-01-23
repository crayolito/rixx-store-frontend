import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacionToast } from '../../../compartido/componentes/notificacion-toast/notificacion-toast'; // ← NUEVO
import { BarraLateralAdmin } from '../barra-lateral-admin/barra-lateral-admin';
import { CabeceraAdmin } from '../cabecera-admin/cabecera-admin';

@Component({
  selector: 'app-layout-admin',
  standalone: true,
  imports: [
    RouterOutlet,
    BarraLateralAdmin,
    CabeceraAdmin,
    NotificacionToast // ← NUEVO
  ],
  templateUrl: './layout-admin.html',
  styleUrl: './layout-admin.css',
})
export class LayoutAdmin { }
