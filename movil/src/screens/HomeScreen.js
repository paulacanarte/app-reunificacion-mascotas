// Pantalla de inicio: las cuatro acciones principales del MVP.
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '../components/Boton';
import Fondo from '../components/Fondo';
import { useAuth } from '../context/AuthContext';
import { useConexion } from '../offline/useConexion';
import { colores, espacio, sombra, texto } from '../theme';

const NOMBRE_ROL = {
  DUENO: 'Dueño',
  CIUDADANO: 'Ciudadano',
  VETERINARIO: 'Veterinario o rescatista',
  FUNDACION: 'Fundación',
  ADMINISTRADOR: 'Administrador',
};

const ACCIONES = [
  {
    titulo: 'Reportar mascota perdida',
    detalle: 'Foto, última ubicación y descripción',
    icono: '🆘',
    color: colores.perdida,
    suave: colores.perdidaSuave,
    ir: ['Reporte', { tipo: 'PERDIDA' }],
  },
  {
    titulo: 'Reportar animal encontrado',
    detalle: 'Foto, lugar del hallazgo y dónde está',
    icono: '🤲',
    color: colores.encontrada,
    suave: colores.encontradaSuave,
    ir: ['Reporte', { tipo: 'ENCONTRADA' }],
  },
  {
    titulo: 'Buscar mascotas',
    detalle: 'Por especie, rasgos, zona y fecha',
    icono: '🔍',
    color: colores.busqueda,
    suave: colores.busquedaSuave,
    ir: ['Buscar'],
  },
  {
    titulo: 'Ver mapa',
    detalle: 'Refugios, puntos de recepción y reportes',
    icono: '🗺️',
    color: colores.refugio,
    suave: colores.refugioSuave,
    ir: ['Mapa'],
  },
];

export default function HomeScreen({ navigation }) {
  const { usuario, huellaActiva, activarHuella, salir } = useAuth();
  const { conectado, pendientes } = useConexion();
  const [cambiandoHuella, setCambiandoHuella] = useState(false);

  async function alCambiarHuella(valor) {
    setCambiandoHuella(true);
    const error = await activarHuella(valor);
    setCambiandoHuella(false);
    if (error) Alert.alert('Huella no disponible', error);
  }

  return (
    <Fondo>
      <SafeAreaView style={{ flex: 1 }}>
        {!conectado && (
          <View style={estilos.banner} accessibilityRole="alert">
            <Text style={estilos.textoBanner}>
              Sin conexión. Lo que reportes se guarda en el teléfono y se publica al volver la señal.
            </Text>
          </View>
        )}
        {pendientes > 0 && (
          <View style={estilos.banner}>
            <Text style={estilos.textoBanner}>
              {pendientes === 1 ? '1 reporte pendiente por publicar' : `${pendientes} reportes pendientes por publicar`}
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={estilos.contenido}>
          <View style={estilos.encabezado}>
            <View style={estilos.logo}>
              <Text style={{ fontSize: 30 }}>🐾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={texto.titulo}>Hola, {usuario.nombre.split(' ')[0]}</Text>
              <Text style={texto.subtitulo}>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</Text>
            </View>
          </View>

          <Text style={estilos.pregunta}>¿Qué necesitas hacer?</Text>

          <View style={estilos.lista}>
            {ACCIONES.map((a) => (
              <Pressable
                key={a.titulo}
                accessibilityRole="button"
                accessibilityHint={a.detalle}
                onPress={() => navigation.navigate(...a.ir)}
                style={({ pressed }) => [estilos.accion, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
              >
                <View style={[estilos.icono, { backgroundColor: a.suave }]}>
                  <Text style={{ fontSize: 26 }}>{a.icono}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={estilos.tituloAccion}>{a.titulo}</Text>
                  <Text style={texto.pequeno}>{a.detalle}</Text>
                </View>
                <Text style={[estilos.flecha, { color: a.color }]}>›</Text>
              </Pressable>
            ))}
          </View>

          <View style={estilos.ajuste}>
            <View style={{ flex: 1 }}>
              <Text style={texto.etiqueta}>Ingresar con huella o rostro</Text>
              <Text style={texto.pequeno}>Solo en este teléfono.</Text>
            </View>
            <Switch
              value={huellaActiva}
              onValueChange={alCambiarHuella}
              disabled={cambiandoHuella}
              trackColor={{ true: colores.primario }}
              accessibilityLabel="Ingresar con huella o rostro"
            />
          </View>

          <Boton titulo="Cerrar sesión" variante="secundario" onPress={salir} />
        </ScrollView>
      </SafeAreaView>
    </Fondo>
  );
}

const estilos = StyleSheet.create({
  banner: {
    backgroundColor: colores.avisoSuave,
    borderLeftWidth: 4,
    borderLeftColor: colores.aviso,
    borderRadius: 8,
    marginHorizontal: espacio.l,
    marginTop: espacio.s,
    padding: espacio.m,
  },
  textoBanner: { fontSize: 14, color: colores.tinta },
  contenido: { padding: espacio.l, gap: espacio.l },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficie,
    ...sombra,
  },
  pregunta: { fontSize: 18, fontWeight: '600', color: colores.tinta, marginBottom: -espacio.s },
  lista: { gap: espacio.s + 4 },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: 18,
    backgroundColor: colores.superficie,
    ...sombra,
  },
  icono: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tituloAccion: { fontSize: 17, fontWeight: '700', color: colores.tinta },
  flecha: { fontSize: 30, fontWeight: '300' },
  ajuste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
