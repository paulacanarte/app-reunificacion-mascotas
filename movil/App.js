import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConexionProvider } from './src/offline/useConexion';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReporteScreen from './src/screens/ReporteScreen';
import ReporteEnviadoScreen from './src/screens/ReporteEnviadoScreen';
import { colores } from './src/theme';

const Stack = createNativeStackNavigator();

const conEncabezado = {
  headerShown: true,
  headerTintColor: colores.primario,
  headerStyle: { backgroundColor: colores.fondo },
  headerTitleStyle: { color: colores.tinta },
  headerShadowVisible: false,
  headerBackTitle: 'Atrás',
};

function Rutas() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {usuario ? (
        <Stack.Screen name="Inicio" component={HomeScreen} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegisterScreen} />
        </>
      )}
      {/* Con o sin sesión: se puede reportar sin cuenta (RF04). */}
      <Stack.Screen
        name="Reporte"
        component={ReporteScreen}
        options={({ route }) => ({
          ...conEncabezado,
          title: route.params?.tipo === 'ENCONTRADA' ? 'Animal encontrado' : 'Mascota perdida',
        })}
      />
      <Stack.Screen name="ReporteEnviado" component={ReporteEnviadoScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ConexionProvider>
          <NavigationContainer>
            <Rutas />
          </NavigationContainer>
          <StatusBar style="dark" />
        </ConexionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
