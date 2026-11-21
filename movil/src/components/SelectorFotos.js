// Tomar o elegir las fotos del reporte (CU04, RN01).
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { guardarFoto, MAX_FOTOS, validarFoto } from '../offline/fotos';
import { colores, espacio, texto } from '../theme';
import Boton from './Boton';

const OPCIONES_IMAGEN = { mediaTypes: ['images'], quality: 0.6 }; // comprimidas para mala señal

export default function SelectorFotos({ fotos, onCambiar, error }) {
  const [ocupado, setOcupado] = useState(false);
  const quedan = MAX_FOTOS - fotos.length;

  async function agregar(resultado) {
    if (resultado.canceled) return;
    const nuevas = [];
    for (const asset of resultado.assets.slice(0, quedan)) {
      const problema = validarFoto(asset);
      if (problema) {
        Alert.alert('Foto no válida', problema);
        continue;
      }
      nuevas.push(await guardarFoto(asset));
    }
    onCambiar([...fotos, ...nuevas]);
  }

  async function usar(origen) {
    setOcupado(true);
    try {
      if (origen === 'camara') {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert('Sin permiso', 'Para tomar la foto, permite el uso de la cámara en los ajustes del teléfono.');
          return;
        }
        await agregar(await ImagePicker.launchCameraAsync(OPCIONES_IMAGEN));
      } else {
        await agregar(
          await ImagePicker.launchImageLibraryAsync({
            ...OPCIONES_IMAGEN,
            allowsMultipleSelection: quedan > 1,
            selectionLimit: quedan,
          })
        );
      }
    } catch {
      Alert.alert('No se pudo agregar la foto', 'Inténtalo de nuevo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={texto.etiqueta}>Fotos</Text>
      <Text style={texto.pequeno}>
        Hasta {MAX_FOTOS}. Que se vea bien la cara y el cuerpo; ayudan a encontrar coincidencias.
      </Text>

      {fotos.length > 0 && (
        <View style={estilos.miniaturas}>
          {fotos.map((uri) => (
            <View key={uri}>
              <Image source={{ uri }} style={estilos.miniatura} accessibilityIgnoresInvertColors />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
                onPress={() => onCambiar(fotos.filter((f) => f !== uri))}
                style={estilos.quitar}
                hitSlop={8}
              >
                <Text style={estilos.textoQuitar}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {quedan > 0 && (
        <View style={estilos.botones}>
          <View style={{ flex: 1 }}>
            <Boton titulo="Tomar foto" variante="secundario" onPress={() => usar('camara')} deshabilitado={ocupado} />
          </View>
          <View style={{ flex: 1 }}>
            <Boton titulo="Galería" variante="secundario" onPress={() => usar('galeria')} deshabilitado={ocupado} />
          </View>
        </View>
      )}
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.s, marginBottom: espacio.m },
  miniaturas: { flexDirection: 'row', gap: espacio.s },
  miniatura: { width: 96, height: 96, borderRadius: 10, backgroundColor: colores.borde },
  quitar: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,38,44,0.75)',
  },
  textoQuitar: { color: '#fff', fontSize: 14, fontWeight: '700' },
  botones: { flexDirection: 'row', gap: espacio.s },
  error: { fontSize: 13, color: colores.alerta },
});
