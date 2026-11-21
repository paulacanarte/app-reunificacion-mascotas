// Paleta pensada para una emergencia: calmada, cálida, legible y con buen contraste.
export const colores = {
  fondo: '#F3F6F7',
  fondoArriba: '#DCEFE5', // inicio del degradado del fondo (verde menta)
  fondoMedio: '#F4F1E8',
  fondoAbajo: '#FBEDE0', // final del degradado (crema durazno)
  superficie: '#FFFFFF',
  tinta: '#16262C',
  tenue: '#56676D',
  borde: '#CCD7DA',
  primario: '#1E6B52', // verde refugio: acciones principales
  primarioSuave: '#DCEFE7',
  alerta: '#B5401E', // errores
  aviso: '#F2A541', // sin conexión / pendientes
  avisoSuave: '#FDF1DC',
  perdida: '#C4532C', // mascotas perdidas
  perdidaSuave: '#FBE3D8',
  encontrada: '#1E6B52', // animales encontrados
  encontradaSuave: '#DCEFE7',
  refugio: '#2D5F8B', // refugios y puntos de recepción
  refugioSuave: '#DDE9F5',
  busqueda: '#6B4FA0',
  busquedaSuave: '#ECE5F6',
};

export const espacio = { xs: 4, s: 8, m: 16, l: 24, xl: 32 };

export const texto = {
  titulo: { fontSize: 28, fontWeight: '700', color: colores.tinta },
  subtitulo: { fontSize: 16, color: colores.tenue, lineHeight: 22 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.tinta },
  cuerpo: { fontSize: 16, color: colores.tinta },
  pequeno: { fontSize: 13, color: colores.tenue },
};

// Sombra suave para las tarjetas (iOS usa shadow*, Android usa elevation).
export const sombra = {
  shadowColor: '#16262C',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
