// Pantalla de inicio. Las acciones se conectan a sus tareas del MVP.
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '../components/Boton';
import { useAuth } from '../context/AuthContext';
import { useConexion } from '../offline/useConexion';
import { colores, espacio, texto } from '../theme';

const NOMBRE_ROL = {
  DUENO: 'Dueño',
  CIUDADANO: 'Ciudadano',
  VETERINARIO: 'Veterinario o rescatista',
  FUNDACION: 'Fundación',
  ADMINISTRADOR: 'Administrador',
};

const ACCIONES = [
  { titulo: 'Reportar mascota perdida', detalle: 'Foto, última ubicación y descripción', tarea: 'C5-35' },
  { titulo: 'Reportar animal encontrado', detalle: 'Foto, lugar del hallazgo y dónde está', tarea: 'C5-35' },
  { titulo: 'Buscar mascotas', detalle: 'Por especie, rasgos, zona y fecha', tarea: 'C5-36' },
  { titulo: 'Ver mapa', detalle: 'Refugios, puntos de recepción y reportes', tarea: 'C5-37' },
];

export default function HomeScreen() {
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
    <SafeAreaView style={estilos.pantalla}>
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
          <Text style={texto.titulo}>Hola, {usuario.nombre.split(' ')[0]}</Text>
          <Text style={texto.subtitulo}>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</Text>
        </View>

        <View style={estilos.lista}>
          {ACCIONES.map((a) => (
            <Pressable
              key={a.titulo}
              accessibilityRole="button"
              onPress={() => Alert.alert(a.titulo, `Esta pantalla se construye en la tarea ${a.tarea}.`)}
              style={({ pressed }) => [estilos.accion, pressed && { opacity: 0.85 }]}
            >
              <Text style={estilos.tituloAccion}>{a.titulo}</Text>
              <Text style={texto.pequeno}>{a.detalle}</Text>
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
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  banner: { backgroundColor: colores.avisoSuave, borderBottomWidth: 2, borderBottomColor: colores.aviso, padding: espacio.m },
  textoBanner: { fontSize: 14, color: colores.tinta },
  contenido: { padding: espacio.l, gap: espacio.l },
  encabezado: { gap: espacio.xs },
  lista: { gap: espacio.s },
  accion: {
    padding: espacio.m,
    borderRadius: 12,
    backgroundColor: colores.superficie,
    borderLeftWidth: 4,
    borderLeftColor: colores.primario,
    gap: 2,
  },
  tituloAccion: { fontSize: 17, fontWeight: '600', color: colores.tinta },
  ajuste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: 12,
    backgroundColor: colores.superficie,
  },
});
