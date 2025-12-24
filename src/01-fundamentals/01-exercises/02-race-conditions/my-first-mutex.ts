type CuentaBancaria = {
  id: string;
  titular: string;
  saldo: number;
  version: number; // Para optimistic locking (lo veremos después)
};

type Status = 'pending' | 'success' | 'error' | 'locked';

type RetiroResponse = {
  exito: boolean;
  status: Status;
  mensaje: string;
  tx: number;
  cuentaId: string;
};

// Base de datos simulada (en memoria)
const baseDeDatos: Map<string, CuentaBancaria> = new Map();

type Lock = {
  locked: boolean;
  tx: number;
  ttl: number;
}

interface cache {
  set(key: string, value: Lock): void;
  get(key: string): Lock | undefined;
  setnx(key: string, value: Lock): boolean;
  delete(key: string): void;
}

class Redis implements cache {
  private redis: Map<string, Lock>;

  constructor() {
    this.redis = new Map();
  }

  set(key: string, value: Lock) {
    this.redis.set(key, value);
  }

  get(key: string) {
    return this.redis.get(key);
  }

  /*
  * Espero que con esto ya podamos solucionar el error de qué pasa si dos lambdas o dos procesos llaman al mismo tiempo. 
  * Si eso llega a pasar, siempre va a haber una verificación global por parte de redes que dice Este lock ya existe o no? 
  * Con eso, pienso que, si dos lambdas llaman a esta función al mismo tiempo, solo una va a pasar y la otra no. 
  */
  setnx(key: string, value: Lock) {
    if (this.redis.has(key)) {
      return false;
    }
    value.ttl = Date.now() + value.ttl;
    this.redis.set(key, value);
    return true;
  }

  delete(key: string) {
    this.redis.delete(key);
  }
}

// Inicializamos una cuenta
baseDeDatos.set('cuenta-001', {
  id: 'cuenta-001',
  titular: 'María García',
  saldo: 1000,
  version: 1,
});

async function retirarDineroInseguro(
  data: { cuentaId: string; monto: number; tx: number; status: Status },
  cache: cache,
): Promise<RetiroResponse> {
  try {
    console.log('[Processing Transaction]', data.tx);

    if (!cache.setnx(data.cuentaId, { locked: true, tx: data.tx, ttl: 1000 })) {
      data.status = 'locked';
      return { exito: false, status: data.status, mensaje: 'Cuenta bloqueada', tx: data.tx, cuentaId: data.cuentaId };
    }
    
    if (data.tx === 2) throw new Error(`Fallo en la tx: ${data.tx}`);
    if (data.tx === 4) throw new Error(`Fallo en la tx: ${data.tx}`);

    const cuenta = baseDeDatos.get(data.cuentaId);
    console.log(`tx: ${data.tx}, saldo en cuenta: ${cuenta?.saldo}`);

    if (!cuenta) {
      data.status = 'error';
      return { exito: false, status: data.status, mensaje: 'Cuenta no encontrada', tx: data.tx, cuentaId: data.cuentaId };
    }

    // Simulamos latencia de red/base de datos
    await sleep(100); // ⚠️ AQUÍ ESTÁ EL PELIGRO

    // PASO 2: Validamos la regla de negocio
    if (data.monto > cuenta.saldo) {
      console.log(`tx: ${data.tx} Error monto: ${data.monto} saldo: ${cuenta?.saldo} saldo insuficiente`);
      data.status = 'error';
      return { exito: false, status: data.status, mensaje: 'Saldo insuficiente', tx: data.tx, cuentaId: data.cuentaId };
    }

    // PASO 3: Calculamos el nuevo estado
    const nuevoSaldo = cuenta.saldo - data.monto;

    // Más latencia simulada
    await sleep(50);

    // PASO 4: Guardamos el nuevo estado (ESCRITURA)
    // ⚠️ PROBLEMA: ¿Y si alguien MÁS modificó la cuenta entre PASO 1 y PASO 4?
    console.log(`tx: ${data.tx} Actualizando Nuevo Saldo: ${nuevoSaldo}`);
    data.status = 'success';
    baseDeDatos.set(data.cuentaId, {
      ...cuenta,
      saldo: nuevoSaldo,
    });
    
    return {
      exito: true,
      status: data.status,
      mensaje: `Retiro exitoso. Nuevo saldo: $${nuevoSaldo}`,
      tx: data.tx,
      cuentaId: data.cuentaId,
    };

  } catch (error) {
    // • Fuga en Crash: Si tx: 4 lanza el error crítico (el que re-lanzas en el catch), el flujo se rompe, sale de la función, y nunca llegas a la lógica de limpieza del cliente. Ese lock queda zombie. 🧟
    // Esto es para simular cuando el servidor se cae y no alcanza a dar una respuesta. El Locke no queda zombies, se va a limpiar con el templo live. 
    console.log(`tx: ${data.tx} ${error}`);
    if (data.tx === 4) throw error;
    data.status = 'error';
    return { exito: false, status: data.status, mensaje: '500 Server Error', tx: data.tx, cuentaId: data.cuentaId };
  } finally {
    // Ahora la limpieza del cash ya es interna. 
    // Pero, no sé por qué ahora esta función ya no es pura. Tiene este efecto secundario: que tal vez sea necesario. 
    if (data.status !== 'locked') {
      cache.delete(data.cuentaId);
    }
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

  const cache = new Redis();

  console.log('='.repeat(70));
  console.log('📊 Estado inicial: $1000');
  console.log('🎯 Intentando 3 retiros de $800 cada uno simultáneamente...');
  console.log('='.repeat(70));


  let transactions: { cuentaId: string; monto: number; tx: number; status: Status }[] = [
    { cuentaId: 'cuenta-001', monto: 800, tx: 1, status: 'pending' },
    { cuentaId: 'cuenta-001', monto: 800, tx: 2, status: 'pending' },
    { cuentaId: 'cuenta-001', monto: 800, tx: 3, status: 'pending' },
    { cuentaId: 'cuenta-001', monto: 800, tx: 4, status: 'pending' },
  ];

  const successTransactions: RetiroResponse[] = [];
  const errorTransactions: Error[] = [];

  while (transactions.length > 0) {
    const transactionPromises = transactions.map(transaction =>
      retirarDineroInseguro(transaction, cache)
    );
    const responses = await Promise.allSettled(transactionPromises);
    const [fullfilled, rejected] = responses.reduce(([fullfilled, rejected], response) => {
      if (response.status === 'fulfilled') {
        fullfilled.push(response.value);
      } else {
        rejected.push(response.reason);
      }
      return [fullfilled, rejected];
    }, [[] as { exito: boolean; status: Status; mensaje: string; tx: number, cuentaId: string }[], [] as Error[]]);

    const success = fullfilled.filter(tx => ['success', 'error'].includes(tx.status));

    successTransactions.push(...success);
    errorTransactions.push(...rejected);

    const lockedTx = fullfilled.filter(tx => tx.status === 'locked');
    const lockedTxIds = lockedTx.map(tx => tx.tx);
    transactions = transactions.filter(tx => lockedTxIds.includes(tx.tx));
  }

  console.log('='.repeat(70));

  console.log('✅ Transacciones con respuesta controlada:');
  successTransactions.forEach(retiro => console.log(retiro));

  console.log('='.repeat(70));

  console.log('❌ Transacciones con errores no capturados:');
  errorTransactions.forEach(retiro => console.log(retiro));

  console.log('='.repeat(70));

  const cuentaFinal = baseDeDatos.get('cuenta-001')!;
  console.log(`💰 Saldo final: $${cuentaFinal.saldo}`);
  console.log('='.repeat(70));
}

demostrarRaceCondition();

export { }
