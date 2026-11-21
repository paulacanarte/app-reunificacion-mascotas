# Contrato de la API (propuesta para acordar con backend)

Propuesta para que la app móvil y el backend avancen en paralelo (C5-29 a C5-33 y C5-34 a C5-37).
Antes de implementarla, revisar con backend que los nombres coincidan con las clases y servicios
de `mascotas.servicios`. Cualquier cambio se acuerda por Pull Request sobre este archivo.

## Reglas generales

- Todo viaja por HTTPS en JSON (diagrama de despliegue).
- Las rutas protegidas llevan `Authorization: Bearer <token>`.
- Los errores siguen el formato de FastAPI: `{ "detail": "mensaje para el usuario" }`.
- Las ubicaciones van en GeoJSON: `{ "type": "Point", "coordinates": [longitud, latitud] }`.
- Las ubicaciones que devuelve la API a otros usuarios ya vienen aproximadas (RNF02, 500 m).
- Nunca se devuelve el teléfono ni el correo de otro usuario (RF01, RF10).

## Autenticación (C5-29 / C5-34) · ya usado por la app

### POST /auth/registro (CU01, RF01)

Petición:
```json
{ "nombre": "Ana Pérez", "correo": "ana@correo.com", "contrasena": "********",
  "telefono": "3001234567", "rol": "DUENO" }
```
Roles: `DUENO`, `CIUDADANO`, `VETERINARIO`, `FUNDACION`.

Respuesta 201:
```json
{ "token": "eyJ...", "usuario": { "id": "...", "nombre": "Ana Pérez", "correo": "ana@correo.com", "rol": "DUENO" } }
```
Errores: 409 si el correo ya existe.
RN04: durante una emergencia declarada no se exige verificar el correo, por eso se devuelve el token de una vez.

### POST /auth/login (CU02, RF02)

Petición: `{ "correo": "...", "contrasena": "..." }`
Respuesta 200: igual a la del registro. Error: 401 si los datos no coinciden.
La huella o el rostro se verifican en el teléfono y abren la sesión guardada; no pasan por la API.

### GET /usuarios/yo

Respuesta 200: el objeto `usuario` de la sesión actual.

## Mascotas y fotos (C5-30 / C5-35)

| Método y ruta | Caso de uso | Uso |
|---|---|---|
| POST /mascotas | CU03 | Registrar mascota con características |
| GET /mascotas | CU03 | Mascotas del dueño |
| POST /fotos | CU04 | Subir una foto (multipart, máx. 10 MB, JPG/PNG/WEBP, RN01); devuelve `{ "id": "..." }` |

## Reportes (C5-30 / C5-35, C5-36)

| Método y ruta | Caso de uso | Uso |
|---|---|---|
| POST /reportes/perdidas | CU05 | Reportar pérdida; acepta mascota nueva dentro del mismo reporte (RF04) |
| POST /reportes/encontradas | CU06 | Reportar hallazgo; responde con los reportes parecidos (RF07) |
| GET /reportes?especie=&raza=&color=&tamano=&lat=&lon=&radio_km=&desde=&hasta= | CU07 | Buscar, ordenado por cercanía (RF06, RF11) |
| GET /reportes/{id} | CU07 | Detalle de un reporte |

Ejemplo de reporte de pérdida:
```json
{
  "id_cliente": "6f1c2a9e-0b7d-4a51-9a3e-2d8f4c1b7e90",
  "mascota": { "nombre": "Toby", "especie": "PERRO", "raza": "Criollo", "color": "Café",
               "tamano": "MEDIANO", "senas": "Collar rojo" },
  "fotos": ["id-foto-1"],
  "fecha": "2026-11-20T10:30:00-05:00",
  "ubicacion": { "type": "Point", "coordinates": [-75.6961, 4.8143] },
  "descripcion": "Se asustó con la réplica y salió corriendo"
}
```

Ejemplo de reporte de hallazgo (igual, sin `mascota.nombre` y con `estado_actual`):
```json
{
  "id_cliente": "b2e7…",
  "mascota": { "especie": "PERRO", "raza": "", "color": "Café", "tamano": "MEDIANO", "senas": "Collar rojo" },
  "fotos": ["id-foto-2"],
  "fecha": "2026-11-20T15:00:00-05:00",
  "ubicacion": { "type": "Point", "coordinates": [-75.6955, 4.8150] },
  "estado_actual": "CON_QUIEN_REPORTA",
  "descripcion": "Está asustado pero sin heridas"
}
```
- Valores: `especie` PERRO | GATO | OTRO; `tamano` PEQUENO | MEDIANO | GRANDE;
  `estado_actual` CON_QUIEN_REPORTA | EN_REFUGIO | SIGUE_EN_EL_LUGAR.
- `id_cliente` (UUID) lo genera la app. Si la cola sin conexión reintenta un reporte que ya llegó,
  el backend debe devolver el mismo reporte en vez de guardarlo dos veces.
- Sin cuenta (RF04) la petición va sin token y lleva `"contacto": { "nombre": "...", "telefono": "3001234567" }`.
  Ese teléfono nunca se devuelve a otros usuarios (RF01).
- `POST /fotos` recibe la foto en el campo `archivo` del formulario multipart. La app sube primero
  las fotos y luego manda el reporte con sus ids.

Respuesta 201 de `POST /reportes/perdidas`: `{ "reporte": { ...el reporte con "id" y "estado": "ACTIVO" } }`

Respuesta 201 de `POST /reportes/encontradas` (RF07):
```json
{
  "reporte": { "id": "r7", "estado": "ACTIVO", "...": "..." },
  "parecidos": [
    { "id": "r1", "mascota": { "nombre": "Toby", "especie": "PERRO", "color": "Café", "tamano": "MEDIANO", "senas": "Collar rojo" },
      "fotos": ["https://.../foto.jpg"], "fecha": "...", "puntaje": 100, "distancia_km": 0.1 }
  ]
}
```
`parecidos` va ordenado por `puntaje` (0 a 100) y luego por cercanía.

### GET /reportes (CU07, C5-36)

Parámetros, todos opcionales: `tipo` (PERDIDA | ENCONTRADA), `especie`, `tamano`, `color` (texto que contenga),
`desde` (fecha ISO), `lat`, `lon`, `radio_km`. Sin `lat`/`lon`, ordena del más reciente al más antiguo.

Respuesta 200:
```json
{ "resultados": [
  { "id": "r1", "tipo": "PERDIDA", "estado": "ACTIVO",
    "mascota": { "nombre": "Toby", "especie": "PERRO", "raza": "Criollo", "color": "Café", "tamano": "MEDIANO", "senas": "Collar rojo" },
    "fotos": ["https://.../foto.jpg"], "fecha": "...", "descripcion": "...",
    "ubicacion": { "type": "Point", "coordinates": [-75.6945, 4.815] },
    "distancia_km": 0.4 }
] }
```
`GET /reportes/{id}` devuelve un solo reporte con la misma forma (sin `distancia_km`). Ninguno trae
`contacto` ni `id_cliente`, y la ubicación ya viene aproximada (RNF02).

## Coincidencias (C5-31 / C5-36)

| Método y ruta | Caso de uso | Uso |
|---|---|---|
| GET /coincidencias | CU08 | Coincidencias de mis reportes con su puntaje |
| POST /coincidencias/{id}/confirmar | CU09 | El dueño confirma (RF09) |
| POST /coincidencias/{id}/rechazar | CU09 | El dueño rechaza |
| POST /coincidencias/{id}/entrega | CU09 | Cada parte registra la entrega; con las dos queda REUNIFICADA (RN03) |
| POST /dispositivos | RF08 | Registrar el token de Firebase del teléfono para las notificaciones |

## Chat y mapa (C5-32 / C5-36, C5-37)

| Método y ruta | Caso de uso | Uso |
|---|---|---|
| GET /conversaciones | CU10 | Mis conversaciones |
| GET /conversaciones/{id}/mensajes | CU10 | Mensajes |
| POST /conversaciones/{id}/mensajes | CU10 | Enviar mensaje |
| GET /mapa?lat=&lon=&radio_km= | CU11 | Refugios, puntos de recepción y reportes (RF12) |

Respuesta 200 de `GET /mapa` (C5-37): `reportes` con la misma forma de `GET /reportes` y `puntos`:
```json
{ "reportes": [ ... ],
  "puntos": [
    { "id": "p1", "tipo": "REFUGIO", "nombre": "Refugio Huellitas", "direccion": "Cra. 12 #20-15",
      "horario": "Todos los días, 7 a. m. a 7 p. m.", "capacidad": 40, "ocupados": 26,
      "ubicacion": { "type": "Point", "coordinates": [-75.686, 4.8185] } },
    { "id": "p3", "tipo": "PUNTO_RECEPCION", "nombre": "Punto de recepción Parque Olaya", "...": "..." }
  ] }
```
`tipo` del punto: REFUGIO | PUNTO_RECEPCION. Los puntos de recepción no llevan `capacidad`.

## Refugios y moderación (C5-33)

| Método y ruta | Caso de uso | Uso |
|---|---|---|
| POST /refugios, PATCH /refugios/{id} | CU12 | Registrar y actualizar capacidad (RF14) |
| POST /denuncias | CU13 | Denunciar reporte o conversación (RF15) |
| GET /moderacion/denuncias | CU13 | Denuncias por urgencia (RF17) |
| POST /moderacion/acciones | CU13 | Retirar reporte, suspender o bloquear, con motivo (RF16) |
