// MODEL
// Define cómo es una "raza" dentro de la app, sin importar cómo la mande la API.
// Si mañana cambia la API, solo se toca el mapeo (deRespuestaApi), no las pantallas.

export function crearRaza(nombre, subrazas = []) {
  return {
    id: nombre,
    nombre: capitalizar(nombre),
    subrazas: subrazas.map(capitalizar),
  };
}

// La API devuelve: { message: { "bulldog": ["boston", "french"], "akita": [] }, status: "success" }
// Esto lo convierte en una lista de objetos Raza ordenada por nombre.
export function razasDesdeRespuestaApi(json) {
  return Object.entries(json.message)
    .map(([nombre, subrazas]) => crearRaza(nombre, subrazas))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
