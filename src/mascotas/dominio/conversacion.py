"""Mensajería interna sin exponer datos de contacto (RF10)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from .errores import DatosInvalidos, NoAutorizado

LONGITUD_MAXIMA = 1000


@dataclass
class Mensaje:
    autor_id: str
    texto: str
    fecha: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class Conversacion:
    participantes: list[str]
    coincidencia_id: str | None = None
    mensajes: list[Mensaje] = field(default_factory=list)
    bloqueada: bool = False
    id: str | None = None

    def __post_init__(self) -> None:
        if len(set(self.participantes)) != 2:
            raise DatosInvalidos("Una conversación tiene exactamente dos participantes distintos")

    def agregar_mensaje(self, autor_id: str, texto: str) -> Mensaje:
        if self.bloqueada:
            raise NoAutorizado("La conversación fue bloqueada por moderación")
        if autor_id not in self.participantes:
            raise NoAutorizado("El autor no participa en la conversación")
        texto = texto.strip()
        if not texto or len(texto) > LONGITUD_MAXIMA:
            raise DatosInvalidos(f"El mensaje debe tener entre 1 y {LONGITUD_MAXIMA} caracteres")
        mensaje = Mensaje(autor_id, texto)
        self.mensajes.append(mensaje)
        return mensaje

    def otro_participante(self, usuario_id: str) -> str:
        return next(p for p in self.participantes if p != usuario_id)
