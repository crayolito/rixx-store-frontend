import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AnuncioTemporal } from '../../modelos/configuracion.modelo';
import { Modal } from '../modal/modal';

const CLAVE_NO_MOSTRAR_ANUNCIOS = 'no-mostrar-anuncios-popup';

/**
 * Popup de anuncios que solo se muestra en el HOME.
 * - Muestra un anuncio aleatorio de los vigentes
 * - Permite al usuario marcar "No volver a mostrar"
 * - Guarda la preferencia en localStorage
 */
@Component({
  selector: 'app-popup-bienvenida',
  standalone: true,
  imports: [Modal],
  templateUrl: './popup-bienvenida.html',
  styleUrl: './popup-bienvenida.css',
})
export class PopupBienvenida {
  private router = inject(Router);

  /** Lista de anuncios desde el componente padre (inicio-pagina) */
  anuncios = input<AnuncioTemporal[]>([]);

  estaVisible = signal(false);
  noVolverAMostrar = signal(false);
  anuncioSeleccionado = signal<AnuncioTemporal | null>(null);
  
  private yaIntentado = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Detecta si es móvil para mostrar la imagen correcta */
  get esMovil(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  /** Filtra anuncios activos y dentro del rango de fechas */
  anunciosVigentes = computed(() => {
    const lista = this.anuncios();
    if (!lista || lista.length === 0) return [];
    
    const ahora = new Date();
    console.log('[Popup] Fecha actual:', ahora.toISOString());
    
    return lista.filter((anuncio) => {
      if (!anuncio.activo) {
        console.log('[Popup] Anuncio inactivo:', anuncio.id);
        return false;
      }
      if (!anuncio.fechaInicio || !anuncio.fechaFin) {
        console.log('[Popup] Anuncio sin fechas:', anuncio.id);
        return false;
      }
      const inicio = new Date(anuncio.fechaInicio);
      const fin = new Date(anuncio.fechaFin);
      const vigente = ahora >= inicio && ahora <= fin;
      console.log('[Popup] Verificando anuncio:', {
        id: anuncio.id,
        ahora: ahora.toISOString(),
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        ahoraEsMayorQueInicio: ahora >= inicio,
        ahoraEsMenorQueFin: ahora <= fin,
        vigente
      });
      return vigente;
    });
  });

  constructor() {
    // Usar effect para reaccionar cuando lleguen los anuncios
    effect(() => {
      const anunciosRecibidos = this.anuncios();
      const vigentes = this.anunciosVigentes();
      
      console.log('[Popup] Anuncios recibidos:', anunciosRecibidos?.length ?? 0);
      console.log('[Popup] Anuncios vigentes:', vigentes.length);
      console.log('[Popup] Ya intentado:', this.yaIntentado);
      console.log('[Popup] Usuario no quiere:', this.usuarioNoQuiereAnuncios());
      
      // Si ya intentamos o no hay vigentes, salir
      if (this.yaIntentado) {
        console.log('[Popup] Ya intentado, saliendo');
        return;
      }
      if (vigentes.length === 0) {
        console.log('[Popup] No hay vigentes, saliendo');
        return;
      }

      // Si el usuario marcó no mostrar, marcar como intentado y salir
      if (this.usuarioNoQuiereAnuncios()) {
        console.log('[Popup] Usuario no quiere anuncios');
        this.yaIntentado = true;
        return;
      }

      // Marcar como intentado para no repetir
      this.yaIntentado = true;

      // Limpiar timeout anterior si existe
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      console.log('[Popup] Programando mostrar en 1.5s');
      // Esperar y mostrar
      this.timeoutId = setTimeout(() => {
        console.log('[Popup] Mostrando anuncio aleatorio');
        this.mostrarAnuncioAleatorio(vigentes);
      }, 1500);
    });
  }

  /** Verifica si el usuario marcó no querer ver anuncios */
  private usuarioNoQuiereAnuncios(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(CLAVE_NO_MOSTRAR_ANUNCIOS) === 'true';
  }

  /** Selecciona y muestra un anuncio aleatorio de los vigentes */
  private mostrarAnuncioAleatorio(vigentes: AnuncioTemporal[]): void {
    if (vigentes.length === 0) return;

    // Seleccionar uno aleatorio
    const indiceAleatorio = Math.floor(Math.random() * vigentes.length);
    const anuncio = vigentes[indiceAleatorio];
    
    this.anuncioSeleccionado.set(anuncio);
    this.estaVisible.set(true);
  }

  /** Cierra el popup */
  cerrarPopup(): void {
    // Si marcó no volver a mostrar, guardar preferencia
    if (this.noVolverAMostrar()) {
      localStorage.setItem(CLAVE_NO_MOSTRAR_ANUNCIOS, 'true');
    }
    this.estaVisible.set(false);
  }

  /** Cambia el estado del checkbox */
  toggleNoVolverAMostrar(): void {
    this.noVolverAMostrar.update((v) => !v);
  }

  /** Navega al destino del anuncio y cierra el popup */
  navegarADestino(): void {
    const anuncio = this.anuncioSeleccionado();
    if (!anuncio) return;

    this.cerrarPopup();

    if (anuncio.tipoDestino === 'ninguno' || !anuncio.destinoHandle) {
      return;
    }

    if (anuncio.tipoDestino === 'producto') {
      this.router.navigate(['/producto', anuncio.destinoHandle]);
    } else if (anuncio.tipoDestino === 'categoria') {
      this.router.navigate(['/categoria', anuncio.destinoHandle]);
    }
  }
}
