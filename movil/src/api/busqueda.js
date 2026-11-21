// CU07 Buscar reportes y CU11 Ver mapa (C5-36, C5-37).
import { USAR_MOCK } from '../config';
import { solicitud } from './client';
import * as mock from './mock';

function consulta(parametros) {
  const partes = Object.entries(parametros)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return partes.length ? `?${partes.join('&')}` : '';
}

// filtros: { tipo, especie, tamano, color, desde, lat, lon, radio_km }
// Respuesta: { resultados: [...] }, ordenados por cercanía si hay lat/lon (RF06, RF11).
export function buscarReportes(filtros) {
  if (USAR_MOCK) return mock.buscarReportes(filtros);
  return solicitud(`/reportes${consulta(filtros)}`);
}

export function obtenerReporte(id) {
  if (USAR_MOCK) return mock.obtenerReporte(id);
  return solicitud(`/reportes/${encodeURIComponent(id)}`);
}

// Respuesta: { reportes: [...], puntos: [...] } (RF12).
export function obtenerMapa({ lat, lon, radio_km }) {
  if (USAR_MOCK) return mock.obtenerMapa({ lat, lon, radio_km });
  return solicitud(`/mapa${consulta({ lat, lon, radio_km })}`);
}
