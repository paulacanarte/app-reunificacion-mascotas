import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colores, espacio, texto } from '../theme';

export default function Campo({ etiqueta, error, ayuda, ...props }) {
  return (
    <View style={estilos.contenedor}>
      <Text style={texto.etiqueta}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={colores.tenue}
        style={[estilos.entrada, error && estilos.entradaError]}
        {...props}
      />
      {error ? (
        <Text style={estilos.error}>{error}</Text>
      ) : ayuda ? (
        <Text style={texto.pequeno}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.xs, marginBottom: espacio.m },
  entrada: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: espacio.m,
    fontSize: 16,
    color: colores.tinta,
    backgroundColor: colores.superficie,
  },
  entradaError: { borderColor: colores.alerta },
  error: { fontSize: 13, color: colores.alerta },
});
