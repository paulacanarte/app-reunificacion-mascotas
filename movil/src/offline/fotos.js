// Fotos de los reportes (CU04, RN01).
// Las fotos se copian a la carpeta de documentos de la app: la caché del
// selector la puede borrar el sistema, y un reporte en la cola sin conexión
// puede tardar horas en publicarse.
import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export const MAX_FOTOS = 3;
export const MAX_BYTES = 10 * 1024 * 1024; // RN01: máximo 10 MB por foto
const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp'];

function carpeta() {
  const dir = new Directory(Paths.document, 'reportes');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function extension(asset) {
  if (asset.mimeType === 'image/png') return 'png';
  if (asset.mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

// Devuelve un texto de error si la foto no cumple RN01, o null si está bien.
export function validarFoto(asset) {
  if (asset.fileSize && asset.fileSize > MAX_BYTES) return 'La foto pesa más de 10 MB.';
  if (asset.mimeType && !TIPOS_VALIDOS.includes(asset.mimeType)) {
    return 'Solo se aceptan fotos JPG, PNG o WEBP.';
  }
  return null;
}

// Copia la foto elegida a la carpeta de la app y devuelve su ruta.
export async function guardarFoto(asset) {
  const destino = new File(carpeta(), `${Crypto.randomUUID()}.${extension(asset)}`);
  await new File(asset.uri).copy(destino);
  return destino.uri;
}

export function tipoDeFoto(uri) {
  if (uri.endsWith('.png')) return 'image/png';
  if (uri.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export function borrarFotos(uris) {
  for (const uri of uris ?? []) {
    try {
      const archivo = new File(uri);
      if (archivo.exists) archivo.delete();
    } catch {
      // Si no se puede borrar, no es grave: solo ocupa espacio.
    }
  }
}
