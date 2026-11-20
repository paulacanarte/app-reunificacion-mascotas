// Confirmación del reporte. Si fue un hallazgo, muestra los reportes de
// pérdida parecidos que devolvió la API (RF07).
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '../components/Boton';
import { colores, espacio, texto } from '../theme';
import { ESPECIES, TAMANOS } from './ReporteScreen';

const nombreDe = (lista, valor) => lista.find((o) => o.valor === valor)?.texto ?? valor;

function Parecido({ reporte }) {
  const m = reporte.mascota;
  const foto = reporte.fotos?.[0];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => Alert.alert(m.nombre ?? 'Reporte', 'El detalle del reporte y el contacto se construyen en la tarea C5-36.')}
      style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }]}
    >
      {foto ? (
        <Image source={{ uri: foto }} style={estilos.foto} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[estilos.foto, estilos.sinFoto]}>
          <Text style={texto.pequeno}>Sin foto</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={estilos.nombre}>{m.nombre || nombreDe(ESPECIES, m.especie)}</Text>
        <Text style={texto.pequeno}>
          {nombreDe(ESPECIES, m.especie)} · {m.color} · {nombreDe(TAMANOS, m.tamano)}
        </Text>
        {m.senas ? <Text style={texto.pequeno}>{m.senas}</Text> : null}
        <Text style={estilos.dato}>
          Parecido {reporte.puntaje}%
          {reporte.distancia_km != null ? ` · a ${reporte.distancia_km} km` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ReporteEnviadoScreen({ navigation, route }) {
  const { tipo, enviado, parecidos = [] } = route.params ?? {};

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={[estilos.aviso, !enviado && estilos.avisoPendiente]}>
          <Text style={texto.titulo}>{enviado ? 'Reporte publicado' : 'Reporte guardado'}</Text>
          <Text style={texto.subtitulo}>
            {enviado
              ? tipo === 'PERDIDA'
                ? 'Te avisaremos si alguien reporta un animal parecido.'
                : 'Gracias por ayudar. El dueño podrá ver tu reporte.'
              : 'No hay conexión. Quedó guardado en el teléfono y se publica solo cuando vuelva la señal. No borres la app.'}
          </Text>
        </View>

        {enviado && tipo === 'ENCONTRADA' && (
          <View style={{ gap: espacio.s }}>
            <Text style={estilos.seccion}>
              {parecidos.length ? 'Mascotas perdidas parecidas' : 'Aún no hay mascotas perdidas parecidas'}
            </Text>
            {parecidos.length ? (
              <Text style={texto.pequeno}>¿Alguna es el animal que encontraste?</Text>
            ) : (
              <Text style={texto.pequeno}>Si alguien la reporta, te avisaremos.</Text>
            )}
            {parecidos.map((r) => (
              <Parecido key={r.id} reporte={r} />
            ))}
          </View>
        )}

        <Boton titulo="Volver al inicio" onPress={() => navigation.popToTop()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacio.l, gap: espacio.l },
  aviso: { gap: espacio.s, padding: espacio.m, borderRadius: 12, backgroundColor: colores.primarioSuave },
  avisoPendiente: { backgroundColor: colores.avisoSuave },
  seccion: { fontSize: 20, fontWeight: '700', color: colores.tinta },
  tarjeta: {
    flexDirection: 'row',
    gap: espacio.m,
    padding: espacio.s,
    borderRadius: 12,
    backgroundColor: colores.superficie,
  },
  foto: { width: 80, height: 80, borderRadius: 8 },
  sinFoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  nombre: { fontSize: 17, fontWeight: '600', color: colores.tinta },
  dato: { fontSize: 13, fontWeight: '600', color: colores.primario },
});
