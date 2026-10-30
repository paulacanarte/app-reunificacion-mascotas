import sys
from pathlib import Path

import mongomock
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from mascotas.dominio import Caracteristicas, Especie, Fotografia, Rol, Tamano  # noqa: E402
from mascotas.repositorios import Repositorios  # noqa: E402
from mascotas.servicios import (ComparadorCaracteristicas, NotificadorConsola,  # noqa: E402
                                ServicioCoincidencias, ServicioMascotas, ServicioMensajeria,
                                ServicioReportes, ServicioRefugios, ServicioUsuarios)


@pytest.fixture
def repos():
    return Repositorios.desde_db(mongomock.MongoClient()["pruebas"])


@pytest.fixture
def app(repos):
    notificador = NotificadorConsola()
    coincidencias = ServicioCoincidencias(repos, ComparadorCaracteristicas(), notificador)
    return type("App", (), dict(
        repos=repos, notificador=notificador, coincidencias=coincidencias,
        usuarios=ServicioUsuarios(repos, modo_emergencia=True), mascotas=ServicioMascotas(repos),
        reportes=ServicioReportes(repos, coincidencias), chat=ServicioMensajeria(repos, notificador),
        refugios=ServicioRefugios(repos)))


@pytest.fixture
def dueno(app):
    return app.usuarios.registrar("Ana Gómez", "ana@correo.com", "Clave2026", "Clave2026", Rol.DUENO, "3001234567")


@pytest.fixture
def ciudadano(app):
    return app.usuarios.registrar("Luis Pérez", "luis@correo.com", "Clave2026", "Clave2026", Rol.CIUDADANO, "3001234567")


@pytest.fixture
def rasgos():
    return Caracteristicas("café blanco", Tamano.MEDIANO, "Labrador", "corto", "collar rojo")


@pytest.fixture
def foto():
    return Fotografia("foto.jpg", 500_000)


@pytest.fixture
def admin(repos):
    """El administrador no se registra desde la app: se crea directamente en la base de datos."""
    import bcrypt
    from mascotas.dominio import EstadoCuenta, Usuario
    u = Usuario("Admin", "admin@correo.com", bcrypt.hashpw(b"Clave2026", bcrypt.gensalt()).decode(),
                Rol.ADMIN, "3000000000", EstadoCuenta.ACTIVA)
    repos.usuarios.guardar(u)
    return u
