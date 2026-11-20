# Código 5 · App móvil (C5-34: base y login)

App en React Native con Expo para la reunificación de mascotas tras un terremoto.
Esta primera entrega cubre la tarea **C5-34**: proyecto base, navegación, registro (CU01),
inicio de sesión (CU02) con huella o rostro (RF02), sesión disponible sin conexión
y la cola local en SQLite que usará C5-35 (RNF03).

Mientras la API no esté publicada, la app usa datos simulados (`USAR_MOCK = true` en `src/config.js`).
Cuenta de prueba: `dueno@demo.com` / `demo1234`.

## Instalación

Requisitos: Node.js LTS y la app **Expo Go** en el celular.

```bash
npx create-expo-app@latest movil --template blank
cd movil
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context expo-secure-store expo-sqlite expo-local-authentication @react-native-community/netinfo
```

Luego copiar dentro de `movil/` las carpetas `src/` y `docs/`, y reemplazar `App.js`.

`npx expo install` elige las versiones compatibles con el SDK de Expo instalado; no instalar
estos paquetes con `npm install` directo.

## Ejecutar

```bash
npx expo start
```

Escanear el código QR con Expo Go (Android) o con la cámara (iPhone). El celular y el computador
deben estar en la misma red Wi-Fi.

Notas:
- En Expo Go, Face ID de iPhone no funciona; la huella en Android sí. Para Face ID hace falta un
  *development build* (se ve en la etapa de publicación).
- Para conectar con la API real: poner `USAR_MOCK = false` y en `API_URL` la IP del computador
  que corre FastAPI, no `localhost`.

## Estructura

| Carpeta | Contenido | Relación con el documento maestro |
|---|---|---|
| `src/api` | Cliente HTTP, autenticación y servidor simulado | Conexión HTTPS/JSON del diagrama de despliegue |
| `src/context` | Estado de la sesión | CU01, CU02, RF02 |
| `src/storage` | Sesión cifrada en el teléfono | RF02 (ingreso sin conexión) |
| `src/offline` | Cola SQLite y vigilancia de la señal | RNF03, artefacto «SQLite local», rama [no] de «¿Hay conexión?» |
| `src/screens` | Login, Registro, Inicio | Prototipo UX-UI (C5-16) |
| `docs/API.md` | Contrato propuesto con backend | C5-29 a C5-33 |

## Trabajo en GitHub

```bash
git checkout -b feature/C5-34-base-login
git add movil
git commit -m "C5-34: base de la app móvil, registro e inicio de sesión"
git push -u origin feature/C5-34-base-login
```

Abrir el Pull Request hacia `main` para que otro integrante lo revise (C5-38).

## Siguiente: C5-35

Reportar pérdida y hallazgo con cámara (`expo-image-picker`), GPS (`expo-location`)
y envío con `enviarOEncolar()` de `src/offline/queue.js`. Las fotos se guardan como archivos
en el teléfono y la cola guarda su ruta para subirlas al volver la señal.
Incluir el reporte sin cuenta previa (RF04).
