import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { obtenerFotoPerfilAleatoria } from './nucleo/constantes/fotos-perfil.constantes';
import { Autenticacion } from './nucleo/servicios/autenticacion';
import { Sesion } from './nucleo/servicios/sesion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private sesion = inject(Sesion);
  private autenticacion = inject(Autenticacion);
  private router = inject(Router);

  ngOnInit(): void {
    this.procesarVueltaGoogle();
  }

  private async procesarVueltaGoogle(): Promise<void> {
    const hashGuardado =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('google_oauth_hash') : null;
    const hash = hashGuardado ?? (typeof window !== 'undefined' ? window.location.hash : '');
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    if (!accessToken) return;

    console.log('[Google] Token recibido, obteniendo datos del usuario…');

    if (hashGuardado) {
      try {
        sessionStorage.removeItem('google_oauth_hash');
      } catch {
        /**/
      }
    }

    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;

      const datos = (await res.json()) as { email?: string; name?: string; picture?: string };
      if (!datos?.email) return;

      const usuario = this.autenticacion.iniciarSesionConGoogleUserInfo({
        email: datos.email,
        nombre: datos.name,
        foto: obtenerFotoPerfilAleatoria(),
      });
      this.sesion.guardarSesion(usuario);
      console.log('[Google] Sesión iniciada con', datos.email);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      this.router.navigate(['/']);
    } catch (e) {
      console.warn('[Google] Error al procesar vuelta:', e);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}
