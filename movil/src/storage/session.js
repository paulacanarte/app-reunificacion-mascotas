// Sesión guardada de forma cifrada en el teléfono (SecureStore).
// Permite abrir la app sin conexión si ya hubo una sesión (RF02).
import * as SecureStore from 'expo-secure-store';

const CLAVE_SESION = 'sesion';
const CLAVE_BIOMETRIA = 'biometria_activa';

export async function guardarSesion(sesion) {
  await SecureStore.setItemAsync(CLAVE_SESION, JSON.stringify(sesion));
}

export async function obtenerSesion() {
  const valor = await SecureStore.getItemAsync(CLAVE_SESION);
  return valor ? JSON.parse(valor) : null;
}

export async function obtenerToken() {
  const sesion = await obtenerSesion();
  return sesion?.token ?? null;
}

export async function borrarSesion() {
  await SecureStore.deleteItemAsync(CLAVE_SESION);
  await SecureStore.deleteItemAsync(CLAVE_BIOMETRIA);
}

export async function biometriaActiva() {
  return (await SecureStore.getItemAsync(CLAVE_BIOMETRIA)) === 'si';
}

export async function cambiarBiometria(activa) {
  if (activa) await SecureStore.setItemAsync(CLAVE_BIOMETRIA, 'si');
  else await SecureStore.deleteItemAsync(CLAVE_BIOMETRIA);
}
