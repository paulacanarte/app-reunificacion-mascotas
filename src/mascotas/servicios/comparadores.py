"""Estrategias para medir la similitud entre un reporte perdido y uno encontrado (RF07)."""
from __future__ import annotations

from abc import ABC, abstractmethod

from ..dominio import Reporte

PALABRAS_VACIAS = {"de", "la", "el", "en", "y", "con", "un", "una", "los", "las", "a", "del"}


class ComparadorSimilitud(ABC):
    @abstractmethod
    def comparar(self, perdida: Reporte, encontrada: Reporte) -> float:
        """Devuelve un valor entre 0 (nada parecido) y 1 (idéntico)."""


class ComparadorCaracteristicas(ComparadorSimilitud):
    """Comparación por rasgos descritos. Pesos: color 35 %, tamaño 25 %,
    raza 20 %, señas particulares 20 %. Si la especie difiere, la similitud es 0."""

    PESOS = {"color": 0.35, "tamano": 0.25, "raza": 0.20, "senas": 0.20}

    def comparar(self, perdida: Reporte, encontrada: Reporte) -> float:
        if perdida.especie != encontrada.especie:
            return 0.0
        a, b = perdida.caracteristicas, encontrada.caracteristicas
        puntaje = 0.0
        puntaje += self.PESOS["color"] * self._similitud_texto(a.color, b.color)
        puntaje += self.PESOS["tamano"] * (1.0 if a.tamano == b.tamano else 0.0)
        puntaje += self.PESOS["raza"] * self._similitud_raza(a.raza, b.raza)
        puntaje += self.PESOS["senas"] * self._similitud_texto(a.senas, b.senas)
        return round(puntaje, 3)

    @staticmethod
    def _palabras(texto: str) -> set[str]:
        return {p for p in texto.lower().replace(",", " ").split() if p not in PALABRAS_VACIAS}

    def _similitud_texto(self, x: str, y: str) -> float:
        """Índice de Jaccard entre las palabras de ambos textos."""
        px, py = self._palabras(x), self._palabras(y)
        if not px or not py:
            return 0.0
        return len(px & py) / len(px | py)

    def _similitud_raza(self, x: str, y: str) -> float:
        desconocida = {"", "mestizo / no sé", "mestizo", "no sé"}
        if x.lower() in desconocida or y.lower() in desconocida:
            return 0.5  # sin información suficiente: puntaje neutro
        return 1.0 if x.lower() == y.lower() else 0.0


class ComparadorCNN(ComparadorSimilitud):
    """Punto de extensión para el modelo de visión (red neuronal convolucional).

    Cuando el modelo esté entrenado, este comparador extraerá un vector de
    características de cada foto principal y devolverá la similitud coseno.
    Mientras tanto delega en el comparador de características."""

    def __init__(self, modelo=None, respaldo: ComparadorSimilitud | None = None) -> None:
        self.modelo = modelo
        self.respaldo = respaldo or ComparadorCaracteristicas()

    def comparar(self, perdida: Reporte, encontrada: Reporte) -> float:
        if self.modelo is None:
            return self.respaldo.comparar(perdida, encontrada)
        raise NotImplementedError("Integrar aquí el modelo entrenado")
