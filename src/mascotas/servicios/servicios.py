"""Casos de uso implementados como servicios de aplicación."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..dominio import (AccionModeracion, Caracteristicas, Coincidencia, Conversacion, Denuncia,
                       RegistroModeracion,
                       DatosInvalidos, EstadoCoincidencia, EstadoReporte, Especie,
                       Fotografia, Mascota, NoAutorizado, NoEncontrado, Refugio,
                       Reporte, ReporteEncontrada, ReportePerdida, Rol, TipoPunto,
                       TipoReporte, Ubicacion, Usuario)
from ..repositorios import Repositorios
from .comparadores import ComparadorSimilitud
from .notificador import Notificador


class ServicioUsuarios:
    """CU01 Registrarse · CU02 Iniciar sesión."""

    def __init__(self, repos: Repositorios, modo_emergencia: bool = False) -> None:
        self.repos = repos
        self.modo_emergencia = modo_emergencia

    def registrar(self, nombre: str, correo: str, contrasena: str, confirmacion: str, rol: Rol,
                  telefono: str) -> Usuario:
        if contrasena != confirmacion:
            raise DatosInvalidos("Las contraseñas no coinciden")
        if self.repos.usuarios.buscar_por_correo(correo):
            raise DatosInvalidos("Ya existe una cuenta con ese correo. ¿Desea recuperar la contraseña?")
        usuario = Usuario.crear(nombre, correo, contrasena, rol, telefono)
        if self.modo_emergencia:  # RN04
            usuario.activar()
        self.repos.usuarios.guardar(usuario)
        return usuario

    def iniciar_sesion(self, correo: str, contrasena: str) -> Usuario:
        usuario = self.repos.usuarios.buscar_por_correo(correo)
        if usuario is None or not usuario.verificar_contrasena(contrasena):
            raise NoAutorizado("Correo o contraseña incorrectos")
        if not usuario.puede_operar:
            raise NoAutorizado("La cuenta está suspendida o bloqueada")
        return usuario

    def habilitar_biometria(self, usuario: Usuario, id_dispositivo: str) -> None:
        """RF02: después del primer ingreso, el usuario activa huella o rostro en su teléfono."""
        usuario.habilitar_biometria(id_dispositivo)
        self.repos.usuarios.guardar(usuario)

    def iniciar_sesion_biometrica(self, correo: str, id_dispositivo: str) -> Usuario:
        """El teléfono ya verificó la huella o el rostro; aquí solo se valida que el dispositivo sea de confianza."""
        usuario = self.repos.usuarios.buscar_por_correo(correo)
        if usuario is None or not usuario.acepta_biometria(id_dispositivo):
            raise NoAutorizado("Este dispositivo no tiene activado el ingreso biométrico")
        if not usuario.puede_operar:
            raise NoAutorizado("La cuenta está suspendida o bloqueada")
        return usuario

    def verificar_correo(self, usuario_id: str) -> None:
        usuario = self.repos.usuarios.buscar_por_id(usuario_id)
        usuario.activar()
        self.repos.usuarios.guardar(usuario)


class ServicioMascotas:
    """CU03 Registrar mascota · CU04 Adjuntar fotografías."""

    def __init__(self, repos: Repositorios) -> None:
        self.repos = repos

    def registrar(self, dueno: Usuario, nombre: str, especie: Especie, sexo: str,
                  caracteristicas: Caracteristicas, fotos: list[Fotografia], forzar: bool = False,
                  **opcionales) -> Mascota:
        if dueno.rol != Rol.DUENO:
            raise NoAutorizado("Solo un dueño puede registrar mascotas")
        mascota = Mascota(dueno.id, nombre.strip(), especie, sexo.upper(), caracteristicas, fotos, **opcionales)
        mascota.validar()
        duplicada = any(m.nombre.lower() == mascota.nombre.lower() and m.especie == especie
                        for m in self.repos.mascotas.de_dueno(dueno.id))
        if duplicada and not forzar:
            raise DatosInvalidos("Ya tiene una mascota con ese nombre y especie. Use forzar=True para continuar")
        self.repos.mascotas.guardar(mascota)
        return mascota

    def de_dueno(self, dueno: Usuario) -> list[Mascota]:
        return self.repos.mascotas.de_dueno(dueno.id)


@dataclass
class Sugerencia:
    """Reporte de mascota perdida parecido a un hallazgo, para mostrar a quien lo encontró (RF07)."""
    reporte: Reporte
    similitud: float
    distancia_km: float


@dataclass
class DenunciaUrgente:
    """Denuncias pendientes agrupadas por publicación, con su nivel de urgencia (RF17)."""
    objetivo_id: str
    cantidad: int
    gravedad_maxima: int
    urgencia: int
    motivos: list[str]


@dataclass
class ResultadoBusqueda:
    reporte: Reporte
    ubicacion_publica: Ubicacion
    distancia_km: float | None


class ServicioCoincidencias:
    """CU08 Generar coincidencias · CU09 Confirmar coincidencia."""

    def __init__(self, repos: Repositorios, comparador: ComparadorSimilitud, notificador: Notificador) -> None:
        self.repos = repos
        self.comparador = comparador
        self.notificador = notificador

    def buscar_coincidencias(self, reporte: Reporte) -> list[Coincidencia]:
        opuesto = TipoReporte.ENCONTRADA if reporte.tipo() == TipoReporte.PERDIDA else TipoReporte.PERDIDA
        candidatos = self.repos.reportes.buscar(tipo=opuesto, especie=reporte.especie)
        nuevas: list[Coincidencia] = []
        for candidato in candidatos:
            perdida, encontrada = (reporte, candidato) if opuesto == TipoReporte.ENCONTRADA else (candidato, reporte)
            distancia = perdida.ubicacion.distancia_km(encontrada.ubicacion)
            similitud = self.comparador.comparar(perdida, encontrada)
            if not Coincidencia.es_relevante(similitud, distancia):
                continue
            if self.repos.coincidencias.existe(perdida.id, encontrada.id):
                continue
            coincidencia = Coincidencia(perdida.id, encontrada.id, similitud, round(distancia, 2))
            self.repos.coincidencias.guardar(coincidencia)
            for r in (perdida, encontrada):
                if r.estado != EstadoReporte.POSIBLE_COINCIDENCIA:
                    r.cambiar_estado(EstadoReporte.POSIBLE_COINCIDENCIA)
                    self.repos.reportes.guardar(r)
            self.notificador.notificar(
                perdida.usuario_id,
                f"Posible coincidencia ({similitud:.0%}) a {distancia:.1f} km. Revise la app.")
            nuevas.append(coincidencia)
        return nuevas

    def sugerir_parecidos(self, encontrada: Reporte, minimo: float = 0.5, limite: int = 5) -> list[Sugerencia]:
        """Lista para quien encontró al animal: reportes perdidos parecidos, del más al menos similar (RF07)."""
        sugerencias = []
        for perdida in self.repos.reportes.buscar(tipo=TipoReporte.PERDIDA, especie=encontrada.especie):
            distancia = perdida.ubicacion.distancia_km(encontrada.ubicacion)
            similitud = self.comparador.comparar(perdida, encontrada)
            if similitud >= minimo and distancia < 20:
                sugerencias.append(Sugerencia(perdida, similitud, round(distancia, 2)))
        sugerencias.sort(key=lambda x: (-x.similitud, x.distancia_km))
        return sugerencias[:limite]

    def _cargar(self, coincidencia_id: str, usuario: Usuario):
        c = self.repos.coincidencias.buscar_por_id(coincidencia_id)
        perdida = self.repos.reportes.buscar_por_id(c.reporte_perdida_id)
        encontrada = self.repos.reportes.buscar_por_id(c.reporte_encontrada_id)
        return c, perdida, encontrada

    def confirmar(self, coincidencia_id: str, dueno: Usuario) -> Conversacion:
        c, perdida, encontrada = self._cargar(coincidencia_id, dueno)
        if perdida.usuario_id != dueno.id:
            raise NoAutorizado("Solo el dueño del reporte puede confirmar la coincidencia")
        c.confirmar()
        for r in (perdida, encontrada):
            r.cambiar_estado(EstadoReporte.EN_VERIFICACION)
            self.repos.reportes.guardar(r)
        self.repos.coincidencias.guardar(c)
        conversacion = Conversacion([dueno.id, encontrada.usuario_id], coincidencia_id=c.id)
        self.repos.conversaciones.guardar(conversacion)
        self.notificador.notificar(encontrada.usuario_id, "El dueño confirmó que es su mascota. Coordinen la entrega.")
        return conversacion

    def rechazar(self, coincidencia_id: str, dueno: Usuario) -> None:
        c, perdida, encontrada = self._cargar(coincidencia_id, dueno)
        if perdida.usuario_id != dueno.id:
            raise NoAutorizado("Solo el dueño del reporte puede rechazar la coincidencia")
        c.rechazar()
        self.repos.coincidencias.guardar(c)
        for r in (perdida, encontrada):
            pendientes = self.repos.coincidencias.listar(
                {"estado": EstadoCoincidencia.PENDIENTE.value,
                 "$or": [{"reporte_perdida_id": r.id}, {"reporte_encontrada_id": r.id}]})
            if not pendientes and r.estado == EstadoReporte.POSIBLE_COINCIDENCIA:
                r.cambiar_estado(r.estado_inicial())
                self.repos.reportes.guardar(r)

    def registrar_entrega(self, coincidencia_id: str, usuario: Usuario) -> bool:
        c, perdida, encontrada = self._cargar(coincidencia_id, usuario)
        if usuario.id not in (perdida.usuario_id, encontrada.usuario_id):
            raise NoAutorizado("Solo las partes del caso pueden confirmar la entrega")
        completa = c.registrar_entrega(usuario.id)
        self.repos.coincidencias.guardar(c)
        if completa:  # RN03
            for r in (perdida, encontrada):
                r.cambiar_estado(EstadoReporte.REUNIFICADA)
                self.repos.reportes.guardar(r)
            self.notificador.notificar(perdida.usuario_id, "¡Caso reunificado! Gracias por usar la app.")
        return completa


class ServicioReportes:
    """CU05 Reportar pérdida · CU06 Reportar hallazgo · CU07 Buscar."""

    def __init__(self, repos: Repositorios, coincidencias: ServicioCoincidencias) -> None:
        self.repos = repos
        self.coincidencias = coincidencias

    def reportar_perdida(self, dueno: Usuario, mascota_id: str, ubicacion: Ubicacion,
                         fecha_evento: datetime, descripcion: str = "") -> ReportePerdida:
        mascota = self.repos.mascotas.buscar_por_id(mascota_id)
        if mascota.dueno_id != dueno.id:
            raise NoAutorizado("La mascota no pertenece a este usuario")
        if self.repos.reportes.abierto_de_mascota(mascota_id):
            raise DatosInvalidos("La mascota ya tiene un reporte abierto")
        reporte = ReportePerdida(usuario_id=dueno.id, especie=mascota.especie,
                                 caracteristicas=mascota.caracteristicas, ubicacion=ubicacion,
                                 fecha_evento=fecha_evento, descripcion=descripcion,
                                 fotos=list(mascota.fotos), mascota_id=mascota.id)
        self.repos.reportes.guardar(reporte)
        self.coincidencias.buscar_coincidencias(reporte)
        return self.repos.reportes.buscar_por_id(reporte.id)

    def reportar_perdida_rapida(self, dueno: Usuario, nombre: str, especie: Especie, sexo: str,
                                caracteristicas: Caracteristicas, fotos: list[Fotografia], ubicacion: Ubicacion,
                                fecha_evento: datetime, descripcion: str = "") -> ReportePerdida:
        """RF04: el dueño que no había registrado su mascota la registra y la reporta en un solo paso."""
        if dueno.rol != Rol.DUENO:
            raise NoAutorizado("Solo un dueño puede reportar una mascota perdida")
        mascota = Mascota(dueno.id, nombre.strip(), especie, sexo.upper(), caracteristicas, fotos)
        mascota.validar()
        self.repos.mascotas.guardar(mascota)
        return self.reportar_perdida(dueno, mascota.id, ubicacion, fecha_evento, descripcion)

    def reportar_encontrada(self, usuario: Usuario, especie: Especie, caracteristicas: Caracteristicas,
                            ubicacion: Ubicacion, fecha_evento: datetime, fotos: list[Fotografia],
                            lugar_resguardo: str = "", refugio_id: str | None = None,
                            descripcion: str = "") -> ReporteEncontrada:
        if refugio_id:
            refugio = self.repos.refugios.buscar_por_id(refugio_id)
            refugio.registrar_ingreso()
            self.repos.refugios.guardar(refugio)
            lugar_resguardo = lugar_resguardo or refugio.nombre
        reporte = ReporteEncontrada(usuario_id=usuario.id, especie=especie, caracteristicas=caracteristicas,
                                    ubicacion=ubicacion, fecha_evento=fecha_evento, descripcion=descripcion,
                                    fotos=fotos, lugar_resguardo=lugar_resguardo, refugio_id=refugio_id)
        self.repos.reportes.guardar(reporte)
        self.coincidencias.buscar_coincidencias(reporte)
        return self.repos.reportes.buscar_por_id(reporte.id)

    def buscar(self, desde: Ubicacion | None = None, radio_km: float | None = None,
               desde_fecha: datetime | None = None, hasta_fecha: datetime | None = None,
               **filtros) -> list[ResultadoBusqueda]:
        """Busca con filtros (RF06) y ordena por cercanía (RF11). Nunca expone la ubicación exacta."""
        resultados = []
        for r in self.repos.reportes.buscar(**filtros):
            fecha = r.fecha_evento.replace(tzinfo=None)
            if desde_fecha and fecha < desde_fecha.replace(tzinfo=None):
                continue
            if hasta_fecha and fecha > hasta_fecha.replace(tzinfo=None):
                continue
            distancia = desde.distancia_km(r.ubicacion) if desde else None
            if radio_km is not None and distancia is not None and distancia > radio_km:
                continue
            resultados.append(ResultadoBusqueda(r, r.ubicacion_publica(),
                                                round(distancia, 2) if distancia is not None else None))
        resultados.sort(key=lambda x: (x.distancia_km is None, x.distancia_km or 0))
        return resultados


class ServicioMensajeria:
    """CU10 Comunicarse por chat interno."""

    def __init__(self, repos: Repositorios, notificador: Notificador) -> None:
        self.repos = repos
        self.notificador = notificador

    def enviar(self, conversacion_id: str, autor: Usuario, texto: str) -> None:
        conversacion = self.repos.conversaciones.buscar_por_id(conversacion_id)
        conversacion.agregar_mensaje(autor.id, texto)
        self.repos.conversaciones.guardar(conversacion)
        self.notificador.notificar(conversacion.otro_participante(autor.id), f"Nuevo mensaje de {autor.nombre}")

    def de_usuario(self, usuario: Usuario) -> list[Conversacion]:
        return self.repos.conversaciones.de_usuario(usuario.id)


class ServicioRefugios:
    """CU11 Consultar mapa · CU12 Gestionar refugios."""

    def __init__(self, repos: Repositorios) -> None:
        self.repos = repos

    def registrar(self, usuario: Usuario, nombre: str, tipo: TipoPunto, ubicacion: Ubicacion,
                  contacto: str, capacidad: int) -> Refugio:
        if usuario.rol not in (Rol.FUNDACION, Rol.ADMIN):
            raise NoAutorizado("Solo fundaciones o administradores gestionan refugios")
        refugio = Refugio(nombre, tipo, ubicacion, contacto, capacidad)
        self.repos.refugios.guardar(refugio)
        return refugio

    def puntos_del_mapa(self) -> dict[str, list]:
        """Datos para el mapa: refugios con su ubicación real y reportes con la aproximada."""
        reportes = self.repos.reportes.buscar()
        return {
            "refugios": [r for r in self.repos.refugios.listar() if r.tipo == TipoPunto.REFUGIO],
            "puntos_recepcion": [r for r in self.repos.refugios.listar() if r.tipo == TipoPunto.PUNTO_RECEPCION],
            "perdidas": [(r.id, r.ubicacion_publica()) for r in reportes if r.tipo() == TipoReporte.PERDIDA],
            "encontradas": [(r.id, r.ubicacion_publica()) for r in reportes if r.tipo() == TipoReporte.ENCONTRADA],
        }


class ServicioModeracion:
    """CU13 Denunciar y moderar contenido (RF15, RF16, RF17)."""

    def __init__(self, repos: Repositorios) -> None:
        self.repos = repos

    def denunciar(self, autor: Usuario, objetivo_id: str, motivo: str, detalle: str = "") -> Denuncia:
        denuncia = Denuncia(autor.id, objetivo_id, motivo, detalle)
        self.repos.denuncias.guardar(denuncia)
        return denuncia

    def denuncias_por_urgencia(self, admin: Usuario) -> list[DenunciaUrgente]:
        """Agrupa las denuncias pendientes por publicación. Urgencia = suma de la gravedad de cada denuncia,
        así pesan tanto la cantidad de denuncias como la gravedad del motivo (RF17)."""
        self._exigir_admin(admin)
        grupos: dict[str, list[Denuncia]] = {}
        for d in self.repos.denuncias.pendientes():
            grupos.setdefault(d.objetivo_id, []).append(d)
        lista = [DenunciaUrgente(obj, len(ds), max(d.gravedad for d in ds), sum(d.gravedad for d in ds),
                                 sorted({d.motivo for d in ds})) for obj, ds in grupos.items()]
        lista.sort(key=lambda x: (-x.urgencia, -x.gravedad_maxima))
        return lista

    def retirar_reporte(self, admin: Usuario, reporte_id: str, motivo: str) -> None:
        self._exigir_admin(admin)
        reporte = self.repos.reportes.buscar_por_id(reporte_id)
        self._registrar(admin, AccionModeracion.RETIRAR_REPORTE, reporte_id, motivo)
        reporte.cambiar_estado(EstadoReporte.CERRADA)
        self.repos.reportes.guardar(reporte)
        self._resolver_denuncias(reporte_id)

    def bloquear_conversacion(self, admin: Usuario, conversacion_id: str, motivo: str) -> None:
        self._exigir_admin(admin)
        conversacion = self.repos.conversaciones.buscar_por_id(conversacion_id)
        self._registrar(admin, AccionModeracion.BLOQUEAR_CONVERSACION, conversacion_id, motivo)
        conversacion.bloqueada = True
        self.repos.conversaciones.guardar(conversacion)
        self._resolver_denuncias(conversacion_id)

    def suspender_usuario(self, admin: Usuario, usuario_id: str, motivo: str) -> None:
        self._sancionar(admin, usuario_id, motivo, AccionModeracion.SUSPENDER_CUENTA)

    def bloquear_usuario(self, admin: Usuario, usuario_id: str, motivo: str) -> None:
        self._sancionar(admin, usuario_id, motivo, AccionModeracion.BLOQUEAR_CUENTA)

    def descartar_denuncias(self, admin: Usuario, objetivo_id: str, motivo: str) -> None:
        self._exigir_admin(admin)
        self._registrar(admin, AccionModeracion.DESCARTAR_DENUNCIA, objetivo_id, motivo)
        self._resolver_denuncias(objetivo_id)

    def historial(self, admin: Usuario, objetivo_id: str) -> list[RegistroModeracion]:
        self._exigir_admin(admin)
        return self.repos.registros.de_objetivo(objetivo_id)

    # --- auxiliares
    def _sancionar(self, admin: Usuario, usuario_id: str, motivo: str, accion: AccionModeracion) -> None:
        self._exigir_admin(admin)
        if usuario_id == admin.id:
            raise DatosInvalidos("Un administrador no puede sancionarse a sí mismo")
        usuario = self.repos.usuarios.buscar_por_id(usuario_id)
        self._registrar(admin, accion, usuario_id, motivo)
        usuario.suspender() if accion == AccionModeracion.SUSPENDER_CUENTA else usuario.bloquear()
        self.repos.usuarios.guardar(usuario)
        self._resolver_denuncias(usuario_id)

    def _registrar(self, admin: Usuario, accion: AccionModeracion, objetivo_id: str, motivo: str) -> None:
        # el log se escribe ANTES de aplicar la sanción: sin motivo válido no hay sanción (RF16)
        self.repos.registros.guardar(RegistroModeracion(admin.id, accion, objetivo_id, motivo))

    def _resolver_denuncias(self, objetivo_id: str) -> None:
        for d in self.repos.denuncias.listar({"objetivo_id": objetivo_id, "resuelta": False}):
            d.resolver()
            self.repos.denuncias.guardar(d)

    @staticmethod
    def _exigir_admin(usuario: Usuario) -> None:
        if usuario.rol != Rol.ADMIN:
            raise NoAutorizado("Solo el administrador puede moderar")
