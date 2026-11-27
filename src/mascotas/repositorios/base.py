"""Repositorio genérico sobre una colección de MongoDB."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from ..dominio.errores import NoEncontrado

T = TypeVar("T")


class RepositorioMongo(ABC, Generic[T]):
    """Traduce entidades del dominio a documentos y viceversa."""

    def __init__(self, coleccion: Collection) -> None:
        self.coleccion = coleccion

    @abstractmethod
    def a_documento(self, entidad: T) -> dict: ...

    @abstractmethod
    def desde_documento(self, doc: dict) -> T: ...

    def guardar(self, entidad: T) -> str:
        """Inserta si la entidad no tiene id; si lo tiene, reemplaza el documento."""
        doc = self.a_documento(entidad)
        if getattr(entidad, "id", None):
            self.coleccion.replace_one({"_id": ObjectId(entidad.id)}, doc, upsert=True)
        else:
            entidad.id = str(self.coleccion.insert_one(doc).inserted_id)
        return entidad.id

    def buscar_por_id(self, id_: str) -> T:
        try:
            doc = self.coleccion.find_one({"_id": ObjectId(id_)})
        except InvalidId:
            doc = None
        if doc is None:
            raise NoEncontrado(f"No existe el registro {id_} en {self.coleccion.name}")
        return self.desde_documento(doc)

    def listar(self, filtro: dict | None = None, limite: int = 100) -> list[T]:
        return [self.desde_documento(d) for d in self.coleccion.find(filtro or {}).limit(limite)]

    def eliminar(self, id_: str) -> None:
        self.coleccion.delete_one({"_id": ObjectId(id_)})
