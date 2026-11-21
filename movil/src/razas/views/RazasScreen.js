// VIEW
// Solo dibuja lo que le entrega el ViewModel y le avisa cuando el usuario hace algo.
// No llama a la API, no hace fetch y no transforma datos.
// El servicio le llega por props desde App.js (no lo importa): bajo acoplamiento.

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fondo from '../../components/Fondo';
import Boton from '../../components/Boton';
import { colores, espacio, sombra, texto } from '../../theme';
import { useRazasViewModel } from '../viewmodels/useRazasViewModel';

export default function RazasScreen({ servicio }) {
  const vm = useRazasViewModel(servicio);

  if (vm.cargando) {
    return (
      <Fondo>
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={texto.subtitulo}>Cargando razas…</Text>
        </View>
      </Fondo>
    );
  }

  if (vm.error && vm.total === 0) {
    return (
      <Fondo>
        <View style={estilos.centro}>
          <Text style={estilos.error}>{vm.error}</Text>
          <Boton titulo="Reintentar" onPress={vm.reintentar} />
        </View>
      </Fondo>
    );
  }

  return (
    <Fondo>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <FlatList
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled"
          data={vm.razas}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={
            <View style={{ gap: espacio.m, marginBottom: espacio.s }}>
              <Text style={texto.pequeno}>{vm.total} razas desde dog.ceo · toca una para ver su foto</Text>

              {vm.razaSeleccionada && (
                <View style={estilos.tarjeta}>
                  <Text style={estilos.subtitulo}>{vm.razaSeleccionada.nombre}</Text>
                  {vm.cargandoFoto ? (
                    <View style={[estilos.foto, estilos.centro]}>
                      <ActivityIndicator color={colores.primario} />
                    </View>
                  ) : (
                    vm.foto && (
                      <Image
                        source={{ uri: vm.foto }}
                        style={estilos.foto}
                        accessibilityLabel={`Foto de ${vm.razaSeleccionada.nombre}`}
                      />
                    )
                  )}
                  <Pressable onPress={() => vm.seleccionarRaza(vm.razaSeleccionada)} hitSlop={8}>
                    <Text style={estilos.enlace}>Otra foto</Text>
                  </Pressable>
                </View>
              )}

              <TextInput
                style={estilos.buscador}
                placeholder="Buscar raza…"
                placeholderTextColor={colores.tenue}
                value={vm.busqueda}
                onChangeText={vm.setBusqueda}
              />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => vm.seleccionarRaza(item)}
              style={({ pressed }) => [estilos.fila, pressed && { opacity: 0.85 }]}
            >
              <Text style={estilos.nombre}>{item.nombre}</Text>
              {item.subrazas.length > 0 && <Text style={texto.pequeno}>{item.subrazas.join(', ')}</Text>}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: espacio.s }} />}
          ListEmptyComponent={<Text style={texto.pequeno}>No hay razas con ese nombre.</Text>}
        />
      </SafeAreaView>
    </Fondo>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.l, paddingTop: espacio.m },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacio.l, gap: espacio.m },
  error: { color: colores.alerta, textAlign: 'center', fontSize: 16 },
  tarjeta: {
    padding: espacio.m,
    borderRadius: 18,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    ...sombra,
  },
  subtitulo: { fontSize: 18, fontWeight: '700', color: colores.tinta, marginBottom: espacio.s },
  foto: { width: '100%', height: 220, borderRadius: 12, backgroundColor: colores.fondo },
  enlace: { color: colores.primario, marginTop: espacio.s, fontWeight: '700' },
  buscador: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colores.tinta,
    backgroundColor: colores.superficie,
  },
  fila: {
    padding: espacio.m,
    borderRadius: 14,
    backgroundColor: colores.superficie,
    gap: 2,
  },
  nombre: { fontSize: 16, fontWeight: '600', color: colores.tinta },
});
