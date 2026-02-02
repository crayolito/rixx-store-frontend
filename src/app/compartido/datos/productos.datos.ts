/** Lista de productos (fuente única para admin catálogo y destacados). */

export interface Producto {
  id: string;
  nombre: string;
  imagen: string;
  categoria: string;
  estado: 'Activo' | 'Inactivo' | 'Agotado';
  fuente: string;
  inventario: number;
}

export const PRODUCTOS: Producto[] = [
  { id: '1', nombre: 'Laptop Gaming Ultra Pro con Procesador Intel i9 y Tarjeta Gráfica RTX 4090', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 500, fuente: 'Manual' },
  { id: '2', nombre: 'Smartphone Android', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Inactivo', inventario: 0, fuente: 'Manual' },
  { id: '3', nombre: 'Auriculares Inalámbricos Premium', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Agotado', inventario: 25, fuente: 'Manual' },
  { id: '4', nombre: 'Teclado Mecánico RGB', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Inactivo', inventario: 150, fuente: 'Manual' },
  { id: '5', nombre: 'Monitor 4K Ultra HD de 32 Pulgadas con Tecnología HDR y Frecuencia de Refresco de 144Hz', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 75, fuente: 'Manual' },
  { id: '6', nombre: 'Mouse Inalámbrico Ergonómico', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 200, fuente: 'Manual' },
  { id: '7', nombre: 'Webcam Full HD 1080p', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 80, fuente: 'Manual' },
  { id: '8', nombre: 'Tablet Android de 10 Pulgadas', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Inactivo', inventario: 0, fuente: 'Manual' },
  { id: '9', nombre: 'Altavoz Bluetooth Portátil', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 120, fuente: 'Manual' },
  { id: '10', nombre: 'Cámara Digital Profesional', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Inactivo', inventario: 15, fuente: 'Manual' },
  { id: '11', nombre: 'Disco Duro Externo 2TB', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 90, fuente: 'Manual' },
  { id: '12', nombre: 'Router WiFi 6 de Alta Velocidad', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 60, fuente: 'Manual' },
  { id: '13', nombre: 'Smartwatch con Monitor de Salud', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Inactivo', inventario: 0, fuente: 'Manual' },
  { id: '14', nombre: 'Impresora Multifuncional', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Activo', inventario: 40, fuente: 'Manual' },
  { id: '15', nombre: 'Micrófono USB para Streaming', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', estado: 'Inactivo', inventario: 30, fuente: 'Manual' },
];
