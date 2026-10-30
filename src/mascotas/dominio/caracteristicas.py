"""Rasgos físicos usados para describir y comparar animales."""
from dataclasses import dataclass

from .enums import Tamano


@dataclass
class Caracteristicas:
    color: str
    tamano: Tamano
    raza: str = "Mestizo / No sé"
    pelaje: str = ""
    senas: str = ""
