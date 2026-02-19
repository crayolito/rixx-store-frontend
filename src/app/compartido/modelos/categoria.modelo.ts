export interface CategoriaApi {
  id_categoria: number;
  nombre: string;
  handle: string;
  idVemper: string | null;
  generaCodigo?: boolean;
  cantidadProductos: number;
}

export interface RespuestaCategorias {
  exito: boolean;
  datos: CategoriaApi[];
}

/** Respuesta de crear o actualizar categoría (un solo objeto en datos) */
export interface RespuestaCategoria {
  exito: boolean;
  datos: {
    id_categoria: number;
    nombre: string;
    handle: string;
    generaCodigo?: boolean;
  };
}

/** Respuesta de eliminar categoría */
export interface RespuestaEliminarCategoria {
  exito: boolean;
  mensaje?: string;
}
