// Servidor simulado para avanzar sin la API real.
// Solo para desarrollo: guarda todo en memoria y se borra al recargar.
// Los datos de ejemplo están en Pereira; los reportes que hagas quedan donde estés.
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

// ---------- Datos de ejemplo ----------

const DIA = 86400000;
const punto = (lat, lon) => ({ type: 'Point', coordinates: [lon, lat] });
const haceDias = (d) => new Date(Date.now() - d * DIA).toISOString();

let siguienteId = 1;
const nuevoId = () => `r${siguienteId++}`;

const reportes = [
  { tipo: 'PERDIDA', mascota: { nombre: 'Toby', especie: 'PERRO', raza: 'Criollo', color: 'Café', tamano: 'MEDIANO', senas: 'Collar rojo' }, fecha: haceDias(1), ubicacion: punto(4.8143, -75.6961), descripcion: 'Se asustó con la réplica y salió corriendo hacia el parque.' },
  { tipo: 'PERDIDA', mascota: { nombre: 'Luna', especie: 'GATO', raza: '', color: 'Negro', tamano: 'PEQUENO', senas: 'Ojos amarillos' }, fecha: haceDias(2), ubicacion: punto(4.8205, -75.6895), descripcion: 'No sale de la casa nunca, debe estar escondida.' },
  { tipo: 'PERDIDA', mascota: { nombre: 'Rocky', especie: 'PERRO', raza: 'Labrador', color: 'Amarillo', tamano: 'GRANDE', senas: '' }, fecha: haceDias(0.2), ubicacion: punto(4.8075, -75.7010), descripcion: 'Responde a su nombre y es muy amigable.' },
  { tipo: 'PERDIDA', mascota: { nombre: 'Max', especie: 'PERRO', raza: 'French poodle', color: 'Blanco', tamano: 'PEQUENO', senas: 'Corte de pelo reciente' }, fecha: haceDias(3), ubicacion: punto(4.8030, -75.6870), descripcion: '' },
  { tipo: 'PERDIDA', mascota: { nombre: 'Nala', especie: 'GATO', raza: 'Criolla', color: 'Naranja', tamano: 'MEDIANO', senas: 'Cola corta' }, fecha: haceDias(1.5), ubicacion: punto(4.8245, -75.7060), descripcion: 'Tiene un cascabel en el collar.' },
  { tipo: 'PERDIDA', mascota: { nombre: 'Copito', especie: 'OTRO', raza: 'Conejo', color: 'Blanco', tamano: 'PEQUENO', senas: 'Oreja izquierda caída' }, fecha: haceDias(4), ubicacion: punto(4.7985, -75.6960), descripcion: 'Es un conejo, se escapó del patio.' },
  { tipo: 'ENCONTRADA', mascota: { especie: 'PERRO', raza: 'Criollo', color: 'Café', tamano: 'MEDIANO', senas: 'Collar rojo sin placa' }, fecha: haceDias(0.5), ubicacion: punto(4.8170, -75.6925), estado_actual: 'CON_QUIEN_REPORTA', descripcion: 'Está asustado pero sin heridas.' },
  { tipo: 'ENCONTRADA', mascota: { especie: 'GATO', raza: '', color: 'Gris', tamano: 'PEQUENO', senas: '' }, fecha: haceDias(1), ubicacion: punto(4.8115, -75.6820), estado_actual: 'EN_REFUGIO', descripcion: 'Lo llevamos al Refugio Huellitas.' },
  { tipo: 'ENCONTRADA', mascota: { especie: 'PERRO', raza: '', color: 'Negro', tamano: 'GRANDE', senas: 'Cojea de una pata' }, fecha: haceDias(0.1), ubicacion: punto(4.8280, -75.6985), estado_actual: 'SIGUE_EN_EL_LUGAR', descripcion: 'Está debajo de un puente, no deja que nadie se acerque.' },
].map((r) => ({ ...r, id: nuevoId(), fotos: [], estado: 'ACTIVO', creado_en: r.fecha }));

// RF12, RF14: refugios con su capacidad y puntos de recepción.
const puntos = [
  { id: 'p1', tipo: 'REFUGIO', nombre: 'Refugio Huellitas', direccion: 'Cra. 12 #20-15', horario: 'Todos los días, 7 a. m. a 7 p. m.', capacidad: 40, ocupados: 26, ubicacion: punto(4.8185, -75.6860) },
  { id: 'p2', tipo: 'REFUGIO', nombre: 'Fundación Patitas', direccion: 'Calle 35 #8-40', horario: 'Lunes a sábado, 8 a. m. a 5 p. m.', capacidad: 25, ocupados: 25, ubicacion: punto(4.8040, -75.7075) },
  { id: 'p3', tipo: 'PUNTO_RECEPCION', nombre: 'Punto de recepción Parque Olaya', direccion: 'Parque Olaya Herrera', horario: '24 horas durante la emergencia', ubicacion: punto(4.8100, -75.6990) },
  { id: 'p4', tipo: 'PUNTO_RECEPCION', nombre: 'Punto de recepción Villa Olímpica', direccion: 'Av. 30 de Agosto', horario: '6 a. m. a 10 p. m.', ubicacion: punto(4.8225, -75.7140) },
];

// ---------- Utilidades ----------

function distanciaKm([lon1, lat1], [lon2, lat2]) {
  const rad = (g) => (g * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

// RNF02: a otros usuarios se les muestra una zona de unos 500 m, no el punto exacto.
const PASO = 0.0045;
const aproximar = ({ coordinates: [lon, lat] }) =>
  punto(Math.round(lat / PASO) * PASO, Math.round(lon / PASO) * PASO);

const normal = (t) => (t ?? '').trim().toLowerCase();

// Lo que la API devuelve de un reporte a cualquier usuario (sin contacto, RF01).
function resumen(r, desde) {
  const { contacto, id_cliente, ...publicoR } = r;
  return {
    ...publicoR,
    ubicacion: aproximar(r.ubicacion),
    distancia_km: desde ? Math.round(distanciaKm(desde, r.ubicacion.coordinates) * 10) / 10 : null,
  };
}

// ---------- Reportes (C5-35) ----------

export async function subirFoto(uri) {
  await esperar(300);
  return { id: uri }; // en el simulador la "foto subida" es la ruta local
}

// RF07: reportes de pérdida parecidos al hallazgo, del más parecido al menos.
function parecidos(hallazgo) {
  return reportes
    .filter((r) => r.tipo === 'PERDIDA' && r.mascota.especie === hallazgo.mascota.especie)
    .map((r) => {
      let puntaje = 40;
      if (r.mascota.tamano === hallazgo.mascota.tamano) puntaje += 25;
      if (normal(r.mascota.color) && normal(r.mascota.color) === normal(hallazgo.mascota.color)) puntaje += 35;
      return { ...resumen(r, hallazgo.ubicacion.coordinates), puntaje };
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
    reporte = { ...datos, id: nuevoId(), tipo, estado: 'ACTIVO', creado_en: new Date().toISOString() };
    reportes.push(reporte);
  }
  return tipo === 'ENCONTRADA' ? { reporte, parecidos: parecidos(reporte) } : { reporte };
}

// ---------- Búsqueda (C5-36) ----------

export async function buscarReportes({ tipo, especie, tamano, color, desde, lat, lon, radio_km } = {}) {
  await esperar(400);
  const origen = lat != null && lon != null ? [lon, lat] : null;
  const resultados = reportes
    .filter((r) => r.estado === 'ACTIVO')
    .filter((r) => !tipo || r.tipo === tipo)
    .filter((r) => !especie || r.mascota.especie === especie)
    .filter((r) => !tamano || r.mascota.tamano === tamano)
    .filter((r) => !color || normal(r.mascota.color).includes(normal(color)))
    .filter((r) => !desde || new Date(r.fecha) >= new Date(desde))
    .map((r) => resumen(r, origen))
    .filter((r) => !radio_km || r.distancia_km == null || r.distancia_km <= radio_km)
    // RF11: primero lo más cercano; sin ubicación, lo más reciente.
    .sort((a, b) =>
      origen ? a.distancia_km - b.distancia_km : new Date(b.fecha) - new Date(a.fecha)
    );
  return { resultados };
}

export async function obtenerReporte(id) {
  await esperar(250);
  const r = reportes.find((x) => x.id === id);
  if (!r) throw new ErrorApi('Este reporte ya no está disponible.', 404);
  return resumen(r, null);
}

// ---------- Mapa (C5-37) ----------

// La API real filtra por radio_km; el simulador devuelve todo para que los
// datos de ejemplo (en Pereira) se vean aunque se pruebe desde otra ciudad.
export async function obtenerMapa({ lat, lon } = {}) {
  await esperar(400);
  const origen = lat != null && lon != null ? [lon, lat] : null;
  return {
    reportes: reportes.filter((r) => r.estado === 'ACTIVO').map((r) => resumen(r, origen)),
    puntos,
  };
}
