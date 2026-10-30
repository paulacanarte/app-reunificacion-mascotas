"""Pruebas de las historias de trabajo del role playing (C5-25)."""
from datetime import datetime, timedelta, timezone

import pytest

from mascotas.dominio import (Caracteristicas, EstadoCuenta, EstadoReporte, Especie, Fotografia,
                              NoAutorizado, DatosInvalidos, Rol, Tamano, Ubicacion)
from mascotas.servicios import ServicioModeracion

HACE_UNA_HORA = datetime.now(timezone.utc) - timedelta(hours=1)
PEREIRA = Ubicacion(4.8133, -75.6961)
CERCA = Ubicacion(4.8300, -75.6800)


def test_ingreso_biometrico_solo_en_dispositivo_registrado(app, dueno):
    with pytest.raises(NoAutorizado):
        app.usuarios.iniciar_sesion_biometrica("ana@correo.com", "telefono-ana")
    app.usuarios.habilitar_biometria(dueno, "telefono-ana")
    assert app.usuarios.iniciar_sesion_biometrica("ana@correo.com", "telefono-ana").id == dueno.id
    with pytest.raises(NoAutorizado):
        app.usuarios.iniciar_sesion_biometrica("ana@correo.com", "otro-telefono")


def test_reporte_rapido_sin_registro_previo(app, dueno, rasgos, foto):
    reporte = app.reportes.reportar_perdida_rapida(dueno, "Max", Especie.PERRO, "macho", rasgos, [foto],
                                                   PEREIRA, HACE_UNA_HORA, "Se escapó con el sismo")
    assert reporte.estado == EstadoReporte.PERDIDA
    assert len(app.mascotas.de_dueno(dueno)) == 1


def test_quien_encuentra_ve_reportes_parecidos(app, dueno, ciudadano, rasgos, foto):
    app.reportes.reportar_perdida_rapida(dueno, "Max", Especie.PERRO, "macho", rasgos, [foto], PEREIRA, HACE_UNA_HORA)
    otro = Caracteristicas("negro", Tamano.GRANDE, "Pastor", "largo", "cojea")
    app.reportes.reportar_perdida_rapida(dueno, "Rocky", Especie.PERRO, "macho", otro, [foto], PEREIRA, HACE_UNA_HORA)
    hallazgo = app.reportes.reportar_encontrada(ciudadano, Especie.PERRO, rasgos, CERCA, HACE_UNA_HORA, [foto])
    sugerencias = app.coincidencias.sugerir_parecidos(hallazgo)
    assert len(sugerencias) == 1 and sugerencias[0].similitud >= 0.7


def test_denuncias_ordenadas_por_urgencia(app, repos, admin, dueno, ciudadano):
    mod = ServicioModeracion(repos)
    mod.denunciar(dueno, "reporte-spam", "SPAM")
    mod.denunciar(dueno, "reporte-maltrato", "MALTRATO_ANIMAL")
    mod.denunciar(ciudadano, "reporte-falso", "REPORTE_FALSO")
    mod.denunciar(dueno, "reporte-falso", "FRAUDE")
    with pytest.raises(NoAutorizado):
        mod.denuncias_por_urgencia(dueno)
    orden = [d.objetivo_id for d in mod.denuncias_por_urgencia(admin)]
    assert orden == ["reporte-falso", "reporte-maltrato", "reporte-spam"]


def test_bloqueo_con_motivo_queda_en_log(app, repos, admin, ciudadano):
    mod = ServicioModeracion(repos)
    mod.denunciar(admin, ciudadano.id, "LENGUAJE_OFENSIVO")
    with pytest.raises(DatosInvalidos):
        mod.bloquear_usuario(admin, ciudadano.id, "malo")  # motivo muy corto: no se sanciona
    assert repos.usuarios.buscar_por_id(ciudadano.id).estado == EstadoCuenta.ACTIVA
    mod.bloquear_usuario(admin, ciudadano.id, "Insultos repetidos en el chat a tres dueños")
    assert repos.usuarios.buscar_por_id(ciudadano.id).estado == EstadoCuenta.BLOQUEADA
    log = mod.historial(admin, ciudadano.id)
    assert len(log) == 1 and log[0].admin_id == admin.id and "Insultos" in log[0].motivo
    assert mod.denuncias_por_urgencia(admin) == []
    with pytest.raises(NoAutorizado):
        app.usuarios.iniciar_sesion("luis@correo.com", "Clave2026")


def test_retirar_reporte_falso(app, repos, admin, ciudadano, rasgos, foto):
    mod = ServicioModeracion(repos)
    falso = app.reportes.reportar_encontrada(ciudadano, Especie.PERRO, rasgos, CERCA, HACE_UNA_HORA, [foto])
    mod.retirar_reporte(admin, falso.id, "La foto es de internet, no es un hallazgo real")
    assert repos.reportes.buscar_por_id(falso.id).estado == EstadoReporte.CERRADA
