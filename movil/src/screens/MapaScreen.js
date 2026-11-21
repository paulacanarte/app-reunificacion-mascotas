// CU11 Ver mapa (C5-37, RF12): mascotas perdidas, animales encontrados,
// refugios y puntos de recepción. Cada mascota se ve con un ícono de su especie.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Boton from '../components/Boton';
import { FotoMascota, Insignia } from '../components/TarjetaReporte';
import { obtenerMapa } from '../api/busqueda';
import { aCoordenada, distanciaTexto, EMOJI_ESPECIE, haceCuanto, rasgos, tituloReporte } from '../formato';
import { useConexion } from '../offline/useConexion';
import { ubicacionRapida } from '../offline/ubicacion';
import { colores, espacio, sombra, texto } from '../theme';

// Centro de Pereira: se usa si no hay permiso de ubicación.
const REGION_INICIAL = { latitude: 4.8133, longitude: -75.6961, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const RADIO_KM = 30;

const CAPAS = [
  { clave: 'PERDIDA', texto: 'Perdidas', icono: '🐾', color: colores.perdida },
  { clave: 'ENCONTRADA', texto: 'Encontradas', icono: '💚', color: colores.encontrada },
  { clave: 'PUNTOS', texto: 'Refugios', icono: '🏠', color: colores.refugio },
];

function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// Ícono pequeño del mapa: círculo blanco con el emoji y borde del color del tipo.
function Pin({ emoji, color, seleccionado }) {
  return (
    <View style={estilos.pinContenedor}>
      <View style={[estilos.pin, { borderColor: color }, seleccionado && estilos.pinSeleccionado]}>
        <Text style={seleccionado ? estilos.emojiGrande : estilos.emoji}>{emoji}</Text>
      </View>
      <View style={[estilos.punta, { borderTopColor: color }]} />
    </View>
  );
}

function TarjetaPunto({ punto }) {
  const lleno = punto.capacidad && punto.ocupados >= punto.capacidad;
  return (
    <View style={{ gap: 4 }}>
      <View style={estilos.filaTitulo}>
        <Text style={{ fontSize: 28 }}>{punto.tipo === 'REFUGIO' ? '🏠' : '📦'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nombre}>{punto.nombre}</Text>
          <Text style={texto.pequeno}>{punto.tipo === 'REFUGIO' ? 'Refugio' : 'Punto de recepción'}</Text>
        </View>
      </View>
      {punto.capacidad ? (
        <Text style={[estilos.cupo, lleno && { color: colores.alerta }]}>
          {lleno ? 'Sin cupos disponibles' : `${punto.capacidad - punto.ocupados} cupos libres de ${punto.capacidad}`}
        </Text>
      ) : null}
      <Text style={texto.cuerpo}>{punto.direccion}</Text>
      <Text style={texto.pequeno}>{punto.horario}</Text>
    </View>
  );
}

export default function MapaScreen({ navigation }) {
  const mapa = useRef(null);
  const abajo = useSafeAreaInsets().bottom;
  const { conectado } = useConexion();
  const [datos, setDatos] = useState({ reportes: [], puntos: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [capas, setCapas] = useState({ PERDIDA: true, ENCONTRADA: true, PUNTOS: true });
  const [seleccion, setSeleccion] = useState(null);
  // Android dibuja los íconos personalizados una vez; se redibujan solo al cambiar.
  const [redibujar, setRedibujar] = useState(true);

  useEffect(() => {
    (async () => {
      const yo = await ubicacionRapida();
      try {
        const r = await obtenerMapa({ lat: yo?.lat, lon: yo?.lon, radio_km: RADIO_KM });
        setDatos(r);
        encuadrar(r, yo);
      } catch (e) {
        setError(e.sinConexion ? 'Sin conexión: no se pudieron cargar los reportes.' : e.message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // El mapa ignora los movimientos antes de estar listo: se guardan para después.
  const listo = useRef(false);
  const pendiente = useRef(null);

  // Si hay reportes cerca, se centra en la persona; si no, muestra todos.
  function encuadrar(r, yo) {
    if (!listo.current) {
      pendiente.current = [r, yo];
      return;
    }
    const todos = [...r.reportes, ...r.puntos].map((x) => aCoordenada(x.ubicacion));
    if (!mapa.current || todos.length === 0) return;
    const aqui = yo ? { latitude: yo.lat, longitude: yo.lon } : null;
    if (aqui && todos.some((c) => distanciaKm(aqui, c) < 15)) {
      mapa.current.animateToRegion({ ...aqui, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
    } else {
      mapa.current.fitToCoordinates(todos, {
        edgePadding: { top: 140, right: 60, bottom: 200, left: 60 },
        animated: true,
      });
    }
  }

  const marcadores = useMemo(() => {
    const lista = [];
    for (const r of datos.reportes) {
      if (!capas[r.tipo]) continue;
      lista.push({
        clave: `r-${r.id}`,
        tipo: 'reporte',
        item: r,
        coordenada: aCoordenada(r.ubicacion),
        emoji: EMOJI_ESPECIE[r.mascota.especie] ?? '🐾',
        color: r.tipo === 'PERDIDA' ? colores.perdida : colores.encontrada,
      });
    }
    if (capas.PUNTOS) {
      for (const p of datos.puntos) {
        lista.push({
          clave: `p-${p.id}`,
          tipo: 'punto',
          item: p,
          coordenada: aCoordenada(p.ubicacion),
          emoji: p.tipo === 'REFUGIO' ? '🏠' : '📦',
          color: colores.refugio,
        });
      }
    }
    return lista;
  }, [datos, capas]);

  useEffect(() => {
    setRedibujar(true);
    const id = setTimeout(() => setRedibujar(false), 1200);
    return () => clearTimeout(id);
  }, [marcadores, seleccion]);

  const cuenta = (clave) =>
    clave === 'PUNTOS' ? datos.puntos.length : datos.reportes.filter((r) => r.tipo === clave).length;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={REGION_INICIAL}
        showsUserLocation
        showsMyLocationButton
        toolbarEnabled={false}
        onMapReady={() => {
          listo.current = true;
          if (pendiente.current) encuadrar(...pendiente.current);
        }}
        onPress={(e) => {
          // En Android tocar un ícono también llega aquí; solo se cierra al tocar el mapa vacío.
          if (e.nativeEvent.action !== 'marker-press') setSeleccion(null);
        }}
      >
        {marcadores.map((m) => (
          <Marker
            key={m.clave}
            coordinate={m.coordenada}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={redibujar}
            onPress={() => setSeleccion(m)}
            accessibilityLabel={m.tipo === 'reporte' ? tituloReporte(m.item) : m.item.nombre}
          >
            <Pin emoji={m.emoji} color={m.color} seleccionado={seleccion?.clave === m.clave} />
          </Marker>
        ))}
      </MapView>

      {/* Capas: tocar para mostrar u ocultar cada tipo. */}
      <View style={estilos.capas} pointerEvents="box-none">
        {CAPAS.map((c) => {
          const activa = capas[c.clave];
          return (
            <Pressable
              key={c.clave}
              accessibilityRole="switch"
              accessibilityState={{ checked: activa }}
              onPress={() => {
                setCapas((x) => ({ ...x, [c.clave]: !x[c.clave] }));
                setSeleccion(null);
              }}
              style={[estilos.capa, activa ? { backgroundColor: c.color } : estilos.capaApagada]}
            >
              <Text style={estilos.iconoCapa}>{c.icono}</Text>
              <Text style={[estilos.textoCapa, activa && { color: '#fff' }]}>
                {c.texto} {cargando ? '' : `(${cuenta(c.clave)})`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {(cargando || error || !conectado) && (
        <View style={estilos.estado}>
          {cargando ? <ActivityIndicator color={colores.primario} /> : null}
          <Text style={texto.pequeno}>
            {cargando ? 'Cargando reportes…' : error || 'Sin conexión: el mapa puede no estar al día.'}
          </Text>
        </View>
      )}

      {seleccion && (
        <View style={[estilos.hoja, { paddingBottom: espacio.m + abajo }]}>
          {seleccion.tipo === 'reporte' ? (
            <>
              <View style={estilos.filaTitulo}>
                <FotoMascota reporte={seleccion.item} tamano={64} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={estilos.filaTitulo}>
                    <Text style={estilos.nombre} numberOfLines={1}>
                      {tituloReporte(seleccion.item)}
                    </Text>
                    <Insignia tipo={seleccion.item.tipo} />
                  </View>
                  <Text style={texto.pequeno}>{rasgos(seleccion.item.mascota)}</Text>
                  <Text style={estilos.cupo}>
                    {[haceCuanto(seleccion.item.fecha), distanciaTexto(seleccion.item.distancia_km)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </View>
              <Boton
                titulo="Ver detalle"
                onPress={() => navigation.navigate('DetalleReporte', { id: seleccion.item.id })}
              />
            </>
          ) : (
            <TarjetaPunto punto={seleccion.item} />
          )}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pinContenedor: { alignItems: 'center' },
  pin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSeleccionado: { width: 50, height: 50, borderRadius: 25 },
  emoji: { fontSize: 18 },
  emojiGrande: { fontSize: 26 },
  punta: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  capas: {
    position: 'absolute',
    top: espacio.m,
    left: espacio.m,
    right: espacio.m,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacio.s,
  },
  capa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: espacio.m - 4,
    borderRadius: 20,
    ...sombra,
  },
  capaApagada: { backgroundColor: colores.superficie },
  iconoCapa: { fontSize: 16 },
  textoCapa: { fontSize: 14, fontWeight: '600', color: colores.tinta },
  estado: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
    borderRadius: 20,
    backgroundColor: colores.superficie,
    ...sombra,
  },
  hoja: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: espacio.m,
    padding: espacio.l,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colores.superficie,
    ...sombra,
    elevation: 12,
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  nombre: { flexShrink: 1, fontSize: 18, fontWeight: '700', color: colores.tinta },
  cupo: { fontSize: 14, fontWeight: '600', color: colores.primario },
});
