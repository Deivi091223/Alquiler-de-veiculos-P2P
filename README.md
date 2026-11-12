# Plataforma P2P de Alquiler de Vehículos entre Particulares

## Descripción

Este proyecto es una solución web que conecta directamente a propietarios particulares de vehículos (autos, motos y utilitarios) con personas que necesitan alquilarlos por horas o días. Nace como alternativa a las rentadoras tradicionales, que suelen tener tarifas altas, depósitos de garantía abusivos y procesos burocráticos rígidos.

La plataforma permite a los propietarios publicar sus vehículos con un peritaje técnico verificado, y a los arrendatarios reservar de forma segura mediante contratos digitales que garantizan uso estrictamente privado (queda prohibido su uso como transporte comercial de pasajeros, ej. Uber, Didi, taxis).

## Objetivo

Lograr más de 500 reservas efectivas sin incidencias no cubiertas durante el primer año de operación, reduciendo en un 90% las disputas por daños mediante evidencia fotográfica geolocalizada y contratos digitales explícitos.

## ¿Cómo funciona?

1. **Búsqueda y acceso:** el visitante filtra el catálogo por ubicación, fechas y categoría. Al hacer clic en un vehículo, si no tiene sesión de conductor, se le ofrece iniciar sesión o crear una cuenta.
2. **Reserva:** el conductor (con identidad y licencia aprobadas por Soporte) elige las fechas, revisa el desglose (tarifa, microseguro, comisión y depósito de garantía) y acepta la cláusula de uso privado. El sistema bloquea las fechas para evitar dobles reservas.
3. **Check-in / Check-out:** el propietario aprueba la reserva. El conductor registra mínimo 4 fotografías al recibir y al entregar el vehículo (simuladas en esta versión) y puede reportar un incidente con el botón SOS.
4. **Cierre:** el propietario valida las fotos de entrega. Si están bien, la reserva se finaliza y el depósito se libera; si reporta daños, la reserva pasa a disputa y Soporte la resuelve.
5. **Publicación de vehículos:** el propietario publica con peritaje técnico y tarjeta de propiedad. Soporte los aprueba y el anuncio queda activo. El peritaje vence al año y, si vence, el anuncio se desactiva.
6. **Auditoría:** Soporte valida documentos (con motivo en los rechazos y bitácora de quién y cuándo), escala siniestros a la aseguradora, inmoviliza contratos en casos críticos y resuelve disputas.

## Funcionalidades por perfil

- **Conductor:** catálogo con filtros, registro y login, reserva con desglose de costos, aceptación de cláusula de uso privado, check-in y check-out con fotos, botón SOS, historial de reservas y calificación del propietario.
- **Propietario:** publicación de vehículos con peritaje, renovación de peritaje, bloqueo de fechas en el calendario, aprobación o rechazo de reservas, validación de fotos de entrega, métricas y sección "Mis Ganancias" con filtros por fechas y por vehículo.
- **Operaciones y Soporte:** validación de documentos con bitácora de auditoría, incidentes y expedientes, contratos activos con inmovilización, resolución de disputas (liberar el depósito al cliente o retenerlo a favor del propietario), administración de cuentas y revisión de la vigencia de peritajes.

## Roles del sistema (clases)

- **Usuario** *(clase abstracta)*: datos de acceso, bloqueo de la cuenta por 24 horas tras 3 intentos fallidos y carga de documentos.
- **Cliente**: reserva vehículos, reporta incidentes y califica al propietario.
- **Propietario**: publica y administra vehículos, aprueba reservas, valida fotos y consulta sus ganancias.
- **Administrador**: único usuario de Soporte; verifica documentos, escala siniestros, inmoviliza contratos y resuelve disputas.
- **Vehiculo** *(clase abstracta)* con sus subclases **Moto**, **Auto** y **Utilitario**: cada una calcula su seguro diario (polimorfismo).
- **Peritaje**, **Reserva**, **Pago**, **Poliza** e **Incidente**: apoyan el flujo de reserva, cobro, seguro y siniestros.

## Tecnologías

- HTML5, CSS3, JavaScript (ES6+)
- Jira (Scrum: sprints, historias de usuario, story points)
- Git y GitHub (ramas por integrante, Pull Requests)
- Figma (prototipado de interfaz)

## Alcance de esta entrega (MVP)

**Implementado:**
- Búsqueda y filtrado de vehículos por ubicación, fechas y categoría.
- Registro y login por rol, con bloqueo tras 3 intentos fallidos.
- Reserva con validación de disponibilidad, aceptación de contrato, microseguro, depósito y comisión.
- Check-in y check-out con fotos, botón SOS y reseñas.
- Publicación de vehículos con peritaje obligatorio y renovación de peritaje.
- Calendario de disponibilidad y sección "Mis Ganancias" con filtros.
- Panel de Soporte: validación de documentos con bitácora de auditoría, incidentes, contratos, disputas y cuentas.

**Pendiente (arrastre al siguiente sprint):**
- Correo o SMS de confirmación y notificaciones.
- Fecha, hora y GPS reales en las fotos, plazo de 24 horas para validarlas y vista comparativa de fotos para el administrador.
- Reportes con exportación a CSV y Excel.
- Tarifa de alquiler por hora, eliminación de vehículos por parte del propietario y selects anidados de categoría, subcategoría y propósito.

Quedan fuera de este alcance: pasarelas de pago reales (se simulan) y detección automática de daños con IA.

## Reglas de negocio

- Comisión de la plataforma: 10 % sobre la tarifa de alquiler.
- Depósito de garantía: 1,5 % del valor comercial del vehículo; se retiene al reservar y se libera al finalizar en buen estado.
- Microseguro diario sobre el valor comercial: auto estándar 0,035 %; moto de alto cilindraje y auto de lujo 0,06 %; demás motos y utilitarios 0,05 %.
- Precio recomendado de alquiler: 0,18 % del valor comercial por día.
- Uso estrictamente privado: queda prohibido el transporte público o comercial de pasajeros (Uber, Didi, taxis), y el conductor lo acepta en la reserva.
- El peritaje técnico dura 1 año; con peritaje vencido el anuncio se desactiva.

## Estructura del proyecto

- `index.html`: catálogo y búsqueda.
- `conductor.html`, `propietario.html`, `soporte.html`: portales de cada perfil.
- `styles.css`: estilos de todo el sitio.
- `js/datos.js`: variables globales, datos de demostración y guardado en el navegador.
- `js/Vehiculo.js`, `js/Reserva.js`, `js/Usuario.js`: clases del sistema.
- `js/main.js`: conecta las clases con los HTML.
- `vehiculos/`: fotos de los vehículos (nombre = placa, por ejemplo `ABC-12D.jpg`).
- `Diagramas/`: diagramas de clases, casos de uso y modelo ER.
- `documentos simulados/`: archivos de ejemplo para simular documentos.

## Cómo ejecutar

1. Abrir la carpeta del proyecto en Visual Studio Code.
2. Abrir `index.html` con la extensión Live Server (o directamente en el navegador).
3. Ingresar con las credenciales de demostración de abajo.
4. Los datos se guardan en el navegador. Para reiniciar los datos de demostración: F12 → Application → Local Storage → Clear, y recargar la página.

## Credenciales de acceso de demostración

Estas cuentas de prueba se crean al cargar la aplicación por primera vez en el navegador:

| Perfil | Usuario o correo | Contraseña |
|---|---|---|
| Conductor — Carlos Pérez | `carlos.perez@email.com` | `1234` |
| Conductor — J. Restrepo | `j.restrepo@email.com` | `1234` |
| Propietario — Mateo Gómez | `mateo.gomez@email.com` | `1234` |
| Operaciones y Soporte — Sofía Ramírez | `soporte` | `soporte2026` |

Los datos se guardan en el almacenamiento local del navegador. Si ya hay datos guardados, las cuentas de demostración no se vuelven a crear automáticamente.

## Integrantes

- Vanegas Gutierrez David
- Moreno Ossa Wilder

## Programa Académico

Técnico en Desarrollo de Software