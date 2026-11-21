// Ubicación del reporte por GPS. El GPS funciona sin internet,
// así que también sirve para los reportes que quedan en la cola.
import * as Location from 'expo-location';

const ESPERA_GPS_MS = 15000;

export class ErrorUbicacion extends Error {}

function conLimite(promesa, ms) {
  let id;
  const limite = new Promise((_, rechazar) => {
    id = setTimeout(() => rechazar(new Error('tiempo')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(id));
}

// Devuelve { lat, lon, precision } o lanza ErrorUbicacion con un texto para el usuario.
export async function obtenerUbicacion() {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (!permiso.granted) {
    throw new ErrorUbicacion('Permite el acceso a la ubicación en los ajustes del teléfono para ubicar el reporte.');
  }

  let posicion = null;
  try {
    posicion = await conLimite(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      ESPERA_GPS_MS
    );
  } catch {
    // Sin señal de GPS a tiempo: se usa la última posición conocida del teléfono.
    posicion = await Location.getLastKnownPositionAsync().catch(() => null);
  }
  if (!posicion) {
    throw new ErrorUbicacion('No se pudo obtener la ubicación. Revisa que el GPS esté encendido e inténtalo al aire libre.');
  }

  return {
    lat: posicion.coords.latitude,
    lon: posicion.coords.longitude,
    precision: posicion.coords.accuracy ? Math.round(posicion.coords.accuracy) : null,
  };
}

// Para buscar y para el mapa basta una ubicación aproximada y rápida.
// Devuelve { lat, lon } o null si no hay permiso o no se pudo obtener; nunca lanza.
export async function ubicacionRapida() {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) return null;
    const posicion =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60000 }).catch(() => null)) ??
      (await conLimite(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 8000).catch(
        () => null
      ));
    return posicion ? { lat: posicion.coords.latitude, lon: posicion.coords.longitude } : null;
  } catch {
    return null;
  }
}
