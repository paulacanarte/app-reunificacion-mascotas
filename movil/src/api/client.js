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

export async function solicitud(ruta, { metodo = 'GET', cuerpo, conToken = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (conToken) {
    const token = await obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_ESPERA_MS);

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: controlador.signal,
    });
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
