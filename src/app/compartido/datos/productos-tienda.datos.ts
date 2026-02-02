/** Productos con datos completos para tienda y categorías marketing (descripción, precios, fecha). */

export interface PrecioVariante {
  id: string;
  nombre: string;
  precioBase: number;
  precioOferta: number | null;
}

export interface ProductoTienda {
  id: string;
  nombre: string;
  imagen: string;
  categoria: string;
  descripcion: string;
  fechaCreacion: string;
  precios: PrecioVariante[];
}

export const PRODUCTOS_TIENDA: ProductoTienda[] = [
  { id: '1', nombre: 'Laptop Gaming Ultra Pro', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Laptop de alto rendimiento para gaming y trabajo profesional con gráfica dedicada RTX 4090.', fechaCreacion: '2026-01-10T10:00:00Z', precios: [{ id: 'p1-1', nombre: '16GB RAM', precioBase: 2999, precioOferta: 2849 }, { id: 'p1-2', nombre: '32GB RAM', precioBase: 3499, precioOferta: 3324 }] },
  { id: '2', nombre: 'Smartphone Android', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Smartphone con pantalla AMOLED y cámara de alta resolución.', fechaCreacion: '2026-01-11T08:00:00Z', precios: [{ id: 'p2-1', nombre: '128GB', precioBase: 450, precioOferta: null }] },
  { id: '3', nombre: 'Auriculares Inalámbricos', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Auriculares con cancelación de ruido y excelente calidad de sonido.', fechaCreacion: '2026-01-12T14:00:00Z', precios: [{ id: 'p3-1', nombre: 'Estándar', precioBase: 180, precioOferta: 162 }] },
  { id: '4', nombre: 'Teclado Mecánico RGB', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Teclado mecánico con retroiluminación RGB y switches personalizables.', fechaCreacion: '2026-01-13T09:00:00Z', precios: [{ id: 'p4-1', nombre: 'Linear', precioBase: 120, precioOferta: null }, { id: 'p4-2', nombre: 'Táctil', precioBase: 135, precioOferta: 122 }] },
  { id: '5', nombre: 'Monitor 4K Ultra HD', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Monitor gaming 4K con HDR y alta frecuencia de refresco.', fechaCreacion: '2026-01-14T11:00:00Z', precios: [{ id: 'p5-1', nombre: '27"', precioBase: 499, precioOferta: 449 }, { id: 'p5-2', nombre: '32"', precioBase: 599, precioOferta: 539 }] },
  { id: '6', nombre: 'Mouse Inalámbrico', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Mouse ergonómico con sensor de precisión y batería de larga duración.', fechaCreacion: '2026-01-15T10:00:00Z', precios: [{ id: 'p6-1', nombre: 'Básico', precioBase: 45, precioOferta: 40 }] },
  { id: '7', nombre: 'Webcam Full HD 1080p', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Webcam con micrófono integrado para videollamadas y streaming.', fechaCreacion: '2026-01-16T08:00:00Z', precios: [{ id: 'p7-1', nombre: '1080p', precioBase: 85, precioOferta: null }] },
  { id: '8', nombre: 'Tablet Android 10"', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Tablet con pantalla Full HD ideal para entretenimiento y productividad.', fechaCreacion: '2026-01-17T12:00:00Z', precios: [{ id: 'p8-1', nombre: '64GB', precioBase: 250, precioOferta: 225 }] },
  { id: '9', nombre: 'Altavoz Bluetooth', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Altavoz portátil con excelente autonomía y sonido envolvente.', fechaCreacion: '2026-01-18T09:00:00Z', precios: [{ id: 'p9-1', nombre: 'Compacto', precioBase: 65, precioOferta: null }] },
  { id: '10', nombre: 'Cámara Digital', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Cámara con sensor de alta resolución y grabación en 4K.', fechaCreacion: '2026-01-19T14:00:00Z', precios: [{ id: 'p10-1', nombre: 'Kit básico', precioBase: 899, precioOferta: 809 }] },
  { id: '11', nombre: 'Disco Duro 2TB', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Almacenamiento portátil USB 3.0 con gran capacidad.', fechaCreacion: '2026-01-20T10:00:00Z', precios: [{ id: 'p11-1', nombre: 'HDD', precioBase: 95, precioOferta: null }, { id: 'p11-2', nombre: 'SSD', precioBase: 180, precioOferta: 162 }] },
  { id: '12', nombre: 'Router WiFi 6', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Router de última generación con cobertura ampliada y puertos Gigabit.', fechaCreacion: '2026-01-21T11:00:00Z', precios: [{ id: 'p12-1', nombre: 'Dual Band', precioBase: 120, precioOferta: 108 }] },
  { id: '13', nombre: 'Smartwatch', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Reloj inteligente con monitoreo cardiaco, sueño y GPS integrado.', fechaCreacion: '2026-01-22T08:00:00Z', precios: [{ id: 'p13-1', nombre: 'Sport', precioBase: 199, precioOferta: null }] },
  { id: '14', nombre: 'Impresora Multifuncional', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Impresora con escáner y WiFi para impresión, copia y escaneo.', fechaCreacion: '2026-01-23T13:00:00Z', precios: [{ id: 'p14-1', nombre: 'Inyección', precioBase: 150, precioOferta: 135 }] },
  { id: '15', nombre: 'Micrófono USB', imagen: '/imagenes/images1.jpg', categoria: 'Electrónica', descripcion: 'Micrófono condensador con filtro pop y calidad de estudio.', fechaCreacion: '2026-01-24T09:00:00Z', precios: [{ id: 'p15-1', nombre: 'Cardioide', precioBase: 75, precioOferta: null }] },
];
