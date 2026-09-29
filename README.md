# Plataforma P2P de Alquiler de Vehículos entre Particulares

## Descripción

Este proyecto es una solución web que conecta directamente a propietarios particulares de vehículos (autos, motos y utilitarios) con personas que necesitan alquilarlos por horas o días. Nace como alternativa a las rentadoras tradicionales, que suelen tener tarifas altas, depósitos de garantía abusivos y procesos burocráticos rígidos.

La plataforma permite a los propietarios publicar sus vehículos con un peritaje técnico verificado, y a los arrendatarios reservar de forma segura mediante contratos digitales que garantizan uso estrictamente privado (queda prohibido su uso como transporte comercial de pasajeros, ej. Uber, Didi, taxis).

## Objetivo

Lograr más de 500 reservas efectivas sin incidencias no cubiertas durante el primer año de operación, reduciendo en un 90% las disputas por daños mediante evidencia fotográfica geolocalizada y contratos digitales explícitos.

## ¿Cómo funciona?

1. **Búsqueda y reserva:** el usuario filtra vehículos disponibles por ubicación y fechas, revisa el desglose de costos (tarifa + microseguro + garantía) y acepta el contrato de uso privado.
2. **Check-in / Check-out:** antes y después de cada alquiler se suben mínimo 4 fotografías con coordenadas GPS y marca de tiempo, para dejar evidencia del estado del vehículo.
3. **Publicación de vehículos:** los propietarios registran sus vehículos, pero solo pueden activarlos si cargan un peritaje técnico vigente.
4. **Auditoría:** los administradores validan documentos, aprueban o rechazan peritajes e identidades, y generan reportes exportables (Excel/CSV).

## Roles del sistema

- **UsuarioP2P** *(clase base abstracta)*: id, nombre, apellido, correo, rol, estado activo.
- **ClienteArrendatario**: alquila vehículos, registra licencia de conducir y método de pago.
- **PropietarioVehiculo**: publica y administra sus vehículos y peritajes.
- **AdministradorSistema**: audita documentos, identidades y genera reportes.
- **Vehiculo**: marca, modelo, categoría, tarifa y disponibilidad.
- **Reserva**: vincula cliente y vehículo, calcula costos y bloquea el calendario.

## Tecnologías

- HTML5, CSS3, JavaScript (ES6+)
- Jira (Scrum: sprints, historias de usuario, story points)
- Git y GitHub (ramas por integrante, Pull Requests)
- Figma (prototipado de interfaz)

## Alcance de esta entrega (MVP)

- Búsqueda y filtrado de vehículos por ubicación y fechas
- Reserva con validación de disponibilidad y aceptación de contrato
- Carga de fotos de check-in / check-out
- Publicación de vehículos con peritaje obligatorio
- Panel básico de aprobación de documentos

> Quedan fuera de este alcance: pasarelas de pago reales (se simulan) y detección automática de daños con IA.

## Integrantes

- Vanegas Gutierrez David
- Moreno Ossa Wilder

## Programa Académico

Técnico en Desarrollo de Software