import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Banner } from '../componentes/banner/banner';
import { Billetera } from '../componentes/billetera/billetera';
import { DatosPersonales, type DatosPersonalesGuardados } from '../componentes/datos-personales/datos-personales';
import { Pedidos } from '../componentes/pedidos/pedidos';
import { Sesion } from '../../../../nucleo/servicios/sesion';
import type { PedidoAutomatico, PedidoGiftCard } from '../modelos/perfil.modelo';

/**
 * Página principal del perfil de usuario.
 * Orquesta layout, menú lateral y las secciones: datos personales, pedidos y billetera.
 */
@Component({
  selector: 'app-perfil-pagina',
  standalone: true,
  imports: [CommonModule, Banner, DatosPersonales, Pedidos, Billetera],
  templateUrl: './perfil-pagina.html',
  styleUrl: './perfil-pagina.css',
})
export class PerfilPagina implements OnInit {
  seccionActiva = signal<'perfil' | 'pedidos' | 'billetera'>('perfil');

  nombre = signal('');
  email = signal('');
  telefono = signal('');
  nacionalidad = signal('');
  fotoPerfil = signal('/imagenes/foto-perfil1.png');

  pedidosAutomaticos = signal<PedidoAutomatico[]>([]);
  pedidosGiftCard = signal<PedidoGiftCard[]>([]);

  tieneSocialLogin = computed(() => this.sesion.usuarioActual()?.socialLogin === true);

  private route = inject(ActivatedRoute);
  private sesion = inject(Sesion);

  ngOnInit(): void {
    const u = this.sesion.usuarioActual();
    if (u) {
      this.nombre.set(u.nombre ?? '');
      this.email.set(u.email ?? '');
      this.telefono.set(u.telefono ?? '');
      this.nacionalidad.set(u.nacionalidad ?? '');
      this.fotoPerfil.set(u.fotoPerfil ?? '/imagenes/foto-perfil1.png');
    }
    this.route.queryParams.subscribe((params) => {
      const seccion = params['seccion'];
      if (seccion === 'pedidos' || seccion === 'billetera') {
        this.seccionActiva.set(seccion);
      }
    });
  }

  cambiarSeccion(seccion: 'perfil' | 'pedidos' | 'billetera'): void {
    this.seccionActiva.set(seccion);
  }

  onFotoActualizada(url: string): void {
    this.fotoPerfil.set(url);
  }

  onDatosGuardados(datos: DatosPersonalesGuardados): void {
    this.nombre.set(datos.nombre);
    this.email.set(datos.email);
    if (datos.telefono != null) this.telefono.set(datos.telefono);
    if (datos.nacionalidad != null) this.nacionalidad.set(datos.nacionalidad);
  }
}
