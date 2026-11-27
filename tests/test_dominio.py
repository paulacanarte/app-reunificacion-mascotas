from datetime import datetime, timedelta, timezone

import pytest

from mascotas.dominio import (Coincidencia, Conversacion, DatosInvalidos, EstadoReporte, Especie,
                              Fotografia, Mascota, NoAutorizado, Refugio, ReporteEncontrada,
                              ReportePerdida, Rol, TipoPunto, TransicionInvalida, Ubicacion, Usuario)

PEREIRA = Ubicacion(4.8133, -75.6961)
DOSQUEBRADAS = Ubicacion(4.8390, -75.6670)


def test_usuario_guarda_hash_y_verifica_contrasena():
    u = Usuario.crear("Ana Gómez", "ANA@Correo.com ", "Clave2026", Rol.DUENO, "300 123 4567")
    assert u.correo == "ana@correo.com"
    assert u.hash_contrasena != "Clave2026"
    assert u.verificar_contrasena("Clave2026") and not u.verificar_contrasena("otra")
    assert u.telefono == "3001234567" and "300" not in repr(u)  # el teléfono no se expone


@pytest.mark.parametrize("correo,clave", [("sin-arroba", "Clave2026"), ("a@b.com", "corta1"), ("a@b.com", "sinnumeros")])
def test_usuario_rechaza_datos_invalidos(correo, clave):
    with pytest.raises(DatosInvalidos):
        Usuario.crear("Ana Gómez", correo, clave, Rol.DUENO, "3001234567")


def test_no_se_puede_registrar_como_admin():
    with pytest.raises(DatosInvalidos):
        Usuario.crear("Ana Gómez", "a@b.com", "Clave2026", Rol.ADMIN, "3001234567")


def test_distancia_pereira_dosquebradas():
    assert 3 < PEREIRA.distancia_km(DOSQUEBRADAS) < 5


def test_ubicacion_aproximada_queda_dentro_del_radio():
    aprox = PEREIRA.aproximar(500, semilla=7)
    assert aprox != PEREIRA
    assert PEREIRA.distancia_km(aprox) <= 0.5


@pytest.mark.parametrize("nombre,tamano", [("foto.gif", 100), ("foto.jpg", 11 * 1024 * 1024), ("foto", 100)])
def test_foto_invalida(nombre, tamano):
    with pytest.raises(DatosInvalidos):
        Fotografia(nombre, tamano).validar()


def test_mascota_requiere_foto_y_maximo_cinco(rasgos):
    m = Mascota("d1", "Max", Especie.PERRO, "MACHO", rasgos)
    with pytest.raises(DatosInvalidos):
        m.validar()
    for i in range(5):
        m.agregar_foto(Fotografia(f"f{i}.png", 1000))
    assert m.foto_principal().nombre_archivo == "f0.png"
    with pytest.raises(DatosInvalidos):
        m.agregar_foto(Fotografia("f5.png", 1000))


def _perdida(rasgos, foto):
    return ReportePerdida(usuario_id="d1", especie=Especie.PERRO, caracteristicas=rasgos, ubicacion=PEREIRA,
                          fecha_evento=datetime.now(timezone.utc) - timedelta(hours=1), fotos=[foto], mascota_id="m1")


def test_maquina_de_estados_del_reporte(rasgos, foto):
    r = _perdida(rasgos, foto)
    assert r.estado == EstadoReporte.PERDIDA
    with pytest.raises(TransicionInvalida):
        r.cambiar_estado(EstadoReporte.REUNIFICADA)
    with pytest.raises(TransicionInvalida):
        r.cambiar_estado(EstadoReporte.ENCONTRADA)
    for estado in (EstadoReporte.POSIBLE_COINCIDENCIA, EstadoReporte.EN_VERIFICACION,
                   EstadoReporte.REUNIFICADA, EstadoReporte.CERRADA):
        r.cambiar_estado(estado)
    assert not r.esta_abierto


def test_reporte_no_acepta_fecha_futura(rasgos, foto):
    with pytest.raises(DatosInvalidos):
        ReportePerdida(usuario_id="d1", especie=Especie.PERRO, caracteristicas=rasgos, ubicacion=PEREIRA,
                       fecha_evento=datetime.now(timezone.utc) + timedelta(days=1), mascota_id="m1")


def test_hallazgo_requiere_foto(rasgos):
    with pytest.raises(DatosInvalidos):
        ReporteEncontrada(usuario_id="c1", especie=Especie.PERRO, caracteristicas=rasgos, ubicacion=PEREIRA,
                          fecha_evento=datetime.now(timezone.utc))


def test_regla_de_relevancia_rn02():
    assert Coincidencia.es_relevante(0.70, 19.9)
    assert not Coincidencia.es_relevante(0.69, 1)
    assert not Coincidencia.es_relevante(0.9, 20)


def test_entrega_requiere_ambas_partes():
    c = Coincidencia("p1", "e1", 0.8, 3)
    with pytest.raises(TransicionInvalida):
        c.registrar_entrega("d1")
    c.confirmar()
    assert c.registrar_entrega("d1") is False
    assert c.registrar_entrega("c1") is True


def test_conversacion_solo_entre_participantes():
    conv = Conversacion(["d1", "c1"])
    conv.agregar_mensaje("d1", "Hola")
    with pytest.raises(NoAutorizado):
        conv.agregar_mensaje("intruso", "Hola")
    conv.bloqueada = True
    with pytest.raises(NoAutorizado):
        conv.agregar_mensaje("c1", "Hola")


def test_refugio_controla_cupo():
    r = Refugio("Coliseo", TipoPunto.REFUGIO, DOSQUEBRADAS, "300", capacidad=1)
    r.registrar_ingreso()
    assert not r.tiene_cupo()
    with pytest.raises(DatosInvalidos):
        r.registrar_ingreso()


def test_telefono_invalido():
    with pytest.raises(DatosInvalidos):
        Usuario.crear("Ana Gómez", "a@b.com", "Clave2026", Rol.DUENO, "abc")


def test_registro_de_moderacion_exige_motivo():
    from mascotas.dominio import AccionModeracion, RegistroModeracion
    with pytest.raises(DatosInvalidos):
        RegistroModeracion("admin", AccionModeracion.BLOQUEAR_CUENTA, "u1", "spam")
