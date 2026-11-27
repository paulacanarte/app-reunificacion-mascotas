"""Repositorios concretos, uno por colección."""
from __future__ import annotations

from bson import ObjectId

from ..dominio import (AccionModeracion, Coincidencia, Conversacion, Denuncia, RegistroModeracion, EstadoCoincidencia,
                       EstadoCuenta, EstadoReporte, Especie, Mascota, Mensaje,
                       Refugio, Reporte, ReporteEncontrada, ReportePerdida, Rol,
                       TipoPunto, TipoReporte, Usuario)
from .base import RepositorioMongo
from .conversores import (caracteristicas_a_doc, doc_a_caracteristicas, doc_a_fotos,
                          doc_a_ubicacion, fecha_a_doc, fotos_a_doc, ubicacion_a_doc)


class RepositorioUsuarios(RepositorioMongo[Usuario]):
    def a_documento(self, u: Usuario) -> dict:
        return {"nombre": u.nombre, "correo": u.correo, "hash_contrasena": u.hash_contrasena,
                "rol": u.rol.value, "telefono": u.telefono, "estado": u.estado.value,
                "dispositivos_biometricos": sorted(u.dispositivos_biometricos), "fecha_registro": u.fecha_registro}

    def desde_documento(self, d: dict) -> Usuario:
        return Usuario(nombre=d["nombre"], correo=d["correo"], hash_contrasena=d["hash_contrasena"],
                       rol=Rol(d["rol"]), telefono=d.get("telefono", ""), estado=EstadoCuenta(d["estado"]),
                       dispositivos_biometricos=set(d.get("dispositivos_biometricos", [])),
                       fecha_registro=d["fecha_registro"], id=str(d["_id"]))

    def buscar_por_correo(self, correo: str) -> Usuario | None:
        d = self.coleccion.find_one({"correo": correo.strip().lower()})
        return self.desde_documento(d) if d else None


class RepositorioMascotas(RepositorioMongo[Mascota]):
    def a_documento(self, m: Mascota) -> dict:
        return {"dueno_id": m.dueno_id, "nombre": m.nombre, "especie": m.especie.value, "sexo": m.sexo,
                "caracteristicas": caracteristicas_a_doc(m.caracteristicas), "fotos": fotos_a_doc(m.fotos),
                "fecha_nacimiento": fecha_a_doc(m.fecha_nacimiento), "peso_kg": m.peso_kg,
                "esterilizada": m.esterilizada}

    def desde_documento(self, d: dict) -> Mascota:
        fn = d.get("fecha_nacimiento")
        return Mascota(dueno_id=d["dueno_id"], nombre=d["nombre"], especie=Especie(d["especie"]),
                       sexo=d["sexo"], caracteristicas=doc_a_caracteristicas(d["caracteristicas"]),
                       fotos=doc_a_fotos(d["fotos"]), fecha_nacimiento=fn.date() if fn else None,
                       peso_kg=d.get("peso_kg"), esterilizada=d.get("esterilizada", False), id=str(d["_id"]))

    def de_dueno(self, dueno_id: str) -> list[Mascota]:
        return self.listar({"dueno_id": dueno_id})


class RepositorioReportes(RepositorioMongo[Reporte]):
    def a_documento(self, r: Reporte) -> dict:
        doc = {"tipo": r.tipo().value, "usuario_id": r.usuario_id, "especie": r.especie.value,
               "caracteristicas": caracteristicas_a_doc(r.caracteristicas),
               "ubicacion": ubicacion_a_doc(r.ubicacion), "fecha_evento": r.fecha_evento,
               "descripcion": r.descripcion, "fotos": fotos_a_doc(r.fotos), "estado": r.estado.value,
               "fecha_creacion": r.fecha_creacion}
        if isinstance(r, ReportePerdida):
            doc["mascota_id"] = r.mascota_id
        else:
            doc.update(lugar_resguardo=r.lugar_resguardo, refugio_id=r.refugio_id)
        return doc

    def desde_documento(self, d: dict) -> Reporte:
        comunes = dict(usuario_id=d["usuario_id"], especie=Especie(d["especie"]),
                       caracteristicas=doc_a_caracteristicas(d["caracteristicas"]),
                       ubicacion=doc_a_ubicacion(d["ubicacion"]), fecha_evento=d["fecha_evento"],
                       descripcion=d.get("descripcion", ""), fotos=doc_a_fotos(d["fotos"]),
                       estado=EstadoReporte(d["estado"]), fecha_creacion=d["fecha_creacion"], id=str(d["_id"]))
        if d["tipo"] == TipoReporte.PERDIDA.value:
            return ReportePerdida(mascota_id=d["mascota_id"], **comunes)
        return ReporteEncontrada(lugar_resguardo=d.get("lugar_resguardo", ""),
                                 refugio_id=d.get("refugio_id"), **comunes)

    def abierto_de_mascota(self, mascota_id: str) -> ReportePerdida | None:
        d = self.coleccion.find_one({"mascota_id": mascota_id,
                                     "estado": {"$nin": [EstadoReporte.REUNIFICADA.value, EstadoReporte.CERRADA.value]}})
        return self.desde_documento(d) if d else None

    def buscar(self, tipo: TipoReporte | None = None, especie: Especie | None = None,
               color: str | None = None, tamano: str | None = None, raza: str | None = None,
               solo_abiertos: bool = True, limite: int = 500) -> list[Reporte]:
        """Filtros de RF06. La distancia (RF11) se calcula en el servicio."""
        filtro: dict = {}
        if tipo:
            filtro["tipo"] = tipo.value
        if especie:
            filtro["especie"] = especie.value
        if color:
            filtro["caracteristicas.color"] = {"$regex": color, "$options": "i"}
        if tamano:
            filtro["caracteristicas.tamano"] = tamano
        if raza:
            filtro["caracteristicas.raza"] = {"$regex": raza, "$options": "i"}
        if solo_abiertos:
            filtro["estado"] = {"$nin": [EstadoReporte.REUNIFICADA.value, EstadoReporte.CERRADA.value]}
        return self.listar(filtro, limite)


class RepositorioCoincidencias(RepositorioMongo[Coincidencia]):
    def a_documento(self, c: Coincidencia) -> dict:
        return {"reporte_perdida_id": c.reporte_perdida_id, "reporte_encontrada_id": c.reporte_encontrada_id,
                "similitud": c.similitud, "distancia_km": c.distancia_km, "estado": c.estado.value,
                "entregas_confirmadas": sorted(c.entregas_confirmadas), "fecha_creacion": c.fecha_creacion}

    def desde_documento(self, d: dict) -> Coincidencia:
        return Coincidencia(d["reporte_perdida_id"], d["reporte_encontrada_id"], d["similitud"],
                            d["distancia_km"], EstadoCoincidencia(d["estado"]),
                            set(d.get("entregas_confirmadas", [])), d["fecha_creacion"], str(d["_id"]))

    def existe(self, perdida_id: str, encontrada_id: str) -> bool:
        return self.coleccion.count_documents({"reporte_perdida_id": perdida_id,
                                               "reporte_encontrada_id": encontrada_id}) > 0


class RepositorioConversaciones(RepositorioMongo[Conversacion]):
    def a_documento(self, c: Conversacion) -> dict:
        return {"participantes": c.participantes, "coincidencia_id": c.coincidencia_id, "bloqueada": c.bloqueada,
                "mensajes": [{"autor_id": m.autor_id, "texto": m.texto, "fecha": m.fecha} for m in c.mensajes]}

    def desde_documento(self, d: dict) -> Conversacion:
        return Conversacion(d["participantes"], d.get("coincidencia_id"),
                            [Mensaje(**m) for m in d.get("mensajes", [])], d.get("bloqueada", False), str(d["_id"]))

    def de_usuario(self, usuario_id: str) -> list[Conversacion]:
        return self.listar({"participantes": usuario_id})


class RepositorioRefugios(RepositorioMongo[Refugio]):
    def a_documento(self, r: Refugio) -> dict:
        return {"nombre": r.nombre, "tipo": r.tipo.value, "ubicacion": ubicacion_a_doc(r.ubicacion),
                "contacto": r.contacto, "capacidad": r.capacidad, "ocupacion": r.ocupacion}

    def desde_documento(self, d: dict) -> Refugio:
        return Refugio(d["nombre"], TipoPunto(d["tipo"]), doc_a_ubicacion(d["ubicacion"]), d["contacto"],
                       d["capacidad"], d["ocupacion"], str(d["_id"]))


class RepositorioDenuncias(RepositorioMongo[Denuncia]):
    def a_documento(self, x: Denuncia) -> dict:
        return {"autor_id": x.autor_id, "objetivo_id": x.objetivo_id, "motivo": x.motivo,
                "detalle": x.detalle, "resuelta": x.resuelta, "fecha": x.fecha}

    def desde_documento(self, d: dict) -> Denuncia:
        return Denuncia(d["autor_id"], d["objetivo_id"], d["motivo"], d.get("detalle", ""),
                        d.get("resuelta", False), d["fecha"], str(d["_id"]))

    def pendientes(self) -> list[Denuncia]:
        return self.listar({"resuelta": False})


class RepositorioRegistrosModeracion(RepositorioMongo[RegistroModeracion]):
    """Log de auditoría: solo se insertan registros, nunca se modifican (RF16)."""

    def a_documento(self, r: RegistroModeracion) -> dict:
        return {"admin_id": r.admin_id, "accion": r.accion.value, "objetivo_id": r.objetivo_id,
                "motivo": r.motivo, "fecha": r.fecha}

    def desde_documento(self, d: dict) -> RegistroModeracion:
        return RegistroModeracion(d["admin_id"], AccionModeracion(d["accion"]), d["objetivo_id"],
                                  d["motivo"], d["fecha"], str(d["_id"]))

    def de_objetivo(self, objetivo_id: str) -> list[RegistroModeracion]:
        return self.listar({"objetivo_id": objetivo_id})
