// =====================================================
// Vehiculo.js — Peritaje, Vehiculo (abstracta), Moto, Auto, Utilitario
// =====================================================

class Peritaje {
    constructor(datos) {
        this.id = nuevoId("PER");
        this.dictamen = "Pendiente";   // Pendiente | Aprobado | Rechazado
        Object.assign(this, datos);
        if (!this.fechaVencimiento) {  // el peritaje dura 1 año
            const vence = new Date(this.fecha);
            vence.setFullYear(vence.getFullYear() + 1);
            this.fechaVencimiento = vence.toISOString().slice(0, 10);
        }
    }

    estaVigente() {
        return this.dictamen === "Aprobado" && this.fechaVencimiento >= hoy();
    }
}

// Clase ABSTRACTA: no se puede crear un Vehiculo directamente
class Vehiculo {
    constructor(datos) {
        if (new.target === Vehiculo) throw new Error("Vehiculo es abstracta: use Moto, Auto o Utilitario");
        this.id = nuevoId("VEH");
        this.estado = "Pendiente de aprobación";   // Pendiente de aprobación | Activo | Inactivo
        this.tarjetaAprobada = false;
        this.peritajes = [];
        this.bloqueos = [];                        // fechas no disponibles: { inicio, fin }
        Object.assign(this, datos);                // los datos recibidos reemplazan los valores por defecto
        this.peritajes = this.peritajes.map(p => new Peritaje(p));
    }

    // Cada subclase lo sobrescribe (polimorfismo)
    calcularSeguroDiario() {
        throw new Error("calcularSeguroDiario() debe definirse en la subclase");
    }

    obtenerPrecioRecomendado() { return Math.round(this.valorComercial * 0.0018); }

    calcularDeposito() { return Math.round(this.valorComercial * 0.015); }

    calcularTotalReserva(dias) {
        const subtotalAlquiler = Math.round(this.tarifaDiaria * dias);
        const totalSeguro = Math.round(this.calcularSeguroDiario() * dias);
        const comisionPlataforma = Math.round(subtotalAlquiler * 0.10);
        return {
            subtotalAlquiler: subtotalAlquiler,
            totalSeguro: totalSeguro,
            comisionPlataforma: comisionPlataforma,
            depositoGarantia: this.calcularDeposito(),   // se retiene aparte, no suma al total
            montoTotal: subtotalAlquiler + totalSeguro + comisionPlataforma
        };
    }

    peritajeVigente() {
        const vigentes = this.peritajes.filter(p => p.estaVigente());
        return vigentes[vigentes.length - 1];
    }

    diasParaVencerPeritaje() {
        const p = this.peritajeVigente();
        return p ? Math.ceil((new Date(p.fechaVencimiento) - new Date()) / 86400000) : 0;
    }

    // Activo solo si la tarjeta de propiedad y el peritaje están aprobados y vigentes
    activarSiCorresponde() {
        const peritaje = this.peritajeVigente();
        if (peritaje) this.valorComercial = peritaje.valorComercial;
        if (this.tarjetaAprobada && peritaje) {
            this.estado = "Activo";
        } else if (this.estado === "Activo") {
            this.estado = "Inactivo";
        }
    }

    // true si no hay bloqueos ni otras reservas en esas fechas
    estaDisponible(inicio, fin, ignorarReservaId) {
        const choqueBloqueo = this.bloqueos.some(b => seSolapan(inicio, fin, b.inicio, b.fin));
        const choqueReserva = reservas.some(r => r.vehiculoId === this.id && r.id !== ignorarReservaId &&
            r.bloqueaFechas() && seSolapan(inicio, fin, r.fechaInicio, r.fechaFin));
        return !choqueBloqueo && !choqueReserva;
    }

    bloquearFechas(inicio, fin) {
        if (!inicio || !fin || fin <= inicio) throw new Error("Fechas inválidas");
        if (!this.estaDisponible(inicio, fin)) throw new Error("Ya hay una reserva o bloqueo en esas fechas");
        this.bloqueos.push({ inicio: inicio, fin: fin });
    }
}

class Moto extends Vehiculo {
    constructor(datos) {
        super(datos);
        this.tipo = "MOTO";
        // la subcategoría se deduce del cilindraje
        if (this.cilindraje < 200) this.subcategoria = "Bajo";
        else if (this.cilindraje <= 600) this.subcategoria = "Medio";
        else this.subcategoria = "Alto";
    }

    calcularSeguroDiario() {
        if (this.subcategoria === "Alto") return this.valorComercial * 0.0006;
        return this.valorComercial * 0.0005;
    }
}

class Auto extends Vehiculo {
    constructor(datos) {
        super(datos);   // subcategoría: Estándar o Lujo
        this.tipo = "AUTO";
    }

    calcularSeguroDiario() {
        if (this.subcategoria === "Lujo") return this.valorComercial * 0.0006;
        return this.valorComercial * 0.00035;
    }
}

class Utilitario extends Vehiculo {
    constructor(datos) {
        super(datos);   // subcategoría: Motocarguero o Camión / Van
        this.tipo = "UTILITARIO";
    }

    calcularSeguroDiario() { return this.valorComercial * 0.0005; }
}

const clasesVehiculo = { MOTO: Moto, AUTO: Auto, UTILITARIO: Utilitario };

// Catálogo: solo vehículos activos y libres en las fechas pedidas
function buscarVehiculosDisponibles(f) {
    return vehiculos.filter(v => v.estado === "Activo" &&
        (!f.tipo || v.tipo === f.tipo) &&
        (!f.subcategoria || v.subcategoria === f.subcategoria) &&
        (!f.ubicacion || v.ubicacion.toLowerCase().includes(f.ubicacion.toLowerCase())) &&
        (!f.inicio || !f.fin || v.estaDisponible(f.inicio, f.fin)));
}
