import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colores, espacio } from '../theme';

export default function Boton({ titulo, onPress, variante = 'primario', cargando = false, deshabilitado = false }) {
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        estilos.base,
        estilos[variante],
        pressed && estilos.presionado,
        inactivo && estilos.inactivo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'primario' ? '#fff' : colores.primario} />
      ) : (
        <Text style={[estilos.texto, variante === 'primario' && estilos.textoPrimario]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacio.m,
  },
  primario: { backgroundColor: colores.primario },
  secundario: { backgroundColor: colores.superficie, borderWidth: 1.5, borderColor: colores.primario },
  texto: { fontSize: 16, fontWeight: '600', color: colores.primario },
  textoPrimario: { color: '#fff' },
  presionado: { opacity: 0.85 },
  inactivo: { opacity: 0.5 },
});
