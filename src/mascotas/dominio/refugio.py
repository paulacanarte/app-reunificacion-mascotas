"""Refugios temporales y puntos de recepción (RF12, RF14)."""
from __future__ import annotations

from dataclasses import dataclass

from .enums import TipoPunto
from .errores import DatosInvalidos
from .ubicacion import Ubicacion


@dataclass
class Refugio:
    nombre: str
    tipo: TipoPunto
    ubicacion: Ubicacion
    contacto: str
    capacidad: int
    ocupacion: int = 0
    id: str | None = None

    def __post_init__(self) -> None:
        if self.capacidad < 0 or not 0 <= self.ocupacion <= self.capacidad:
            raise DatosInvalidos("Capacidad u ocupación inválida")

    def tiene_cupo(self) -> bool:
        return self.ocupacion < self.capacidad

    def registrar_ingreso(self) -> None:
        if not self.tiene_cupo():
            raise DatosInvalidos(f"{self.nombre} no tiene cupo disponible")
        self.ocupacion += 1

    def registrar_salida(self) -> None:
        if self.ocupacion == 0:
            raise DatosInvalidos("No hay animales registrados en el refugio")
        self.ocupacion -= 1
