// Servidor simulado para avanzar sin la API real.
// Solo para desarrollo: guarda todo en memoria y se borra al recargar.
import { ErrorApi } from './client';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const usuarios = [
  {
    id: 'u1',
    nombre: 'Usuario Demo',
    correo: 'dueno@demo.com',
    contrasena: 'demo1234',
    telefono: '3001234567',
    rol: 'DUENO',
  },
];

function publico(u) {
  const { contrasena, telefono, ...resto } = u; // el teléfono nunca se expone (RF01)
  return resto;
}

export async function registrar(datos) {
  await esperar(600);
  const correo = datos.correo.trim().toLowerCase();
  if (usuarios.some((u) => u.correo === correo)) {
    throw new ErrorApi('Ya existe una cuenta con ese correo.', 409);
  }
  const nuevo = { ...datos, correo, id: `u${usuarios.length + 1}` };
  usuarios.push(nuevo);
  return { token: `mock-${nuevo.id}`, usuario: publico(nuevo) };
}

export async function iniciarSesion(correo, contrasena) {
  await esperar(600);
  const u = usuarios.find((x) => x.correo === correo.trim().toLowerCase());
  if (!u || u.contrasena !== contrasena) {
    throw new ErrorApi('Correo o contraseña incorrectos.', 401);
  }
  return { token: `mock-${u.id}`, usuario: publico(u) };
}

// ---------- Reportes (C5-35) ----------

// Reportes de pérdida de ejemplo, para que un hallazgo tenga con qué compararse.
const reportes = [
  {
    id: 'r1',
    tipo: 'PERDIDA',
    mascota: { nombre: 'Toby', especie: 'PERRO', raza: 'Criollo', color: 'Café', tamano: 'MEDIANO', senas: 'Collar rojo' },
    fotos: [],
    fecha: new Date(Date.now() - 86400000).toISOString(),
    ubicacion: { type: 'Point', coordinates: [-75.6961, 4.8143] },
  },
  {
    id: 'r2',
    tipo: 'PERDIDA',
    mascota: { nombre: 'Luna', especie: 'GATO', raza: '', color: 'Negro', tamano: 'PEQUENO', senas: 'Ojos amarillos' },
    fotos: [],
    fecha: new Date(Date.now() - 2 * 86400000).toISOString(),
    ubicacion: { type: 'Point', coordinates: [-75.69, 4.82] },
  },
  {
    id: 'r3',
    tipo: 'PERDIDA',
    mascota: { nombre: 'Rocky', especie: 'PERRO', raza: 'Labrador', color: 'Amarillo', tamano: 'GRANDE', senas: '' },
    fotos: [],
    fecha: new Date().toISOString(),
    ubicacion: { type: 'Point', coordinates: [-75.70, 4.81] },
  },
];

export async function subirFoto(uri) {
  await esperar(300);
  return { id: uri }; // en el simulador la "foto subida" es la ruta local
}

function distanciaKm([lon1, lat1], [lon2, lat2]) {
  const rad = (g) => (g * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const normal = (t) => (t ?? '').trim().toLowerCase();

// RF07: reportes de pérdida parecidos al hallazgo, del más parecido al menos.
function parecidos(hallazgo) {
  return reportes
    .filter((r) => r.tipo === 'PERDIDA' && r.mascota.especie === hallazgo.mascota.especie)
    .map((r) => {
      let puntaje = 40;
      if (r.mascota.tamano === hallazgo.mascota.tamano) puntaje += 25;
      if (normal(r.mascota.color) && normal(r.mascota.color) === normal(hallazgo.mascota.color)) puntaje += 35;
      return {
        id: r.id,
        mascota: r.mascota,
        fotos: r.fotos,
        fecha: r.fecha,
        puntaje,
        distancia_km: Math.round(distanciaKm(r.ubicacion.coordinates, hallazgo.ubicacion.coordinates) * 10) / 10,
      };
    })
    .sort((a, b) => b.puntaje - a.puntaje || a.distancia_km - b.distancia_km)
    .slice(0, 5);
}

export async function publicarReporte(ruta, datos) {
  await esperar(800);
  const tipo = ruta.endsWith('/perdidas') ? 'PERDIDA' : 'ENCONTRADA';
  // Si la cola reintenta un reporte que ya llegó, no se duplica.
  let reporte = reportes.find((r) => r.id_cliente && r.id_cliente === datos.id_cliente);
  if (!reporte) {
    reporte = { ...datos, id: `r${reportes.length + 1}`, tipo, estado: 'ACTIVO', creado_en: new Date().toISOString() };
    reportes.push(reporte);
  }
  return tipo === 'ENCONTRADA' ? { reporte, parecidos: parecidos(reporte) } : { reporte };
}
