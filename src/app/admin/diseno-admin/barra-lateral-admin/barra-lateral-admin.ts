import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalSidebarServicio } from '../../servicios/modal-sidebar.servicio';

// FASE 1: Interfaz para las opciones del menú
interface OpcionMenu {
  id: string;
  texto: string;
  icono: string;
  ruta?: string;
  activo?: boolean;
  opciones?: string[];
  rutasSubOpciones?: Record<string, string>;
  estaDesplegado?: boolean;
  subOpcionSeleccionada?: string;
}

@Component({
  selector: 'app-barra-lateral-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barra-lateral-admin.html',
  styleUrl: './barra-lateral-admin.css',
})
export class BarraLateralAdmin {
  private modalServicio = inject(ModalSidebarServicio);
  private router = inject(Router);

  estaAbierto = this.modalServicio.estaAbierto;

  // FASE 2: Array de opciones del menú
  opcionesMenu: OpcionMenu[] = [
    {
      id: 'inicio',
      texto: 'Inicio',
      icono: '/iconos/ico-inicio.svg',
      ruta: '/admin/inicio',
      activo: true,
    },
    {
      id: 'catalogo',
      texto: 'Catalogo',
      icono: '/iconos/ico-categoria.svg',
      activo: false,
      opciones: ['Productos', 'Categorias', 'Codigos', 'Billetera', 'Importar Vemper'],
      rutasSubOpciones: {
        'Productos': '/admin/catalogo/productos',
        'Categorias': '/admin/catalogo/categorias',
        'Codigos': '/admin/catalogo/codigos',
        'Billetera': '/admin/catalogo/billetera',
        'Importar Vemper': '/admin/catalogo/importar-vemper',
      },
      estaDesplegado: false,
    },
    {
      id: 'pedidos',
      texto: 'Pedidos',
      icono: '/iconos/ico-orden.svg',
      ruta: '/admin/pedidos',
      activo: false
    },
    {
      id: 'usuarios',
      texto: 'Usuarios',
      icono: '/iconos/ico-cliente.svg',
      ruta: '/admin/usuarios',
      activo: false
    },
    {
      id: 'marketing',
      texto: 'Marketing',
      icono: '/iconos/ico-marketing.svg',
      activo: false,
      opciones: ['Encabezado', 'Promocion', 'Carrusel', 'Categorias', 'Pie de pagina'],
      rutasSubOpciones: {
        'Encabezado': '/admin/marketing/encabezado',
        'Promocion': '/admin/marketing/promocion',
        'Carrusel': '/admin/marketing/carrusel',
        'Categorias': '/admin/marketing/categorias',
        'Pie de pagina': '/admin/marketing/pie-de-pagina',
      },
      estaDesplegado: false,
    },
    {
      id: 'metricas',
      texto: 'Metricas',
      icono: '/iconos/ico-metricas.svg',
      ruta: '/admin/metricas',
      activo: false
    },
    {
      id: 'configuraciones',
      texto: 'Configuraciones',
      icono: '/iconos/ico-configuracion.svg',
      activo: false,
      opciones: ['Metodos de Pago'],
      rutasSubOpciones: {
        'Metodos de Pago': '/admin/configuraciones/metodos-pago',
      },
      estaDesplegado: false,
    }
  ];

  // FASE 3: Cerrar el modal cuando se hace click en el overlay
  cerrarModal() {
    this.modalServicio.cerrar();
  }

  // FASE 4: Manejar click en opción del menú
  seleccionarOpcion(opcion: OpcionMenu) {
    // Si tiene subopciones, solo alternar desplegado (no cerrar modal)
    if (opcion.opciones && opcion.opciones.length > 0) {
      opcion.estaDesplegado = !opcion.estaDesplegado;

      // Si se está cerrando, desactivar la opción y sus subopciones
      if (!opcion.estaDesplegado) {
        opcion.activo = false;
        opcion.subOpcionSeleccionada = undefined;
      } else {
        // Si se está abriendo, activar la opción principal
        this.opcionesMenu.forEach(item => {
          if (item.id !== opcion.id) {
            item.activo = false;
            item.estaDesplegado = false;
            item.subOpcionSeleccionada = undefined;
          }
        })
        opcion.activo = true;
      }
    } else {
      // Si no tiene subopciones, seleccionar y cerrar modal
      this.opcionesMenu.forEach(item => {
        item.activo = false;
        item.estaDesplegado = false;
        item.subOpcionSeleccionada = undefined;
      });
      opcion.activo = true;

      // FASE 5: Navegar y cerrar el modal
      if (opcion.ruta) {
        this.router.navigate([opcion.ruta]);
      }
      this.modalServicio.cerrar();
    }
  }

  // FASE 6: Manejar selección de subopción
  seleccionarSubOpcion(opcion: OpcionMenu, subOpcion: string) {
    // Desactivar todas las opciones principales
    this.opcionesMenu.forEach(item => {
      item.activo = false;
      item.subOpcionSeleccionada = undefined;
    });

    // Marcar la subopción seleccionada
    opcion.subOpcionSeleccionada = subOpcion;

    // FASE 7: Navegar y cerrar el modal
    if (opcion.rutasSubOpciones && opcion.rutasSubOpciones[subOpcion]) {
      this.router.navigate([opcion.rutasSubOpciones[subOpcion]]);
    }
    this.modalServicio.cerrar();
  }

  // FASE 8: Verificar si una opción tiene subopciones
  tieneSubopciones(opcion: OpcionMenu): boolean {
    return opcion.opciones !== undefined && opcion.opciones.length > 0;
  }
}
