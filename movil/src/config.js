// Configuración general de la app.
// Mientras la API de FastAPI no esté publicada (C5-28 / C5-29), la app
// trabaja con datos simulados. Cuando esté lista, poner USAR_MOCK = false
// y apuntar API_URL al servidor.
export const USAR_MOCK = true;

// En pruebas locales usar la IP del computador que corre FastAPI
// (no "localhost": el celular no es el computador).
export const API_URL = 'http://192.168.1.10:8000';

export const TIEMPO_ESPERA_MS = 10000;
