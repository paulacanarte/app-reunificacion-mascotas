// CU07 Detalle de un reporte (C5-36). La ubicación se muestra como una
// zona aproximada de 500 m para proteger a quien reportó (RNF02).
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import Boton from '../components/Boton';
import Fondo from '../components/Fondo';
import { FotoMascota, Insignia } from '../components/TarjetaReporte';
import { obtenerReporte } from '../api/busqueda';
import {
  aCoordenada,
  ESPECIES,
  ESTADO_ACTUAL,
  haceCuanto,
  nombreDe,
  TAMANOS,
  TIPO_REPORTE,
  tituloReporte,
} from '../formato';
import { colores, espacio, sombra, texto } from '../theme';

function Dato({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <View style={estilos.dato}>
      <Text style={estilos.etiquetaDato}>{etiqueta}</Text>
      <Text style={estilos.valorDato}>{valor}</Text>
    </View>
  );
}

export default function DetalleReporteScreen({ route }) {
  const { id } = route.params;
  const { width } = useWindowDimensions();
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerReporte(id)
      .then(setReporte)
      .catch((e) => setError(e.sinConexion ? 'Sin conexión. Inténtalo cuando tengas señal.' : e.message));
  }, [id]);

  if (error || !reporte) {
    return (
      <Fondo style={estilos.centro}>
        {error ? <Text style={texto.subtitulo}>{error}</Text> : <ActivityIndicator size="large" color={colores.primario} />}
      </Fondo>
    );
  }

  const m = reporte.mascota;
  const tipo = TIPO_REPORTE[reporte.tipo];
  const anchoFoto = width - espacio.l * 2;
  const centro = aCoordenada(reporte.ubicacion);

  return (
    <Fondo>
      <ScrollView contentContainerStyle={estilos.contenido}>
        {reporte.fotos?.length ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={estilos.fotos}>
            {reporte.fotos.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={{ width: anchoFoto, height: anchoFoto * 0.8, borderRadius: 18 }}
                accessibilityIgnoresInvertColors
              />
            ))}
          </ScrollView>
        ) : (
          <View style={{ alignSelf: 'center' }}>
            <FotoMascota reporte={reporte} tamano={160} radio={80} />
          </View>
        )}

        <View style={estilos.cabecera}>
          <Text style={texto.titulo}>{tituloReporte(reporte)}</Text>
          <Insignia tipo={reporte.tipo} />
        </View>
        <Text style={texto.subtitulo}>
          {reporte.tipo === 'PERDIDA' ? 'Se perdió' : 'Encontrado'} {haceCuanto(reporte.fecha)}
        </Text>

        <View style={estilos.tarjeta}>
          <Dato etiqueta="Especie" valor={nombreDe(ESPECIES, m.especie)} />
          <Dato etiqueta="Raza" valor={m.raza} />
          <Dato etiqueta="Color" valor={m.color} />
          <Dato etiqueta="Tamaño" valor={nombreDe(TAMANOS, m.tamano)} />
          <Dato etiqueta="Señas" valor={m.senas} />
          {reporte.tipo === 'ENCONTRADA' && (
            <Dato etiqueta="Dónde está" valor={nombreDe(ESTADO_ACTUAL, reporte.estado_actual)} />
          )}
        </View>

        {reporte.descripcion ? (
          <View style={estilos.tarjeta}>
            <Text style={texto.etiqueta}>Descripción</Text>
            <Text style={texto.cuerpo}>{reporte.descripcion}</Text>
          </View>
        ) : null}

        <View style={[estilos.tarjeta, { padding: 0, overflow: 'hidden' }]}>
          <MapView
            style={{ height: 180 }}
            liteMode
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            toolbarEnabled={false}
            initialRegion={{ ...centro, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
          >
            <Circle
              center={centro}
              radius={500}
              strokeColor={tipo.color}
              strokeWidth={2}
              fillColor={reporte.tipo === 'PERDIDA' ? 'rgba(196,83,44,0.18)' : 'rgba(30,107,82,0.18)'}
            />
          </MapView>
          <Text style={[texto.pequeno, { padding: espacio.m }]}>
            Zona aproximada. Para proteger a quien reportó no se muestra el punto exacto.
          </Text>
        </View>

        <Boton
          titulo={reporte.tipo === 'PERDIDA' ? 'Lo he visto' : 'Creo que es mi mascota'}
          onPress={() =>
            Alert.alert(
              'Contactar',
              'El chat con quien reportó (CU10) y la confirmación de coincidencias (CU09) se conectan cuando la API esté publicada.'
            )
          }
        />
      </ScrollView>
    </Fondo>
  );
}

const estilos = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', padding: espacio.l },
  contenido: { padding: espacio.l, gap: espacio.m, paddingBottom: espacio.xl * 2 },
  fotos: { borderRadius: 18 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, flexWrap: 'wrap', marginTop: espacio.s },
  tarjeta: { backgroundColor: colores.superficie, borderRadius: 16, padding: espacio.m, gap: espacio.s, ...sombra },
  dato: { flexDirection: 'row', justifyContent: 'space-between', gap: espacio.m },
  etiquetaDato: { fontSize: 15, color: colores.tenue },
  valorDato: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: colores.tinta, textAlign: 'right' },
});
