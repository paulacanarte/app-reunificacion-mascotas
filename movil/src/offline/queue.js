// Cola sin conexión (RNF03): es el artefacto "SQLite local" del diagrama
// de despliegue y la rama [no] de "¿Hay conexión?" en el de actividades.
// Lo que no se puede enviar se guarda aquí y se envía al volver la señal.
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { USAR_MOCK } from '../config';
import { publicarReporte } from '../api/reportes';
import { borrarFotos } from './fotos';

let bdPromesa = null;

function bd() {
  if (!bdPromesa) {
    bdPromesa = (async () => {
      const base = await SQLite.openDatabaseAsync('codigo5.db');
      await base.execAsync(`
        CREATE TABLE IF NOT EXISTS cola_pendientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ruta TEXT NOT NULL,
          metodo TEXT NOT NULL,
          cuerpo TEXT,
          creado_en TEXT NOT NULL,
          intentos INTEGER NOT NULL DEFAULT 0,
          ultimo_error TEXT
        );
      `);
      // C5-35: rutas locales de las fotos que hay que subir antes del reporte.
      // Se agrega aparte para no perder la cola de quien ya tenía la versión C5-34.
      const columnas = await base.getAllAsync('PRAGMA table_info(cola_pendientes)');
      if (!columnas.some((c) => c.name === 'fotos')) {
        await base.execAsync('ALTER TABLE cola_pendientes ADD COLUMN fotos TEXT');
      }
      return base;
    })();
  }
  return bdPromesa;
}

// Avisos para que la pantalla actualice el contador de pendientes.
const oyentes = new Set();
export function alCambiarCola(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}
function avisar() {
  oyentes.forEach((fn) => fn());
}

export async function encolar(ruta, cuerpo, fotos = [], metodo = 'POST') {
  const base = await bd();
  await base.runAsync(
    'INSERT INTO cola_pendientes (ruta, metodo, cuerpo, fotos, creado_en) VALUES (?, ?, ?, ?, ?)',
    ruta,
    metodo,
    JSON.stringify(cuerpo ?? null),
    JSON.stringify(fotos),
    new Date().toISOString()
  );
  avisar();
}

export async function contarPendientes() {
  const base = await bd();
  const fila = await base.getFirstAsync('SELECT COUNT(*) AS total FROM cola_pendientes');
  return fila?.total ?? 0;
}

async function hayConexion() {
  const estado = await NetInfo.fetch();
  return Boolean(estado.isConnected) && estado.isInternetReachable !== false;
}

// Con la API real, la foto ya quedó en el servidor y la copia local sobra.
// En el simulador la foto "subida" es la misma ruta local, así que se conserva.
function limpiarFotos(fotos) {
  if (!USAR_MOCK) borrarFotos(fotos);
}

// Intenta publicar; si no hay señal, lo deja en la cola (rama [no] de "¿Hay conexión?").
// `fotos` son rutas locales; se suben antes del reporte.
export async function enviarOEncolar(ruta, cuerpo, fotos = []) {
  if (!(await hayConexion())) {
    await encolar(ruta, cuerpo, fotos);
    return { enviado: false, encolado: true };
  }
  try {
    const datos = await publicarReporte(ruta, cuerpo, fotos);
    limpiarFotos(fotos);
    return { enviado: true, datos };
  } catch (error) {
    if (!error.sinConexion) throw error;
    await encolar(ruta, cuerpo, fotos);
    return { enviado: false, encolado: true };
  }
}

// Envía en orden lo pendiente. Si se cae la señal a mitad, se detiene
// y lo que falta queda para el próximo intento. Nunca corre dos veces a la vez.
let enCurso = null;

export function sincronizar() {
  if (!enCurso) {
    enCurso = sincronizarAhora().finally(() => {
      enCurso = null;
    });
  }
  return enCurso;
}

async function sincronizarAhora() {
  const base = await bd();
  const filas = await base.getAllAsync('SELECT * FROM cola_pendientes ORDER BY id');
  let enviados = 0;
  for (const fila of filas) {
    const fotos = JSON.parse(fila.fotos ?? '[]');
    try {
      // El cuerpo lleva su id_cliente: si el servidor ya lo recibió, no lo duplica.
      await publicarReporte(fila.ruta, JSON.parse(fila.cuerpo), fotos);
      await base.runAsync('DELETE FROM cola_pendientes WHERE id = ?', fila.id);
      limpiarFotos(fotos);
      enviados += 1;
    } catch (error) {
      if (error.sinConexion) break;
      await base.runAsync(
        'UPDATE cola_pendientes SET intentos = intentos + 1, ultimo_error = ? WHERE id = ?',
        error.message,
        fila.id
      );
    }
  }
  if (filas.length) avisar();
  return { enviados, pendientes: await contarPendientes() };
}
