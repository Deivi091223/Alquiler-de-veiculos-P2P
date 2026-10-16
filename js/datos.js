// =====================================================
// datos.js — Variables globales, guardado y datos de ejemplo
// =====================================================
let usuarios = [];
let vehiculos = [];
let reservas = [];
let documentos = [];   // objetos simples: { id, tipo, titularId, referenciaId, archivo, estado, motivo }
let usuarioActual = null;
let contadorId = 1;

function nuevoId(prefijo) {
    contadorId++;
    return prefijo + "-" + contadorId;
}

function buscarUsuario(id) { return usuarios.find(u => u.id === id); }
function buscarVehiculo(id) { return vehiculos.find(v => v.id === id); }
function buscarReserva(id) { return reservas.find(r => r.id === id); }

function hoy() { return new Date().toISOString().slice(0, 10); }
function dinero(n) { return "$" + Math.round(n).toLocaleString("es-CO"); }

// Dos rangos de fechas se solapan si cada uno empieza antes de que el otro termine
function seSolapan(inicio1, fin1, inicio2, fin2) {
    return new Date(inicio1) < new Date(fin2) && new Date(inicio2) < new Date(fin1);
}

function crearDocumento(tipo, titularId, archivo, referenciaId, estado) {
    documentos.push({
        id: nuevoId("DOC"), tipo: tipo, titularId: titularId, referenciaId: referenciaId,
        archivo: archivo, estado: estado || "Pendiente", motivo: ""
    });
}

// ---------- Guardar y cargar (localStorage) ----------
function guardarDatos() {
    const datos = { usuarios: usuarios, vehiculos: vehiculos, reservas: reservas, documentos: documentos, contadorId: contadorId };
    localStorage.setItem("p2p_datos_v3", JSON.stringify(datos));
}

function cargarDatos() {
    const texto = localStorage.getItem("p2p_datos_v3");
    if (texto === null) {
        crearDatosDemo();
        return;
    }
    const d = JSON.parse(texto);
    documentos = d.documentos;
    // Los objetos guardados vuelven a convertirse en instancias de su clase
    usuarios = d.usuarios.map(u => new clasesUsuario[u.rol](u));
    vehiculos = d.vehiculos.map(v => new clasesVehiculo[v.tipo](v));
    reservas = d.reservas.map(r => new Reserva(r));
    contadorId = d.contadorId;
    vehiculos.forEach(v => v.activarSiCorresponde());   // desactiva anuncios con peritaje vencido
}

// ---------- Datos de ejemplo ----------
function haceMeses(n) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - n);
    return fecha.toISOString().slice(0, 10);
}

function crearDatosDemo() {
    const carlos = new Cliente({ nombre: "Carlos Pérez", documentoIdentidad: "1000000001", email: "carlos.perez@email.com", _contrasena: "1234", licenciaConducir: "B1", contactoEmergencia: "Ana Pérez - 3000000000" });
    const restrepo = new Cliente({ nombre: "J. Restrepo", documentoIdentidad: "1000000004", email: "j.restrepo@email.com", _contrasena: "1234", licenciaConducir: "B1", contactoEmergencia: "Luis Restrepo - 3010000000" });
    const mateo = new Propietario({ nombre: "Mateo Gómez", documentoIdentidad: "1000000002", email: "mateo.gomez@email.com", _contrasena: "1234", tarjetaPropiedad: "TP-0001" });
    // Único usuario de Soporte: usuario "soporte" / contraseña "soporte2026"
    const sofia = new Administrador({ nombre: "Sofía Ramírez", documentoIdentidad: "1000000003", email: "soporte@p2p.com", _contrasena: "soporte2026" });
    usuarios.push(carlos, restrepo, mateo, sofia);

    crearDocumento("Identidad", carlos.id, "identidad.pdf", null, "Aprobado");
    crearDocumento("Licencia", carlos.id, "licencia.pdf", null, "Aprobado");
    crearDocumento("Identidad", mateo.id, "identidad.pdf", null, "Aprobado");
    crearDocumento("Identidad", restrepo.id, "identidad.pdf", null, "Aprobado");
    crearDocumento("Licencia", restrepo.id, "licencia_restrepo.pdf");   // queda pendiente para Soporte

    vehiculos.push(new Auto({
        placa: "ABC-12D", marca: "Renault", modelo: "Logan", anio: 2022, ubicacion: "Medellín",
        tarifaDiaria: 120000, valorComercial: 45000000, subcategoria: "Estándar", proposito: "Urbano / Ciudad",
        propietarioId: mateo.id, tarjetaAprobada: true,
        peritajes: [{ fecha: haceMeses(2), valorComercial: 45000000, dictamen: "Aprobado" }]
    }));
    vehiculos.push(new Moto({
        placa: "LUX-01A", marca: "Kawasaki", modelo: "Z900", anio: 2023, ubicacion: "Poblado, Medellín",
        tarifaDiaria: 260000, valorComercial: 42000000, cilindraje: 948, proposito: "Sport",
        propietarioId: mateo.id, tarjetaAprobada: true,
        peritajes: [{ fecha: haceMeses(3), valorComercial: 42000000, dictamen: "Aprobado" }]
    }));
    vehiculos.push(new Utilitario({
        placa: "NKS-20B", marca: "NKS", modelo: "200 Motocarguero", anio: 2021, ubicacion: "Itagüí",
        tarifaDiaria: 180000, valorComercial: 12000000, subcategoria: "Motocarguero", proposito: "Carga Ligera",
        propietarioId: mateo.id, tarjetaAprobada: true,
        // este peritaje vence en 20 días
        peritajes: [{ fecha: haceMeses(11), valorComercial: 12000000, dictamen: "Aprobado",
                      fechaVencimiento: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10) }]
    }));
    vehiculos.forEach(v => v.activarSiCorresponde());
    guardarDatos();
}
