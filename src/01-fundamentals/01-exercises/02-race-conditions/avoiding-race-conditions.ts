/**
 * =============================================================================
 * 🏎️ CONDICIONES DE CARRERA EN BASES DE DATOS
 * =============================================================================
 *
 * CONCEPTO PRIMERO:
 * -----------------
 * Una "Race Condition" (condición de carrera) ocurre cuando DOS O MÁS procesos
 * intentan LEER y MODIFICAR el mismo dato simultáneamente, y el resultado
 * final depende del ORDEN en que se ejecutan.
 *
 * ANALOGÍA DEL MUNDO REAL: El Cajero Automático
 * ---------------------------------------------
 * Imagina que tienes $1000 en tu cuenta. Tú y tu pareja van a DOS cajeros
 * diferentes al mismo tiempo, cada uno a retirar $800.
 *
 *   Cajero A (Tú)                    Cajero B (Tu pareja)
 *   ─────────────                    ────────────────────
 *   1. Lee saldo = $1000
 *                                    1. Lee saldo = $1000
 *   2. ¿$800 <= $1000? ✅
 *                                    2. ¿$800 <= $1000? ✅
 *   3. Nuevo saldo = $1000 - $800
 *                                    3. Nuevo saldo = $1000 - $800
 *   4. Guarda saldo = $200
 *                                    4. Guarda saldo = $200
 *
 *   RESULTADO: Retiraron $1600, pero el banco solo descontó $800!
 *   El banco PERDIÓ $800 por una race condition.
 *
 * PROBLEMA QUE RESUELVE:
 * ----------------------
 * - Pérdida de datos
 * - Inconsistencia en el estado
 * - Bugs "fantasma" que solo ocurren bajo carga
 * - Problemas de inventario (vender más stock del disponible)
 * - Doble cobro o doble descuento
 */

// =============================================================================
// SECCIÓN 1: EL PROBLEMA - CÓDIGO INGENUO (SIN PROTECCIÓN)
// =============================================================================

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

/**
 * ❌ CÓDIGO CON RACE CONDITION
 * ----------------------------
 * Este código es PELIGROSO en un entorno concurrente.
 * El problema: hay un "gap" entre LEER y ESCRIBIR donde otro proceso
 * puede modificar el dato.
 */
async function retirarDineroInseguro(
  cuentaId: string,
  monto: number
): Promise<{ exito: boolean; mensaje: string }> {
  // PASO 1: Leemos el estado actual (LECTURA)
  const cuenta = baseDeDatos.get(cuentaId);

  if (!cuenta) {
    return { exito: false, mensaje: 'Cuenta no encontrada' };
  }

  // Simulamos latencia de red/base de datos
  await sleep(100); // ⚠️ AQUÍ ESTÁ EL PELIGRO

  // PASO 2: Validamos la regla de negocio
  if (monto > cuenta.saldo) {
    return { exito: false, mensaje: 'Saldo insuficiente' };
  }

  // PASO 3: Calculamos el nuevo estado
  const nuevoSaldo = cuenta.saldo - monto;

  // Más latencia simulada
  await sleep(50);

  // PASO 4: Guardamos el nuevo estado (ESCRITURA)
  // ⚠️ PROBLEMA: ¿Y si alguien MÁS modificó la cuenta entre PASO 1 y PASO 4?
  baseDeDatos.set(cuentaId, {
    ...cuenta,
    saldo: nuevoSaldo,
  });

  return {
    exito: true,
    mensaje: `Retiro exitoso. Nuevo saldo: $${nuevoSaldo}`,
  };
}

// Función auxiliar para simular latencia
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * DEMOSTRACIÓN DEL BUG
 * --------------------
 * Ejecutamos DOS retiros simultáneos de $800 cada uno.
 * Esperamos que UNO falle (saldo insuficiente), pero AMBOS pasan.
 */
async function demostrarRaceCondition(): Promise<void> {
  console.log('='.repeat(70));
  console.log('❌ DEMOSTRACIÓN: RACE CONDITION EN ACCIÓN');
  console.log('='.repeat(70));

  // Reiniciamos la cuenta
  baseDeDatos.set('cuenta-001', {
    id: 'cuenta-001',
    titular: 'María García',
    saldo: 1000,
    version: 1,
  });

  console.log('\n📊 Estado inicial: $1000');
  console.log('🎯 Intentando 2 retiros de $800 cada uno simultáneamente...\n');

  // Ejecutamos AMBOS retiros al mismo tiempo
  const [resultado1, resultado2] = await Promise.all([
    retirarDineroInseguro('cuenta-001', 800),
    retirarDineroInseguro('cuenta-001', 800),
  ]);

  console.log(`👤 Retiro 1: ${resultado1.mensaje}`);
  console.log(`👤 Retiro 2: ${resultado2.mensaje}`);

  const cuentaFinal = baseDeDatos.get('cuenta-001')!;
  console.log(`\n💰 Saldo final: $${cuentaFinal.saldo}`);
  console.log(`\n⚠️  ¡PROBLEMA! Ambos retiros pasaron.`);
  console.log(`   Se retiraron $1600 de una cuenta con solo $1000.`);
  console.log(`   El banco perdió $600.`);
}

// =============================================================================
// SECCIÓN 2: SOLUCIÓN 1 - PESSIMISTIC LOCKING (Bloqueo Pesimista)
// =============================================================================

/**
 * CONCEPTO:
 * ---------
 * "Antes de leer, BLOQUEO el recurso para que nadie más pueda tocarlo."
 *
 * Es como entrar a un baño y CERRAR CON LLAVE la puerta.
 * Mientras estés adentro, nadie más puede entrar.
 *
 * EN SQL:
 *   SELECT * FROM cuentas WHERE id = ? FOR UPDATE;
 *   -- Esta fila queda BLOQUEADA hasta que termines tu transacción
 *
 * VENTAJAS:
 * - Garantiza que no habrá conflictos
 * - Simple de entender
 *
 * DESVENTAJAS:
 * - Reduce el paralelismo (otros procesos ESPERAN)
 * - Riesgo de DEADLOCKS (dos procesos esperándose mutuamente)
 * - No escala bien con alto tráfico
 */

// Simulamos locks en memoria
const locks: Map<string, boolean> = new Map();

async function adquirirLock(recursoId: string): Promise<void> {
  // Esperamos hasta que el recurso esté disponible
  while (locks.get(recursoId)) {
    await sleep(10); // Polling (en producción usarías semáforos)
  }
  locks.set(recursoId, true);
}

function liberarLock(recursoId: string): void {
  locks.set(recursoId, false);
}

/**
 * ✅ RETIRO CON PESSIMISTIC LOCKING
 */
async function retirarConPessimisticLock(
  cuentaId: string,
  monto: number
): Promise<{ exito: boolean; mensaje: string }> {
  // PASO 1: Adquirimos el LOCK antes de hacer nada
  await adquirirLock(cuentaId);

  try {
    // PASO 2: Ahora podemos leer con seguridad
    const cuenta = baseDeDatos.get(cuentaId);

    if (!cuenta) {
      return { exito: false, mensaje: 'Cuenta no encontrada' };
    }

    await sleep(100); // Simulamos latencia

    // PASO 3: Validamos
    if (monto > cuenta.saldo) {
      return { exito: false, mensaje: 'Saldo insuficiente' };
    }

    // PASO 4: Actualizamos
    const nuevoSaldo = cuenta.saldo - monto;
    await sleep(50);

    baseDeDatos.set(cuentaId, {
      ...cuenta,
      saldo: nuevoSaldo,
    });

    return {
      exito: true,
      mensaje: `Retiro exitoso. Nuevo saldo: $${nuevoSaldo}`,
    };
  } finally {
    // PASO 5: SIEMPRE liberamos el lock, incluso si hay error
    liberarLock(cuentaId);
  }
}

async function demostrarPessimisticLocking(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('✅ SOLUCIÓN 1: PESSIMISTIC LOCKING');
  console.log('='.repeat(70));

  baseDeDatos.set('cuenta-001', {
    id: 'cuenta-001',
    titular: 'María García',
    saldo: 1000,
    version: 1,
  });

  console.log('\n📊 Estado inicial: $1000');
  console.log('🎯 Intentando 2 retiros de $800 con LOCK...\n');

  const [resultado1, resultado2] = await Promise.all([
    retirarConPessimisticLock('cuenta-001', 800),
    retirarConPessimisticLock('cuenta-001', 800),
  ]);

  console.log(`👤 Retiro 1: ${resultado1.mensaje}`);
  console.log(`👤 Retiro 2: ${resultado2.mensaje}`);

  const cuentaFinal = baseDeDatos.get('cuenta-001')!;
  console.log(`\n💰 Saldo final: $${cuentaFinal.saldo}`);
  console.log(`\n✅ ¡CORRECTO! Solo un retiro pasó, el otro fue rechazado.`);
}

// =============================================================================
// SECCIÓN 3: SOLUCIÓN 2 - OPTIMISTIC LOCKING (Bloqueo Optimista)
// =============================================================================

/**
 * CONCEPTO:
 * ---------
 * "No bloqueo nada. Leo, proceso, y AL GUARDAR verifico que nadie
 * haya modificado el dato mientras yo trabajaba."
 *
 * Es como editar un documento en Google Docs. No bloqueas a nadie,
 * pero si dos personas editan el mismo párrafo, el sistema detecta
 * el conflicto.
 *
 * MECANISMO:
 * - Cada registro tiene un campo "version" (o "updated_at")
 * - Al leer, guardamos la versión
 * - Al escribir, verificamos que la versión no haya cambiado
 * - Si cambió, RECHAZAMOS la operación y el cliente debe reintentar
 *
 * EN SQL:
 *   UPDATE cuentas
 *   SET saldo = ?, version = version + 1
 *   WHERE id = ? AND version = ?;
 *   -- Si 0 filas afectadas = alguien más modificó primero
 *
 * EN DynamoDB:
 *   ConditionExpression: "version = :expectedVersion"
 *
 * VENTAJAS:
 * - Alto paralelismo (no hay esperas)
 * - No hay deadlocks
 * - Escala muy bien
 *
 * DESVENTAJAS:
 * - El cliente debe manejar reintentos
 * - Bajo alta contención, muchos reintentos = posible thrashing
 */

/**
 * ✅ RETIRO CON OPTIMISTIC LOCKING
 */
async function retirarConOptimisticLock(
  cuentaId: string,
  monto: number,
  intentoNumero: number = 1,
  maxIntentos: number = 3
): Promise<{ exito: boolean; mensaje: string }> {
  // PASO 1: Leemos el estado actual CON su versión
  const cuenta = baseDeDatos.get(cuentaId);

  if (!cuenta) {
    return { exito: false, mensaje: 'Cuenta no encontrada' };
  }

  const versionLeida = cuenta.version; // Guardamos la versión que leímos

  await sleep(100); // Simulamos latencia

  // PASO 2: Validamos
  if (monto > cuenta.saldo) {
    return { exito: false, mensaje: 'Saldo insuficiente' };
  }

  // PASO 3: Calculamos el nuevo estado
  const nuevoSaldo = cuenta.saldo - monto;
  const nuevaVersion = versionLeida + 1;

  await sleep(50);

  // PASO 4: Intentamos guardar CON CONDICIÓN DE VERSIÓN
  const cuentaActual = baseDeDatos.get(cuentaId)!;

  // ¿La versión sigue siendo la misma que cuando leímos?
  if (cuentaActual.version !== versionLeida) {
    // ¡CONFLICTO! Alguien más modificó la cuenta
    console.log(`   ⚡ Conflicto detectado (intento ${intentoNumero}). Reintentando...`);

    if (intentoNumero >= maxIntentos) {
      return {
        exito: false,
        mensaje: 'Error: Demasiados conflictos. Intenta más tarde.',
      };
    }

    // Reintentamos con backoff exponencial
    await sleep(50 * intentoNumero);
    return retirarConOptimisticLock(cuentaId, monto, intentoNumero + 1, maxIntentos);
  }

  // ¡Sin conflicto! Guardamos
  baseDeDatos.set(cuentaId, {
    ...cuenta,
    saldo: nuevoSaldo,
    version: nuevaVersion,
  });

  return {
    exito: true,
    mensaje: `Retiro exitoso. Nuevo saldo: $${nuevoSaldo}`,
  };
}

async function demostrarOptimisticLocking(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('✅ SOLUCIÓN 2: OPTIMISTIC LOCKING (Recomendado para alta escala)');
  console.log('='.repeat(70));

  baseDeDatos.set('cuenta-001', {
    id: 'cuenta-001',
    titular: 'María García',
    saldo: 1000,
    version: 1,
  });

  console.log('\n📊 Estado inicial: $1000, versión: 1');
  console.log('🎯 Intentando 2 retiros de $800 con version checking...\n');

  const [resultado1, resultado2] = await Promise.all([
    retirarConOptimisticLock('cuenta-001', 800),
    retirarConOptimisticLock('cuenta-001', 800),
  ]);

  console.log(`\n👤 Retiro 1: ${resultado1.mensaje}`);
  console.log(`👤 Retiro 2: ${resultado2.mensaje}`);

  const cuentaFinal = baseDeDatos.get('cuenta-001')!;
  console.log(`\n💰 Saldo final: $${cuentaFinal.saldo}, versión: ${cuentaFinal.version}`);
  console.log(`\n✅ ¡CORRECTO! El sistema detectó el conflicto y lo manejó.`);
}

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

  const resultado = await ejecutarTransaccion(transaccion);

  if (resultado.exito) {
    return {
      exito: true,
      mensaje: `Retiro exitoso. Nuevo saldo: $${resultado.resultado}`,
    };
  } else {
    return { exito: false, mensaje: resultado.error || 'Error' };
  }
}

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
const eventLog: EventoCuenta[] = [];

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

// =============================================================================
// COMPARATIVA: TYPESCRIPT vs SCALA
// =============================================================================

/**
 * EN SCALA (con ZIO o Cats Effect):
 * ----------------------------------
 * Scala tiene herramientas más poderosas para manejar concurrencia:
 *
 * ```scala
 * // Scala con ZIO
 * import zio._
 *
 * case class Cuenta(id: String, saldo: BigDecimal, version: Int)
 *
 * def retirarConOptimisticLocking(
 *   ref: Ref[Map[String, Cuenta]],  // Ref es una referencia atómica
 *   cuentaId: String,
 *   monto: BigDecimal
 * ): ZIO[Any, String, Cuenta] = {
 *   ref.modify { db =>
 *     db.get(cuentaId) match {
 *       case None =>
 *         (Left("Cuenta no encontrada"), db)
 *       case Some(cuenta) if monto > cuenta.saldo =>
 *         (Left("Saldo insuficiente"), db)
 *       case Some(cuenta) =>
 *         val nuevaCuenta = cuenta.copy(
 *           saldo = cuenta.saldo - monto,
 *           version = cuenta.version + 1
 *         )
 *         (Right(nuevaCuenta), db.updated(cuentaId, nuevaCuenta))
 *     }
 *   }.flatMap {
 *     case Left(error) => ZIO.fail(error)
 *     case Right(cuenta) => ZIO.succeed(cuenta)
 *   }
 * }
 * ```
 *
 * DIFERENCIAS CLAVE:
 * ------------------
 * - Scala/ZIO: `Ref[A]` proporciona operaciones atómicas sin locks externos
 * - TypeScript: Debemos implementar locks manualmente o usar libs como `async-mutex`
 * - Scala tiene tipos de datos concurrentes en su stdlib (Concurrent HashMaps, etc.)
 * - En TS, `Map` no es thread-safe (aunque Node es single-threaded,
 *   las operaciones async pueden intercalarse)
 */

// =============================================================================
// RESUMEN: ¿CUÁNDO USAR CADA TÉCNICA?
// =============================================================================

/**
 * ┌─────────────────────┬─────────────────────────────────────────────────────┐
 * │ TÉCNICA             │ CUÁNDO USARLA                                       │
 * ├─────────────────────┼─────────────────────────────────────────────────────┤
 * │ Pessimistic Locking │ - Baja concurrencia                                 │
 * │                     │ - Transacciones largas                              │
 * │                     │ - Cuando los conflictos son MUY costosos            │
 * │                     │ - Ej: Reservas de hotel, asientos de vuelo          │
 * ├─────────────────────┼─────────────────────────────────────────────────────┤
 * │ Optimistic Locking  │ - Alta concurrencia                                 │
 * │                     │ - Transacciones cortas                              │
 * │                     │ - Baja probabilidad de conflicto                    │
 * │                     │ - Ej: E-commerce, redes sociales, APIs REST         │
 * ├─────────────────────┼─────────────────────────────────────────────────────┤
 * │ Transacciones ACID  │ - Múltiples tablas/recursos relacionados            │
 * │                     │ - Requieres TODO o NADA                             │
 * │                     │ - Ej: Transferencias bancarias, pagos               │
 * ├─────────────────────┼─────────────────────────────────────────────────────┤
 * │ Event Sourcing      │ - Necesitas historial completo                      │
 * │                     │ - Auditoría es importante                           │
 * │                     │ - Sistema distribuido                               │
 * │                     │ - Ej: Fintech, healthcare, legal                    │
 * └─────────────────────┴─────────────────────────────────────────────────────┘
 */

// =============================================================================
// EJECUCIÓN DE DEMOS
// =============================================================================

async function main(): Promise<void> {
  await demostrarRaceCondition();
  await demostrarPessimisticLocking();
  await demostrarOptimisticLocking();

  console.log('\n' + '='.repeat(70));
  console.log('📚 REFERENCIA: Functional Programming in Scala');
  console.log('   Capítulo sobre Side Effects y Referential Transparency');
  console.log('   explica por qué la inmutabilidad evita race conditions.');
  console.log('='.repeat(70));
}

main().catch(console.error);

// =============================================================================
// 🎯 RETO DE REFACTORIZACIÓN
// =============================================================================

/**
 * EJERCICIO: Refactoriza el siguiente código imperativo con race condition
 * a una versión segura usando Optimistic Locking.
 *
 * CÓDIGO PROBLEMÁTICO:
 * --------------------
 * ```typescript
 * let inventario = 10;
 *
 * async function comprarProducto(cantidad: number): Promise<boolean> {
 *     if (cantidad <= inventario) {
 *         await procesarPago();  // Simula latencia
 *         inventario -= cantidad;
 *         return true;
 *     }
 *     return false;
 * }
 *
 * // Problema: 5 clientes intentan comprar 3 productos cada uno simultáneamente
 * // Hay 10 en stock, pero podrían venderse 15 por race conditions
 * ```
 *
 * PISTAS:
 * 1. Convierte `inventario` en un objeto con `{ cantidad: number, version: number }`
 * 2. Al intentar la compra, guarda la versión actual
 * 3. Antes de actualizar, verifica que la versión no haya cambiado
 * 4. Si cambió, reintenta la operación
 *
 * ¡Intenta resolverlo antes de ver la solución!
 */

export {};
