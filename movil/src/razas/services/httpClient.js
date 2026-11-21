// CLIENTE HTTP GENÉRICO
// Es la única pieza que sabe usar fetch. No conoce perros ni razas:
// solo hace la petición, espera un tiempo máximo y convierte la respuesta en JSON.

const TIEMPO_ESPERA_MS = 10000;

export async function getJson(url) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_ESPERA_MS);

  try {
    const respuesta = await fetch(url, { signal: controlador.signal });
    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con el código ${respuesta.status}.`);
    }
    return await respuesta.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder.');
    }
    if (error instanceof TypeError) {
      throw new Error('No hay conexión a internet.');
    }
    throw error;
  } finally {
    clearTimeout(temporizador);
  }
}
