// Textos y valores compartidos por los reportes, la búsqueda y el mapa.
// Los valores en MAYÚSCULA deben coincidir con las enumeraciones del dominio en Python.
import { colores } from './theme';

export const ESPECIES = [
  { valor: 'PERRO', texto: 'Perro' },
  { valor: 'GATO', texto: 'Gato' },
  { valor: 'OTRO', texto: 'Otro' },
];

export const TAMANOS = [
  { valor: 'PEQUENO', texto: 'Pequeño' },
  { valor: 'MEDIANO', texto: 'Mediano' },
  { valor: 'GRANDE', texto: 'Grande' },
];

export const ESTADO_ACTUAL = [
  { valor: 'CON_QUIEN_REPORTA', texto: 'Lo tiene quien lo encontró' },
  { valor: 'EN_REFUGIO', texto: 'En un refugio' },
  { valor: 'SIGUE_EN_EL_LUGAR', texto: 'Sigue en el lugar' },
];

export const EMOJI_ESPECIE = { PERRO: '🐶', GATO: '🐱', OTRO: '🐾' };

export const TIPO_REPORTE = {
  PERDIDA: { texto: 'Perdida', color: colores.perdida, suave: colores.perdidaSuave },
  ENCONTRADA: { texto: 'Encontrada', color: colores.encontrada, suave: colores.encontradaSuave },
};

export const nombreDe = (lista, valor) => lista.find((o) => o.valor === valor)?.texto ?? valor ?? '';

// "Toby" para una pérdida; "Perro encontrado" para un hallazgo sin nombre.
export function tituloReporte(r) {
  if (r.mascota?.nombre) return r.mascota.nombre;
  const especie = nombreDe(ESPECIES, r.mascota?.especie);
  if (r.mascota?.especie === 'OTRO') return 'Animal encontrado';
  return `${especie} ${r.tipo === 'PERDIDA' ? 'perdido' : 'encontrado'}`;
}

export function rasgos(m) {
  return [nombreDe(ESPECIES, m.especie), m.color, nombreDe(TAMANOS, m.tamano)].filter(Boolean).join(' · ');
}

export function haceCuanto(fecha) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (minutos < 60) return minutos <= 1 ? 'hace un momento' : `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return horas === 1 ? 'hace 1 hora' : `hace ${horas} horas`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

export function distanciaTexto(km) {
  if (km == null) return '';
  return km < 1 ? `a ${Math.round(km * 1000)} m` : `a ${km.toFixed(1).replace('.', ',')} km`;
}

// GeoJSON guarda [longitud, latitud]; los mapas usan { latitude, longitude }.
export const aCoordenada = (ubicacion) => ({
  latitude: ubicacion.coordinates[1],
  longitude: ubicacion.coordinates[0],
});
