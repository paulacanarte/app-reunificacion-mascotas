// Cliente HTTP: todas las llamadas a la API pasan por aquí.
// Conexión por HTTPS/JSON, como dice el diagrama de despliegue.
import { API_URL, TIEMPO_ESPERA_MS } from '../config';
import { obtenerToken } from '../storage/session';

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0, sinConexion = false) {
    super(mensaje);
    this.estado = estado;
    this.sinConexion = sinConexion;
  }
}

async function encabezados(conToken, extra = {}) {
  const headers = { ...extra };
  if (conToken) {
    const token = await obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function solicitud(ruta, { metodo = 'GET', cuerpo, conToken = true } = {}) {
  return enviar(ruta, {
    method: metodo,
    headers: await encabezados(conToken, { 'Content-Type': 'application/json' }),
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
}

// Sube un archivo como multipart/form-data (POST /fotos).
// El Content-Type no se pone a mano: fetch lo arma con su separador.
export async function subirArchivo(ruta, archivo, campo = 'archivo') {
  const formulario = new FormData();
  formulario.append(campo, archivo);
  return enviar(
    ruta,
    { method: 'POST', headers: await encabezados(true), body: formulario },
    60000 // una foto con mala señal tarda más que un JSON
  );
}

async function enviar(ruta, opciones, tiempo = TIEMPO_ESPERA_MS) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), tiempo);

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, signal: controlador.signal });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor.', 0, true);
  } finally {
    clearTimeout(temporizador);
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    // FastAPI devuelve "detail" como texto o, en errores 422, como lista.
    const detalle = typeof datos?.detail === 'string' ? datos.detail : 'Revisa los datos enviados.';
    throw new ErrorApi(detalle, respuesta.status);
  }
  return datos;
}
