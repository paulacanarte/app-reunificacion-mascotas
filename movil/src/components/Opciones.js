// Grupo de opciones para tocar (una sola a la vez). Más rápido que escribir
// en una emergencia y evita errores de ortografía al comparar reportes.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, espacio, texto } from '../theme';

export default function Opciones({ etiqueta, opciones, valor, onCambiar, error }) {
  return (
    <View style={estilos.contenedor}>
      <Text style={texto.etiqueta}>{etiqueta}</Text>
      <View style={estilos.fila} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
        {opciones.map((o) => {
          const activa = o.valor === valor;
          return (
            <Pressable
              key={o.valor}
              accessibilityRole="radio"
              accessibilityState={{ checked: activa }}
              onPress={() => onCambiar(o.valor)}
              style={[estilos.opcion, activa && estilos.activa, error && !valor && estilos.conError]}
            >
              <Text style={[estilos.texto, activa && estilos.textoActivo]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.xs, marginBottom: espacio.m },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  opcion: {
    minHeight: 44,
    paddingHorizontal: espacio.m,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  activa: { backgroundColor: colores.primario, borderColor: colores.primario },
  conError: { borderColor: colores.alerta },
  texto: { fontSize: 15, color: colores.tinta },
  textoActivo: { color: '#fff', fontWeight: '600' },
  error: { fontSize: 13, color: colores.alerta },
});
