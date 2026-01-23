import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../../../compartido/componentes/modal/modal';


// FASE 1: Modelo de usuario
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  fotoPerfil: string;
  estado: 'Activo' | 'Inactivo';
  rol: 'Admin' | 'Usuario' | 'Editor' | 'Soporte';
  fechaRegistro: Date;
  ultimoAcceso: Date;
}

@Component({
  selector: 'app-usuarios-admin-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './usuarios-admin-pagina.html',
  styleUrl: './usuarios-admin-pagina.css',
})
export class UsuariosAdminPagina {
  Math = Math;

  // FASE 2: Estado de los dropdowns
  dropdownEstadoAbierto = signal(false);
  dropdownRolAbierto = signal(false);
  dropdownFechaAbierto = signal(false);

  // FASE 3: Valores seleccionados en cada filtro
  textoBusqueda = signal<string>('');
  estadoSeleccionado = signal<string>('Todos');
  rolSeleccionado = signal<string>('Todos los roles');
  fechaSeleccionada = signal<string>('Todas las fechas');

  // FASE 4: Opciones disponibles para cada filtro
  opcionesEstado = ['Todos', 'Activo', 'Inactivo'];
  opcionesRol = ['Todos los roles', 'Admin', 'Usuario', 'Editor', 'Soporte'];
  opcionesFecha = [
    'Todas las fechas',
    'Hoy',
    'Última semana',
    'Último mes',
    'Últimos 3 meses'
  ];

  // FASE 5: Control del modal
  modalAbierto = signal(false);
  usuarioEnEdicion = signal<Usuario | null>(null);

  // FASE 6: Datos del formulario
  formulario = signal({
    nombre: '',
    email: '',
    contrasena: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
    rol: 'Usuario' as 'Admin' | 'Usuario' | 'Editor' | 'Soporte',
    fotoPerfil: '/imagenes/usuarios/default.jpg'
  });

  // FASE 7: Datos de usuarios (temporal, vendrá del servicio)
  usuarios = signal<Usuario[]>([
    {
      id: '1',
      nombre: 'Juan Pérez García',
      email: 'juan.perez@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Activo',
      rol: 'Admin',
      fechaRegistro: new Date('2024-01-15'),
      ultimoAcceso: new Date('2026-01-21')
    },
    {
      id: '2',
      nombre: 'María García López',
      email: 'maria.garcia@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Activo',
      rol: 'Editor',
      fechaRegistro: new Date('2024-02-20'),
      ultimoAcceso: new Date('2026-01-20')
    },
    {
      id: '3',
      nombre: 'Carlos Rodríguez Martínez',
      email: 'carlos.rodriguez@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Inactivo',
      rol: 'Usuario',
      fechaRegistro: new Date('2024-03-10'),
      ultimoAcceso: new Date('2026-01-15')
    },
    {
      id: '4',
      nombre: 'Ana Martínez Sánchez',
      email: 'ana.martinez@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Activo',
      rol: 'Soporte',
      fechaRegistro: new Date('2024-04-05'),
      ultimoAcceso: new Date('2026-01-21')
    },
    {
      id: '5',
      nombre: 'Luis Fernández Torres',
      email: 'luis.fernandez@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Activo',
      rol: 'Usuario',
      fechaRegistro: new Date('2024-05-12'),
      ultimoAcceso: new Date('2026-01-19')
    },
    {
      id: '6',
      nombre: 'Laura Gómez Ruiz',
      email: 'laura.gomez@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Inactivo',
      rol: 'Usuario',
      fechaRegistro: new Date('2024-06-18'),
      ultimoAcceso: new Date('2026-01-10')
    },
    {
      id: '7',
      nombre: 'Pedro López Jiménez',
      email: 'pedro.lopez@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Activo',
      rol: 'Editor',
      fechaRegistro: new Date('2024-07-22'),
      ultimoAcceso: new Date('2026-01-21')
    },
    {
      id: '8',
      nombre: 'Carmen Díaz Moreno',
      email: 'carmen.diaz@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Activo',
      rol: 'Usuario',
      fechaRegistro: new Date('2024-08-30'),
      ultimoAcceso: new Date('2026-01-18')
    },
    {
      id: '9',
      nombre: 'Miguel Sánchez Romero',
      email: 'miguel.sanchez@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Inactivo',
      rol: 'Usuario',
      fechaRegistro: new Date('2024-09-14'),
      ultimoAcceso: new Date('2026-01-05')
    },
    {
      id: '10',
      nombre: 'Isabel Torres Ramírez',
      email: 'isabel.torres@ejemplo.com',
      fotoPerfil: '/imagenes/images1.jpg',
      estado: 'Activo',
      rol: 'Soporte',
      fechaRegistro: new Date('2024-10-25'),
      ultimoAcceso: new Date('2026-01-20')
    }
  ]);

  // FASE 8: Paginación
  paginaActual = signal(1);
  usuariosPorPagina = signal(10);
  totalUsuarios = computed(() => this.usuarios().length);

  // FASE 9: Calcular total de páginas
  totalPaginas = computed(() => {
    return Math.ceil(this.totalUsuarios() / this.usuariosPorPagina());
  });

  // FASE 10: Calcular usuarios a mostrar en la página actual
  usuariosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.usuariosPorPagina();
    const fin = inicio + this.usuariosPorPagina();
    return this.usuarios().slice(inicio, fin);
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

  // FASE 12: Formatear fecha
  formatearFecha(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 60) {
      return `Hace ${minutos} minutos`;
    } else if (horas < 24) {
      return `Hace ${horas} horas`;
    } else if (dias < 7) {
      return `Hace ${dias} días`;
    } else {
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear();
      return `${dia}/${mes}/${año}`;
    }
  }

  // FASE 13: Cambiar a página específica
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  // FASE 14: Ir a página anterior
  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.update(pag => pag - 1);
    }
  }

  // FASE 15: Ir a página siguiente
  paginaSiguiente() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(pag => pag + 1);
    }
  }

  // FASE 16: Alternar visibilidad del dropdown de estado
  alternarEstado() {
    this.dropdownEstadoAbierto.update(abierto => !abierto);
    this.dropdownRolAbierto.set(false);
    this.dropdownFechaAbierto.set(false);
  }

  // FASE 17: Alternar visibilidad del dropdown de rol
  alternarRol() {
    this.dropdownRolAbierto.update(abierto => !abierto);
    this.dropdownEstadoAbierto.set(false);
    this.dropdownFechaAbierto.set(false);
  }

  // FASE 18: Alternar visibilidad del dropdown de fecha
  alternarFecha() {
    this.dropdownFechaAbierto.update(abierto => !abierto);
    this.dropdownEstadoAbierto.set(false);
    this.dropdownRolAbierto.set(false);
  }

  // FASE 19: Seleccionar un estado
  seleccionarEstado(opcion: string) {
    this.estadoSeleccionado.set(opcion);
    this.dropdownEstadoAbierto.set(false);
    this.paginaActual.set(1);
  }

  // FASE 20: Seleccionar un rol
  seleccionarRol(opcion: string) {
    this.rolSeleccionado.set(opcion);
    this.dropdownRolAbierto.set(false);
    this.paginaActual.set(1);
  }

  // FASE 21: Seleccionar una fecha
  seleccionarFecha(opcion: string) {
    this.fechaSeleccionada.set(opcion);
    this.dropdownFechaAbierto.set(false);
    this.paginaActual.set(1);
  }

  // FASE 22: Cerrar todos los dropdowns
  cerrarTodosLosDropdowns() {
    this.dropdownEstadoAbierto.set(false);
    this.dropdownRolAbierto.set(false);
    this.dropdownFechaAbierto.set(false);
  }

  // FASE 23: Limpiar todos los filtros
  limpiarFiltros() {
    this.textoBusqueda.set('');
    this.estadoSeleccionado.set('Todos');
    this.rolSeleccionado.set('Todos los roles');
    this.fechaSeleccionada.set('Todas las fechas');
    this.paginaActual.set(1);
  }

  // FASE 24: Abrir modal para crear nuevo usuario
  abrirModalCrear() {
    this.usuarioEnEdicion.set(null);
    this.formulario.set({
      nombre: '',
      email: '',
      contrasena: '',
      estado: 'Activo',
      rol: 'Usuario',
      fotoPerfil: '/imagenes/usuarios/default.jpg'
    });
    this.modalAbierto.set(true);
  }

  // FASE 25: Abrir modal para editar usuario
  editarUsuario(usuario: Usuario) {
    this.usuarioEnEdicion.set(usuario);
    this.formulario.set({
      nombre: usuario.nombre,
      email: usuario.email,
      contrasena: '',
      estado: usuario.estado,
      rol: usuario.rol,
      fotoPerfil: usuario.fotoPerfil
    });
    this.modalAbierto.set(true);
  }

  // FASE 26: Cerrar modal
  cerrarModal() {
    this.modalAbierto.set(false);
    this.usuarioEnEdicion.set(null);
  }

  // FASE 27: Guardar usuario (crear o actualizar)
  guardarUsuario() {
    console.log('Guardar usuario:', this.formulario());
    // Aquí iría la lógica para guardar en el servicio
    this.cerrarModal();
  }

  // FASE 28: Eliminar usuario
  eliminarUsuario(id: string) {
    console.log('Eliminar usuario:', id);
    // Aquí mostrarías confirmación y eliminarías el usuario
  }

  // FASE 29: Manejar cambio de imagen
  manejarCambioImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.formulario.update(form => ({
          ...form,
          fotoPerfil: e.target?.result as string
        }));
      };
      reader.readAsDataURL(input.files[0]);
    }
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

  // FASE 34: Actualizar campo rol del formulario
  actualizarRol(event: Event) {
    const valor = (event.target as HTMLSelectElement).value as 'Admin' | 'Usuario' | 'Editor' | 'Soporte';
    this.formulario.update(f => ({ ...f, rol: valor }));
  }

  // FASE 35: Actualizar estado a Activo
  actualizarEstadoActivo() {
    this.formulario.update(f => ({ ...f, estado: 'Activo' }));
  }

  // FASE 36: Actualizar estado a Inactivo
  actualizarEstadoInactivo() {
    this.formulario.update(f => ({ ...f, estado: 'Inactivo' }));
  }

  // FASE 37: Actualizar rol a Admin
  actualizarRolAdmin() {
    this.formulario.update(f => ({ ...f, rol: 'Admin' }));
  }

  // FASE 38: Actualizar rol a Usuario
  actualizarRolUsuario() {
    this.formulario.update(f => ({ ...f, rol: 'Usuario' }));
  }

  // FASE 39: Actualizar rol a Editor
  actualizarRolEditor() {
    this.formulario.update(f => ({ ...f, rol: 'Editor' }));
  }

  // FASE 40: Actualizar rol a Soporte
  actualizarRolSoporte() {
    this.formulario.update(f => ({ ...f, rol: 'Soporte' }));
  }
}
