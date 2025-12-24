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

async function retirarDineroInseguro(
  data: { cuentaId: string; monto: number; tx: number; },
  locks2: Map<string, boolean>,
  retryCount: number = 0
): Promise<{ exito: boolean; mensaje: string; tx: number }> {
  try {
    console.log('[Processing Transaction]', data.tx);

    if (!locks2.get(data.cuentaId)) {
      const lock = locks2.set(data.cuentaId, true);

      if (data.tx === 2) throw new Error(`Error en la tx: ${data.tx}`);

      const cuenta = baseDeDatos.get(data.cuentaId);
      console.log(`tx: ${data.tx}, saldo en cuenta: ${cuenta?.saldo}`);

      if (!cuenta) {
        locks2.set(data.cuentaId, false);
        return { exito: false, mensaje: 'Cuenta no encontrada', tx: data.tx };
      }

      // Simulamos latencia de red/base de datos
      await sleep(100); // ⚠️ AQUÍ ESTÁ EL PELIGRO

      // PASO 2: Validamos la regla de negocio
      if (data.monto > cuenta.saldo) {
        console.log(`tx: ${data.tx} Error monto: ${data.monto} saldo: ${cuenta?.saldo} saldo insuficiente`);
        locks2.set(data.cuentaId, false);
        return { exito: false, mensaje: 'Saldo insuficiente', tx: data.tx };
      }

      // PASO 3: Calculamos el nuevo estado
      const nuevoSaldo = cuenta.saldo - data.monto;

      // Más latencia simulada
      await sleep(50);

      // PASO 4: Guardamos el nuevo estado (ESCRITURA)
      // ⚠️ PROBLEMA: ¿Y si alguien MÁS modificó la cuenta entre PASO 1 y PASO 4?
      console.log(`tx: ${data.tx} Actualizando Nuevo Saldo: ${nuevoSaldo}`);
      baseDeDatos.set(data.cuentaId, {
        ...cuenta,
        saldo: nuevoSaldo,
      });

      locks2.set(data.cuentaId, false);
      return {
        exito: true,
        mensaje: `Retiro exitoso. Nuevo saldo: $${nuevoSaldo}`,
        tx: data.tx,
      };
    } else {
      retryCount += 1;
      await sleep((2 ** retryCount) * 1000);
      console.log('[Retry Transaction]', data.tx);
      return retirarDineroInseguro(data, locks2);
    }
  } catch (error) {
    console.log(`tx: ${data.tx} Error: ${error}`);
    locks2.set(data.cuentaId, false);
    return { exito: false, mensaje: '500 Server Error', tx: data.tx };
  } finally {
    locks2.delete(data.cuentaId);
    console.log('[locks2] free', locks2);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demostrarRaceCondition(): Promise<void> {
  baseDeDatos.set('cuenta-001', {
    id: 'cuenta-001',
    titular: 'María García',
    saldo: 1000,
    version: 1,
  });

  console.log('='.repeat(70));
  console.log('📊 Estado inicial: $1000');
  console.log('🎯 Intentando 3 retiros de $800 cada uno simultáneamente...');
  console.log('='.repeat(70));

  const locks2: Map<string, boolean> = new Map();

  const responses = await Promise.allSettled([
    retirarDineroInseguro({ cuentaId: 'cuenta-001', monto: 800, tx: 1 }, locks2),
    retirarDineroInseguro({ cuentaId: 'cuenta-001', monto: 800, tx: 2 }, locks2),
    retirarDineroInseguro({ cuentaId: 'cuenta-001', monto: 800, tx: 3 }, locks2),
  ]);

  const [fullfilled, rejected] = responses.reduce(([fullfilled, rejected], response) => {
    if (response.status === 'fulfilled') {
      fullfilled.push(response.value);
    } else {
      rejected.push(response.reason);
    }
    return [fullfilled, rejected];
  }, [[] as { exito: boolean; mensaje: string; tx: number }[], [] as Error[]]);

  console.log('='.repeat(70));

  console.log('✅ Transacciones con respuesta controlada:');
  fullfilled.forEach(retiro => console.log(retiro));

  console.log('='.repeat(70));

  console.log('❌ Transacciones con errores no capturados:');
  rejected.forEach(retiro => console.log(retiro));

  console.log('='.repeat(70));

  const cuentaFinal = baseDeDatos.get('cuenta-001')!;
  console.log(`💰 Saldo final: $${cuentaFinal.saldo}`);
  console.log('='.repeat(70));
}

demostrarRaceCondition();

export { }
