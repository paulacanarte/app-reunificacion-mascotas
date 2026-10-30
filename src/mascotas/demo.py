"""Demostración de punta a punta: pérdida → hallazgo → coincidencia → reunificación.

Uso:
    python -m mascotas.demo            # usa MongoDB (MONGO_URI, por defecto localhost)
    python -m mascotas.demo --memoria  # usa una base en memoria (mongomock), sin instalar MongoDB
"""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone

from .dominio import Caracteristicas, Especie, Fotografia, Rol, Tamano, TipoPunto, TipoReporte, Ubicacion
from .repositorios import Repositorios, crear_indices, obtener_base_datos
from .servicios import (ComparadorCaracteristicas, NotificadorConsola, ServicioCoincidencias,
                        ServicioMascotas, ServicioMensajeria, ServicioReportes, ServicioRefugios,
                        ServicioUsuarios)


def conectar(memoria: bool):
    if memoria:
        import mongomock
        return mongomock.MongoClient()["mascotas_demo"]
    db = obtener_base_datos()
    crear_indices(db)
    return db


def main() -> None:
    db = conectar("--memoria" in sys.argv)
    for nombre in db.list_collection_names():
        db.drop_collection(nombre)
    repos = Repositorios.desde_db(db)
    notificador = NotificadorConsola()
    usuarios = ServicioUsuarios(repos, modo_emergencia=True)
    mascotas = ServicioMascotas(repos)
    coincidencias = ServicioCoincidencias(repos, ComparadorCaracteristicas(), notificador)
    reportes = ServicioReportes(repos, coincidencias)
    chat = ServicioMensajeria(repos, notificador)
    refugios = ServicioRefugios(repos)

    print("\n1. Registro de usuarios (CU01)")
    ana = usuarios.registrar("Ana Gómez", "ana@correo.com", "Clave2026", "Clave2026", Rol.DUENO, "3001234567")
    luis = usuarios.registrar("Luis Pérez", "luis@correo.com", "Clave2026", "Clave2026", Rol.CIUDADANO, "3001234567")
    fundacion = usuarios.registrar("Fundación Huellas", "huellas@correo.com", "Clave2026", "Clave2026", Rol.FUNDACION, "3001234567")
    print(f"   {ana.nombre} ({ana.rol.value}), {luis.nombre} ({luis.rol.value}), {fundacion.nombre}")

    print("\n2. Refugio temporal (CU12)")
    refugio = refugios.registrar(fundacion, "Refugio temporal Dosquebradas", TipoPunto.REFUGIO,
                                 Ubicacion(4.8390, -75.6670, "Coliseo"), "300 000 0000", capacidad=40)
    print(f"   {refugio.nombre}: cupo {refugio.capacidad}")

    print("\n3. Registro de mascota (CU03 + CU04)")
    rasgos = Caracteristicas("café con blanco", Tamano.MEDIANO, "Mestizo / No sé", "corto", "collar rojo mancha blanca en el pecho")
    max_ = mascotas.registrar(ana, "Max", Especie.PERRO, "macho", rasgos, [Fotografia("max.jpg", 1_800_000)])
    print(f"   {max_.nombre} registrado con foto principal {max_.foto_principal().nombre_archivo}")

    ahora = datetime.now(timezone.utc)
    print("\n4. Reporte de pérdida (CU05)")
    perdida = reportes.reportar_perdida(ana, max_.id, Ubicacion(4.8133, -75.6961, "Barrio Cuba, Pereira"),
                                        ahora - timedelta(hours=6), "Salió corriendo durante el sismo")
    print(f"   Estado: {perdida.estado.value} · ubicación pública: {perdida.ubicacion_publica()}")

    print("\n5. Reporte de hallazgo (CU06) → coincidencia automática (CU08)")
    hallado = reportes.reportar_encontrada(
        luis, Especie.PERRO, Caracteristicas("café y blanco", Tamano.MEDIANO, "", "corto", "collar rojo mancha blanca pecho"),
        Ubicacion(4.8300, -75.6800, "Parque principal"), ahora - timedelta(hours=2),
        [Fotografia("encontrado.jpg", 950_000)], refugio_id=refugio.id)
    print(f"   Estado del hallazgo: {hallado.estado.value} · resguardado en: {hallado.lugar_resguardo}")
    for sug in coincidencias.sugerir_parecidos(hallado):
        print(f"   Luis ve un reporte parecido: {sug.similitud:.0%} a {sug.distancia_km} km")

    print("\n6. Búsqueda con filtros (CU07)")
    for r in reportes.buscar(desde=Ubicacion(4.8133, -75.6961), tipo=TipoReporte.ENCONTRADA, especie=Especie.PERRO):
        print(f"   {r.reporte.tipo().value} a {r.distancia_km} km · {r.reporte.caracteristicas.color}")

    print("\n7. Confirmación y chat (CU09 + CU10)")
    c = repos.coincidencias.listar()[0]
    print(f"   Similitud {c.similitud:.0%} a {c.distancia_km} km")
    conversacion = coincidencias.confirmar(c.id, ana)
    chat.enviar(conversacion.id, ana, "¡Es Max! ¿Puedo recogerlo hoy en el refugio?")
    chat.enviar(conversacion.id, luis, "Claro, está en el coliseo hasta las 6 p. m.")

    print("\n8. Entrega y reunificación (RN03)")
    coincidencias.registrar_entrega(c.id, ana)
    coincidencias.registrar_entrega(c.id, luis)
    final = repos.reportes.buscar_por_id(perdida.id)
    print(f"   Estado final del caso: {final.estado.value}")


if __name__ == "__main__":
    main()
