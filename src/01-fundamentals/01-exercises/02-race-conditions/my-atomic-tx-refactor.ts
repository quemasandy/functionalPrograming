/**
 * Simulamos una base de datos simple.
 * En producción esto sería PostgreSQL, MySQL, DynamoDB, etc.
 */
type CuentaBancaria = {
  id: string;
  titular: string;
  saldo: number;
  version: number; // Para optimistic locking (lo veremos después)
};

// Base de datos simulada (en memoria)
const baseDeDatos: Map<string, CuentaBancaria> = new Map();

// Inicializamos una cuenta
baseDeDatos.set('cuenta-001', {
  id: 'cuenta-001',
  titular: 'María García',
  saldo: 1000,
  version: 1,
});

// =============================================================================
// SECCIÓN 4: SOLUCIÓN 3 - TRANSACCIONES ATÓMICAS
// =============================================================================

/**
 * CONCEPTO:
 * ---------
 * "Ejecuto TODO o NADA de forma atómica."
 * Una transacción tiene 4 propiedades (ACID):
 *
 * - Atomicity (Atomicidad): Todo pasa o nada pasa
 * - Consistency (Consistencia): El sistema va de un estado válido a otro
 * - Isolation (Aislamiento): Las transacciones no se ven entre sí
 * - Durability (Durabilidad): Los cambios son permanentes
 *
 * EN SQL (PostgreSQL):
 *   BEGIN;
 *   SELECT saldo FROM cuentas WHERE id = ? FOR UPDATE;
 *   UPDATE cuentas SET saldo = saldo - ? WHERE id = ?;
 *   COMMIT;  -- Si todo sale bien
 *   ROLLBACK; -- Si algo falla
 *
 * EN DynamoDB:
 *   TransactWriteItems con múltiples Put/Update/Delete
 */

// Simulamos una transacción atómica
type Transaccion<T> = {
  ejecutar: () => Promise<T>;
  rollback: () => Promise<void>;
};

async function ejecutarTransaccion<T>(
  tx: Transaccion<T>
): Promise<{ exito: boolean; resultado?: T; error?: string }> {
  try {
    const resultado = await tx.ejecutar();
    return { exito: true, resultado };
  } catch (error) {
    await tx.rollback();
    return {
      exito: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * ✅ RETIRO CON TRANSACCIÓN ATÓMICA
 */
async function retirarConTransaccion(
  cuentaId: string,
  monto: number
): Promise<{ exito: boolean; mensaje: string }> {
  // Guardamos estado inicial para rollback
  // es un memento recuerda el estado anterior
  const estadoAnterior = baseDeDatos.get(cuentaId);

  const transaccion: Transaccion<number> = {
    ejecutar: async () => {
      const cuenta = baseDeDatos.get(cuentaId);
      if (!cuenta) throw new Error('Cuenta no encontrada');
      if (monto > cuenta.saldo) throw new Error('Saldo insuficiente');

      const nuevoSaldo = cuenta.saldo - monto;

      // Operación ATÓMICA - no hay gap entre leer y escribir
      baseDeDatos.set(cuentaId, {
        ...cuenta,
        saldo: nuevoSaldo,
        version: cuenta.version + 1,
      });

      return nuevoSaldo;
    },
    rollback: async () => {
      if (estadoAnterior) {
        baseDeDatos.set(cuentaId, estadoAnterior);
      }
    },
  };

  // command pattern trasaccion en un comand con 2 acciones (ejecutar y rollback)
  const resultado = await ejecutarTransaccion(transaccion);

  if (resultado.exito) {
    return {
      exito: true,
      mensaje: `Retiro exitoso. Nuevo saldo: $${resultado.resultado}`,
    };
  } 

  return { 
    exito: false, 
    mensaje: resultado.error || 'Error' 
  };
}

async function main() {
  const resultado = await retirarConTransaccion('cuenta-001', 800);
  console.log(resultado);

  const resultadoInsuficientFunds = await retirarConTransaccion('cuenta-001', 1800);
  console.log(resultadoInsuficientFunds);
}

main();
