// Cola sin conexión (RNF03): es el artefacto "SQLite local" del diagrama
// de despliegue y la rama [no] de "¿Hay conexión?" en el de actividades.
// Lo que no se puede enviar se guarda aquí y se envía al volver la señal.
import * as SQLite from 'expo-sqlite';
import { solicitud } from '../api/client';

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
      return base;
    })();
  }
  return bdPromesa;
}

export async function encolar(ruta, metodo, cuerpo) {
  const base = await bd();
  await base.runAsync(
    'INSERT INTO cola_pendientes (ruta, metodo, cuerpo, creado_en) VALUES (?, ?, ?, ?)',
    ruta,
    metodo,
    JSON.stringify(cuerpo ?? null),
    new Date().toISOString()
  );
}

export async function contarPendientes() {
  const base = await bd();
  const fila = await base.getFirstAsync('SELECT COUNT(*) AS total FROM cola_pendientes');
  return fila?.total ?? 0;
}

// Intenta enviar; si no hay señal, lo deja en la cola.
// Se usará en C5-35 para reportar pérdidas y hallazgos.
export async function enviarOEncolar(ruta, cuerpo, metodo = 'POST') {
  try {
    const datos = await solicitud(ruta, { metodo, cuerpo });
    return { enviado: true, datos };
  } catch (error) {
    if (!error.sinConexion) throw error;
    await encolar(ruta, metodo, cuerpo);
    return { enviado: false, encolado: true };
  }
}

// Envía en orden lo pendiente. Si se cae la señal a mitad, se detiene
// y lo que falta queda para el próximo intento.
export async function sincronizar() {
  const base = await bd();
  const filas = await base.getAllAsync('SELECT * FROM cola_pendientes ORDER BY id');
  let enviados = 0;
  for (const fila of filas) {
    try {
      await solicitud(fila.ruta, { metodo: fila.metodo, cuerpo: JSON.parse(fila.cuerpo) });
      await base.runAsync('DELETE FROM cola_pendientes WHERE id = ?', fila.id);
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
  return { enviados, pendientes: await contarPendientes() };
}
