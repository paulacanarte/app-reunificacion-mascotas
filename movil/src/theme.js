// Paleta pensada para una emergencia: calmada, legible y con buen contraste.
export const colores = {
  fondo: '#F3F6F7',
  superficie: '#FFFFFF',
  tinta: '#16262C',
  tenue: '#56676D',
  borde: '#CCD7DA',
  primario: '#1E6B52', // verde refugio: acciones principales
  primarioSuave: '#DCEFE7',
  alerta: '#B5401E', // errores
  aviso: '#F2A541', // sin conexión / pendientes
  avisoSuave: '#FDF1DC',
};

export const espacio = { xs: 4, s: 8, m: 16, l: 24, xl: 32 };

export const texto = {
  titulo: { fontSize: 28, fontWeight: '700', color: colores.tinta },
  subtitulo: { fontSize: 16, color: colores.tenue, lineHeight: 22 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.tinta },
  cuerpo: { fontSize: 16, color: colores.tinta },
  pequeno: { fontSize: 13, color: colores.tenue },
};
