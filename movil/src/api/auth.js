// CU01 Registrarse y CU02 Iniciar sesión.
import { USAR_MOCK } from '../config';
import { solicitud } from './client';
import * as mock from './mock';

export function registrar(datos) {
  if (USAR_MOCK) return mock.registrar(datos);
  return solicitud('/auth/registro', { metodo: 'POST', cuerpo: datos, conToken: false });
}

export function iniciarSesion(correo, contrasena) {
  if (USAR_MOCK) return mock.iniciarSesion(correo, contrasena);
  return solicitud('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo, contrasena },
    conToken: false,
  });
}
