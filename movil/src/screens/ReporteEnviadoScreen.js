// Confirmación del reporte. Si fue un hallazgo, muestra los reportes de
// pérdida parecidos que devolvió la API (RF07).
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '../components/Boton';
import Fondo from '../components/Fondo';
import TarjetaReporte from '../components/TarjetaReporte';
import { colores, espacio, sombra, texto } from '../theme';

export default function ReporteEnviadoScreen({ navigation, route }) {
  const { tipo, enviado, parecidos = [] } = route.params ?? {};

  return (
    <Fondo>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.contenido}>
          <View style={estilos.aviso}>
            <Text style={estilos.icono}>{enviado ? '✅' : '📥'}</Text>
            <Text style={[texto.titulo, { textAlign: 'center' }]}>
              {enviado ? 'Reporte publicado' : 'Reporte guardado'}
            </Text>
            <Text style={[texto.subtitulo, { textAlign: 'center' }]}>
              {enviado
                ? tipo === 'PERDIDA'
                  ? 'Te avisaremos si alguien reporta un animal parecido.'
                  : 'Gracias por ayudar. El dueño podrá ver tu reporte.'
                : 'No hay conexión. Quedó guardado en el teléfono y se publica solo cuando vuelva la señal. No borres la app.'}
            </Text>
          </View>

          {enviado && tipo === 'ENCONTRADA' && (
            <View style={{ gap: espacio.s + 4 }}>
              <Text style={estilos.seccion}>
                {parecidos.length ? 'Mascotas perdidas parecidas' : 'Aún no hay mascotas perdidas parecidas'}
              </Text>
              <Text style={texto.pequeno}>
                {parecidos.length
                  ? '¿Alguna es el animal que encontraste? Toca para ver el detalle.'
                  : 'Si alguien la reporta, te avisaremos.'}
              </Text>
              {parecidos.map((r) => (
                <TarjetaReporte
                  key={r.id}
                  reporte={{ ...r, tipo: r.tipo ?? 'PERDIDA' }}
                  onPress={() => navigation.navigate('DetalleReporte', { id: r.id })}
                />
              ))}
            </View>
          )}

          <Boton titulo="Volver al inicio" onPress={() => navigation.popToTop()} />
        </ScrollView>
      </SafeAreaView>
    </Fondo>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l, gap: espacio.l },
  aviso: {
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.l,
    borderRadius: 20,
    backgroundColor: colores.superficie,
    ...sombra,
  },
  icono: { fontSize: 48 },
  seccion: { fontSize: 20, fontWeight: '700', color: colores.tinta },
});
