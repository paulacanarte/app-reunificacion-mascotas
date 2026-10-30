"""Funciones de conversión de objetos de valor a documentos BSON."""
from __future__ import annotations

from datetime import date, datetime

from ..dominio import Caracteristicas, Fotografia, Tamano, Ubicacion


def ubicacion_a_doc(u: Ubicacion) -> dict:
    # GeoJSON para el índice 2dsphere de MongoDB
    return {**u.a_geojson(), "descripcion": u.descripcion}


def doc_a_ubicacion(d: dict) -> Ubicacion:
    lon, lat = d["coordinates"]
    return Ubicacion(lat, lon, d.get("descripcion", ""))


def caracteristicas_a_doc(c: Caracteristicas) -> dict:
    return {"color": c.color, "tamano": c.tamano.value, "raza": c.raza, "pelaje": c.pelaje, "senas": c.senas}


def doc_a_caracteristicas(d: dict) -> Caracteristicas:
    return Caracteristicas(d["color"], Tamano(d["tamano"]), d.get("raza", ""), d.get("pelaje", ""), d.get("senas", ""))


def fotos_a_doc(fotos: list[Fotografia]) -> list[dict]:
    return [{"nombre_archivo": f.nombre_archivo, "tamano_bytes": f.tamano_bytes, "es_principal": f.es_principal}
            for f in fotos]


def doc_a_fotos(lista: list[dict]) -> list[Fotografia]:
    return [Fotografia(**f) for f in lista]


def fecha_a_doc(f: date | None) -> datetime | None:
    if f is None or isinstance(f, datetime):
        return f
    return datetime(f.year, f.month, f.day)
