// Estado de la sesión para toda la app (CU01, CU02 y RF02).
import { createContext, useContext, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as authApi from '../api/auth';
import {
  biometriaActiva,
  borrarSesion,
  cambiarBiometria,
  guardarSesion,
  obtenerSesion,
} from '../storage/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  // Sesión guardada que espera la huella para abrirse.
  const [sesionBloqueada, setSesionBloqueada] = useState(null);
  const [huellaActiva, setHuellaActiva] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const sesion = await obtenerSesion();
        if (!sesion) return;
        const conHuella = await biometriaActiva();
        setHuellaActiva(conHuella);
        // Sin huella, la sesión se abre directo, incluso sin conexión.
        if (conHuella) setSesionBloqueada(sesion);
        else setUsuario(sesion.usuario);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function abrirSesion(sesion) {
    await guardarSesion(sesion);
    setSesionBloqueada(null);
    setUsuario(sesion.usuario);
  }

  async function entrar(correo, contrasena) {
    await abrirSesion(await authApi.iniciarSesion(correo, contrasena));
  }

  async function registrarse(datos) {
    await abrirSesion(await authApi.registrar(datos));
  }

  async function entrarConHuella() {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ingresa con tu huella o rostro',
      cancelLabel: 'Usar contraseña',
    });
    if (!resultado.success) return false;
    setUsuario(sesionBloqueada.usuario);
    setSesionBloqueada(null);
    return true;
  }

  // Devuelve un texto de error o null si se pudo activar.
  async function activarHuella(activa) {
    if (activa) {
      const tieneSensor = await LocalAuthentication.hasHardwareAsync();
      const registrada = await LocalAuthentication.isEnrolledAsync();
      if (!tieneSensor || !registrada) {
        return 'Este teléfono no tiene huella ni rostro configurados.';
      }
    }
    await cambiarBiometria(activa);
    setHuellaActiva(activa);
    return null;
  }

  async function salir() {
    await borrarSesion();
    setHuellaActiva(false);
    setSesionBloqueada(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        sesionBloqueada,
        huellaActiva,
        entrar,
        registrarse,
        entrarConHuella,
        activarHuella,
        salir,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
