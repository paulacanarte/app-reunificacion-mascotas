// CU07 Buscar mascotas (C5-36): por tipo, especie, tamaño, color, fecha y zona.
// Los resultados salen del más cercano al más lejano (RF06, RF11).
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import Campo from '../components/Campo';
import Fondo from '../components/Fondo';
import Opciones from '../components/Opciones';
import TarjetaReporte from '../components/TarjetaReporte';
import { buscarReportes } from '../api/busqueda';
import { ESPECIES, TAMANOS } from '../formato';
import { useConexion } from '../offline/useConexion';
import { ubicacionRapida } from '../offline/ubicacion';
import { colores, espacio, texto } from '../theme';

const TODOS = { valor: '', texto: 'Todos' };

const TIPOS = [
  { valor: '', texto: 'Todos' },
  { valor: 'PERDIDA', texto: 'Perdidos' },
  { valor: 'ENCONTRADA', texto: 'Encontrados' },
];

const FECHAS = [
  { valor: 0, texto: 'Cualquier fecha' },
  { valor: 1, texto: 'Último día' },
  { valor: 3, texto: '3 días' },
  { valor: 7, texto: 'Semana' },
];

const RADIOS = [
  { valor: 0, texto: 'Sin límite' },
  { valor: 2, texto: '2 km' },
  { valor: 5, texto: '5 km' },
  { valor: 20, texto: '20 km' },
];

export default function BuscarScreen({ navigation, route }) {
  const { conectado } = useConexion();
  const [filtros, setFiltros] = useState({
    tipo: route.params?.tipo ?? '',
    especie: '',
    tamano: '',
    color: '',
    dias: 0,
    radio: 0,
  });
  const [colorEscrito, setColorEscrito] = useState('');
  const [ubicacion, setUbicacion] = useState(undefined); // undefined: buscando; null: no disponible
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cambiar = (campo) => (valor) => setFiltros((f) => ({ ...f, [campo]: valor }));

  useEffect(() => {
    ubicacionRapida().then(setUbicacion);
  }, []);

  // Espera a que la persona deje de escribir el color antes de buscar.
  useEffect(() => {
    const valor = colorEscrito.trim();
    const id = setTimeout(() => setFiltros((f) => (f.color === valor ? f : { ...f, color: valor })), 400);
    return () => clearTimeout(id);
  }, [colorEscrito]);

  useEffect(() => {
    if (ubicacion === undefined) return undefined; // primero la ubicación, para ordenar por cercanía
    let vigente = true;
    setCargando(true);
    setError('');
    buscarReportes({
      tipo: filtros.tipo,
      especie: filtros.especie,
      tamano: filtros.tamano,
      color: filtros.color,
      desde: filtros.dias ? new Date(Date.now() - filtros.dias * 86400000).toISOString() : '',
      lat: ubicacion?.lat,
      lon: ubicacion?.lon,
      radio_km: ubicacion && filtros.radio ? filtros.radio : '',
    })
      .then((r) => vigente && setResultados(r.resultados ?? []))
      .catch((e) =>
        vigente &&
        setError(e.sinConexion ? 'Sin conexión. Vuelve a intentarlo cuando tengas señal.' : e.message)
      )
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [filtros, ubicacion]);

  const encabezado = (
    <View>
      {!conectado && (
        <View style={estilos.banner}>
          <Text style={estilos.textoBanner}>Sin conexión: los resultados pueden no estar al día.</Text>
        </View>
      )}
      <Opciones etiqueta="Qué buscas" opciones={TIPOS} valor={filtros.tipo} onCambiar={cambiar('tipo')} />
      <Opciones etiqueta="Especie" opciones={[TODOS, ...ESPECIES]} valor={filtros.especie} onCambiar={cambiar('especie')} />
      <Opciones etiqueta="Tamaño" opciones={[TODOS, ...TAMANOS]} valor={filtros.tamano} onCambiar={cambiar('tamano')} />
      <Campo etiqueta="Color" value={colorEscrito} onChangeText={setColorEscrito} placeholder="Ej.: café, negro, blanco" />
      <Opciones etiqueta="Fecha del reporte" opciones={FECHAS} valor={filtros.dias} onCambiar={cambiar('dias')} />
      {ubicacion ? (
        <Opciones etiqueta="Distancia desde donde estás" opciones={RADIOS} valor={filtros.radio} onCambiar={cambiar('radio')} />
      ) : ubicacion === null ? (
        <Text style={[texto.pequeno, { marginBottom: espacio.m }]}>
          Sin acceso a tu ubicación: los resultados van del más reciente al más antiguo.
        </Text>
      ) : null}

      <View style={estilos.resumen}>
        <Text style={estilos.titulo}>
          {cargando ? 'Buscando…' : `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'}`}
        </Text>
        {cargando && <ActivityIndicator color={colores.primario} />}
      </View>
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );

  return (
    <Fondo>
      <FlatList
        data={cargando ? [] : resultados}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={
          !cargando && !error ? (
            <View style={estilos.vacio}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={texto.subtitulo}>No hay reportes con esos filtros. Prueba quitando alguno.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TarjetaReporte reporte={item} onPress={() => navigation.navigate('DetalleReporte', { id: item.id })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: espacio.s + 4 }} />}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      />
    </Fondo>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l, paddingBottom: espacio.xl * 2 },
  banner: {
    backgroundColor: colores.avisoSuave,
    borderLeftWidth: 4,
    borderLeftColor: colores.aviso,
    borderRadius: 8,
    padding: espacio.m,
    marginBottom: espacio.m,
  },
  textoBanner: { fontSize: 14, color: colores.tinta },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, marginTop: espacio.s, marginBottom: espacio.m },
  titulo: { fontSize: 20, fontWeight: '700', color: colores.tinta },
  error: { fontSize: 14, color: colores.alerta, marginBottom: espacio.m },
  vacio: { alignItems: 'center', gap: espacio.s, paddingVertical: espacio.xl },
});
