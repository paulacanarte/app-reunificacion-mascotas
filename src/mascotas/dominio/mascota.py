"""Mascota registrada por un dueño (RF03)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from .caracteristicas import Caracteristicas
from .enums import Especie
from .errores import DatosInvalidos
from .fotografia import MAXIMO_FOTOS, Fotografia, validar_lista_fotos

SEXOS = {"MACHO", "HEMBRA", "DESCONOCIDO"}


@dataclass
class Mascota:
    dueno_id: str
    nombre: str
    especie: Especie
    sexo: str
    caracteristicas: Caracteristicas
    fotos: list[Fotografia] = field(default_factory=list)
    fecha_nacimiento: date | None = None
    peso_kg: float | None = None
    esterilizada: bool = False
    id: str | None = None

    def agregar_foto(self, foto: Fotografia) -> None:
        if len(self.fotos) >= MAXIMO_FOTOS:
            raise DatosInvalidos(f"Máximo {MAXIMO_FOTOS} fotos por mascota")
        foto.validar()
        if foto.es_principal:
            for f in self.fotos:
                f.es_principal = False
        self.fotos.append(foto)
        validar_lista_fotos(self.fotos)

    def foto_principal(self) -> Fotografia | None:
        return next((f for f in self.fotos if f.es_principal), None)

    def validar(self) -> None:
        """Campos obligatorios: nombre, especie, sexo y al menos una foto."""
        if not self.nombre.strip():
            raise DatosInvalidos("El nombre es obligatorio")
        if self.sexo.upper() not in SEXOS:
            raise DatosInvalidos("Sexo inválido")
        if self.peso_kg is not None and self.peso_kg <= 0:
            raise DatosInvalidos("El peso debe ser positivo")
        if self.fecha_nacimiento and self.fecha_nacimiento > date.today():
            raise DatosInvalidos("La fecha de nacimiento no puede ser futura")
        validar_lista_fotos(self.fotos, minimo=1)
