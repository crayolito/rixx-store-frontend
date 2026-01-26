import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sesion } from './nucleo/servicios/sesion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private sesion = inject(Sesion);

  ngOnInit(): void {
    // FASE 1: Cargar sesión guardada al iniciar la aplicación
    this.sesion.cargarSesion();
  }
}
