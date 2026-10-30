"""Usuario del sistema (RF01, RF02, RNF01)."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone

import bcrypt

from .enums import EstadoCuenta, Rol
from .errores import DatosInvalidos, TransicionInvalida

PATRON_CORREO = re.compile(r"^[\w.+-]+@[\w-]+(\.[\w-]+)+$")
PATRON_TELEFONO = re.compile(r"^\+?\d{7,15}$")


def validar_contrasena_segura(contrasena: str) -> None:
    """Mínimo 8 caracteres, con al menos una letra y un número."""
    if len(contrasena) < 8 or not re.search(r"[A-Za-z]", contrasena) or not re.search(r"\d", contrasena):
        raise DatosInvalidos("La contraseña debe tener mínimo 8 caracteres, letras y números")


@dataclass
class Usuario:
    nombre: str
    correo: str
    hash_contrasena: str = field(repr=False)
    rol: Rol
    telefono: str = field(default="", repr=False)  # privado: nunca se muestra a otros (RNF02)
    estado: EstadoCuenta = EstadoCuenta.PENDIENTE_VERIFICACION
    dispositivos_biometricos: set[str] = field(default_factory=set, repr=False)
    fecha_registro: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: str | None = None

    @classmethod
    def crear(cls, nombre: str, correo: str, contrasena: str, rol: Rol, telefono: str) -> "Usuario":
        nombre = nombre.strip()
        correo = correo.strip().lower()
        telefono = re.sub(r"[\s-]", "", telefono)
        if not PATRON_TELEFONO.match(telefono):
            raise DatosInvalidos("Teléfono inválido: use solo números (7 a 15 dígitos)")
        if len(nombre) < 3:
            raise DatosInvalidos("El nombre debe tener al menos 3 caracteres")
        if not PATRON_CORREO.match(correo):
            raise DatosInvalidos("Correo electrónico inválido")
        if rol == Rol.ADMIN:
            raise DatosInvalidos("El rol administrador no se puede elegir al registrarse")
        validar_contrasena_segura(contrasena)
        hash_ = bcrypt.hashpw(contrasena.encode(), bcrypt.gensalt()).decode()
        return cls(nombre=nombre, correo=correo, hash_contrasena=hash_, rol=rol, telefono=telefono)

    def verificar_contrasena(self, contrasena: str) -> bool:
        return bcrypt.checkpw(contrasena.encode(), self.hash_contrasena.encode())

    def activar(self) -> None:
        if self.estado == EstadoCuenta.BLOQUEADA:
            raise TransicionInvalida("Una cuenta bloqueada no se puede activar")
        self.estado = EstadoCuenta.ACTIVA

    def suspender(self) -> None:
        if self.estado == EstadoCuenta.BLOQUEADA:
            raise TransicionInvalida("La cuenta ya está bloqueada")
        self.estado = EstadoCuenta.SUSPENDIDA

    def bloquear(self) -> None:
        self.estado = EstadoCuenta.BLOQUEADA

    def habilitar_biometria(self, id_dispositivo: str) -> None:
        """RF02: el teléfono verifica huella o rostro; el sistema solo confía en dispositivos registrados."""
        if not id_dispositivo.strip():
            raise DatosInvalidos("Dispositivo inválido")
        self.dispositivos_biometricos.add(id_dispositivo)

    def acepta_biometria(self, id_dispositivo: str) -> bool:
        return id_dispositivo in self.dispositivos_biometricos

    @property
    def puede_operar(self) -> bool:
        return self.estado not in (EstadoCuenta.BLOQUEADA, EstadoCuenta.SUSPENDIDA)
