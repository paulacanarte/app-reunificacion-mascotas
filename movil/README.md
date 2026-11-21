# Código 5 · App móvil

App en React Native con Expo (SDK 58) para la reunificación de mascotas tras un terremoto.

- **C5-34**: proyecto base, navegación, registro (CU01), inicio de sesión (CU02) con huella o
  rostro (RF02), sesión disponible sin conexión y cola local en SQLite (RNF03).
- **C5-35**: reportar mascota perdida (CU05) y animal encontrado (CU06) con fotos (CU04, RN01),
  ubicación GPS, envío sin conexión por la cola y reporte sin cuenta (RF04). Al reportar un
  hallazgo se muestran las mascotas perdidas parecidas (RF07).
- **C5-36**: buscar mascotas por tipo, especie, tamaño, color, fecha y distancia, ordenadas por
  cercanía (CU07, RF06, RF11), y detalle del reporte con zona aproximada de 500 m (RNF02).
- **C5-37**: mapa con mascotas perdidas y encontradas (ícono de su especie), refugios con cupos y
  puntos de recepción (CU11, RF12, RF14).
- Diseño: fondo en degradado menta–crema con huellas, tarjetas con ícono y sombra.

Mientras la API no esté publicada, la app usa datos simulados (`USAR_MOCK = true` en `src/config.js`).
Cuenta de prueba: `dueno@demo.com` / `demo1234`. El simulador trae, en Pereira, seis mascotas perdidas,
tres animales encontrados, dos refugios y dos puntos de recepción de ejemplo.

## Instalación

Requisitos: Node.js LTS y la app **Expo Go** en el celular.

```bash
npm install
```

Si se agregan librerías nativas, instalarlas con `npx expo install <paquete>` y no con `npm install`
directo, para que las versiones sean compatibles con el SDK de Expo.

## Ejecutar

```bash
npx expo start
```

En Windows, si PowerShell bloquea los scripts, usar `npx.cmd expo start`.

Escanear el código QR con Expo Go (Android) o con la cámara (iPhone). El celular y el computador
deben estar en la misma red Wi-Fi; si no conecta, `npx expo start --tunnel`.

Notas:
- En Expo Go, Face ID de iPhone no funciona; la huella en Android sí. Para Face ID hace falta un
  *development build* (se ve en la etapa de publicación).
- Para conectar con la API real: poner `USAR_MOCK = false` y en `API_URL` la IP del computador
  que corre FastAPI, no `localhost`.
- El mapa funciona en Expo Go sin configurar nada. Para publicar la app en Android hará falta una
  clave de Google Maps (`android.config.googleMaps.apiKey` en `app.json`).

## Probar la C5-35

1. **Con cuenta**: Inicio → «Reportar mascota perdida» o «Reportar animal encontrado».
2. **Sin cuenta (RF04)**: en Ingresar, «Perdí mi mascota» o «Encontré un animal». Pide nombre y celular.
3. **Coincidencias (RF07)**: reportar un perro mediano color «Café» encontrado → aparece Toby al 100 %.
4. **Sin conexión (RNF03)**: activar el modo avión, publicar un reporte → queda «guardado».
   En Inicio aparece «1 reporte pendiente». Al quitar el modo avión se publica solo y el aviso desaparece.

## Probar la C5-36 y la C5-37

1. **Buscar**: Inicio → «Buscar mascotas». Filtrar por «Gato» o escribir «café» en Color. Tocar un
   resultado abre el detalle con fotos, rasgos y la zona aproximada en un mapa pequeño.
2. **Mapa**: Inicio → «Ver mapa». Cada mascota es un ícono 🐶 / 🐱 / 🐾 con borde naranja (perdida)
   o verde (encontrada); los refugios 🏠 y puntos de recepción 📦 en azul. Los botones de arriba
   muestran u ocultan cada capa. Tocar un ícono abre su tarjeta con «Ver detalle» o los cupos del refugio.
3. Ambos funcionan también sin cuenta, desde los botones «Buscar» y «Mapa» de la pantalla de ingreso.

## Estructura

| Carpeta | Contenido | Relación con el documento maestro |
|---|---|---|
| `src/api` | Cliente HTTP, autenticación, reportes y servidor simulado | Conexión HTTPS/JSON del diagrama de despliegue |
| `src/context` | Estado de la sesión | CU01, CU02, RF02 |
| `src/storage` | Sesión cifrada en el teléfono | RF02 (ingreso sin conexión) |
| `src/offline` | Cola SQLite, vigilancia de la señal, fotos locales y GPS | RNF03, artefacto «SQLite local», rama [no] de «¿Hay conexión?» |
| `src/components` | Botón, campo, opciones y selector de fotos | Prototipo UX-UI (C5-16) |
| `src/screens` | Login, Registro, Inicio, Reporte y confirmación | Prototipo UX-UI (C5-16), CU05, CU06 |
| `docs/API.md` | Contrato propuesto con backend | C5-29 a C5-33 |

## Cómo funciona el envío sin conexión

1. Las fotos se copian a la carpeta de documentos de la app (la caché la puede borrar el sistema).
2. `enviarOEncolar()` en `src/offline/queue.js` revisa la señal. Si no hay, guarda en SQLite la ruta,
   el cuerpo del reporte y las rutas de sus fotos.
3. Al volver la señal (o cada minuto si hay señal pero no servidor), `sincronizar()` sube las fotos,
   publica el reporte y lo borra de la cola.
4. Cada reporte lleva un `id_cliente` (UUID) para que un reintento no lo duplique en el servidor.

## Pendiente

- Coincidencias de mis reportes y confirmación (CU08, CU09) y chat con quien reportó (CU10):
  el botón del detalle avisa que se conectan cuando la API esté publicada.
- Elegir el lugar del reporte tocando el mapa, en vez de usar solo la ubicación actual.
