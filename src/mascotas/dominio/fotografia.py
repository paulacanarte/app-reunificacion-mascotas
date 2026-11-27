"""Fotografía de una mascota o reporte (RN01)."""
from __future__ import annotations

from dataclasses import dataclass

from .errores import DatosInvalidos

FORMATOS_PERMITIDOS = {"jpg", "jpeg", "png", "webp"}
TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024   # 10 MB antes de comprimir
TAMANO_MAXIMO_SUBIDA = 2 * 1024 * 1024   # 2 MB después de comprimir (RNF04)
MAXIMO_FOTOS = 5


@dataclass
class Fotografia:
    nombre_archivo: str
    tamano_bytes: int
    es_principal: bool = False

    @property
    def formato(self) -> str:
        if "." not in self.nombre_archivo:
            return ""
        return self.nombre_archivo.rsplit(".", 1)[-1].lower()

    def validar(self) -> None:
        if self.formato not in FORMATOS_PERMITIDOS:
            raise DatosInvalidos("Formato no permitido. Use JPG, PNG o WEBP")
        if not 0 < self.tamano_bytes <= TAMANO_MAXIMO_BYTES:
            raise DatosInvalidos("Cada foto debe pesar como máximo 10 MB")

    def requiere_compresion(self) -> bool:
        return self.tamano_bytes > TAMANO_MAXIMO_SUBIDA


def validar_lista_fotos(fotos: list[Fotografia], minimo: int = 0) -> None:
    """Valida cantidad y formato; deja exactamente una foto principal."""
    if len(fotos) < minimo:
        raise DatosInvalidos(f"Se requiere al menos {minimo} foto(s)")
    if len(fotos) > MAXIMO_FOTOS:
        raise DatosInvalidos(f"Máximo {MAXIMO_FOTOS} fotos")
    for foto in fotos:
        foto.validar()
    principales = sum(f.es_principal for f in fotos)
    if principales > 1:
        raise DatosInvalidos("Solo puede haber una foto principal")
    if fotos and principales == 0:
        fotos[0].es_principal = True
