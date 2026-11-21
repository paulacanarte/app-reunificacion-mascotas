// SERVICE (implementación falsa)
// Cumple el mismo contrato que DogApiService pero sin internet.
// Sirve para demostrar el bajo acoplamiento: el ViewModel y la View funcionan
// igual con este servicio o con el real. Se cambia en src/di/contenedor.js.

import { crearRaza } from '../models/Raza';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export function crearDogServiceFalso() {
  return {
    async obtenerRazas() {
      await esperar(500);
      return [
        crearRaza('beagle'),
        crearRaza('bulldog', ['boston', 'french']),
        crearRaza('husky'),
      ];
    },

    async obtenerFotoAleatoria() {
      await esperar(300);
      return 'https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg';
    },
  };
}
