// CU05 Reportar pérdida y CU06 Reportar hallazgo (C5-35).
// Una sola pantalla para los dos casos: route.params.tipo es PERDIDA o ENCONTRADA.
// Funciona con sesión o sin cuenta (RF04); sin cuenta pide un contacto.
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import Boton from '../components/Boton';
import Campo from '../components/Campo';
import Opciones from '../components/Opciones';
import SelectorFotos from '../components/SelectorFotos';
import { useAuth } from '../context/AuthContext';
import { RUTA_REPORTE } from '../api/reportes';
import { enviarOEncolar } from '../offline/queue';
import { useConexion } from '../offline/useConexion';
import { ErrorUbicacion, obtenerUbicacion } from '../offline/ubicacion';
import { colores, espacio, texto } from '../theme';

export const ESPECIES = [
  { valor: 'PERRO', texto: 'Perro' },
  { valor: 'GATO', texto: 'Gato' },
  { valor: 'OTRO', texto: 'Otro' },
];

export const TAMANOS = [
  { valor: 'PEQUENO', texto: 'Pequeño' },
  { valor: 'MEDIANO', texto: 'Mediano' },
  { valor: 'GRANDE', texto: 'Grande' },
];

const CUANDO = [
  { valor: 0, texto: 'Hoy' },
  { valor: 1, texto: 'Ayer' },
  { valor: 2, texto: 'Hace 2 días' },
  { valor: 3, texto: 'Hace 3 días o más' },
];

const ESTADO_ACTUAL = [
  { valor: 'CON_QUIEN_REPORTA', texto: 'Lo tengo yo' },
  { valor: 'EN_REFUGIO', texto: 'En un refugio' },
  { valor: 'SIGUE_EN_EL_LUGAR', texto: 'Sigue en el lugar' },
];

const TEXTOS = {
  PERDIDA: {
    lugar: '¿Dónde se perdió?',
    ayudaLugar: 'Usa tu ubicación si estás donde la viste por última vez. Si no, cuéntalo en la descripción.',
    cuando: '¿Cuándo se perdió?',
    ayudaDescripcion: 'Qué pasó, hacia dónde corrió, si responde a su nombre.',
  },
  ENCONTRADA: {
    lugar: '¿Dónde lo encontraste?',
    ayudaLugar: 'Se toma la ubicación del teléfono. Otros usuarios solo verán una zona aproximada.',
    cuando: '¿Cuándo lo encontraste?',
    ayudaDescripcion: 'Cómo está de salud, si tiene collar o placa, cómo se comporta.',
  },
};

function validar(d, tipo, sinCuenta) {
  const e = {};
  if (d.fotos.length === 0) e.fotos = 'Agrega al menos una foto.';
  if (tipo === 'PERDIDA' && !d.nombre.trim()) e.nombre = 'Escribe el nombre de tu mascota.';
  if (!d.especie) e.especie = 'Elige una opción.';
  if (!d.tamano) e.tamano = 'Elige una opción.';
  if (!d.color.trim()) e.color = 'Escribe el color o los colores.';
  if (!d.ubicacion) e.ubicacion = 'Falta la ubicación.';
  if (tipo === 'ENCONTRADA' && !d.estadoActual) e.estadoActual = 'Elige una opción.';
  if (sinCuenta) {
    if (!d.contactoNombre.trim()) e.contactoNombre = 'Escribe tu nombre.';
    if (!/^3\d{9}$/.test(d.contactoTelefono.replace(/\s/g, ''))) {
      e.contactoTelefono = 'Escribe un celular de 10 dígitos que empiece por 3.';
    }
  }
  return e;
}

function armarCuerpo(d, tipo, idCliente, sinCuenta) {
  const cuerpo = {
    id_cliente: idCliente,
    mascota: {
      ...(tipo === 'PERDIDA' ? { nombre: d.nombre.trim() } : {}),
      especie: d.especie,
      raza: d.raza.trim(),
      color: d.color.trim(),
      tamano: d.tamano,
      senas: d.senas.trim(),
    },
    fecha: new Date(Date.now() - d.cuando * 86400000).toISOString(),
    ubicacion: { type: 'Point', coordinates: [d.ubicacion.lon, d.ubicacion.lat] }, // GeoJSON: [lon, lat]
    descripcion: d.descripcion.trim(),
  };
  if (tipo === 'ENCONTRADA') cuerpo.estado_actual = d.estadoActual;
  // RF01: el teléfono solo lo ve el sistema, nunca otros usuarios.
  if (sinCuenta) {
    cuerpo.contacto = { nombre: d.contactoNombre.trim(), telefono: d.contactoTelefono.replace(/\s/g, '') };
  }
  return cuerpo;
}

export default function ReporteScreen({ navigation, route }) {
  const tipo = route.params?.tipo === 'ENCONTRADA' ? 'ENCONTRADA' : 'PERDIDA';
  const t = TEXTOS[tipo];
  const { usuario } = useAuth();
  const { conectado } = useConexion();
  const sinCuenta = !usuario;
  // Un id por reporte: si la cola lo reintenta, el servidor no lo duplica.
  const idCliente = useRef(Crypto.randomUUID()).current;

  const [d, setD] = useState({
    fotos: [],
    nombre: '',
    especie: '',
    tamano: '',
    raza: '',
    color: '',
    senas: '',
    cuando: 0,
    ubicacion: null,
    estadoActual: '',
    descripcion: '',
    contactoNombre: '',
    contactoTelefono: '',
  });
  const [errores, setErrores] = useState({});
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const cambiar = (campo) => (valor) => setD((actual) => ({ ...actual, [campo]: valor }));

  async function tomarUbicacion() {
    setBuscandoUbicacion(true);
    setErrorUbicacion('');
    try {
      cambiar('ubicacion')(await obtenerUbicacion());
    } catch (e) {
      setErrorUbicacion(e instanceof ErrorUbicacion ? e.message : 'No se pudo obtener la ubicación.');
    } finally {
      setBuscandoUbicacion(false);
    }
  }

  // Quien encuentra un animal casi siempre está en el lugar: se ubica de una vez.
  useEffect(() => {
    if (tipo === 'ENCONTRADA') tomarUbicacion();
  }, []);

  async function publicar() {
    const e = validar(d, tipo, sinCuenta);
    setErrores(e);
    setErrorEnvio('');
    if (Object.keys(e).length) {
      setErrorEnvio('Revisa los campos marcados en rojo.');
      return;
    }
    setEnviando(true);
    try {
      const resultado = await enviarOEncolar(RUTA_REPORTE[tipo], armarCuerpo(d, tipo, idCliente, sinCuenta), d.fotos);
      navigation.replace('ReporteEnviado', {
        tipo,
        enviado: resultado.enviado,
        parecidos: resultado.datos?.parecidos ?? [],
      });
    } catch (error) {
      setErrorEnvio(error.message || 'No se pudo publicar el reporte. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.pantalla}>
      {!conectado && (
        <View style={estilos.banner} accessibilityRole="alert">
          <Text style={estilos.textoBanner}>
            Sin conexión. El reporte se guarda en el teléfono y se publica solo al volver la señal.
          </Text>
        </View>
      )}
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <SelectorFotos fotos={d.fotos} onCambiar={cambiar('fotos')} error={errores.fotos} />

        <Text style={estilos.seccion}>{tipo === 'PERDIDA' ? 'Tu mascota' : 'El animal'}</Text>
        {tipo === 'PERDIDA' && (
          <Campo etiqueta="Nombre" value={d.nombre} onChangeText={cambiar('nombre')} error={errores.nombre} />
        )}
        <Opciones etiqueta="Especie" opciones={ESPECIES} valor={d.especie} onCambiar={cambiar('especie')} error={errores.especie} />
        <Opciones etiqueta="Tamaño" opciones={TAMANOS} valor={d.tamano} onCambiar={cambiar('tamano')} error={errores.tamano} />
        <Campo
          etiqueta="Color"
          value={d.color}
          onChangeText={cambiar('color')}
          error={errores.color}
          placeholder="Ej.: café con blanco"
        />
        <Campo etiqueta="Raza (opcional)" value={d.raza} onChangeText={cambiar('raza')} placeholder="Ej.: criollo" />
        <Campo
          etiqueta="Señas particulares (opcional)"
          value={d.senas}
          onChangeText={cambiar('senas')}
          placeholder="Collar, manchas, cicatrices, cojea…"
        />

        <Text style={estilos.seccion}>Lugar y fecha</Text>
        <View style={estilos.bloque}>
          <Text style={texto.etiqueta}>{t.lugar}</Text>
          <Text style={texto.pequeno}>{t.ayudaLugar}</Text>
          {d.ubicacion && (
            <Text style={estilos.ubicacion}>
              Ubicación tomada ({d.ubicacion.lat.toFixed(5)}, {d.ubicacion.lon.toFixed(5)}
              {d.ubicacion.precision ? `, ±${d.ubicacion.precision} m` : ''})
            </Text>
          )}
          <Boton
            titulo={d.ubicacion ? 'Volver a tomar la ubicación' : 'Usar mi ubicación actual'}
            variante="secundario"
            onPress={tomarUbicacion}
            cargando={buscandoUbicacion}
          />
          {errorUbicacion || errores.ubicacion ? (
            <Text style={estilos.error}>{errorUbicacion || errores.ubicacion}</Text>
          ) : null}
        </View>
        <Opciones etiqueta={t.cuando} opciones={CUANDO} valor={d.cuando} onCambiar={cambiar('cuando')} />

        {tipo === 'ENCONTRADA' && (
          <Opciones
            etiqueta="¿Dónde está ahora?"
            opciones={ESTADO_ACTUAL}
            valor={d.estadoActual}
            onCambiar={cambiar('estadoActual')}
            error={errores.estadoActual}
          />
        )}

        <Campo
          etiqueta="Descripción (opcional)"
          ayuda={t.ayudaDescripcion}
          value={d.descripcion}
          onChangeText={cambiar('descripcion')}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />

        {sinCuenta && (
          <>
            <Text style={estilos.seccion}>Tu contacto</Text>
            <Text style={[texto.pequeno, { marginBottom: espacio.m }]}>
              Lo usamos para avisarte si hay una coincidencia. Tu teléfono no se muestra a otros usuarios.
            </Text>
            <Campo
              etiqueta="Tu nombre"
              value={d.contactoNombre}
              onChangeText={cambiar('contactoNombre')}
              error={errores.contactoNombre}
              autoComplete="name"
            />
            <Campo
              etiqueta="Tu celular"
              value={d.contactoTelefono}
              onChangeText={cambiar('contactoTelefono')}
              error={errores.contactoTelefono}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={13}
            />
          </>
        )}

        {errorEnvio ? <Text style={[estilos.error, { marginBottom: espacio.m }]}>{errorEnvio}</Text> : null}
        <Boton
          titulo={conectado ? 'Publicar reporte' : 'Guardar y publicar al volver la señal'}
          onPress={publicar}
          cargando={enviando}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  banner: { backgroundColor: colores.avisoSuave, borderBottomWidth: 2, borderBottomColor: colores.aviso, padding: espacio.m },
  textoBanner: { fontSize: 14, color: colores.tinta },
  contenido: { padding: espacio.l, paddingBottom: espacio.xl * 2 },
  seccion: { fontSize: 20, fontWeight: '700', color: colores.tinta, marginTop: espacio.m, marginBottom: espacio.m },
  bloque: { gap: espacio.s, marginBottom: espacio.m },
  ubicacion: { fontSize: 14, color: colores.primario, fontWeight: '600' },
  error: { fontSize: 13, color: colores.alerta },
});
