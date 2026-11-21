// INYECCIÓN DE DEPENDENCIAS
// Único lugar donde se decide QUÉ implementación de servicio usa la app.
// Para probar sin internet, cambiar USAR_SERVICIO_FALSO a true: nada más cambia.

import { crearDogApiService } from '../services/DogApiService';
import { crearDogServiceFalso } from '../services/DogServiceFalso';

const USAR_SERVICIO_FALSO = false;

export const dogService = USAR_SERVICIO_FALSO
  ? crearDogServiceFalso()
  : crearDogApiService();
