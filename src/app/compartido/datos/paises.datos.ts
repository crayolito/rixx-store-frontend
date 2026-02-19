/** Datos de países para selectores (teléfono, nacionalidad). */

export interface Pais {
  codigo: string;
  nombre: string;
  bandera: string;
  sigla: string;
}

export const PAISES: Pais[] = [
  { codigo: 'bo', nombre: 'Bolivia', bandera: '/imagenes/bolivia.png', sigla: '+591' },
  { codigo: 'mx', nombre: 'México', bandera: '/imagenes/mexico.png', sigla: '+52' },
  { codigo: 'ar', nombre: 'Argentina', bandera: '/imagenes/argentina.png', sigla: '+54' },
  { codigo: 'co', nombre: 'Colombia', bandera: '/imagenes/colombia.png', sigla: '+57' },
  { codigo: 'pe', nombre: 'Perú', bandera: '/imagenes/peru.png', sigla: '+51' },
  { codigo: 'cl', nombre: 'Chile', bandera: '/imagenes/chile.png', sigla: '+56' },
  { codigo: 'ec', nombre: 'Ecuador', bandera: '/imagenes/ecuador.png', sigla: '+593' },
  { codigo: 've', nombre: 'Venezuela', bandera: '/imagenes/venezuela.png', sigla: '+58' },
  { codigo: 'gt', nombre: 'Guatemala', bandera: '/imagenes/guatemala.png', sigla: '+502' },
  { codigo: 'br', nombre: 'Brasil', bandera: '/imagenes/brasil.png', sigla: '+55' },
];
