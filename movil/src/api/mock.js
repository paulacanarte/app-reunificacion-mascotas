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
