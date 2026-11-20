// CU05 Reportar pérdida y CU06 Reportar hallazgo (C5-35).
// Sube primero las fotos (POST /fotos) y luego el reporte con sus ids.
import { USAR_MOCK } from '../config';
import { solicitud, subirArchivo } from './client';
import { tipoDeFoto } from '../offline/fotos';
import * as mock from './mock';

export const RUTA_REPORTE = {
  PERDIDA: '/reportes/perdidas',
  ENCONTRADA: '/reportes/encontradas',
};

async function subirFoto(uri) {
  if (USAR_MOCK) return mock.subirFoto(uri);
  const nombre = uri.split('/').pop();
  return subirArchivo('/fotos', { uri, name: nombre, type: tipoDeFoto(uri) });
}

// Publica un reporte. `fotosLocales` son rutas de archivos en el teléfono.
// Lo usa tanto el envío directo como la cola sin conexión.
export async function publicarReporte(ruta, cuerpo, fotosLocales = []) {
  const ids = [];
  for (const uri of fotosLocales) {
    const { id } = await subirFoto(uri);
    ids.push(id);
  }
  const datos = { ...cuerpo, fotos: ids };
  if (USAR_MOCK) return mock.publicarReporte(ruta, datos);
  return solicitud(ruta, { metodo: 'POST', cuerpo: datos });
}
