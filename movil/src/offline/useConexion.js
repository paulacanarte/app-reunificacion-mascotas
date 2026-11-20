// Vigila la señal para toda la app. Al recuperarla, publica lo que quedó
// en la cola. Está arriba de la navegación para que también funcione en
// los reportes sin cuenta (RF04) y no solo mientras se ve la pantalla de Inicio.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { alCambiarCola, contarPendientes, sincronizar } from './queue';

const REINTENTO_MS = 60000; // con señal pero sin servidor, se reintenta cada minuto

const ConexionContext = createContext({ conectado: true, pendientes: 0 });

export function ConexionProvider({ children }) {
  const [conectado, setConectado] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const anterior = useRef(false);

  useEffect(() => {
    const recontar = () => contarPendientes().then(setPendientes).catch(() => {});
    recontar();
    const dejarDeOir = alCambiarCola(recontar);

    const cancelar = NetInfo.addEventListener((estado) => {
      const ahora = Boolean(estado.isConnected) && estado.isInternetReachable !== false;
      setConectado(ahora);
      if (ahora && !anterior.current) sincronizar().catch(() => {});
      anterior.current = ahora;
    });

    return () => {
      dejarDeOir();
      cancelar();
    };
  }, []);

  useEffect(() => {
    if (!conectado || pendientes === 0) return undefined;
    const id = setInterval(() => sincronizar().catch(() => {}), REINTENTO_MS);
    return () => clearInterval(id);
  }, [conectado, pendientes]);

  return <ConexionContext.Provider value={{ conectado, pendientes }}>{children}</ConexionContext.Provider>;
}

export function useConexion() {
  return useContext(ConexionContext);
}
