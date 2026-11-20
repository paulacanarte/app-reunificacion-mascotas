// CU02 Iniciar sesión (RF02): correo y contraseña, o huella si ya se activó.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '../components/Boton';
import Campo from '../components/Campo';
import { useAuth } from '../context/AuthContext';
import { colores, espacio, texto } from '../theme';

export default function LoginScreen({ navigation }) {
  const { entrar, entrarConHuella, sesionBloqueada } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function alIngresar() {
    if (!correo.trim() || !contrasena) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      await entrar(correo, contrasena);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alUsarHuella() {
    setError('');
    const ok = await entrarConHuella();
    if (!ok) setError('No se pudo verificar. Ingresa con tu contraseña.');
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.encabezado}>
            <Text style={texto.titulo}>Ingresar</Text>
            <Text style={texto.subtitulo}>
              Reporta, busca y reúne mascotas perdidas después de una emergencia.
            </Text>
          </View>

          {sesionBloqueada && (
            <View style={estilos.bloqueHuella}>
              <Text style={texto.cuerpo}>Hola de nuevo, {sesionBloqueada.usuario.nombre}.</Text>
              <Boton titulo="Ingresar con huella o rostro" onPress={alUsarHuella} />
            </View>
          )}

          <Campo
            etiqueta="Correo"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
          />
          <Campo
            etiqueta="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            autoComplete="password"
          />

          {error ? <Text style={estilos.error}>{error}</Text> : null}

          <View style={estilos.acciones}>
            <Boton
              titulo="Ingresar"
              onPress={alIngresar}
              cargando={enviando}
              variante={sesionBloqueada ? 'secundario' : 'primario'}
            />
            <Boton titulo="Crear cuenta" variante="secundario" onPress={() => navigation.navigate('Registro')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacio.l, paddingTop: espacio.xl },
  encabezado: { gap: espacio.s, marginBottom: espacio.xl },
  bloqueHuella: {
    gap: espacio.m,
    padding: espacio.m,
    marginBottom: espacio.l,
    borderRadius: 12,
    backgroundColor: colores.primarioSuave,
  },
  error: { color: colores.alerta, fontSize: 14, marginBottom: espacio.m },
  acciones: { gap: espacio.m, marginTop: espacio.s },
});
