"""Conexión a MongoDB e índices."""
from __future__ import annotations

import os
from dataclasses import dataclass

from pymongo import ASCENDING, GEOSPHERE, MongoClient
from pymongo.database import Database

from .repositorios import (RepositorioCoincidencias, RepositorioConversaciones,
                           RepositorioDenuncias, RepositorioMascotas, RepositorioRegistrosModeracion, RepositorioReportes,
                           RepositorioRefugios, RepositorioUsuarios)


def obtener_base_datos(uri: str | None = None, nombre: str | None = None) -> Database:
    uri = uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")
    nombre = nombre or os.getenv("MONGO_DB", "mascotas_db")
    return MongoClient(uri)[nombre]


def crear_indices(db: Database) -> None:
    db.usuarios.create_index([("correo", ASCENDING)], unique=True)
    db.mascotas.create_index([("dueno_id", ASCENDING)])
    db.reportes.create_index([("ubicacion", GEOSPHERE)])
    db.reportes.create_index([("tipo", ASCENDING), ("especie", ASCENDING), ("estado", ASCENDING)])
    db.coincidencias.create_index([("reporte_perdida_id", ASCENDING), ("reporte_encontrada_id", ASCENDING)],
                                  unique=True)
    db.refugios.create_index([("ubicacion", GEOSPHERE)])
    db.registros_moderacion.create_index([("objetivo_id", ASCENDING), ("fecha", ASCENDING)])


@dataclass
class Repositorios:
    usuarios: RepositorioUsuarios
    mascotas: RepositorioMascotas
    reportes: RepositorioReportes
    coincidencias: RepositorioCoincidencias
    conversaciones: RepositorioConversaciones
    refugios: RepositorioRefugios
    denuncias: RepositorioDenuncias
    registros: RepositorioRegistrosModeracion

    @classmethod
    def desde_db(cls, db: Database) -> "Repositorios":
        return cls(RepositorioUsuarios(db.usuarios), RepositorioMascotas(db.mascotas),
                   RepositorioReportes(db.reportes), RepositorioCoincidencias(db.coincidencias),
                   RepositorioConversaciones(db.conversaciones), RepositorioRefugios(db.refugios),
                   RepositorioDenuncias(db.denuncias), RepositorioRegistrosModeracion(db.registros_moderacion))
