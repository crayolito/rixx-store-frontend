import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Modal } from '../../../../../../compartido/componentes/modal/modal';

// FASE 1: Modelos de datos
interface Categoria {
  id: string;
  nombre: string;
  seleccionada: boolean;
}

interface CampoAdicional {
  id: string;
  etiqueta: string;
  identificador: string;
  tipo: 'texto' | 'numero';
  requerido: boolean;
}

interface Precio {
  id: string;
  nombre: string;
  precioBase: number;
  margenClienteFinal: number;
  margenRevendedor: number;
  margenMayorista: number;
  porcentajeDescuento: number;
  soloClienteFinal: boolean;
  precioActivo: boolean;
}

@Component({
  selector: 'app-producto-formulario-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './producto-formulario-pagina.html',
  styleUrl: './producto-formulario-pagina.css',
})
export class ProductoFormularioPagina {
  // FASE 2: Datos del formulario
  titulo = signal<string>('');
  descripcion = signal<string>('');
  instrucciones = signal<string>('');
  terminos = signal<string>('');
  esProductoManual = signal<boolean>(true);
  estadoProducto = signal<'activo' | 'inactivo' | 'agotado'>('activo');

  // FASE 3: Categorías
  categorias = signal<Categoria[]>([
    { id: '1', nombre: 'Categoría 1', seleccionada: true },
    { id: '2', nombre: 'Categoría 2', seleccionada: true },
    { id: '3', nombre: 'Categoría 3', seleccionada: true },
    { id: '4', nombre: 'Categoría 4', seleccionada: false },
    { id: '5', nombre: 'Categoría 5', seleccionada: false },
  ]);

  buscarCategoria = signal<string>('');
  mostrarOpcionesCategorias = signal<boolean>(false);

  // FASE 4: Campos adicionales
  camposAdicionales = signal<CampoAdicional[]>([
    {
      id: '1',
      etiqueta: 'ID del jugador',
      identificador: 'id_del_jugador',
      tipo: 'texto',
      requerido: true,
    },
  ]);

  // FASE 5: Precios
  precios = signal<Precio[]>([]);

  // FASE 6: Modal para tipo de campo
  modalTipoCampoAbierto = signal<boolean>(false);
  campoAdicionalEditando = signal<CampoAdicional | null>(null);
  etiquetaCampo = signal<string>('');
  tipoCampoSeleccionado = signal<'texto' | 'numero'>('texto');
  campoRequerido = signal<boolean>(true);

  // FASE 7: Modal para precio
  modalPrecioAbierto = signal<boolean>(false);
  precioEditando = signal<Precio | null>(null);
  nombrePrecio = signal<string>('');
  precioBase = signal<number>(0);
  porcentajeDescuento = signal<number>(0);
  margenClienteFinal = signal<number>(0);
  margenRevendedor = signal<number>(0);
  margenMayorista = signal<number>(0);
  soloClienteFinal = signal<boolean>(false);
  precioActivo = signal<boolean>(true);

  // FASE 8: Drag and Drop
  elementoArrastrando = signal<string | null>(null);
  tipoArrastrando = signal<'campo' | 'precio' | null>(null);
  indiceArrastrando = signal<number | null>(null);

  // FASE 9: Computed
  categoriasSeleccionadas = computed(() =>
    this.categorias().filter(cat => cat.seleccionada)
  );

  categoriasFiltradas = computed(() => {
    const busqueda = this.buscarCategoria().toLowerCase();
    if (!busqueda) return this.categorias();
    return this.categorias().filter(cat =>
      cat.nombre.toLowerCase().includes(busqueda)
    );
  });

  hayResultadosBusqueda = computed(() =>
    this.categoriasFiltradas().length > 0
  );

  precioClienteFinalCalculado = computed(() => {
    const base = this.precioBase();
    const margen = this.margenClienteFinal() / 100;
    return base * (1 + margen);
  });

  precioRevendedorCalculado = computed(() => {
    const base = this.precioBase();
    const margen = this.margenRevendedor() / 100;
    return base * (1 + margen);
  });

  precioMayoristaCalculado = computed(() => {
    const base = this.precioBase();
    const margen = this.margenMayorista() / 100;
    return base * (1 + margen);
  });

  constructor(private router: Router) { }

  // FASE 10: Navegación
  volver() {
    this.router.navigate(['/admin/productos']);
  }

  guardar() {
    console.log('Guardando formulario...', {
      titulo: this.titulo(),
      descripcion: this.descripcion(),
      categorias: this.categoriasSeleccionadas(),
      camposAdicionales: this.camposAdicionales(),
      precios: this.precios(),
      estadoProducto: this.estadoProducto(),
    });
  }

  // FASE 11: Gestión de categorías
  toggleCategoria(categoria: Categoria) {
    this.categorias.update(cats =>
      cats.map(cat =>
        cat.id === categoria.id
          ? { ...cat, seleccionada: !cat.seleccionada }
          : cat
      )
    );
  }

  eliminarCategoria(categoria: Categoria) {
    this.categorias.update(cats =>
      cats.map(cat =>
        cat.id === categoria.id
          ? { ...cat, seleccionada: false }
          : cat
      )
    );
  }

  // FASE 12: Gestión de campos adicionales
  abrirModalAgregarCampo() {
    this.campoAdicionalEditando.set(null);
    this.etiquetaCampo.set('');
    this.tipoCampoSeleccionado.set('texto');
    this.campoRequerido.set(true);
    this.modalTipoCampoAbierto.set(true);
  }

  abrirModalEditarCampo(campo: CampoAdicional) {
    this.campoAdicionalEditando.set(campo);
    this.etiquetaCampo.set(campo.etiqueta);
    this.tipoCampoSeleccionado.set(campo.tipo);
    this.campoRequerido.set(campo.requerido);
    this.modalTipoCampoAbierto.set(true);
  }

  cerrarModalTipoCampo() {
    this.modalTipoCampoAbierto.set(false);
  }

  generarIdentificador(etiqueta: string): string {
    return etiqueta
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  guardarCampoAdicional() {
    const etiqueta = this.etiquetaCampo().trim();
    if (!etiqueta) {
      alert('Debes ingresar una etiqueta para el campo');
      return;
    }

    const identificador = this.generarIdentificador(etiqueta);

    const nuevoCampo: CampoAdicional = {
      id: Date.now().toString(),
      etiqueta,
      identificador,
      tipo: this.tipoCampoSeleccionado(),
      requerido: this.campoRequerido(),
    };

    if (this.campoAdicionalEditando()) {
      this.camposAdicionales.update(campos =>
        campos.map(campo =>
          campo.id === this.campoAdicionalEditando()!.id
            ? { ...nuevoCampo, id: campo.id }
            : campo
        )
      );
    } else {
      this.camposAdicionales.update(campos => [...campos, nuevoCampo]);
    }

    this.cerrarModalTipoCampo();
  }

  eliminarCampoAdicional(campoId: string) {
    this.camposAdicionales.update(campos =>
      campos.filter(campo => campo.id !== campoId)
    );
  }

  // FASE 13: Gestión de precios
  abrirModalAgregarPrecio() {
    this.precioEditando.set(null);
    this.nombrePrecio.set('');
    this.precioBase.set(0);
    this.porcentajeDescuento.set(0);
    this.margenClienteFinal.set(0);
    this.margenRevendedor.set(0);
    this.margenMayorista.set(0);
    this.soloClienteFinal.set(false);
    this.precioActivo.set(true);
    this.modalPrecioAbierto.set(true);
  }

  abrirModalEditarPrecio(precio: Precio) {
    this.precioEditando.set(precio);
    this.nombrePrecio.set(precio.nombre);
    this.precioBase.set(precio.precioBase);
    this.porcentajeDescuento.set(precio.porcentajeDescuento);
    this.margenClienteFinal.set(precio.margenClienteFinal);
    this.margenRevendedor.set(precio.margenRevendedor);
    this.margenMayorista.set(precio.margenMayorista);
    this.soloClienteFinal.set(precio.soloClienteFinal);
    this.precioActivo.set(precio.precioActivo);
    this.modalPrecioAbierto.set(true);
  }

  cerrarModalPrecio() {
    this.modalPrecioAbierto.set(false);
  }

  guardarPrecio() {
    const nombre = this.nombrePrecio().trim();
    if (!nombre) {
      alert('Debes ingresar un nombre para el precio');
      return;
    }

    if (this.precioBase() <= 0) {
      alert('El precio base debe ser mayor a 0');
      return;
    }

    const nuevoPrecio: Precio = {
      id: Date.now().toString(),
      nombre,
      precioBase: this.precioBase(),
      margenClienteFinal: this.margenClienteFinal(),
      margenRevendedor: this.margenRevendedor(),
      margenMayorista: this.margenMayorista(),
      porcentajeDescuento: this.porcentajeDescuento(),
      soloClienteFinal: this.soloClienteFinal(),
      precioActivo: this.precioActivo(),
    };

    if (this.precioEditando()) {
      this.precios.update(precios =>
        precios.map(precio =>
          precio.id === this.precioEditando()!.id
            ? { ...nuevoPrecio, id: precio.id }
            : precio
        )
      );
    } else {
      this.precios.update(precios => [...precios, nuevoPrecio]);
    }

    this.cerrarModalPrecio();
  }

  eliminarPrecio(precioId: string) {
    this.precios.update(precios =>
      precios.filter(precio => precio.id !== precioId)
    );
  }

  // FASE 14: Drag and Drop - Campos Adicionales
  iniciarArrastreCampo(event: DragEvent, campoId: string, indice: number) {
    this.elementoArrastrando.set(campoId);
    this.tipoArrastrando.set('campo');
    this.indiceArrastrando.set(indice);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', campoId);
    }
  }

  permitirSoltarCampo(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  soltarCampo(event: DragEvent, indiceDestino: number) {
    event.preventDefault();
    event.stopPropagation();

    const indiceOrigen = this.indiceArrastrando();
    if (indiceOrigen === null || this.tipoArrastrando() !== 'campo') return;

    if (indiceOrigen === indiceDestino) {
      this.limpiarArrastre();
      return;
    }

    this.camposAdicionales.update(campos => {
      const nuevoArray = [...campos];
      const [elementoMovido] = nuevoArray.splice(indiceOrigen, 1);
      nuevoArray.splice(indiceDestino, 0, elementoMovido);
      return nuevoArray;
    });

    this.limpiarArrastre();
  }

  // FASE 15: Drag and Drop - Precios
  iniciarArrastrePrecio(event: DragEvent, precioId: string, indice: number) {
    this.elementoArrastrando.set(precioId);
    this.tipoArrastrando.set('precio');
    this.indiceArrastrando.set(indice);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', precioId);
    }
  }

  permitirSoltarPrecio(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  soltarPrecio(event: DragEvent, indiceDestino: number) {
    event.preventDefault();
    event.stopPropagation();

    const indiceOrigen = this.indiceArrastrando();
    if (indiceOrigen === null || this.tipoArrastrando() !== 'precio') return;

    if (indiceOrigen === indiceDestino) {
      this.limpiarArrastre();
      return;
    }

    this.precios.update(precios => {
      const nuevoArray = [...precios];
      const [elementoMovido] = nuevoArray.splice(indiceOrigen, 1);
      nuevoArray.splice(indiceDestino, 0, elementoMovido);
      return nuevoArray;
    });

    this.limpiarArrastre();
  }

  limpiarArrastre() {
    this.elementoArrastrando.set(null);
    this.tipoArrastrando.set(null);
    this.indiceArrastrando.set(null);
  }

  estaArrastrando(campoId: string): boolean {
    return this.elementoArrastrando() === campoId;
  }

  estaArrastrandoPrecio(precioId: string): boolean {
    return this.elementoArrastrando() === precioId;
  }
}
