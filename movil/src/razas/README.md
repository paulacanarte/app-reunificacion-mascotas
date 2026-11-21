# Razas de perros · MVVM con capa de service

Módulo de la app (pantalla "Razas de perros" en el inicio) que consume la API pública https://dog.ceo/api y muestra
las razas de perros. Al tocar una raza, muestra una foto aleatoria de esa raza.

## Endpoints que consume

| Endpoint | Para qué |
|---|---|
| `GET https://dog.ceo/api/breeds/list/all` | Lista de razas y subrazas |
| `GET https://dog.ceo/api/breed/{raza}/images/random` | URL de una foto de la raza |

## Capas

```
View (RazasScreen)  →  ViewModel (useRazasViewModel)  →  Service (DogApiService)  →  httpClient  →  API
       ↑ dibuja             estado + lógica                 endpoints + Model          fetch
```

| Carpeta | Capa | Responsabilidad | No sabe de… |
|---|---|---|---|
| `models` | Model | Forma de los datos de la app (`Raza`) y conversión desde el JSON de la API | React, pantallas, fetch |
| `services` | Service | Qué endpoints llamar y devolver Models (`httpClient` hace el fetch) | React, pantallas |
| `viewmodels` | ViewModel | Estado de la pantalla: cargando, error, búsqueda, raza elegida | Cómo se dibuja; qué API hay detrás |
| `views` | View | Dibujar lo que da el ViewModel y avisarle de los toques | fetch, endpoints, JSON |
| `di` | Inyección de dependencias | Decide qué servicio usa la app | — |

## Recorrido de una petición

1. `App.js` (pantalla "Razas" del Stack) toma `dogService` del contenedor y se lo pasa a `RazasScreen`.
2. `RazasScreen` llama a `useRazasViewModel(servicio)`.
3. Al montarse, el ViewModel pone `cargando = true` y llama `servicio.obtenerRazas()`.
4. `DogApiService` llama a `httpClient.getJson(.../breeds/list/all)`, que hace el `fetch`
   (con 10 s de tiempo máximo y mensajes de error entendibles).
5. El JSON `{ message: { bulldog: ["boston", ...] } }` pasa por `razasDesdeRespuestaApi`
   y se convierte en `[{ id, nombre, subrazas }]`.
6. El ViewModel guarda la lista y pone `cargando = false`; React vuelve a dibujar la View.
7. La View muestra la lista. Si hubo error, muestra el mensaje y el botón "Reintentar".

## Bajo acoplamiento

- El ViewModel **recibe** el servicio por parámetro; no lo importa. Le sirve cualquier objeto
  con `obtenerRazas()` y `obtenerFotoAleatoria(id)`.
- Prueba: en `src/razas/di/contenedor.js` poner `USAR_SERVICIO_FALSO = true`. La app pasa a usar
  `DogServiceFalso` (datos fijos, sin internet) sin cambiar ni una línea de la View ni del ViewModel.
- `DogApiService` también recibe el cliente HTTP por parámetro, así que se puede reemplazar
  `fetch` por otra librería (por ejemplo axios) tocando un solo archivo.
- Si la API cambia el formato del JSON, solo se ajusta el mapeo en `src/razas/models/Raza.js`.
