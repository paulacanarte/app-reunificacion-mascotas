from datetime import datetime, timedelta, timezone

import pytest

from mascotas.dominio import (Caracteristicas, DatosInvalidos, EstadoReporte, Especie, Fotografia,
                              NoAutorizado, Rol, Tamano, TipoPunto, TipoReporte, Ubicacion)

HACE_UNA_HORA = datetime.now(timezone.utc) - timedelta(hours=1)
PEREIRA = Ubicacion(4.8133, -75.6961)
CERCA = Ubicacion(4.8300, -75.6800)
LEJOS = Ubicacion(6.2442, -75.5812)  # Medellín


def test_registro_rechaza_correo_duplicado(app, dueno):
    with pytest.raises(DatosInvalidos):
        app.usuarios.registrar("Otra", "ana@correo.com", "Clave2026", "Clave2026", Rol.DUENO, "3001234567")


def test_iniciar_sesion(app, dueno):
    assert app.usuarios.iniciar_sesion("ana@correo.com", "Clave2026").id == dueno.id
    with pytest.raises(NoAutorizado):
        app.usuarios.iniciar_sesion("ana@correo.com", "mala")


def test_solo_duenos_registran_mascotas(app, ciudadano, rasgos, foto):
    with pytest.raises(NoAutorizado):
        app.mascotas.registrar(ciudadano, "Max", Especie.PERRO, "macho", rasgos, [foto])


def test_mascota_duplicada_requiere_confirmacion(app, dueno, rasgos, foto):
    app.mascotas.registrar(dueno, "Max", Especie.PERRO, "macho", rasgos, [foto])
    with pytest.raises(DatosInvalidos):
        app.mascotas.registrar(dueno, "max", Especie.PERRO, "macho", rasgos, [Fotografia("b.jpg", 10)])
    app.mascotas.registrar(dueno, "max", Especie.PERRO, "macho", rasgos, [Fotografia("b.jpg", 10)], forzar=True)
    assert len(app.mascotas.de_dueno(dueno)) == 2


def _flujo_hasta_coincidencia(app, dueno, ciudadano, rasgos, foto, ubicacion_hallazgo=CERCA):
    max_ = app.mascotas.registrar(dueno, "Max", Especie.PERRO, "macho", rasgos, [foto])
    perdida = app.reportes.reportar_perdida(dueno, max_.id, PEREIRA, HACE_UNA_HORA)
    hallado = app.reportes.reportar_encontrada(ciudadano, Especie.PERRO, rasgos, ubicacion_hallazgo,
                                               HACE_UNA_HORA, [Fotografia("h.jpg", 10)])
    return perdida, hallado


def test_hallazgo_similar_y_cercano_genera_coincidencia(app, dueno, ciudadano, rasgos, foto):
    perdida, hallado = _flujo_hasta_coincidencia(app, dueno, ciudadano, rasgos, foto)
    assert hallado.estado == EstadoReporte.POSIBLE_COINCIDENCIA
    assert app.repos.reportes.buscar_por_id(perdida.id).estado == EstadoReporte.POSIBLE_COINCIDENCIA
    assert app.notificador.enviadas[-1][0] == dueno.id


def test_hallazgo_lejano_no_genera_coincidencia(app, dueno, ciudadano, rasgos, foto):
    _, hallado = _flujo_hasta_coincidencia(app, dueno, ciudadano, rasgos, foto, LEJOS)
    assert hallado.estado == EstadoReporte.ENCONTRADA
    assert app.repos.coincidencias.listar() == []


def test_hallazgo_de_otra_especie_no_coincide(app, dueno, ciudadano, rasgos, foto):
    max_ = app.mascotas.registrar(dueno, "Max", Especie.PERRO, "macho", rasgos, [foto])
    app.reportes.reportar_perdida(dueno, max_.id, PEREIRA, HACE_UNA_HORA)
    app.reportes.reportar_encontrada(ciudadano, Especie.GATO, rasgos, CERCA, HACE_UNA_HORA, [foto])
    assert app.repos.coincidencias.listar() == []


def test_no_permite_dos_reportes_abiertos(app, dueno, rasgos, foto):
    max_ = app.mascotas.registrar(dueno, "Max", Especie.PERRO, "macho", rasgos, [foto])
    app.reportes.reportar_perdida(dueno, max_.id, PEREIRA, HACE_UNA_HORA)
    with pytest.raises(DatosInvalidos):
        app.reportes.reportar_perdida(dueno, max_.id, PEREIRA, HACE_UNA_HORA)


def test_flujo_completo_hasta_reunificacion(app, dueno, ciudadano, rasgos, foto):
    perdida, _ = _flujo_hasta_coincidencia(app, dueno, ciudadano, rasgos, foto)
    c = app.repos.coincidencias.listar()[0]
    with pytest.raises(NoAutorizado):
        app.coincidencias.confirmar(c.id, ciudadano)
    conversacion = app.coincidencias.confirmar(c.id, dueno)
    app.chat.enviar(conversacion.id, ciudadano, "Lo tengo conmigo")
    assert app.coincidencias.registrar_entrega(c.id, dueno) is False
    assert app.coincidencias.registrar_entrega(c.id, ciudadano) is True
    assert app.repos.reportes.buscar_por_id(perdida.id).estado == EstadoReporte.REUNIFICADA


def test_rechazo_devuelve_estados_iniciales(app, dueno, ciudadano, rasgos, foto):
    perdida, hallado = _flujo_hasta_coincidencia(app, dueno, ciudadano, rasgos, foto)
    c = app.repos.coincidencias.listar()[0]
    app.coincidencias.rechazar(c.id, dueno)
    assert app.repos.reportes.buscar_por_id(perdida.id).estado == EstadoReporte.PERDIDA
    assert app.repos.reportes.buscar_por_id(hallado.id).estado == EstadoReporte.ENCONTRADA


def test_busqueda_ordena_por_cercania_y_oculta_ubicacion(app, ciudadano, rasgos, foto):
    for lugar in (LEJOS, CERCA):
        app.reportes.reportar_encontrada(ciudadano, Especie.PERRO, rasgos, lugar, HACE_UNA_HORA, [foto])
    resultados = app.reportes.buscar(desde=PEREIRA, tipo=TipoReporte.ENCONTRADA, color="café")
    assert [r.distancia_km < 5 for r in resultados] == [True, False]
    assert resultados[0].ubicacion_publica != resultados[0].reporte.ubicacion
    assert len(app.reportes.buscar(desde=PEREIRA, radio_km=20)) == 1


def test_refugio_recibe_animal_y_aparece_en_mapa(app, ciudadano, rasgos, foto):
    fundacion = app.usuarios.registrar("Huellas", "h@correo.com", "Clave2026", "Clave2026", Rol.FUNDACION, "3001234567")
    with pytest.raises(NoAutorizado):
        app.refugios.registrar(ciudadano, "X", TipoPunto.REFUGIO, CERCA, "300", 5)
    refugio = app.refugios.registrar(fundacion, "Coliseo", TipoPunto.REFUGIO, CERCA, "300", 5)
    app.reportes.reportar_encontrada(ciudadano, Especie.PERRO, rasgos, CERCA, HACE_UNA_HORA, [foto],
                                     refugio_id=refugio.id)
    assert app.repos.refugios.buscar_por_id(refugio.id).ocupacion == 1
    mapa = app.refugios.puntos_del_mapa()
    assert len(mapa["refugios"]) == 1 and len(mapa["encontradas"]) == 1


def test_comparador_da_cero_si_cambia_la_especie(app, rasgos, foto):
    from mascotas.servicios import ComparadorCaracteristicas
    from mascotas.dominio import ReporteEncontrada, ReportePerdida
    p = ReportePerdida(usuario_id="d", especie=Especie.PERRO, caracteristicas=rasgos, ubicacion=PEREIRA,
                       fecha_evento=HACE_UNA_HORA, mascota_id="m")
    e = ReporteEncontrada(usuario_id="c", especie=Especie.GATO, caracteristicas=rasgos, ubicacion=CERCA,
                          fecha_evento=HACE_UNA_HORA, fotos=[foto])
    assert ComparadorCaracteristicas().comparar(p, e) == 0.0
    otros = Caracteristicas("negro", Tamano.GRANDE, "Pastor", "largo", "cojea")
    e2 = ReporteEncontrada(usuario_id="c", especie=Especie.PERRO, caracteristicas=otros, ubicacion=CERCA,
                           fecha_evento=HACE_UNA_HORA, fotos=[foto])
    assert ComparadorCaracteristicas().comparar(p, e2) < 0.7
