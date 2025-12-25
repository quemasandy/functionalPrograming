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
  removeExpired(): void;
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

  setnx(key: string, value: Lock) {
    // • Lazy Expiration: Modificar setnx para que, si encuentra un lock, verifique si ya caducó antes de decir "bloqueado".
    // • Implementación de TTL Incompleta: Guardas el ttl en el objeto, pero tu método setnx no lo revisa. 
    // Solo verifica this.redis.has(key). Si el lock se queda ahí (zombie), setnx seguirá devolviendo false eternamente 
    // aunque el tiempo haya pasado.
    // Creo que es mala idea que este método sentx if not existe también revise el ttl. 
    // Lo que pasa es que si llega a encontrar un token con el tiempo que aún expiro o sea un token válido, 
    // ok, ¿qué tiene que retornar? Tiene que retornar falso. 
    // Para que con esto el programa principal sepa que existe un lock valido
    // pero si ya expiro no se cuales serian los pasos a seguir 
    // si elimino el lock que ya expiro y devuelvo true el programa continuara una ejeccucion sin lock me va a dar un bug
    // si elimino el lock que ya expiro y devuelvo false el programa reintenta y al reintentar no encuntra el lock y me va a dar un error
    // si decido no hacer nada tengo que devolver false al final del dia existe un lock, expirado puede ser, pero es un lock
    // siempre creo que es mejor idea devolver false al encontrar un lock expirado o vigente
    // ahora lo que podria hacer es actualizar su ttl pero no gano mucho con esto seguira el lock

    // en definitiva creo que es mejor que redis maneje borrar los tokens expirados en un proceso independiente
    // Creo que está bien que devuelva eternamente false, o sea, porque no es responsabilidad de él limpiar los time to libs. 
    // Los time to libs se van a encargar redis, que es un servicio ya externo, ¿no? 
    // Ahora, lo que sí no me gusta es que redis sea un único punto de fallo, pero bueno. 
    // Lazy Expiration: Modificar setnx para que, si encuentra un lock, verifique si ya caducó antes de decir "bloqueado".
    // Supongamos que lo caducó. ¿Cuál debería ser la acción aquí en esta función? 
    
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

  removeExpired() {
    this.redis.forEach((value, key) => {
      console.log('[removeExpired]', value);
      if (value.ttl < Date.now()) {
        this.redis.delete(key);
      }
    });
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
    console.log(`tx: ${data.tx} ${error}`);
    if (data.tx === 4) throw error;
    data.status = 'error';
    return { exito: false, status: data.status, mensaje: '500 Server Error', tx: data.tx, cuentaId: data.cuentaId };
  } finally {
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

    const fullfilledNotLock = fullfilled.filter(tx => tx.status !== 'locked');

    successTransactions.push(...fullfilledNotLock);
    errorTransactions.push(...rejected);

    const lockedTx = fullfilled.filter(tx => tx.status === 'locked');
    const lockedTxIds = lockedTx.map(tx => tx.tx);
    transactions = transactions.filter(tx => lockedTxIds.includes(tx.tx));
  }

  cache.removeExpired();

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
