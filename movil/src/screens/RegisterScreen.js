// CU01 Registrarse (RF01): nombre, correo, contraseña, teléfono y rol.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '../components/Boton';
import Campo from '../components/Campo';
import { useAuth } from '../context/AuthContext';
import { colores, espacio, texto } from '../theme';

// Deben coincidir con la enumeración de roles del dominio en Python.
const ROLES = [
  { valor: 'DUENO', nombre: 'Dueño' },
  { valor: 'CIUDADANO', nombre: 'Ciudadano' },
  { valor: 'VETERINARIO', nombre: 'Veterinario o rescatista' },
  { valor: 'FUNDACION', nombre: 'Fundación' },
];

function validar({ nombre, correo, contrasena, telefono, rol }) {
  const errores = {};
  if (nombre.trim().length < 3) errores.nombre = 'Escribe tu nombre completo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) errores.correo = 'Escribe un correo válido.';
  if (contrasena.length < 8) errores.contrasena = 'Usa al menos 8 caracteres.';
  if (!/^3\d{9}$/.test(telefono.replace(/\s/g, ''))) errores.telefono = 'Escribe un celular de 10 dígitos que empiece por 3.';
  if (!rol) errores.rol = 'Elige cómo vas a usar la app.';
  return errores;
}

export default function RegisterScreen({ navigation }) {
  const { registrarse } = useAuth();
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '', telefono: '', rol: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }));

  async function alCrear() {
    const encontrados = validar(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setErrorGeneral('');
    setEnviando(true);
    try {
      await registrarse({ ...datos, telefono: datos.telefono.replace(/\s/g, '') });
    } catch (e) {
      setErrorGeneral(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Text style={[texto.titulo, { marginBottom: espacio.l }]}>Crear cuenta</Text>

          <Campo etiqueta="Nombre" value={datos.nombre} onChangeText={cambiar('nombre')} error={errores.nombre} autoComplete="name" />
          <Campo
            etiqueta="Correo"
            value={datos.correo}
            onChangeText={cambiar('correo')}
            error={errores.correo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Campo
            etiqueta="Contraseña"
            value={datos.contrasena}
            onChangeText={cambiar('contrasena')}
            error={errores.contrasena}
            secureTextEntry
            autoComplete="new-password"
          />
          <Campo
            etiqueta="Celular"
            value={datos.telefono}
            onChangeText={cambiar('telefono')}
            error={errores.telefono}
            ayuda="Solo se usa para recuperar tu cuenta. Nadie más lo ve."
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Text style={texto.etiqueta}>¿Cómo vas a usar la app?</Text>
          <View style={estilos.roles} accessibilityRole="radiogroup">
            {ROLES.map((r) => {
              const elegido = datos.rol === r.valor;
              return (
                <Pressable
                  key={r.valor}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: elegido }}
                  onPress={() => cambiar('rol')(r.valor)}
                  style={[estilos.rol, elegido && estilos.rolElegido]}
                >
                  <Text style={[estilos.textoRol, elegido && estilos.textoRolElegido]}>{r.nombre}</Text>
                </Pressable>
              );
            })}
          </View>
          {errores.rol ? <Text style={estilos.error}>{errores.rol}</Text> : null}
          {errorGeneral ? <Text style={estilos.error}>{errorGeneral}</Text> : null}

          <View style={estilos.acciones}>
            <Boton titulo="Crear cuenta" onPress={alCrear} cargando={enviando} />
            <Boton titulo="Ya tengo cuenta" variante="secundario" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacio.l },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s, marginTop: espacio.s, marginBottom: espacio.s },
  rol: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  rolElegido: { borderColor: colores.primario, backgroundColor: colores.primarioSuave },
  textoRol: { fontSize: 15, color: colores.tinta },
  textoRolElegido: { color: colores.primario, fontWeight: '600' },
  error: { color: colores.alerta, fontSize: 14, marginBottom: espacio.s },
  acciones: { gap: espacio.m, marginTop: espacio.l },
});
