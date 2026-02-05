import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { OpcionPieDePagina, RedSocial, SeccionPieDePagina } from '../../../compartido/modelos/configuracion.modelo';
import { ConfiguracionServicio } from '../../../compartido/servicios/configuracion.servicio';

const ICONOS_REDES: Record<string, string> = {
  facebook: '/imagenes/ico-facebook.svg',
  instagram: '/imagenes/ico-instagram.svg',
  twitter: '/imagenes/ico-twitter.svg',
  youtube: '/imagenes/icon-youtube.svg',
  linkedin: '/imagenes/ico-linkedin.svg',
  tiktok: '/imagenes/ico-tiktok.svg',
};

@Component({
  selector: 'app-pie-tienda',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pie-tienda.html',
  styleUrl: './pie-tienda.css',
})
export class PieTienda {
  private configuracion = inject(ConfiguracionServicio);

  readonly pie = this.configuracion.pieDePaginaActual;

  readonly secciones = computed(() => {
    const p = this.pie();
    return (p?.secciones ?? []) as SeccionPieDePagina[];
  });

  readonly redesConUrl = computed(() => {
    const p = this.pie();
    const redes = (p?.redesSociales ?? []) as RedSocial[];
    return redes.filter((r) => (r.url ?? '').trim() !== '');
  });

  logoUrl = computed(() => this.pie()?.logoUrl?.trim() ?? '');
  currentYear = new Date().getFullYear();

  urlEnlace(opcion: OpcionPieDePagina): string {
    const t = (opcion.tipo ?? 'enlace').toLowerCase();
    const path = (opcion.path ?? '').trim();
    if (t === 'telefono') return path.startsWith('tel:') ? path : `tel:${path}`;
    if (t === 'correo') return path.startsWith('mailto:') ? path : `mailto:${path}`;
    return path || '#';
  }

  esEnlaceInterno(path: string): boolean {
    const p = (path ?? '').trim();
    return p.startsWith('/') && !p.startsWith('//');
  }

  iconoRed(id: string): string {
    return ICONOS_REDES[id?.toLowerCase() ?? ''] ?? '';
  }
}
