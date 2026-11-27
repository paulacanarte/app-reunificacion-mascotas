"""Denuncias (RF15), urgencia (RF17) y registro de auditoría de moderación (RF16)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from .enums import AccionModeracion
from .errores import DatosInvalidos

# Gravedad de cada motivo: se usa para ordenar las denuncias por urgencia (RF17)
GRAVEDAD = {"MALTRATO_ANIMAL": 5, "FRAUDE": 4, "REPORTE_FALSO": 3, "LENGUAJE_OFENSIVO": 2, "SPAM": 1, "OTRO": 1}
MOTIVOS = set(GRAVEDAD)


@dataclass
class Denuncia:
    autor_id: str
    objetivo_id: str
    motivo: str
    detalle: str = ""
    resuelta: bool = False
    fecha: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: str | None = None

    def __post_init__(self) -> None:
        if self.motivo not in MOTIVOS:
            raise DatosInvalidos(f"Motivo inválido. Opciones: {', '.join(sorted(MOTIVOS))}")

    @property
    def gravedad(self) -> int:
        return GRAVEDAD[self.motivo]

    def resolver(self) -> None:
        self.resuelta = True


@dataclass
class RegistroModeracion:
    """Entrada del log de auditoría: quién decidió, qué hizo, sobre qué y por qué (RF16)."""
    admin_id: str
    accion: AccionModeracion
    objetivo_id: str
    motivo: str
    fecha: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: str | None = None

    def __post_init__(self) -> None:
        if len(self.motivo.strip()) < 10:
            raise DatosInvalidos("El motivo es obligatorio (mínimo 10 caracteres)")
