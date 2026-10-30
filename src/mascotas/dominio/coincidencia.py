"""Posible coincidencia entre un reporte perdido y uno encontrado (RF07-RF09, RN02, RN03)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from .enums import EstadoCoincidencia
from .errores import DatosInvalidos, TransicionInvalida

UMBRAL_SIMILITUD = 0.70
DISTANCIA_MAXIMA_KM = 20.0


@dataclass
class Coincidencia:
    reporte_perdida_id: str
    reporte_encontrada_id: str
    similitud: float
    distancia_km: float
    estado: EstadoCoincidencia = EstadoCoincidencia.PENDIENTE
    entregas_confirmadas: set[str] = field(default_factory=set)
    fecha_creacion: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: str | None = None

    def __post_init__(self) -> None:
        if not 0 <= self.similitud <= 1:
            raise DatosInvalidos("La similitud debe estar entre 0 y 1")

    @staticmethod
    def es_relevante(similitud: float, distancia_km: float) -> bool:
        """Regla RN02: notificar solo con similitud >= 70 % y distancia < 20 km."""
        return similitud >= UMBRAL_SIMILITUD and distancia_km < DISTANCIA_MAXIMA_KM

    def confirmar(self) -> None:
        self._exigir(EstadoCoincidencia.PENDIENTE)
        self.estado = EstadoCoincidencia.CONFIRMADA

    def rechazar(self) -> None:
        self._exigir(EstadoCoincidencia.PENDIENTE)
        self.estado = EstadoCoincidencia.RECHAZADA

    def registrar_entrega(self, usuario_id: str) -> bool:
        """Registra la confirmación de entrega de una de las partes.
        Devuelve True cuando ambas partes confirmaron (RN03)."""
        self._exigir(EstadoCoincidencia.CONFIRMADA)
        self.entregas_confirmadas.add(usuario_id)
        if len(self.entregas_confirmadas) >= 2:
            self.estado = EstadoCoincidencia.ENTREGADA
            return True
        return False

    def _exigir(self, estado: EstadoCoincidencia) -> None:
        if self.estado != estado:
            raise TransicionInvalida(f"La coincidencia está en {self.estado.value}, se esperaba {estado.value}")
