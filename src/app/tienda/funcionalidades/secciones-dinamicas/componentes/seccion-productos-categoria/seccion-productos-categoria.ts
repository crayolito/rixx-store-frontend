import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';


interface ProductoCategoria {
  id: string;
  imagen: string;
  etiqueta: 'Nuevo' | 'Oferta' | null;
  titulo: string;
  descripcion: string;
  precioBase: number;
  precioOferta: number | null;
  porcentajeDescuento: number | null;
}

@Component({
  selector: 'app-seccion-productos-categoria',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seccion-productos-categoria.html',
  styleUrl: './seccion-productos-categoria.css',
})
export class SeccionProductosCategoria {
  productos = input.required<ProductoCategoria[]>();
  titulo = input.required<string>();
}
