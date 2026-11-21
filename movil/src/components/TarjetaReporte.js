// Tarjeta de un reporte en listas (búsqueda, parecidos).
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  distanciaTexto,
  EMOJI_ESPECIE,
  haceCuanto,
  rasgos,
  TIPO_REPORTE,
  tituloReporte,
} from '../formato';
import { colores, espacio, sombra, texto } from '../theme';

export function FotoMascota({ reporte, tamano = 80, radio = 12 }) {
  const foto = reporte.fotos?.[0];
  const tipo = TIPO_REPORTE[reporte.tipo] ?? TIPO_REPORTE.PERDIDA;
  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={{ width: tamano, height: tamano, borderRadius: radio, backgroundColor: colores.borde }}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={[estilos.sinFoto, { width: tamano, height: tamano, borderRadius: radio, backgroundColor: tipo.suave }]}>
      <Text style={{ fontSize: tamano * 0.45 }}>{EMOJI_ESPECIE[reporte.mascota?.especie] ?? '🐾'}</Text>
    </View>
  );
}

export function Insignia({ tipo }) {
  const t = TIPO_REPORTE[tipo] ?? TIPO_REPORTE.PERDIDA;
  return (
    <View style={[estilos.insignia, { backgroundColor: t.suave }]}>
      <Text style={[estilos.textoInsignia, { color: t.color }]}>{t.texto}</Text>
    </View>
  );
}

export default function TarjetaReporte({ reporte, onPress }) {
  const detalle = [haceCuanto(reporte.fecha), distanciaTexto(reporte.distancia_km)].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tituloReporte(reporte)}, ${TIPO_REPORTE[reporte.tipo]?.texto}, ${rasgos(reporte.mascota)}`}
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }]}
    >
      <FotoMascota reporte={reporte} />
      <View style={estilos.info}>
        <View style={estilos.fila}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {tituloReporte(reporte)}
          </Text>
          <Insignia tipo={reporte.tipo} />
        </View>
        <Text style={texto.pequeno} numberOfLines={1}>
          {rasgos(reporte.mascota)}
        </Text>
        {reporte.mascota?.senas ? (
          <Text style={texto.pequeno} numberOfLines={1}>
            {reporte.mascota.senas}
          </Text>
        ) : null}
        <Text style={estilos.dato}>
          {reporte.puntaje != null ? `Parecido ${reporte.puntaje}% · ` : ''}
          {detalle}
        </Text>
      </View>
      <Text style={estilos.flecha}>›</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.s + 4,
    borderRadius: 16,
    backgroundColor: colores.superficie,
    ...sombra,
  },
  sinFoto: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  nombre: { flexShrink: 1, fontSize: 17, fontWeight: '700', color: colores.tinta },
  insignia: { paddingHorizontal: espacio.s, paddingVertical: 2, borderRadius: 8 },
  textoInsignia: { fontSize: 12, fontWeight: '700' },
  dato: { fontSize: 13, fontWeight: '600', color: colores.primario, marginTop: 2 },
  flecha: { fontSize: 26, color: colores.tenue, paddingRight: espacio.xs },
});
