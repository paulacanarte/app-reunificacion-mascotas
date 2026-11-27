"""Excepciones del dominio."""


class ErrorDominio(Exception):
    """Error base de reglas de negocio."""


class DatosInvalidos(ErrorDominio):
    """Un dato no cumple el formato o una regla de validación."""


class TransicionInvalida(ErrorDominio):
    """Se intentó un cambio de estado no permitido."""


class NoAutorizado(ErrorDominio):
    """El usuario no tiene permiso para la acción."""


class NoEncontrado(ErrorDominio):
    """La entidad buscada no existe."""
