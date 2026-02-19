import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BloqueEstadoTablaComponente } from '../../../../compartido/componentes/bloque-estado-tabla/bloque-estado-tabla';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { PAISES, type Pais } from '../../../../compartido/datos/paises.datos';
import { NotificacionServicio } from '../../../../compartido/servicios/notificacion';
import { UsuarioApiItem, UsuarioApiServicio } from '../../../../nucleo/servicios/auth-api.servicio';
import { CloudinaryApiServicio } from '../../../../nucleo/servicios/cloudinary-api.servicio';


interface Rol {
  id_rol: number;
  nombre: string;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fotoPerfil: string;
  estado: 'Activo' | 'Inactivo';
  rol: string;
  saldo?: number;
  nacionalidad?: string;
  socialLogin: boolean;
  ultimoAcceso?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

@Component({
  selector: 'app-usuarios-admin-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, BloqueEstadoTablaComponente],
  templateUrl: './usuarios-admin-pagina.html',
  styleUrl: './usuarios-admin-pagina.css',
})
export class UsuariosAdminPagina implements OnInit  {
  Math = Math;

  private usuarioApi = inject(UsuarioApiServicio);
  private notificacion = inject(NotificacionServicio);
  private cloudinaryApi = inject(CloudinaryApiServicio);

  subiendoFoto = signal(false);
  filtrosVisibles = signal(true);
  dropdownEstadoAbierto = signal(false);
  dropdownRolAbierto = signal(false);

  textoBusqueda = signal<string>('');
  estadoSeleccionado = signal<string>('Todos');
  rolSeleccionado = signal<string>('Todos los roles');
  fechaUltimoAcceso = signal<string>('');

  opcionesEstado = ['Todos', 'Activo', 'Inactivo'];
  roles = signal<Rol[]>([]);
  opcionesRol = computed(() => ['Todos los roles', ...this.roles().map(r => r.nombre)]);

  // FASE 5: Control del modal
  modalAbierto = signal(false);
  usuarioEnEdicion = signal<Usuario | null>(null);

  formulario = signal({
    nombre: '',
    email: '',
    contrasena: '',
    telefono: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    rol: 'Cliente',
    fotoPerfil: '/imagenes/usuarios/default.jpg'
  });

  // FASE 7: Datos de usuarios (temporal, vendrá del servicio)
  usuarios = signal<Usuario[]>([]);
  estaCargando = signal(false);
  totalDesdeApi = signal(0);

  // FASE 8: Paginación
  paginaActual = signal(1);
  usuariosPorPagina = signal(10);
  hayFiltrosActivos = computed(() => {
    const busqueda = this.textoBusqueda().trim();
    const estado = this.estadoSeleccionado();
    const rol = this.rolSeleccionado();
    const fecha = this.fechaUltimoAcceso();
    return busqueda !== '' || estado !== 'Todos' || rol !== 'Todos los roles' || fecha !== '';
  });

  totalUsuarios = computed(() => {
    if (this.hayFiltrosActivos()) {
      return this.aplicarFiltrosClientes(this.usuarios()).length;
    }
    return this.totalDesdeApi() > 0 ? this.totalDesdeApi() : this.usuarios().length;
  });

  // FASE 9: Calcular total de páginas
  totalPaginas = computed(() => {
    return Math.ceil(this.totalUsuarios() / this.usuariosPorPagina());
  });

  usuariosPaginados = computed(() => {
    const todos = this.usuarios();
    if (this.hayFiltrosActivos()) {
      const filtrados = this.aplicarFiltrosClientes(todos);
      const inicio = (this.paginaActual() - 1) * this.usuariosPorPagina();
      const fin = inicio + this.usuariosPorPagina();
      return filtrados.slice(inicio, fin);
    }
    return todos;
  });

  // FASE 11: Obtener números de página a mostrar
  paginasAMostrar = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      if (actual <= 4) {
        for (let i = 1; i <= 5; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(total);
      } else if (actual >= total - 3) {
        paginas.push(1);
        paginas.push(-1);
        for (let i = total - 4; i <= total; i++) {
          paginas.push(i);
        }
      } else {
        paginas.push(1);
        paginas.push(-1);
        for (let i = actual - 1; i <= actual + 1; i++) {
          paginas.push(i);
        }
        paginas.push(-1);
        paginas.push(total);
      }
    }
    return paginas;
  });

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarUsuarios();
  }

  cargarRoles(): void {
    this.usuarioApi.listarRoles().subscribe({
      next: (respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          this.roles.set(respuesta.datos);
        }
      },
      error: () => {
        this.notificacion.error('No se pudieron cargar los roles');
      }
    });
  }

  cargarUsuarios(): void {
    this.estaCargando.set(true);
    this.usuarioApi.listarUsuarios(
      this.paginaActual(),
      this.usuariosPorPagina()
    ).subscribe({
      next: (respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          const datosArray = Array.isArray(respuesta.datos)
            ? respuesta.datos
            : respuesta.datos.datos ?? [];
          const total = respuesta.total ?? (Array.isArray(respuesta.datos) ? null : respuesta.datos.total) ?? datosArray.length;
          const mapeados = datosArray.map((u) => this.mapearUsuarioApi(u));
          this.usuarios.set(mapeados);
          this.totalDesdeApi.set(total);
        }
      },
      error: () => {
        this.notificacion.error('No se pudieron cargar los usuarios');
      },
      complete: () => this.estaCargando.set(false),
    });
  }

  private mapearUsuarioApi(usuario: UsuarioApiItem): Usuario {
    return {
      id: String(usuario.id),
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono ?? undefined,
      fotoPerfil: usuario.foto ?? '/imagenes/images1.jpg',
      estado: usuario.estado === 'activo' ? 'Activo' : 'Inactivo',
      rol: usuario.rol ?? 'Cliente',
      saldo: usuario.saldo,
      nacionalidad: usuario.nacionalidad ?? undefined,
      socialLogin: usuario.socialLogin ?? false,
      ultimoAcceso: usuario.ultimoAcceso,
      fechaCreacion: usuario.fechaCreacion,
      fechaActualizacion: usuario.fechaActualizacion,
    };
  }

  // FASE 13: Cambiar a página específica
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      if (!this.hayFiltrosActivos()) this.cargarUsuarios();
    }
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(pag => pag - 1);
      if (!this.hayFiltrosActivos()) this.cargarUsuarios();
    }
  }

  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(pag => pag + 1);
      if (!this.hayFiltrosActivos()) this.cargarUsuarios();
    }
  }

  // FASE 16: Alternar visibilidad del dropdown de estado
  alternarEstado() {
    this.dropdownEstadoAbierto.update(abierto => !abierto);
    this.dropdownRolAbierto.set(false);
  }

  alternarRol() {
    this.dropdownRolAbierto.update(abierto => !abierto);
    this.dropdownEstadoAbierto.set(false);
  }

  seleccionarEstado(opcion: string) {
    this.estadoSeleccionado.set(opcion);
    this.dropdownEstadoAbierto.set(false);
    this.paginaActual.set(1);
  }

  seleccionarRol(opcion: string) {
    this.rolSeleccionado.set(opcion);
    this.dropdownRolAbierto.set(false);
    this.paginaActual.set(1);
  }

  actualizarBusqueda(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.textoBusqueda.set(valor);
    this.paginaActual.set(1);
  }

  alternarFiltros() {
    this.filtrosVisibles.update(v => !v);
  }

  cerrarTodosLosDropdowns() {
    this.dropdownEstadoAbierto.set(false);
    this.dropdownRolAbierto.set(false);
  }

  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.estadoSeleccionado.set('Todos');
    this.rolSeleccionado.set('Todos los roles');
    this.fechaUltimoAcceso.set('');
    this.paginaActual.set(1);
    this.cargarUsuarios();
  }

  actualizarFiltroFechaUltimoAcceso(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.fechaUltimoAcceso.set(valor);
    this.paginaActual.set(1);
  }

  limpiarFiltroFechaUltimoAcceso() {
    this.fechaUltimoAcceso.set('');
    this.paginaActual.set(1);
  }

  // FASE 24: Abrir modal para crear nuevo usuario
  abrirModalCrear() {
    this.usuarioEnEdicion.set(null);
    const roles = this.roles();
    const rolDefault = roles.find(r => r.nombre === 'Cliente')?.nombre ?? roles[0]?.nombre ?? 'Cliente';
    this.formulario.set({
      nombre: '',
      email: '',
      contrasena: '',
      telefono: '',
      estado: 'Activo',
      rol: rolDefault,
      fotoPerfil: '/imagenes/usuarios/default.jpg'
    });
    this.modalAbierto.set(true);
  }

  editarUsuario(usuario: Usuario) {
    this.usuarioEnEdicion.set(usuario);
    this.formulario.set({
      nombre: usuario.nombre,
      email: usuario.email,
      contrasena: '',
      telefono: usuario.telefono ?? '',
      estado: usuario.estado,
      rol: usuario.rol,
      fotoPerfil: usuario.fotoPerfil
    });
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.usuarioEnEdicion.set(null);
    const roles = this.roles();
    const rolDefault = roles.find(r => r.nombre === 'Cliente')?.nombre ?? roles[0]?.nombre ?? 'Cliente';
    this.formulario.set({
      nombre: '',
      email: '',
      contrasena: '',
      telefono: '',
      estado: 'Activo',
      rol: rolDefault,
      fotoPerfil: '/imagenes/usuarios/default.jpg'
    });
  }

  guardarUsuario() {
    const form = this.formulario();
    const rol = this.roles().find(r => r.nombre === form.rol);
    const usuario = this.usuarioEnEdicion();
    if (usuario) {
      this.usuarioApi.actualizarUsuario(Number(usuario.id), {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        estado: form.estado.toLowerCase(),
        idRol: rol?.id_rol ?? undefined,
        telefono: form.telefono.trim() || null,
        foto: form.fotoPerfil !== '/imagenes/usuarios/default.jpg' ? form.fotoPerfil : undefined,
      }).subscribe({
        next: () => {
          this.notificacion.exito('Usuario actualizado correctamente');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: () => this.notificacion.error('No se pudo actualizar el usuario'),
      });
    } else {
      if (!form.nombre.trim() || !form.email.trim()) {
        this.notificacion.advertencia('Nombre y correo son obligatorios');
        return;
      }
      this.usuarioApi.crearUsuario({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        contrasena: form.contrasena || undefined,
        estado: form.estado.toLowerCase(),
        idRol: rol?.id_rol ?? 2,
        telefono: form.telefono.trim() || null,
        foto: form.fotoPerfil !== '/imagenes/usuarios/default.jpg' ? form.fotoPerfil : undefined,
      }).subscribe({
        next: () => {
          this.notificacion.exito('Usuario creado correctamente');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: () => this.notificacion.error('No se pudo crear el usuario'),
      });
    }
  }

  eliminarUsuario(id: string) {
    this.usuarioApi.eliminarUsuario(Number(id)).subscribe({
      next: (respuesta) => {
        if (respuesta?.exito === false) {
          this.notificacion.error(respuesta.mensaje || 'No se pudo eliminar el usuario');
          return;
        }
        this.notificacion.exito('Usuario eliminado');
        this.cargarUsuarios();
      },
      error: (err) => {
        const mensaje = this.extraerMensajeError(err);
        this.notificacion.error(mensaje || 'No se pudo eliminar el usuario');
      },
    });
  }

  private aplicarFiltrosClientes(usuarios: Usuario[]): Usuario[] {
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    const estado = this.estadoSeleccionado();
    const rol = this.rolSeleccionado();
    const fechaFiltro = this.fechaUltimoAcceso();

    return usuarios.filter((u) => {
      if (busqueda) {
        const coincideNombre = u.nombre.toLowerCase().includes(busqueda);
        const coincideEmail = u.email.toLowerCase().includes(busqueda);
        if (!coincideNombre && !coincideEmail) return false;
      }
      if (estado !== 'Todos' && u.estado !== estado) return false;
      if (rol !== 'Todos los roles' && u.rol !== rol) return false;
      if (fechaFiltro && u.ultimoAcceso) {
        const fechaUsuario = this.extraerFechaISO(u.ultimoAcceso);
        if (fechaUsuario !== fechaFiltro) return false;
      }
      if (fechaFiltro && !u.ultimoAcceso) return false;
      return true;
    });
  }

  private extraerFechaISO(fechaISO: string): string {
    if (!fechaISO) return '';
    const d = new Date(fechaISO);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
  }

  private extraerMensajeError(error: unknown): string {
    if (!error || typeof error !== 'object') return '';
    const resp = error as HttpErrorResponse;
    const body = resp?.error;
    if (body && typeof body === 'object' && typeof (body as { mensaje?: string }).mensaje === 'string') {
      return (body as { mensaje: string }).mensaje;
    }
    if (typeof body === 'string') return body;
    if (resp?.status === 401) return 'Sesión expirada. Inicia sesión de nuevo.';
    if (resp?.status === 403) return 'No tienes permiso para eliminar usuarios.';
    if (resp?.status === 404) return 'Usuario no encontrado.';
    return '';
  }

  manejarCambioImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this.notificacion.error('Solo se permiten archivos de imagen');
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      this.notificacion.error('La imagen no debe superar 5MB');
      return;
    }

    this.subiendoFoto.set(true);
    this.notificacion.info('Subiendo imagen...');

    this.cloudinaryApi.subirImagen(archivo).subscribe({
      next: (urlFoto) => {
        this.subiendoFoto.set(false);
        if (!urlFoto) {
          this.notificacion.error('Error al subir la imagen');
          return;
        }
        this.formulario.update(form => ({ ...form, fotoPerfil: urlFoto }));
        this.notificacion.exito('Imagen subida correctamente');
      },
      error: () => {
        this.subiendoFoto.set(false);
        this.notificacion.error('Error al subir la imagen');
      },
    });

    input.value = '';
  }

  // FASE 30: Actualizar campo nombre del formulario
  actualizarNombre(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.formulario.update(f => ({ ...f, nombre: valor }));
  }

  // FASE 31: Actualizar campo email del formulario
  actualizarEmail(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.formulario.update(f => ({ ...f, email: valor }));
  }

  actualizarTelefono(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.formulario.update(f => ({ ...f, telefono: valor }));
  }

  formatearFechaISO(fecha: string | undefined): string {
    if (!fecha) return '—';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  }

  obtenerPaisPorCodigo(codigo: string | undefined): Pais | null {
    if (!codigo || !codigo.trim()) return null;
    const buscado = codigo.trim().toUpperCase();
    return PAISES.find(p => p.codigo.toUpperCase() === buscado) ?? null;
  }

  // FASE 32: Actualizar campo contraseña del formulario
  actualizarContrasena(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.formulario.update(f => ({ ...f, contrasena: valor }));
  }

  // FASE 33: Actualizar campo estado del formulario
  actualizarEstado(event: Event) {
    const valor = (event.target as HTMLSelectElement).value as 'Activo' | 'Inactivo';
    this.formulario.update(f => ({ ...f, estado: valor }));
  }

  actualizarRol(rol: string) {
    this.formulario.update(f => ({ ...f, rol }));
  }

  actualizarEstadoActivo() {
    this.formulario.update(f => ({ ...f, estado: 'Activo' }));
  }

  actualizarEstadoInactivo() {
    this.formulario.update(f => ({ ...f, estado: 'Inactivo' }));
  }
}
