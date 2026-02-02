import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SlideCarrusel } from '../../../../../compartido/modelos/configuracion.modelo';

@Component({
  selector: 'app-seccion-carrusel',
  standalone: true,
  imports: [],
  templateUrl: './seccion-carrusel.html',
  styleUrl: './seccion-carrusel.css',
})
export class SeccionCarrusel implements OnInit, OnDestroy {
  private router = inject(Router);

  slides = input.required<SlideCarrusel[]>();

  indiceActivo = signal(0);
  private intervalo!: ReturnType<typeof setInterval>;

  // Variables para control de arrastre con ratón
  private mouseInicio = 0;
  private estaArrastrando = false;
  private umbralArrastre = 50;

  // Detectar si es móvil
  get esMovil(): boolean {
    return window.innerWidth < 768;
  }

  ngOnInit() {
    this.iniciarIntervalo();
  }

  ngOnDestroy() {
    clearInterval(this.intervalo);
  }

  // Determinar estado de cada slide
  esAnterior(i: number): boolean {
    const n = this.indiceActivo();
    const total = this.slides().length;
    return i === (n - 1 + total) % total;
  }

  esActiva(i: number): boolean {
    return i === this.indiceActivo();
  }

  esSiguiente(i: number): boolean {
    const n = this.indiceActivo();
    const total = this.slides().length;
    return i === (n + 1) % total;
  }

  esOculta(i: number): boolean {
    return !this.esAnterior(i) && !this.esActiva(i) && !this.esSiguiente(i);
  }

  // Navegación
  irAnterior() {
    const total = this.slides().length;
    this.indiceActivo.update((n) => (n - 1 + total) % total);
  }

  irSiguiente() {
    const total = this.slides().length;
    this.indiceActivo.update((n) => (n + 1) % total);
  }

  irASlide(indice: number) {
    this.indiceActivo.set(indice);
    this.iniciarIntervalo();
  }

  // Control con ratón
  iniciarArrastre(evento: MouseEvent) {
    evento.preventDefault();
    this.estaArrastrando = false;
    this.mouseInicio = evento.clientX;
    clearInterval(this.intervalo);
  }

  finalizarArrastre(evento: MouseEvent) {
    const mouseActual = evento.clientX;
    const diferencia = mouseActual - this.mouseInicio;

    if (Math.abs(diferencia) > this.umbralArrastre) {
      evento.preventDefault();
      evento.stopPropagation();

      if (diferencia > 0) {
        this.irAnterior();
      } else {
        this.irSiguiente();
      }
      this.estaArrastrando = true;
    } else {
      this.estaArrastrando = false;
    }

    this.iniciarIntervalo();
  }

  cancelarArrastre() {
    if (this.mouseInicio !== 0) {
      this.mouseInicio = 0;
      this.estaArrastrando = false;
      this.iniciarIntervalo();
    }
  }

  // NUEVA FUNCIONALIDAD: Manejar click en imagen con destinos
  manejarClickImagen(evento: MouseEvent, slide: SlideCarrusel) {
    // Si está arrastrando, no navegar
    if (this.estaArrastrando) {
      evento.preventDefault();
      evento.stopPropagation();
      return;
    }

    // Navegar según el tipo de destino
    this.navegarADestino(slide);
  }

  // NUEVA FUNCIONALIDAD: Navegar según el destino del slide
  private navegarADestino(slide: SlideCarrusel): void {
    if (slide.tipoDestino === 'ninguno' || !slide.destinoHandle) {
      return; // No hace nada
    }

    if (slide.tipoDestino === 'producto') {
      this.router.navigate(['/producto', slide.destinoHandle]);
    } else if (slide.tipoDestino === 'categoria') {
      this.router.navigate(['/categoria', slide.destinoHandle]);
    }
  }

  private iniciarIntervalo() {
    clearInterval(this.intervalo);
    this.intervalo = setInterval(() => {
      this.irSiguiente();
    }, 6000);
  }
}
