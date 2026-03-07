import { Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AnuncioTemporal } from '../../../../../compartido/modelos/configuracion.modelo';

@Component({
  selector: 'app-seccion-anuncio-temporal',
  standalone: true,
  imports: [],
  templateUrl: './seccion-anuncio-temporal.html',
  styleUrl: './seccion-anuncio-temporal.css',
})
export class SeccionAnuncioTemporal implements OnInit, OnDestroy {
  private router = inject(Router);

  anuncios = input.required<AnuncioTemporal[]>();

  indiceActivo = signal(0);
  private intervalo!: ReturnType<typeof setInterval>;

  // Filtra solo anuncios activos y dentro del rango de fechas
  anunciosVigentes = computed(() => {
    const ahora = new Date();
    return this.anuncios().filter((anuncio) => {
      if (!anuncio.activo) return false;
      const inicio = new Date(anuncio.fechaInicio);
      const fin = new Date(anuncio.fechaFin);
      return ahora >= inicio && ahora <= fin;
    });
  });

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

  // Navega al siguiente anuncio
  irSiguiente() {
    const total = this.anunciosVigentes().length;
    if (total === 0) return;
    this.indiceActivo.update((n) => (n + 1) % total);
    this.iniciarIntervalo();
  }

  // Navega al anuncio anterior
  irAnterior() {
    const total = this.anunciosVigentes().length;
    if (total === 0) return;
    this.indiceActivo.update((n) => (n - 1 + total) % total);
    this.iniciarIntervalo();
  }

  // Ir a un anuncio específico
  irAAnuncio(indice: number) {
    this.indiceActivo.set(indice);
    this.iniciarIntervalo();
  }

  // Navegar según el destino del anuncio
  navegarADestino(anuncio: AnuncioTemporal): void {
    if (anuncio.tipoDestino === 'ninguno' || !anuncio.destinoHandle) {
      return;
    }

    if (anuncio.tipoDestino === 'producto') {
      this.router.navigate(['/producto', anuncio.destinoHandle]);
    } else if (anuncio.tipoDestino === 'categoria') {
      this.router.navigate(['/categoria', anuncio.destinoHandle]);
    }
  }

  private iniciarIntervalo() {
    clearInterval(this.intervalo);
    this.intervalo = setInterval(() => {
      this.irSiguiente();
    }, 5000);
  }
}
