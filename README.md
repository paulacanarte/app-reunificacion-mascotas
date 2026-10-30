# App de reunificación de mascotas tras un terremoto · Código 5

Sistema para reportar, buscar y reunir mascotas perdidas durante emergencias sísmicas.
Implementa en **Python + MongoDB** las clases del diagrama de clases del documento de ingeniería.

## Arquitectura por capas

```
src/mascotas/
├── dominio/        Entidades y reglas de negocio (Usuario, Mascota, Reporte, Coincidencia…)
├── repositorios/   Persistencia en MongoDB (una clase por colección)
├── servicios/      Casos de uso CU01–CU13 (registro, reportes, coincidencias, chat, refugios)
└── demo.py         Recorrido completo: pérdida → hallazgo → coincidencia → reunificación
tests/              Pruebas unitarias e integración (pytest + mongomock)
docs/diagramas/     Diagramas UML en Mermaid
```

| Capa | Clases | Casos de uso |
| --- | --- | --- |
| Dominio | Usuario, RegistroModeracion, Ubicacion, Caracteristicas, Fotografia, Mascota, Reporte, ReportePerdida, ReporteEncontrada, Coincidencia, Conversacion, Mensaje, Refugio, Denuncia | Reglas RN01–RN04, estados RF13 |
| Servicios | ServicioUsuarios, ServicioMascotas, ServicioReportes, ServicioCoincidencias, ServicioMensajeria, ServicioRefugios, ServicioModeracion | CU01–CU13 |
| Repositorios | RepositorioUsuarios, RepositorioMascotas, RepositorioReportes, RepositorioCoincidencias, RepositorioConversaciones, RepositorioRefugios, RepositorioDenuncias | Persistencia |

## Instalación

```bash
git clone https://github.com/<usuario>/codigo5-mascotas.git
cd codigo5-mascotas
python -m venv .venv
# Windows: .venv\Scripts\activate    ·    Linux/Mac: source .venv/bin/activate
pip install -r requirements-dev.txt
```

## Ejecutar

```bash
# Sin instalar MongoDB (base de datos en memoria)
PYTHONPATH=src python -m mascotas.demo --memoria

# Con MongoDB local o MongoDB Atlas
cp .env.example .env          # y ajuste MONGO_URI
PYTHONPATH=src python -m mascotas.demo
```

En Windows (PowerShell): `$env:PYTHONPATH="src"; python -m mascotas.demo --memoria`

## Pruebas

```bash
pytest -v
```

GitHub Actions ejecuta las pruebas en cada `push` (`.github/workflows/pruebas.yml`).

## Colecciones de MongoDB

| Colección | Contenido | Índices |
| --- | --- | --- |
| usuarios | Cuentas con contraseña cifrada (bcrypt) | correo único |
| mascotas | Mascotas con características y fotos | dueno_id |
| reportes | Reportes PERDIDA / ENCONTRADA con ubicación GeoJSON | 2dsphere, tipo+especie+estado |
| coincidencias | Pares perdida–encontrada con similitud | par único |
| conversaciones | Chat interno sin datos de contacto | — |
| refugios | Refugios y puntos de recepción | 2dsphere |
| denuncias | Denuncias con motivo y gravedad (urgencia, RF17) | — |
| registros_moderacion | Log de auditoría de moderación: quién, qué, cuándo y por qué (RF16) | objetivo_id + fecha |

## Equipo

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para el reparto de trabajo y el flujo de ramas.
