// Fondo de todas las pantallas: degradado menta → crema con huellas suaves.
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colores } from '../theme';

const HUELLAS = [
  { top: '6%', right: '8%', size: 46, rotate: '20deg' },
  { top: '30%', left: '-4%', size: 64, rotate: '-25deg' },
  { top: '58%', right: '-2%', size: 56, rotate: '35deg' },
  { bottom: '6%', left: '12%', size: 40, rotate: '-10deg' },
];

export default function Fondo({ children, style }) {
  return (
    <View style={[estilos.base, style]}>
      <LinearGradient
        colors={[colores.fondoArriba, colores.fondoMedio, colores.fondoAbajo]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
        <View style={[estilos.circulo, estilos.circuloArriba]} />
        <View style={[estilos.circulo, estilos.circuloAbajo]} />
        {HUELLAS.map(({ size, rotate, ...pos }, i) => (
          <Text key={i} style={[estilos.huella, pos, { fontSize: size, transform: [{ rotate }] }]}>
            🐾
          </Text>
        ))}
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { flex: 1, backgroundColor: colores.fondoMedio },
  circulo: { position: 'absolute', borderRadius: 999 },
  circuloArriba: { width: 260, height: 260, top: -90, right: -80, backgroundColor: 'rgba(30,107,82,0.08)' },
  circuloAbajo: { width: 300, height: 300, bottom: -120, left: -110, backgroundColor: 'rgba(196,83,44,0.07)' },
  huella: { position: 'absolute', opacity: 0.07 },
});
