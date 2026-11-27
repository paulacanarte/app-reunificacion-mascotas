"""Reportes de mascotas perdidas y encontradas (RF04, RF05, RF13)."""
from __future__ import annotations

import zlib
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone

from .caracteristicas import Caracteristicas
from .enums import Especie, EstadoReporte, TipoReporte
from .errores import DatosInvalidos, TransicionInvalida
from .fotografia import Fotografia, validar_lista_fotos
from .ubicacion import Ubicacion

RADIO_PRIVACIDAD_M = 500

# Máquina de estados del caso (RF13)
TRANSICIONES: dict[EstadoReporte, set[EstadoReporte]] = {
    EstadoReporte.PERDIDA: {EstadoReporte.POSIBLE_COINCIDENCIA, EstadoReporte.CERRADA},
    EstadoReporte.ENCONTRADA: {EstadoReporte.POSIBLE_COINCIDENCIA, EstadoReporte.CERRADA},
    EstadoReporte.POSIBLE_COINCIDENCIA: {
        EstadoReporte.EN_VERIFICACION, EstadoReporte.PERDIDA,
        EstadoReporte.ENCONTRADA, EstadoReporte.CERRADA,
    },
    EstadoReporte.EN_VERIFICACION: {
        EstadoReporte.REUNIFICADA, EstadoReporte.PERDIDA,
        EstadoReporte.ENCONTRADA, EstadoReporte.CERRADA,
    },
    EstadoReporte.REUNIFICADA: {EstadoReporte.CERRADA},
    EstadoReporte.CERRADA: set(),
}


@dataclass
class Reporte(ABC):
    usuario_id: str
    especie: Especie
    caracteristicas: Caracteristicas
    ubicacion: Ubicacion
    fecha_evento: datetime
    descripcion: str = ""
    fotos: list[Fotografia] = field(default_factory=list)
    estado: EstadoReporte | None = None
    fecha_creacion: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: str | None = None

    def __post_init__(self) -> None:
        if self.estado is None:
            self.estado = self.estado_inicial()
        fecha = self.fecha_evento
        if fecha.tzinfo is None:
            fecha = fecha.replace(tzinfo=timezone.utc)
        if fecha > datetime.now(timezone.utc):
            raise DatosInvalidos("La fecha del evento no puede ser futura")
        validar_lista_fotos(self.fotos)

    @abstractmethod
    def tipo(self) -> TipoReporte: ...

    def estado_inicial(self) -> EstadoReporte:
        return EstadoReporte(self.tipo().value)

    @property
    def esta_abierto(self) -> bool:
        return self.estado not in {EstadoReporte.REUNIFICADA, EstadoReporte.CERRADA}

    def cambiar_estado(self, nuevo: EstadoReporte) -> None:
        if nuevo in {EstadoReporte.PERDIDA, EstadoReporte.ENCONTRADA} and nuevo != self.estado_inicial():
            raise TransicionInvalida(f"Un reporte {self.tipo().value} no puede pasar a {nuevo.value}")
        if nuevo not in TRANSICIONES[self.estado]:
            raise TransicionInvalida(f"No se puede pasar de {self.estado.value} a {nuevo.value}")
        self.estado = nuevo

    def ubicacion_publica(self) -> Ubicacion:
        """Ubicación aproximada que ven los demás usuarios (RNF02).
        Se usa el id como semilla para que el punto no cambie en cada consulta."""
        semilla = zlib.crc32(self.id.encode()) if self.id else 0
        return self.ubicacion.aproximar(RADIO_PRIVACIDAD_M, semilla)


@dataclass
class ReportePerdida(Reporte):
    mascota_id: str = ""

    def __post_init__(self) -> None:
        if not self.mascota_id:
            raise DatosInvalidos("El reporte de pérdida debe indicar la mascota")
        super().__post_init__()

    def tipo(self) -> TipoReporte:
        return TipoReporte.PERDIDA


@dataclass
class ReporteEncontrada(Reporte):
    lugar_resguardo: str = ""
    refugio_id: str | None = None

    def __post_init__(self) -> None:
        if not self.fotos:
            raise DatosInvalidos("El reporte de hallazgo requiere al menos una foto")
        super().__post_init__()

    def tipo(self) -> TipoReporte:
        return TipoReporte.ENCONTRADA
