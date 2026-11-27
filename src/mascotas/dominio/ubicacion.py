"""Ubicación geográfica con cálculo de distancia y ofuscación (RF11, RNF02)."""
from __future__ import annotations

import math
import random
from dataclasses import dataclass

from .errores import DatosInvalidos

RADIO_TIERRA_KM = 6371.0


@dataclass(frozen=True)
class Ubicacion:
    latitud: float
    longitud: float
    descripcion: str = ""

    def __post_init__(self) -> None:
        if not -90 <= self.latitud <= 90 or not -180 <= self.longitud <= 180:
            raise DatosInvalidos("Coordenadas fuera de rango")

    def distancia_km(self, otra: "Ubicacion") -> float:
        """Distancia en km con la fórmula de Haversine."""
        lat1, lat2 = math.radians(self.latitud), math.radians(otra.latitud)
        dlat = lat2 - lat1
        dlon = math.radians(otra.longitud - self.longitud)
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        return 2 * RADIO_TIERRA_KM * math.asin(math.sqrt(a))

    def aproximar(self, radio_m: int = 500, semilla: int | None = None) -> "Ubicacion":
        """Punto desplazado al azar dentro de `radio_m` metros, para publicar
        reportes sin revelar la ubicación exacta (RNF02)."""
        rnd = random.Random(semilla)
        distancia = radio_m * math.sqrt(rnd.random())
        angulo = rnd.uniform(0, 2 * math.pi)
        dlat = (distancia * math.cos(angulo)) / 111_320
        dlon = (distancia * math.sin(angulo)) / (111_320 * math.cos(math.radians(self.latitud)))
        return Ubicacion(round(self.latitud + dlat, 5), round(self.longitud + dlon, 5), self.descripcion)

    def a_geojson(self) -> dict:
        return {"type": "Point", "coordinates": [self.longitud, self.latitud]}
