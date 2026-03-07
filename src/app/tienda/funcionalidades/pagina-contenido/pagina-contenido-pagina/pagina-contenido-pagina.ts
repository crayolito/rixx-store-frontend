import { Component, computed, effect, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConfiguracionServicio } from '../../../../compartido/servicios/configuracion.servicio';
import type { OpcionPieDePagina } from '../../../../compartido/modelos/configuracion.modelo';

@Component({
  selector: 'app-pagina-contenido-pagina',
  standalone: true,
  imports: [],
  templateUrl: './pagina-contenido-pagina.html',
  styleUrls: ['./pagina-contenido-pagina.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PaginaContenidoPagina implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private configuracion = inject(ConfiguracionServicio);

  private etiqueta = signal<string>('');
  cargando = signal(true);
  noEncontrada = signal(false);

  private readonly pie = this.configuracion.pieDePaginaActual;

  private opcionEncontrada = computed<OpcionPieDePagina | null>(() => {
    const etiq = this.etiqueta();
    if (!etiq) return null;

    const p = this.pie();
    if (!p?.secciones) return null;

    for (const seccion of p.secciones) {
      const opcion = seccion.opciones?.find(
        (op) => op.tipo === 'pagina' && op.etiqueta === etiq
      );
      if (opcion) return opcion;
    }
    return null;
  });

  contenidoHtml = computed<SafeHtml>(() => {
    const opcion = this.opcionEncontrada();
    if (!opcion?.contenidoHtml) return '';
    return this.sanitizer.bypassSecurityTrustHtml(opcion.contenidoHtml);
  });

  constructor() {
    // Reacciona cuando la configuración del pie de página se carga
    effect(() => {
      const pie = this.pie();
      const etiq = this.etiqueta();
      
      // Si tenemos etiqueta y el pie ya cargó, evaluamos si existe la página
      if (etiq && pie !== null) {
        this.cargando.set(false);
        this.noEncontrada.set(!this.opcionEncontrada());
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const etiq = params.get('etiqueta') ?? '';
      this.etiqueta.set(etiq);
      
      // Si la configuración ya está cargada, evaluamos inmediatamente
      if (this.pie() !== null) {
        this.cargando.set(false);
        this.noEncontrada.set(!this.opcionEncontrada());
      }
      // Si no está cargada, el effect() se encargará cuando llegue
    });
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
