"""Envío de notificaciones (RF08). En producción: Firebase Cloud Messaging."""
from __future__ import annotations

from abc import ABC, abstractmethod


class Notificador(ABC):
    @abstractmethod
    def notificar(self, usuario_id: str, mensaje: str) -> None: ...


class NotificadorConsola(Notificador):
    """Imprime las notificaciones y las guarda en memoria (útil para pruebas)."""

    def __init__(self) -> None:
        self.enviadas: list[tuple[str, str]] = []

    def notificar(self, usuario_id: str, mensaje: str) -> None:
        self.enviadas.append((usuario_id, mensaje))
        print(f"[NOTIFICACIÓN → {usuario_id}] {mensaje}")
