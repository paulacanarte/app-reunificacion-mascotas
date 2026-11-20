// Vigila la señal. Al recuperarla, sincroniza la cola automáticamente.
import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { USAR_MOCK } from '../config';
import { contarPendientes, sincronizar } from './queue';

export function useConexion() {
  const [conectado, setConectado] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const anterior = useRef(true);

  useEffect(() => {
    contarPendientes().then(setPendientes).catch(() => {});

    const cancelar = NetInfo.addEventListener(async (estado) => {
      const ahora = Boolean(estado.isConnected) && estado.isInternetReachable !== false;
      setConectado(ahora);
      // Con datos simulados no hay servidor real al que sincronizar.
      if (ahora && !anterior.current && !USAR_MOCK) {
        const resultado = await sincronizar().catch(() => null);
        if (resultado) setPendientes(resultado.pendientes);
      }
      anterior.current = ahora;
    });
    return cancelar;
  }, []);

  return { conectado, pendientes };
}
