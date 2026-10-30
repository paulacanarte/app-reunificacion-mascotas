# Cómo trabajamos en el repositorio

## Flujo de ramas

1. Nadie sube cambios directo a `main`.
2. Cada integrante crea su rama: `git checkout -b feature/<tema>-<nombre>` (ej. `feature/coincidencias-kevin`).
3. Commits pequeños y descriptivos: `feat: agrega validación de fotos (RN01)`, `test: pruebas de Refugio`.
4. Se abre un *Pull Request* hacia `main`; el líder lo revisa y lo aprueba.
5. Las pruebas de GitHub Actions deben pasar antes de unir.

## Reparto sugerido (cada quien sube su parte con su propia cuenta)

| Integrante | Archivos | Evidencia |
| --- | --- | --- |
| Líder | README, CONTRIBUTING, `repositorios/conexion.py`, `demo.py`, revisión de PR | PRs aprobados |
| Integrante 2 | `dominio/usuario.py`, `servicios` → ServicioUsuarios, pruebas de usuario | commits + PR |
| Integrante 3 | `dominio/mascota.py`, `fotografia.py`, `caracteristicas.py`, ServicioMascotas | commits + PR |
| Integrante 4 | `dominio/reporte.py`, `ubicacion.py`, ServicioReportes | commits + PR |
| Integrante 5 | `dominio/coincidencia.py`, `servicios/comparadores.py`, ServicioCoincidencias | commits + PR |
| Integrante 6 | `dominio/conversacion.py`, `refugio.py`, `denuncia.py`, ServicioMensajeria, ServicioRefugios, ServicioModeracion | commits + PR |

Los `repositorios/repositorios.py` se reparten: cada integrante agrega el repositorio de sus clases.
