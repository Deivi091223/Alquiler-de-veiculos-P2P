// =====================================================
// Usuario.js — Usuario (abstracta), Cliente, Propietario, Administrador
// Los métodos lanzan un Error si algo no se cumple; main.js lo muestra con alert.
// =====================================================

class Usuario {
    constructor(datos) {
        if (new.target === Usuario) throw new Error("Usuario es abstracta: use Cliente, Propietario o Administrador");
        this.id = nuevoId("USR");
        this.intentosFallidos = 0;
        this.bloqueadoHasta = 0;   // momento (en milisegundos) hasta el que la cuenta está bloqueada
        Object.assign(this, datos);
        this.email = this.email.toLowerCase();
        this.usuario = this.usuario || this.email;   // nombre con el que ingresa
        // "_contrasena" con guion bajo = dato privado
    }

    registrar() {
        if (this._contrasena.length < 4) throw new Error("La contraseña debe tener mínimo 4 caracteres");
        if (usuarios.some(u => u.email === this.email)) throw new Error("El correo ya está registrado");
        if (usuarios.some(u => u.documentoIdentidad === this.documentoIdentidad)) throw new Error("El documento de identidad ya está registrado");
        usuarios.push(this);
        guardarDatos();
    }

    estaBloqueado() {
        return Date.now() < this.bloqueadoHasta;
    }

    iniciarSesion(contrasena) {
        if (this.estaBloqueado()) {
            throw new Error("Cuenta bloqueada hasta el " + new Date(this.bloqueadoHasta).toLocaleString("es-CO") +
                " o hasta que Operaciones y Soporte la desbloquee");
        }
        if (contrasena !== this._contrasena) {
            this.intentosFallidos++;
            let mensaje = "Usuario o contraseña incorrectos (" + this.intentosFallidos + "/3 intentos)";
            if (this.intentosFallidos === 3) {
                this.bloqueadoHasta = Date.now() + 24 * 60 * 60 * 1000;   // 24 horas
                this.intentosFallidos = 0;
                mensaje = "Cuenta bloqueada por 24 horas o hasta que Operaciones y Soporte la desbloquee";
            }
            guardarDatos();
            throw new Error(mensaje);
        }
        this.intentosFallidos = 0;
        usuarioActual = this;
        guardarDatos();
    }

    // Sube un documento simulado a la cola de verificación de Soporte
    cargarDocumento(tipo, archivo) {
        crearDocumento(tipo, this.id, archivo);
        guardarDatos();
    }
}

class Cliente extends Usuario {
    constructor(datos) {
        super(datos);
        this.rol = "CLIENTE";
    }

    // Necesita identidad y licencia aprobadas por Soporte
    puedeReservar() {
        for (const tipo of ["Identidad", "Licencia"]) {
            const aprobado = documentos.some(d => d.titularId === this.id && d.tipo === tipo && d.estado === "Aprobado");
            if (!aprobado) throw new Error("Su documento de " + tipo.toLowerCase() + " aún no está aprobado");
        }
    }

    buscarVehiculo(filtros) {
        return buscarVehiculosDisponibles(filtros);
    }

    solicitarReserva(vehiculoId, inicio, fin, aceptaClausula, cupo) {
        this.puedeReservar();
        const vehiculo = buscarVehiculo(vehiculoId);
        if (!vehiculo || vehiculo.estado !== "Activo") throw new Error("El vehículo no está disponible");
        if (!aceptaClausula) throw new Error("Debe aceptar la cláusula de uso privado (prohibido transporte público o comercial de pasajeros)");
        if (!inicio || !fin || fin <= inicio) throw new Error("Fechas inválidas");
        if (inicio < hoy()) throw new Error("La fecha de inicio no puede ser pasada");

        const reserva = new Reserva({ clienteId: this.id, vehiculoId: vehiculoId, propietarioId: vehiculo.propietarioId, fechaInicio: inicio, fechaFin: fin });
        if (!reserva.validarSolapamiento()) throw new Error("El vehículo ya está reservado en esas fechas");

        reserva.pago = new Pago(reserva.calcularTotal());
        reserva.pago.procesar(cupo);   // lanza error si no hay fondos
        reserva.poliza = new Poliza({ primaDiaria: Math.round(vehiculo.calcularSeguroDiario()) });
        reserva.poliza.emitir();
        reservas.push(reserva);        // desde aquí las fechas quedan bloqueadas
        guardarDatos();
        return reserva;
    }

    reportarIncidente(reservaId, tipoEvento, latitud, longitud) {
        const reserva = buscarReserva(reservaId);
        if (!reserva || reserva.clienteId !== this.id) throw new Error("Reserva no encontrada");
        if (reserva.estado !== "En curso") throw new Error("Solo se reporta un incidente en una reserva en curso");
        const incidente = new Incidente({ reservaId: reservaId, tipoEvento: tipoEvento, latitud: latitud, longitud: longitud, reportadoPor: "Cliente" });
        incidente.generarExpediente(reserva);
        reserva.incidentes.push(incidente);
        guardarDatos();
    }

    calificarPropietario(reservaId, estrellas, comentario) {
        const reserva = buscarReserva(reservaId);
        if (!reserva || reserva.clienteId !== this.id) throw new Error("Reserva no encontrada");
        reserva.agregarResena(estrellas, comentario, "CLIENTE");
    }
}

class Propietario extends Usuario {
    constructor(datos) {
        super(datos);
        this.rol = "PROPIETARIO";
    }

    misVehiculos() { return vehiculos.filter(v => v.propietarioId === this.id); }

    misReservas() { return reservas.filter(r => r.propietarioId === this.id); }

    // Sin peritaje ni tarjeta de propiedad no hay anuncio. Queda "Pendiente de aprobación".
    publicarVehiculo(datos) {
        if (!datos.archivoPeritaje) throw new Error("El certificado de peritaje es obligatorio");
        if (!datos.archivoTarjeta) throw new Error("La tarjeta de propiedad es obligatoria");
        if (vehiculos.some(v => v.placa === datos.placa)) throw new Error("Ya existe un vehículo con esa placa");
        if (datos.tipo === "MOTO" && !(datos.cilindraje > 0)) throw new Error("Indique el cilindraje de la moto");

        datos.propietarioId = this.id;
        const vehiculo = new clasesVehiculo[datos.tipo](datos);
        vehiculos.push(vehiculo);
        this.cargarDocumentosAuto(vehiculo.id, datos.valorComercial, datos.archivoPeritaje, datos.archivoTarjeta);
    }

    // Sube el peritaje (y la tarjeta la primera vez). También sirve para renovar el peritaje.
    cargarDocumentosAuto(vehiculoId, valorComercial, archivoPeritaje, archivoTarjeta) {
        const vehiculo = buscarVehiculo(vehiculoId);
        if (!vehiculo || vehiculo.propietarioId !== this.id) throw new Error("Vehículo no encontrado");
        if (!archivoPeritaje) throw new Error("Debe adjuntar el certificado de peritaje");
        const peritaje = new Peritaje({ fecha: hoy(), valorComercial: valorComercial, archivo: archivoPeritaje });
        vehiculo.peritajes.push(peritaje);
        crearDocumento("Peritaje", vehiculoId, archivoPeritaje, peritaje.id);
        if (archivoTarjeta) crearDocumento("Tarjeta de propiedad", vehiculoId, archivoTarjeta);
        guardarDatos();
    }

    gestionarCalendario(vehiculoId, inicio, fin) {
        const vehiculo = buscarVehiculo(vehiculoId);
        if (!vehiculo || vehiculo.propietarioId !== this.id) throw new Error("Vehículo no encontrado");
        vehiculo.bloquearFechas(inicio, fin);
        guardarDatos();
    }

    aprobarReserva(reservaId, aprobar) {
        const reserva = buscarReserva(reservaId);
        if (!reserva || reserva.propietarioId !== this.id) throw new Error("Reserva no encontrada");
        if (reserva.estado !== "Pendiente") throw new Error("La reserva ya fue gestionada");
        if (aprobar) {
            reserva.estado = "Confirmada";
        } else {
            reserva.estado = "Cancelada";   // libera las fechas
            reserva.pago.reembolsar();
        }
        guardarDatos();
    }

    // Aprueba las fotos de entrega (libera el depósito) o las rechaza (disputa)
    validarFotos(reservaId, aprueba) {
        const reserva = buscarReserva(reservaId);
        if (!reserva || reserva.propietarioId !== this.id) throw new Error("Reserva no encontrada");
        if (reserva.estado !== "Por validar") throw new Error("La reserva no está pendiente de validación");
        if (aprueba) {
            reserva.estado = "Finalizada";
            reserva.pago.liberarDeposito();
        } else {
            reserva.estado = "En disputa";
            reserva.pago.congelarDeposito();
        }
        guardarDatos();
    }

    calcularMetricas() {
        let ganancias = 0;
        let estrellas = 0;
        let resenas = 0;
        for (const r of this.misReservas()) {
            // El propietario recibe la tarifa de alquiler; la comisión la paga el cliente aparte
            if (r.estado === "Finalizada") ganancias += r.pago.subtotalAlquiler;
            for (const x of r.resenas) {
                if (x.autorRol === "CLIENTE") { estrellas += x.estrellas; resenas++; }
            }
        }
        const mios = this.misVehiculos();
        return {
            ganancias: ganancias,
            activos: mios.filter(v => v.estado === "Activo").length,
            total: mios.length,
            sinPeritaje: mios.filter(v => !v.peritajeVigente()).length,
            promedio: resenas > 0 ? Math.round(estrellas / resenas * 10) / 10 : 0,
            resenas: resenas
        };
    }
}

class Administrador extends Usuario {
    constructor(datos) {
        super(datos);
        this.rol = "ADMIN";
        this.usuario = "soporte";
    }

    // Solo existe un usuario de Soporte: no se pueden crear más
    registrar() {
        throw new Error("El perfil de Operaciones y Soporte tiene un único usuario; no se pueden crear más");
    }

    desbloquearUsuario(usuarioId) {
        buscarUsuario(usuarioId).bloqueadoHasta = 0;
        guardarDatos();
    }

    // Aprueba o rechaza (con motivo) un documento
    verificarDocumentos(documentoId, aprobar, motivo) {
        const doc = documentos.find(d => d.id === documentoId);
        if (!doc || doc.estado !== "Pendiente") throw new Error("Documento no disponible para revisión");
        if (!aprobar && !motivo) throw new Error("Debe indicar el motivo del rechazo");

        doc.estado = aprobar ? "Aprobado" : "Rechazado";
        doc.motivo = motivo || "";

        if (doc.tipo === "Peritaje" || doc.tipo === "Tarjeta de propiedad") {
            const vehiculo = buscarVehiculo(doc.titularId);
            if (doc.tipo === "Peritaje") {
                vehiculo.peritajes.find(p => p.id === doc.referenciaId).dictamen = doc.estado;
            } else {
                vehiculo.tarjetaAprobada = aprobar;
            }
            vehiculo.activarSiCorresponde();   // pasa a Activo solo si ambos están aprobados
        }
        guardarDatos();
    }

    // Revisa los anuncios y desactiva los que tienen el peritaje vencido
    moderarCatalogo() {
        let cambios = 0;
        for (const v of vehiculos) {
            const antes = v.estado;
            v.activarSiCorresponde();
            if (v.estado !== antes) cambios++;
        }
        guardarDatos();
        return cambios;
    }

    escalarSiniestro(incidenteId) {
        for (const reserva of reservas) {
            const incidente = reserva.incidentes.find(i => i.id === incidenteId);
            if (incidente) {
                if (incidente.estadoExpediente !== "Generado") throw new Error("El incidente ya fue escalado");
                incidente.estadoExpediente = "Escalado a aseguradora";
                reserva.estado = "En disputa";
                reserva.pago.congelarDeposito();
                guardarDatos();
                return;
            }
        }
        throw new Error("Incidente no encontrado");
    }

    // Casos críticos sin reporte del cliente (robo, accidente grave, incomunicación)
    inmovilizarContrato(reservaId, motivo) {
        const reserva = buscarReserva(reservaId);
        if (!reserva || !reserva.bloqueaFechas() || reserva.estado === "Inmovilizada") throw new Error("La reserva ya terminó o ya está inmovilizada");
        const incidente = new Incidente({ reservaId: reservaId, tipoEvento: motivo, latitud: 0, longitud: 0, reportadoPor: "Administrador" });
        incidente.generarExpediente(reserva);
        incidente.estadoExpediente = "Escalado a aseguradora y autoridades";
        reserva.incidentes.push(incidente);
        reserva.estado = "Inmovilizada";
        reserva.pago.congelarDeposito();
        guardarDatos();
    }
}

const clasesUsuario = { CLIENTE: Cliente, PROPIETARIO: Propietario, ADMIN: Administrador };
