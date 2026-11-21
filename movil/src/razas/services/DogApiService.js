// SERVICE (implementación real)
// Sabe QUÉ endpoints llamar y convierte la respuesta en Models.
// No sabe nada de pantallas, React ni estados de carga.
//
// "Contrato" que debe cumplir cualquier servicio de perros (real o falso):
//   obtenerRazas(): Promise<Raza[]>
//   obtenerFotoAleatoria(idRaza): Promise<string>   // URL de la imagen

import { getJson } from './httpClient';
import { razasDesdeRespuestaApi } from '../models/Raza';

const URL_BASE = 'https://dog.ceo/api';

export function crearDogApiService(http = { getJson }) {
  return {
    // Endpoint: GET https://dog.ceo/api/breeds/list/all
    async obtenerRazas() {
      const json = await http.getJson(`${URL_BASE}/breeds/list/all`);
      return razasDesdeRespuestaApi(json);
    },

    // Endpoint: GET https://dog.ceo/api/breed/{raza}/images/random
    async obtenerFotoAleatoria(idRaza) {
      const json = await http.getJson(`${URL_BASE}/breed/${idRaza}/images/random`);
      return json.message;
    },
  };
}
