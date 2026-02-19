import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, NgZone, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { obtenerFotoPerfilAleatoria } from '../../../nucleo/constantes/fotos-perfil.constantes';
import { UsuarioApiServicio } from '../../../nucleo/servicios/auth-api.servicio';
import { Sesion } from '../../../nucleo/servicios/sesion';
import { NotificacionServicio } from '../../servicios/notificacion';
import { Modal } from '../modal/modal';

type Pais = {
  codigo: string;
  nombre: string;
  bandera: string;
  sigla: string;
};

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (res: { access_token: string }) => void;
        ux_mode?: 'popup' | 'redirect';
        redirect_uri?: string;
      }) => { requestAccessToken: (options?: { prompt?: string }) => void };
    };
  };
};

@Component({
  selector: 'app-modal-autenticacion',
  imports: [Modal],
  templateUrl: './modal-autenticacion.html',
  styleUrl: './modal-autenticacion.css',
})
export class ModalAutenticacion {
  estaAbierto = input.required<boolean>();
  cerrar = output<void>();
  modoActual = signal<'login' | 'registro'>('login');
  enviando = signal(false);

  constructor() {
    effect(() => {
      if (this.estaAbierto()) this.enviando.set(false);
    });
  }

  // Método para cerrar y limpiar
  cerrarModal() {
    this.enviando.set(false);
    this.limpiarFormularios();
    this.cerrar.emit();
  }

  private router = inject(Router);
  private sesion = inject(Sesion);
  private usuarioApi = inject(UsuarioApiServicio);
  private ngZone = inject(NgZone);
  private notificacion = inject(NotificacionServicio);
  private readonly CLIENT_ID_GOOGLE = '345565225524-10c01v4s4rtre2p0e4rprgph6jdvm8c8.apps.googleusercontent.com';

  emailLogin = signal('');
  contrasenaLogin = signal('');
  nombreRegistro = signal('');
  emailRegistro = signal('');
  telefonoRegistro = signal('');
  contrasenaRegistro = signal('');
  confirmarContrasenaRegistro = signal('');

  mostrarContrasena = signal(false);
  mostrarConfirmarContrasena = signal(false);
  selectorPaisAbierto = signal(false);
  paisSeleccionado = signal<Pais>({ codigo: 'bo', nombre: 'Bolivia', bandera: '/imagenes/bolivia.png', sigla: '+591' });

  readonly paises: Pais[] = [
    { codigo: 'bo', nombre: 'Bolivia', bandera: '/imagenes/bolivia.png', sigla: '+591' },
    { codigo: 'mx', nombre: 'México', bandera: '/imagenes/mexico.png', sigla: '+52' },
    { codigo: 'ar', nombre: 'Argentina', bandera: '/imagenes/argentina.png', sigla: '+54' },
    { codigo: 'co', nombre: 'Colombia', bandera: '/imagenes/colombia.png', sigla: '+57' },
    { codigo: 'pe', nombre: 'Perú', bandera: '/imagenes/peru.png', sigla: '+51' },
    { codigo: 'cl', nombre: 'Chile', bandera: '/imagenes/chile.png', sigla: '+56' },
    { codigo: 'ec', nombre: 'Ecuador', bandera: '/imagenes/ecuador.png', sigla: '+593' },
    { codigo: 've', nombre: 'Venezuela', bandera: '/imagenes/venezuela.png', sigla: '+58' },
    { codigo: 'gt', nombre: 'Guatemala', bandera: '/imagenes/guatemala.png', sigla: '+502' },
    { codigo: 'br', nombre: 'Brasil', bandera: '/imagenes/brasil.png', sigla: '+55' },
  ];

  private extraerMensajeBackend(error: unknown): string {
    if (!error || typeof error !== 'object') return '';
    const body = (error as HttpErrorResponse).error;
    if (body && typeof body === 'object' && typeof (body as { mensaje?: string }).mensaje === 'string') {
      return (body as { mensaje: string }).mensaje;
    }
    return '';
  }

  alternarModo() {
    this.modoActual.set(this.modoActual() === 'login' ? 'registro' : 'login');
    this.limpiarFormularios();
  }

  // Método para limpiar todos los campos de los formularios
  private limpiarFormularios() {
    // Limpiar formulario login
    this.emailLogin.set('');
    this.contrasenaLogin.set('');

    // Limpiar formulario registro
    this.nombreRegistro.set('');
    this.emailRegistro.set('');
    this.telefonoRegistro.set('');
    this.contrasenaRegistro.set('');
    this.confirmarContrasenaRegistro.set('');

    // Resetear visibilidad de contraseñas
    this.mostrarContrasena.set(false);
    this.mostrarConfirmarContrasena.set(false);
  }

  alternarVisibilidadContrasena() {
    this.mostrarContrasena.update(v => !v);
  }

  alternarVisibilidadConfirmarContrasena() {
    this.mostrarConfirmarContrasena.update(v => !v);
  }

  alternarSelectorPais() {
    this.selectorPaisAbierto.update(v => !v);
  }

  seleccionarPais(pais: Pais) {
    this.paisSeleccionado.set({ ...pais });
    this.selectorPaisAbierto.set(false);
  }

  /** Actualiza el teléfono permitiendo solo dígitos. */
  onTelefonoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const soloNumeros = input.value.replace(/\D/g, '');
    this.telefonoRegistro.set(soloNumeros);
    input.value = soloNumeros;
  }

  iniciarSesionConGoogle() {
    if (typeof google === 'undefined') {
      this.notificacion.error('Inicio de sesión con Google no disponible. Comprueba la conexión.');
      return;
    }
    const modoAlClic = this.modoActual();
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID_GOOGLE,
      scope: 'email profile openid',
      callback: (res) => this.ngZone.run(() => this.procesarTokenGoogle(res.access_token, modoAlClic)),
      ux_mode: 'popup',
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  }

  private async procesarTokenGoogle(accessToken: string, modoAlClic: 'login' | 'registro'): Promise<void> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const datos = (await res.json()) as { email?: string; name?: string; picture?: string };
      if (!datos?.email) return;

      this.enviando.set(true);
      const nombre = (datos.name ?? '').trim() || 'Usuario';
      const esModoLogin = modoAlClic === 'login';

      this.usuarioApi.login(datos.email, '', true).subscribe({
        next: () => {
          this.enviando.set(false);
          this.limpiarFormularios();
          this.cerrar.emit();
          this.notificacion.exito('¡Bienvenido de nuevo!');
          const usuario = this.sesion.usuarioActual();
          if (usuario?.permisos?.includes('acceder_admin')) {
            this.router.navigate(['/admin/inicio']);
          }
        },
        complete: () => this.enviando.set(false),
        error: (err) => {
          if (esModoLogin) {
            const msg = this.extraerMensajeBackend(err);
            this.notificacion.error(msg || 'No tienes cuenta con este correo. Regístrate primero.');
            this.enviando.set(false);
            return;
          }
          // Modo registro: crear cuenta y luego iniciar sesión
          this.usuarioApi.registrar({
            nombre,
            email: datos.email!,
            social_login: true,
            foto: obtenerFotoPerfilAleatoria(),
          }).subscribe({
            next: () => {
              this.usuarioApi.login(datos.email!, '', true).subscribe({
                next: () => {
                  this.enviando.set(false);
                  this.limpiarFormularios();
                  this.cerrar.emit();
                  this.notificacion.exito('¡Cuenta creada con éxito! Bienvenido');
                },
                error: (err) => {
                  const msg = this.extraerMensajeBackend(err);
                  this.notificacion.error(msg || 'No se pudo iniciar sesión después del registro.');
                  this.enviando.set(false);
                },
                complete: () => this.enviando.set(false),
              });
            },
            error: (err) => {
              const msg = this.extraerMensajeBackend(err);
              this.notificacion.error(msg || 'No se pudo crear la cuenta con Google. Intenta de nuevo.');
              this.enviando.set(false);
            },
          });
        },
      });
    } catch {
      this.notificacion.error('No se pudo completar el inicio de sesión con Google.');
      this.enviando.set(false);
    }
  }

  emitirIniciarSesion() {
    const email = this.emailLogin().trim();
    const contrasena = this.contrasenaLogin();
    if (!email) {
      this.notificacion.advertencia('Ingresa tu email.');
      return;
    }

    this.enviando.set(true);
    this.usuarioApi.login(email, contrasena, false).subscribe({
      next: () => {
        this.enviando.set(false);
        this.limpiarFormularios();
        this.cerrar.emit();
        this.notificacion.exito('¡Bienvenido de nuevo!');
        const usuario = this.sesion.usuarioActual();
        if (usuario?.permisos?.includes('acceder_admin')) {
          this.router.navigate(['/admin/inicio']);
        }
      },
      error: (err) => {
        const msg = this.extraerMensajeBackend(err);
        this.notificacion.error(msg || 'Email o contraseña incorrectos');
        this.enviando.set(false);
      },
      complete: () => this.enviando.set(false),
    });
  }

  emitirRegistro() {
    if (this.contrasenaRegistro() !== this.confirmarContrasenaRegistro()) {
      this.notificacion.advertencia('Las contraseñas no coinciden');
      return;
    }

    const nombre = this.nombreRegistro().trim();
    const email = this.emailRegistro().trim();
    const contrasena = this.contrasenaRegistro();
    if (!nombre || !email || !contrasena) {
      this.notificacion.advertencia('Completa nombre, email y contraseña.');
      return;
    }

    const pais = this.paisSeleccionado();
    const soloDigitos = this.telefonoRegistro().replace(/\D/g, '');
    const numero = soloDigitos.trim();
    const telefono = numero ? `${pais.sigla} ${numero}` : null;
    const nacionalidad = numero ? pais.codigo.toUpperCase() : null;

    this.enviando.set(true);
    this.usuarioApi.registrar({
      nombre,
      email,
      contrasena,
      social_login: false,
      telefono,
      nacionalidad,
      foto: obtenerFotoPerfilAleatoria(),
    }).subscribe({
      next: () => {
        this.usuarioApi.login(email, contrasena, false).subscribe({
          next: () => {
            this.enviando.set(false);
            this.limpiarFormularios();
            this.cerrar.emit();
            this.notificacion.exito('¡Cuenta creada con éxito! Bienvenido');
          },
          error: (err) => {
            const msg = this.extraerMensajeBackend(err);
            this.notificacion.info(msg || 'Cuenta creada. Inicia sesión con tu email y contraseña.');
            this.enviando.set(false);
          },
          complete: () => this.enviando.set(false),
        });
      },
      error: (err) => {
        const msg = this.extraerMensajeBackend(err);
        this.notificacion.error(msg || 'No se pudo crear la cuenta. Revisa los datos o intenta otro email.');
        this.enviando.set(false);
      },
      complete: () => this.enviando.set(false),
    });
  }
}
