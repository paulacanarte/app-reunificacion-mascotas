// VIEWMODEL
// Guarda el estado de la pantalla y la lógica de presentación:
// qué se está cargando, qué error mostrar, qué razas pasan el filtro.
// Recibe el servicio como parámetro (no lo importa), por eso no depende
// de la API real: se le puede pasar cualquier objeto que cumpla el contrato.
// No dibuja nada: eso lo hace la View.

import { useCallback, useEffect, useMemo, useState } from 'react';

export function useRazasViewModel(servicio) {
  const [razas, setRazas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [razaSeleccionada, setRazaSeleccionada] = useState(null);
  const [foto, setFoto] = useState(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);

  const cargarRazas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setRazas(await servicio.obtenerRazas());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [servicio]);

  const seleccionarRaza = useCallback(
    async (raza) => {
      setRazaSeleccionada(raza);
      setFoto(null);
      setCargandoFoto(true);
      try {
        setFoto(await servicio.obtenerFotoAleatoria(raza.id));
      } catch (e) {
        setError(e.message);
      } finally {
        setCargandoFoto(false);
      }
    },
    [servicio]
  );

  // Al abrir la pantalla se consume el endpoint una vez.
  useEffect(() => {
    cargarRazas();
  }, [cargarRazas]);

  const razasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return razas;
    return razas.filter((r) => r.nombre.toLowerCase().includes(texto));
  }, [razas, busqueda]);

  // Lo que la View puede leer y las acciones que puede ejecutar.
  return {
    razas: razasFiltradas,
    total: razas.length,
    cargando,
    error,
    busqueda,
    razaSeleccionada,
    foto,
    cargandoFoto,
    setBusqueda,
    reintentar: cargarRazas,
    seleccionarRaza,
  };
}
