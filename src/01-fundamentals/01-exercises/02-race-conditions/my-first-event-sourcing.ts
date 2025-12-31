// =============================================================================
// SECCIÓN 5: SOLUCIÓN FUNCIONAL - INMUTABILIDAD Y EVENTOS
// =============================================================================

/**
 * CONCEPTO FUNCIONAL:
 * -------------------
 * En lugar de MODIFICAR estado, DESCRIBIMOS las operaciones como EVENTOS.
 * El estado se deriva de la secuencia de eventos (Event Sourcing).
 *
 * VENTAJA: Los eventos son INMUTABLES, no hay race conditions sobre ellos.
 * Solo hay race conditions al INSERTAR eventos, lo cual es más fácil de manejar.
 */

// Eventos inmutables
type EventoCuenta =
  | { tipo: 'DEPOSITO'; cuentaId: string; monto: number; timestamp: Date }
  | { tipo: 'RETIRO'; cuentaId: string; monto: number; timestamp: Date }
  | { tipo: 'CUENTA_CREADA'; cuentaId: string; titular: string; timestamp: Date };

// Log de eventos inmutable
const eventLog: EventoCuenta[] = [
  {
    tipo: 'CUENTA_CREADA',
    cuentaId: 'cuenta-001',
    titular: 'Luigi Muñoz',
    timestamp: new Date(),
  },
  {
    tipo: 'DEPOSITO',
    cuentaId: 'cuenta-001',
    monto: 1000,
    timestamp: new Date(),
  },
];

/**
 * Función PURA que calcula el saldo a partir de eventos.
 * Sin efectos secundarios, sin mutación, sin race conditions aquí.
 */
function calcularSaldo(eventos: readonly EventoCuenta[], cuentaId: string): number {
  return eventos
    .filter(e => e.cuentaId === cuentaId)
    .reduce((saldo, evento) => {
      switch (evento.tipo) {
        case 'CUENTA_CREADA':
          return 0;
        case 'DEPOSITO':
          return saldo + evento.monto;
        case 'RETIRO':
          return saldo - evento.monto;
      }
    }, 0);
}

/**
 * ✅ RETIRO CON EVENT SOURCING
 * La única race condition posible es al agregar el evento,
 * y eso se maneja con append-only + versioning.
 */
async function retirarConEventSourcing(
  cuentaId: string,
  monto: number
): Promise<{ exito: boolean; mensaje: string }> {
  // PURO: Calculamos saldo actual desde eventos
  const saldoActual = calcularSaldo(eventLog, cuentaId);

  // PURO: Validamos
  if (monto > saldoActual) {
    return { exito: false, mensaje: 'Saldo insuficiente' };
  }

  // IMPURO: Solo aquí hay posible race condition (append al log)
  // En producción, usarías un append-only store con versioning
  const nuevoEvento: EventoCuenta = {
    tipo: 'RETIRO',
    cuentaId,
    monto,
    timestamp: new Date(),
  };

  eventLog.push(nuevoEvento); // Operación atómica en un store real

  const nuevoSaldo = calcularSaldo(eventLog, cuentaId);
  return {
    exito: true,
    mensaje: `Retiro exitoso. Nuevo saldo: $${nuevoSaldo}`,
  };
}

async function main() {
  const result = await retirarConEventSourcing('cuenta-001', 999);
  console.log(result);
}

main();