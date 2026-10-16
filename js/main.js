// =====================================================
// main.js — Conecta las clases con los HTML.
// El diseño (tarjetas, filas, ventanas) está escrito en los HTML dentro de
// <template>; aquí solo se rellenan los datos. Cada página se identifica
// con <body data-pagina="...">.
// =====================================================

// ---------- Funciones comunes ----------
function valor(id) { return document.getElementById(id).value; }
function poner(id, texto) { document.getElementById(id).textContent = texto; }
function pintar(id, html) { document.getElementById(id).innerHTML = html; }

function nombreArchivo(id) {
    const archivo = document.getElementById(id).files[0];
    return archivo ? archivo.name : "";
}

// Toma la plantilla del HTML y cambia cada {{clave}} por su dato
function llenar(plantilla, datos) {
    let html = document.getElementById(plantilla).innerHTML;
    for (const clave in datos) {
        const texto = String(datos[clave]).replace(/</g, "&lt;").replace(/"/g, "&quot;");
        html = html.replaceAll("{{" + clave + "}}", texto);
    }
    return html;
}

// Llena una lista desplegable (<select>) con elementos { valor, texto }
function llenarSelect(id, elementos) {
    const select = document.getElementById(id);
    while (select.options.length > 0) select.remove(0);   // vacía la lista
    for (const e of elementos) select.add(new Option(e.texto, e.valor));
}

// Ejecuta una acción de las clases; si lanza un Error lo muestra con alert
function ejecutar(accion, mensajeOk, redibujar) {
    try {
        accion();
        if (mensajeOk) alert(mensajeOk);
    } catch (error) {
        alert(error.message);
    }
    if (redibujar) redibujar();
}

function nombreVehiculo(id) {
    const v = buscarVehiculo(id);
    return v.marca + " " + v.modelo;
}

// ---------- Acceso (login) y registro ----------
const paginas = { CLIENTE: "conductor.html", PROPIETARIO: "propietario.html", ADMIN: "soporte.html" };
const titulos = { CLIENTE: "Perfil Conductor", PROPIETARIO: "Perfil Propietario", ADMIN: "Operaciones y Soporte" };
let rolLogin = "";
let alExito = null;
let esObligatorio = false;
let rolRegistro = "";

// La sesión se guarda en sessionStorage: termina al cerrar la pestaña
function sesionActiva() { return buscarUsuario(sessionStorage.getItem("p2p_sesion")); }

function cerrarSesion() {
    sessionStorage.removeItem("p2p_sesion");
    location.href = "index.html";
}

// Las páginas de perfil piden credenciales si no hay sesión del rol correcto
function exigirSesion(rol, alEntrar) {
    const u = sesionActiva();
    if (u && u.rol === rol && !u.estaBloqueado()) {
        usuarioActual = u;
        alEntrar();
    } else {
        mostrarLogin(rol, alEntrar, true);
    }
}

// Menú "Acceso Perfiles"
function abrirPerfil(rol) {
    const u = sesionActiva();
    if (u && u.rol === rol) location.href = paginas[rol];
    else mostrarLogin(rol, () => location.href = paginas[rol], false);
}

function mostrarLogin(rol, funcion, obligatorio) {
    rolLogin = rol;
    alExito = funcion;
    esObligatorio = obligatorio;
    document.getElementById("formLogin").reset();
    poner("loginTitulo", "Acceso: " + titulos[rol]);
    poner("loginMensaje", "");
    document.getElementById("dlgLogin").showModal();
}

function cancelarLogin() {
    document.getElementById("dlgLogin").close();
    if (esObligatorio) location.href = "index.html";   // sin credenciales no se ve el perfil
}

function intentarLogin(evento) {
    evento.preventDefault();
    const nombre = valor("loginUsuario").trim().toLowerCase();
    const u = usuarios.find(x => x.rol === rolLogin && (x.usuario === nombre || x.email === nombre));
    try {
        if (!u) throw new Error("Usuario o contraseña incorrectos");
        u.iniciarSesion(valor("loginClave"));   // lanza Error si la clave es incorrecta o está bloqueada
    } catch (error) {
        poner("loginMensaje", error.message);
        return;
    }
    sessionStorage.setItem("p2p_sesion", u.id);
    document.getElementById("dlgLogin").close();
    alExito();
}

function abrirRegistro(rol) {
    rolRegistro = rol;
    document.getElementById("formRegistro").reset();
    document.getElementById("formRegistro").dataset.rol = rol;   // el CSS muestra los campos de cada rol
    poner("regMensaje", "");
    document.getElementById("dlgRegistro").showModal();
}

function enviarRegistro(evento) {
    evento.preventDefault();
    try {
        if (valor("regClave") !== valor("regClave2")) throw new Error("Las contraseñas no coinciden");
        if (!nombreArchivo("regCedula")) throw new Error("Adjunte el documento de identidad");
        const datos = { nombre: valor("regNombre").trim(), documentoIdentidad: valor("regDocumento").trim(), email: valor("regCorreo"), _contrasena: valor("regClave") };
        let nuevo;
        if (rolRegistro === "CLIENTE") {
            if (!nombreArchivo("regLicenciaArchivo")) throw new Error("Adjunte la licencia de conducción");
            datos.licenciaConducir = valor("regLicencia");
            datos.contactoEmergencia = valor("regContacto");
            nuevo = new Cliente(datos);
            nuevo.registrar();
            nuevo.cargarDocumento("Licencia", nombreArchivo("regLicenciaArchivo"));
        } else {
            datos.tarjetaPropiedad = valor("regTarjeta");
            nuevo = new Propietario(datos);
            nuevo.registrar();
        }
        nuevo.cargarDocumento("Identidad", nombreArchivo("regCedula"));
    } catch (error) {
        poner("regMensaje", error.message);
        return;
    }
    document.getElementById("dlgRegistro").close();
    alert("Cuenta creada. Sus documentos quedan pendientes de verificación por Operaciones y Soporte.\nYa puede ingresar desde \"Acceso Perfiles\" con su correo y contraseña.");
}

// Muestra el nombre de quien tiene sesión y el botón para cerrarla
function mostrarSesion() {
    const u = sesionActiva();
    if (u) {
        poner("nombreSesion", u.nombre);
        document.getElementById("btnCerrarSesion").hidden = false;
    }
}

// =====================================================
// PÁGINA: INDEX (catálogo)
// =====================================================
function iniciarIndex() {
    mostrarCatalogo(buscarVehiculosDisponibles({}));
}

function buscar() {
    const categoria = valor("buscarCategoria").split("|");   // ej: "AUTO|Lujo"
    mostrarCatalogo(buscarVehiculosDisponibles({
        ubicacion: valor("buscarUbicacion"), tipo: categoria[0], subcategoria: categoria[1],
        inicio: valor("buscarInicio"), fin: valor("buscarFin")
    }));
}

// La tarjeta (con su imagen) está en la plantilla "tarjeta" de index.html
function mostrarCatalogo(lista) {
    let html = "";
    for (const v of lista) {
        const porVencer = v.diasParaVencerPeritaje() <= 30;
        html += llenar("tarjeta", {
            id: v.id, placa: v.placa, nombre: v.marca + " " + v.modelo + " " + v.anio,
            precio: dinero(v.tarifaDiaria), ubicacion: v.ubicacion, categoria: v.tipo + " " + v.subcategoria,
            estado: v.estado, peritaje: porVencer ? "Peritaje por vencer" : "Peritaje al día",
            peritajeEstado: porVencer ? "PorVencer" : "AlDia",
            inicio: valor("buscarInicio"), fin: valor("buscarFin")
        });
    }
    pintar("listaVehiculos", html);
}

// =====================================================
// PÁGINA: CONDUCTOR
// =====================================================
function iniciarConductor() { exigirSesion("CLIENTE", mostrarConductor); }

function mostrarConductor() {
    const lista = [{ valor: "", texto: "Seleccione un vehículo" }];
    for (const v of buscarVehiculosDisponibles({})) {
        lista.push({ valor: v.id, texto: nombreVehiculo(v.id) + " (" + v.placa + ") - " + dinero(v.tarifaDiaria) + "/día" });
    }
    llenarSelect("selVehiculo", lista);

    // Datos que llegan desde el catálogo (index.html)
    const params = new URLSearchParams(location.search);
    document.getElementById("selVehiculo").value = params.get("vehiculo") || "";
    document.getElementById("fechaInicio").value = params.get("inicio") || "";
    document.getElementById("fechaFin").value = params.get("fin") || "";

    poner("perfilNombre", usuarioActual.nombre);
    poner("perfilCorreo", usuarioActual.email);
    poner("perfilLicencia", usuarioActual.licenciaConducir);
    poner("perfilEstado", "Estado de cuenta: Activo (" + usuarioActual.intentosFallidos + "/3 intentos fallidos)");
    dibujarHistorial();
    actualizarResumen();
}

// Desglose antes de pagar (usa las mismas funciones de Vehiculo)
function actualizarResumen() {
    const vehiculo = buscarVehiculo(valor("selVehiculo"));
    const inicio = valor("fechaInicio");
    const fin = valor("fechaFin");
    let dias = 0;
    let t = { subtotalAlquiler: 0, totalSeguro: 0, comisionPlataforma: 0, montoTotal: 0, depositoGarantia: 0 };
    if (vehiculo && inicio && fin && fin > inicio) {
        dias = Math.ceil((new Date(fin) - new Date(inicio)) / 86400000);
        t = vehiculo.calcularTotalReserva(dias);
    }
    poner("rDias", dias);
    poner("rTarifa", dinero(t.subtotalAlquiler));
    poner("rSeguro", dinero(t.totalSeguro));
    poner("rComision", dinero(t.comisionPlataforma));
    poner("rTotal", dinero(t.montoTotal));
    poner("rDeposito", dinero(t.depositoGarantia));
}

function confirmarReserva() {
    ejecutar(function () {
        const reserva = usuarioActual.solicitarReserva(valor("selVehiculo"), valor("fechaInicio"), valor("fechaFin"),
            document.getElementById("aceptaClausula").checked, Number(valor("cupoTarjeta")));
        document.getElementById("aceptaClausula").checked = false;
        alert("Reserva " + reserva.id + " solicitada.\nCódigo de transacción: " + reserva.pago.codigoTransaccion +
            "\nPóliza: " + reserva.poliza.numero + "\nQueda pendiente de aprobación del propietario.");
    }, "", dibujarHistorial);
}

function dibujarHistorial() {
    let html = "";
    for (const r of reservas.filter(x => x.clienteId === usuarioActual.id).reverse()) {
        html += llenar("filaReserva", {
            id: r.id, vehiculo: nombreVehiculo(r.vehiculoId), fechas: r.fechaInicio + " a " + r.fechaFin,
            total: dinero(r.pago.montoTotal), estado: r.estado,
            calificada: r.resenas.some(x => x.autorRol === "CLIENTE") ? "si" : "no"
        });
    }
    pintar("historialReservas", html);
}

const fotosSimuladas = ["foto1.jpg", "foto2.jpg", "foto3.jpg", "foto4.jpg"];

function hacerCheckIn(id) {
    ejecutar(() => buscarReserva(id).registrarCheckIn(fotosSimuladas), "Check-in registrado (4 fotos simuladas)", dibujarHistorial);
}

function hacerCheckOut(id) {
    ejecutar(() => buscarReserva(id).registrarCheckOut(fotosSimuladas), "Check-out registrado. El propietario debe validar las fotos", dibujarHistorial);
}

function reportarSOS(id) {
    const tipo = prompt("Tipo de evento (ej: Varado, Choque, Falla mecánica):");
    if (tipo) ejecutar(() => usuarioActual.reportarIncidente(id, tipo, 6.2442, -75.5812), "Incidente reportado. Se generó el expediente digital", dibujarHistorial);
}

function calificar(id) {
    const estrellas = Number(prompt("Calificación del propietario (1 a 5):"));
    const comentario = prompt("Comentario:") || "";
    ejecutar(() => usuarioActual.calificarPropietario(id, estrellas, comentario), "Gracias por su calificación", dibujarHistorial);
}

// =====================================================
// PÁGINA: PROPIETARIO
// =====================================================
function iniciarPropietario() { exigirSesion("PROPIETARIO", mostrarPropietario); }

function mostrarPropietario() {
    const m = usuarioActual.calcularMetricas();
    poner("gananciasAcumuladas", dinero(m.ganancias));
    poner("vehiculosPublicados", m.activos + " / " + m.total);
    poner("detalleVehiculos", m.sinPeritaje + " sin peritaje vigente");
    poner("calificacionPromedio", m.promedio + " ★");
    poner("detalleCalificacion", "Basado en " + m.resenas + " rentas");

    const lista = [];
    let filasVehiculos = "";
    for (const v of usuarioActual.misVehiculos()) {
        const peritaje = v.peritajeVigente();
        lista.push({ valor: v.id, texto: v.placa + " (" + nombreVehiculo(v.id) + ")" });
        filasVehiculos += llenar("filaVehiculo", {
            placa: v.placa, vehiculo: nombreVehiculo(v.id), estado: v.estado,
            peritaje: peritaje ? "Vigente hasta " + peritaje.fechaVencimiento : "Sin peritaje vigente",
            tarifa: dinero(v.tarifaDiaria) + " (recomendado " + dinero(v.obtenerPrecioRecomendado()) + ")"
        });
    }
    llenarSelect("selDocVehiculo", lista);
    llenarSelect("selBloqueoVehiculo", lista);
    pintar("tablaVehiculos", filasVehiculos);

    let filasReservas = "";
    for (const r of usuarioActual.misReservas().reverse()) {
        filasReservas += llenar("filaReservaProp", {
            id: r.id, vehiculo: nombreVehiculo(r.vehiculoId), fechas: r.fechaInicio + " a " + r.fechaFin,
            ingreso: dinero(r.pago.subtotalAlquiler), estado: r.estado
        });
    }
    pintar("tablaReservas", filasReservas);
}

function responderReserva(id, aprobar) {
    ejecutar(() => usuarioActual.aprobarReserva(id, aprobar), aprobar ? "Reserva aprobada" : "Reserva rechazada. Se reembolsó al cliente", mostrarPropietario);
}

function revisarFotosEntrega(id, aprueba) {
    ejecutar(() => usuarioActual.validarFotos(id, aprueba), aprueba ? "Reserva finalizada. Depósito liberado" : "Reserva en disputa. Soporte revisará el caso", mostrarPropietario);
}

function gestionarDisponibilidad() {
    ejecutar(() => usuarioActual.gestionarCalendario(valor("selBloqueoVehiculo"), valor("bloqueoInicio"), valor("bloqueoFin")),
        "Fechas bloqueadas en el calendario", mostrarPropietario);
}

function enviarPublicacion(evento) {
    evento.preventDefault();
    const datos = {
        tipo: valor("pubTipo"), placa: valor("pubPlaca"), marca: valor("pubMarca"), modelo: valor("pubModelo"),
        anio: Number(valor("pubAnio")), ubicacion: valor("pubUbicacion"), proposito: valor("pubProposito"),
        subcategoria: valor("pubSubcategoria"), cilindraje: Number(valor("pubCilindraje")),
        tarifaDiaria: Number(valor("pubTarifa")), valorComercial: Number(valor("pubValor")),
        archivoPeritaje: nombreArchivo("pubPeritaje"), archivoTarjeta: nombreArchivo("pubTarjeta")
    };
    ejecutar(function () {
        usuarioActual.publicarVehiculo(datos);
        document.getElementById("formPublicar").reset();
    }, "Vehículo enviado. Queda pendiente de aprobación de Soporte", mostrarPropietario);
}

function enviarDocumentos(evento) {
    evento.preventDefault();
    ejecutar(() => usuarioActual.cargarDocumentosAuto(valor("selDocVehiculo"), Number(valor("docValor")), nombreArchivo("docPeritaje")),
        "Documentos cargados exitosamente", mostrarPropietario);
}

// =====================================================
// PÁGINA: SOPORTE (Administrador)
// =====================================================
function iniciarSoporte() { exigirSesion("ADMIN", mostrarSoporte); }

function nombreTitular(doc) {
    const u = buscarUsuario(doc.titularId);
    if (u) return u.nombre;
    const v = buscarVehiculo(doc.titularId);
    return v.marca + " " + v.modelo + " (" + v.placa + ")";
}

function mostrarSoporte() {
    let filasDocs = "";
    let filasIncidentes = "";
    let filasContratos = "";
    let filasCuentas = "";
    let porEscalar = 0;

    for (const d of documentos.slice().reverse()) {
        filasDocs += llenar("filaDocumento", { id: d.id, titular: nombreTitular(d), tipo: d.tipo, estado: d.estado, motivo: d.motivo });
    }
    for (const r of reservas) {
        for (const i of r.incidentes) {
            if (i.estadoExpediente === "Generado") porEscalar++;
            filasIncidentes += llenar("filaIncidente", {
                id: i.id, reserva: r.id, evento: i.tipoEvento + " (" + i.reportadoPor + ")", expediente: i.estadoExpediente
            });
        }
        if (r.bloqueaFechas() && r.estado !== "Inmovilizada") {
            filasContratos += llenar("filaContrato", { id: r.id, vehiculo: nombreVehiculo(r.vehiculoId), cliente: buscarUsuario(r.clienteId).nombre, estado: r.estado });
        }
    }
    for (const u of usuarios) {
        const bloqueada = u.estaBloqueado();
        filasCuentas += llenar("filaCuenta", {
            id: u.id, nombre: u.nombre, usuario: u.usuario, perfil: titulos[u.rol],
            estado: bloqueada ? "Bloqueada" : "Activa",
            detalle: bloqueada ? "hasta " + new Date(u.bloqueadoHasta).toLocaleString("es-CO") : "",
            bloqueada: bloqueada ? "si" : "no"
        });
    }

    pintar("tablaDocumentos", filasDocs);
    pintar("tablaIncidentes", filasIncidentes);
    pintar("tablaContratos", filasContratos);
    pintar("tablaCuentas", filasCuentas);
    document.getElementById("alertaIncidentes").hidden = porEscalar === 0;
    poner("textoAlerta", porEscalar + " incidente(s) reportado(s) esperan ser escalados a la aseguradora.");
}

function aprobarDoc(id) {
    ejecutar(() => usuarioActual.verificarDocumentos(id, true, ""), "Documento aprobado", mostrarSoporte);
}

function rechazarDoc(id) {
    const motivo = prompt("Motivo del rechazo:");
    if (motivo) ejecutar(() => usuarioActual.verificarDocumentos(id, false, motivo), "Documento rechazado", mostrarSoporte);
}

function escalarIncidente(id) {
    ejecutar(() => usuarioActual.escalarSiniestro(id), "Expediente escalado a la aseguradora. Depósito congelado", mostrarSoporte);
}

function inmovilizar(id) {
    const motivo = prompt("Motivo (ej: Robo, Incomunicación, Accidente grave):");
    if (motivo) ejecutar(() => usuarioActual.inmovilizarContrato(id, motivo), "Contrato inmovilizado y escalado a aseguradora y autoridades", mostrarSoporte);
}

function desbloquear(id) {
    ejecutar(() => usuarioActual.desbloquearUsuario(id), "Cuenta desbloqueada", mostrarSoporte);
}

function revisarVigencias() {
    alert(usuarioActual.moderarCatalogo() + " anuncio(s) actualizado(s) por vencimiento de peritaje");
    mostrarSoporte();
}

// =====================================================
// ARRANQUE: se ejecuta al cargar cada página
// =====================================================
cargarDatos();
mostrarSesion();
const paginaActual = document.body.dataset.pagina;
if (paginaActual === "index") iniciarIndex();
if (paginaActual === "conductor") iniciarConductor();
if (paginaActual === "propietario") iniciarPropietario();
if (paginaActual === "soporte") iniciarSoporte();
