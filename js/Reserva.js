// =====================================================
// Reserva.js — Pago, Poliza, Incidente y Reserva
// =====================================================

class Pago {
    constructor(datos) {
        this.estado = "Pendiente";            // Pendiente | Cobrado | Reembolsado
        this.estadoDeposito = "Sin retener";  // Retenido | Congelado | Liberado
        this.codigoTransaccion = "";
        Object.assign(this, datos);
    }

    // "cupo" simula el dinero disponible en la tarjeta del cliente
    procesar(cupo) {
        if (cupo < this.montoTotal + this.depositoGarantia) {
            throw new Error("Pago rechazado: la tarjeta no tiene fondos o cupo para el cobro y la garantía");
        }
        this.estado = "Cobrado";
        this.estadoDeposito = "Retenido";
        this.codigoTransaccion = "TX-" + Date.now().toString(36).toUpperCase();
    }

    liberarDeposito() {
        if (this.estadoDeposito === "Retenido") this.estadoDeposito = "Liberado";
    }

    congelarDeposito() {
        if (this.estadoDeposito === "Retenido") this.estadoDeposito = "Congelado";
    }

    reembolsar() {
        this.estado = "Reembolsado";
        this.liberarDeposito();
    }
}

class Poliza {
    constructor(datos) {
        this.numero = "";
        this.estado = "Sin emitir";
        Object.assign(this, datos);
    }

    emitir() {   // la emisión con la aseguradora está simulada
        this.numero = "POL-" + Date.now().toString(36).toUpperCase();
        this.estado = "Vigente";
    }
}

class Incidente {
    constructor(datos) {
        this.id = nuevoId("INC");
        this.estadoExpediente = "Sin generar";   // Generado | Escalado a aseguradora | Escalado a aseguradora y autoridades
        this.expediente = null;
        Object.assign(this, datos);
    }

    // Junta las pruebas del sistema para que Soporte pueda escalar el caso
    generarExpediente(reserva) {
        this.expediente = { reservaId: reserva.id, poliza: reserva.poliza.numero, fotos: reserva.fotos.length };
        this.estadoExpediente = "Generado";
    }
}

class Reserva {
    constructor(datos) {
        this.id = nuevoId("RES");
        // Pendiente → Confirmada → En curso → Por validar → Finalizada
        // (también: Cancelada, En disputa, Inmovilizada)
        this.estado = "Pendiente";
        this.pago = null;
        this.poliza = null;
        this.fotos = [];       // { tipo, nombre }
        this.incidentes = [];
        this.resenas = [];     // { estrellas, comentario, autorRol } (máximo una por rol)
        Object.assign(this, datos);
        if (this.pago) this.pago = new Pago(this.pago);
        if (this.poliza) this.poliza = new Poliza(this.poliza);
        this.incidentes = this.incidentes.map(i => new Incidente(i));
    }

    dias() {
        const dias = Math.ceil((new Date(this.fechaFin) - new Date(this.fechaInicio)) / 86400000);
        return Math.max(1, dias);
    }

    // Finalizada y Cancelada liberan el calendario; los demás estados lo ocupan
    bloqueaFechas() {
        return this.estado !== "Finalizada" && this.estado !== "Cancelada";
    }

    // true = NO hay solapamiento
    validarSolapamiento() {
        return buscarVehiculo(this.vehiculoId).estaDisponible(this.fechaInicio, this.fechaFin, this.id);
    }

    calcularTotal() {
        return buscarVehiculo(this.vehiculoId).calcularTotalReserva(this.dias());
    }

    guardarFotos(tipo, fotos) {
        if (fotos.length < 4) throw new Error("Se requieren mínimo 4 fotos del vehículo");
        fotos.forEach(nombre => this.fotos.push({ tipo: tipo, nombre: nombre }));
    }

    registrarCheckIn(fotos) {
        if (this.estado !== "Confirmada") throw new Error("El check-in solo aplica a reservas confirmadas");
        this.guardarFotos("Recepción", fotos);
        this.estado = "En curso";
        guardarDatos();
    }

    registrarCheckOut(fotos) {
        if (this.estado !== "En curso") throw new Error("El check-out solo aplica a reservas en curso");
        this.guardarFotos("Entrega", fotos);
        this.estado = "Por validar";   // el propietario valida las fotos
        guardarDatos();
    }

    agregarResena(estrellas, comentario, autorRol) {
        if (this.estado !== "Finalizada") throw new Error("Solo se califica una reserva finalizada");
        if (estrellas < 1 || estrellas > 5) throw new Error("Las estrellas deben ser de 1 a 5");
        if (this.resenas.some(r => r.autorRol === autorRol)) throw new Error("Ya existe una reseña de este rol");
        this.resenas.push({ estrellas: estrellas, comentario: comentario, autorRol: autorRol });
        guardarDatos();
    }
}
