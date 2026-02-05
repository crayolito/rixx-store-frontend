/**
 * Fotos de perfil por defecto para usuarios nuevos (registro por formulario o social).
 * Se elige una al azar y se guarda en el backend.
 */
export const FOTOS_PERFIL_ALEATORIAS: readonly string[] = [
  'https://res.cloudinary.com/dcvidtqlq/image/upload/v1770130649/foto-michi1_q4bskr.jpg',
  'https://res.cloudinary.com/dcvidtqlq/image/upload/v1770130649/foto-michi2_pbwawv.jpg',
  'https://res.cloudinary.com/dcvidtqlq/image/upload/v1770130649/foto-michi3_slymhy.jpg',
  'https://res.cloudinary.com/dcvidtqlq/image/upload/v1770130650/foto-michi5_bzir6n.jpg',
  'https://res.cloudinary.com/dcvidtqlq/image/upload/v1770130649/foto-michi4_sxys1x.jpg',
];

export function obtenerFotoPerfilAleatoria(): string {
  const indice = Math.floor(Math.random() * FOTOS_PERFIL_ALEATORIAS.length);
  return FOTOS_PERFIL_ALEATORIAS[indice];
}
