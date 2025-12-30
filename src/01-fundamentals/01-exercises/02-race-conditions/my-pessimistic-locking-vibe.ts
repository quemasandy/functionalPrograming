type CuentaBancaria = {
  id: string;
  titular: string;
  saldo: number;
  version: number; // Para optimistic locking (lo veremos después)
};

// Base de datos simulada (en memoria)
const baseDeDatos: Map<string, CuentaBancaria> = new Map();

// Función auxiliar para simular latencia
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Inicializamos una cuenta
baseDeDatos.set('cuenta-001', {
  id: 'cuenta-001',
  titular: 'María García',
  saldo: 1000,
  version: 1,
});

/*
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
    console.log('adquirirLock loop waiting', recursoId);
    await sleep(10); // Polling (en producción usarías semáforos)
  }
  console.log('adquirirLock lock acquired', recursoId);
  locks.set(recursoId, true);
}

function liberarLock(recursoId: string): void {
  console.log('liberarLock lock released', recursoId);
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
  console.log('[cuentaId]', cuentaId);
  await adquirirLock(cuentaId);

  try {
    // PASO 2: Ahora podemos leer con seguridad
    console.log('[cuentaId] 2', cuentaId);
    const cuenta = baseDeDatos.get(cuentaId);
    console.log('[cuenta]', cuenta);

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

    console.log('[cuentaId] Final', cuentaId);
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
  console.log('='.repeat(70));
  console.log('✅ SOLUCIÓN 1: PESSIMISTIC LOCKING');
  console.log('='.repeat(70));

  baseDeDatos.set('cuenta-001', {
    id: 'cuenta-001',
    titular: 'Luigy Muñoz',
    saldo: 1000,
    version: 1,
  });

  console.log('📊 Estado inicial: $1000');
  console.log('🎯 Intentando 2 retiros de $800 con LOCK...');

  const [resultado1, resultado2] = await Promise.all([
    retirarConPessimisticLock('cuenta-001', 800),
    retirarConPessimisticLock('cuenta-001', 800),
  ]);

  console.log(`👤 Retiro 1: ${resultado1.mensaje}`);
  console.log(`👤 Retiro 2: ${resultado2.mensaje}`);

  const cuentaFinal = baseDeDatos.get('cuenta-001')!;
  console.log(`💰 Saldo final: $${cuentaFinal.saldo}`);
  console.log(`✅ ¡CORRECTO! Solo un retiro pasó, el otro fue rechazado.`);
}

demostrarPessimisticLocking();

export {}