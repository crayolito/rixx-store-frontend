import { Component, input, output, signal } from '@angular/core';
import { Modal } from '../modal/modal';

type Pais = {
  codigo: string;
  nombre: string;
  bandera: string;
  sigla: string;
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

  mostrarContrasena = signal(false);
  mostrarConfirmarContrasena = signal(false);

  selectorPaisAbierto = signal(false);
  paisSeleccionado = signal<Pais>({ codigo: 'mx', nombre: 'México', bandera: '/imagenes/mexico.png', sigla: '+52' });
  readonly paises: Pais[] = [
    { codigo: 'mx', nombre: 'México', bandera: '/imagenes/mexico.png', sigla: '+52' },
    { codigo: 'ar', nombre: 'Argentina', bandera: '/imagenes/argentina.png', sigla: '+54' },
    { codigo: 'co', nombre: 'Colombia', bandera: '/imagenes/colombia.png', sigla: '+57' },
    { codigo: 'pe', nombre: 'Perú', bandera: '/imagenes/peru.png', sigla: '+51' },
    { codigo: 'cl', nombre: 'Chile', bandera: '/imagenes/chile.png', sigla: '+56' },
    { codigo: 'ec', nombre: 'Ecuador', bandera: '/imagenes/ecuador.png', sigla: '+593' },
    { codigo: 've', nombre: 'Venezuela', bandera: '/imagenes/venezuela.png', sigla: '+58' },
    { codigo: 'bo', nombre: 'Bolivia', bandera: '/imagenes/bolivia.png', sigla: '+591' },
    { codigo: 'gt', nombre: 'Guatemala', bandera: '/imagenes/guatemala.png', sigla: '+502' },
    { codigo: 'br', nombre: 'Brasil', bandera: '/imagenes/brasil.png', sigla: '+55' },
  ];

  alternarModo() {
    this.modoActual.set(this.modoActual() === 'login' ? 'registro' : 'login');
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
}
