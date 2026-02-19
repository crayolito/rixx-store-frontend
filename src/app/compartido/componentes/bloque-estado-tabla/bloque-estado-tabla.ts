import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-bloque-estado-tabla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bloque-estado-tabla.html',
})
export class BloqueEstadoTablaComponente {
  estado = input.required<'cargando' | 'vacio'>();
  mensajeCarga = input<string>('Cargando...');
  tituloVacio = input<string>('');
  textoVacio = input<string>('');
  iconoVacio = input<string>('');
}
