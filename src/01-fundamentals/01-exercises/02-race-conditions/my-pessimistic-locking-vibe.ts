// ============================================================================
// � TIPOS DE DOMINIO
// ============================================================================

type CuentaBancaria = {
  readonly id: string;
  readonly titular: string;
  readonly saldo: number;
  readonly version: number;
};

type ResultadoRetiro =
  | { readonly exito: true; readonly nuevoSaldo: number; readonly mensaje: string }
  | { readonly exito: false; readonly mensaje: string };

type LockResult =
  | { readonly success: true; readonly lockToken: string }
  | { readonly success: false; readonly reason: string };

// ============================================================================
// 🗄️ MEMORY DATABASE - Simula PostgreSQL/MySQL
// ============================================================================

interface Database<T> {
  get(id: string): Promise<T | undefined>;
  set(id: string, value: T): Promise<void>;
  delete(id: string): Promise<boolean>;
}

class MemoryDatabase<T> implements Database<T> {
  private readonly store: Map<string, T> = new Map();

  async get(id: string): Promise<T | undefined> {
    return this.store.get(id);
  }

  async set(id: string, value: T): Promise<void> {
    this.store.set(id, value);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

// ============================================================================
// 🔴 MEMORY CACHE - Simula Redis con SETNX
// ============================================================================

interface Cache {
  /**
   * SETNX (SET if Not eXists) - Operación ATÓMICA
   * @returns true si se seteo (key no existía), false si ya existía
   */
  setIfNotExists(key: string, value: string, ttlMs: number): Promise<boolean>;
  get(key: string): Promise<string | undefined>;
  delete(key: string): Promise<boolean>;
}

class MemoryCache implements Cache {
  private readonly store: Map<string, { value: string; expiresAt: number }> = new Map();

  async setIfNotExists(key: string, value: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.store.get(key);

    // Si existe y no ha expirado → SETNX falla (retorna false)
    if (existing && existing.expiresAt > now) {
      return false;
    }

    // SETNX exitoso
    this.store.set(key, { value, expiresAt: now + ttlMs });
    return true;
  }

  async get(key: string): Promise<string | undefined> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing) return undefined;
    if (existing.expiresAt <= now) {
      this.store.delete(key);
      return undefined;
    }
    return existing.value;
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
}

// ============================================================================
// � LOCKING FUNCTIONS - Enfoque funcional
// ============================================================================

const acquireLock = async (
  cache: Cache,
  resourceId: string,
  ttlMs: number
): Promise<LockResult> => {
  const lockToken = crypto.randomUUID();
  const lockKey = `lock:${resourceId}`;

  const acquired = await cache.setIfNotExists(lockKey, lockToken, ttlMs);

  return acquired
    ? { success: true, lockToken }
    : { success: false, reason: `Resource ${resourceId} is locked` };
};

const releaseLock = async (
  cache: Cache,
  resourceId: string,
  expectedToken: string
): Promise<boolean> => {
  const lockKey = `lock:${resourceId}`;
  const currentToken = await cache.get(lockKey);

  // Solo liberar si el token coincide (evita liberar locks ajenos)
  if (currentToken === expectedToken) {
    return cache.delete(lockKey);
  }
  return false;
};

// ============================================================================
// 🏦 BANKING FUNCTIONS - Enfoque funcional
// ============================================================================

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// ✅ Locking también inyectado para consistencia y testabilidad
type LockingStrategy = {
  readonly acquire: (cache: Cache, resourceId: string, ttlMs: number) => Promise<LockResult>;
  readonly release: (cache: Cache, resourceId: string, expectedToken: string) => Promise<boolean>;
};

type Dependencies = {
  readonly db: Database<CuentaBancaria>;
  readonly cache: Cache;
  readonly locking: LockingStrategy;
};

// ✅ Partial Application: Separamos dependencias (configuración) de datos (operación)
// Paso 1: Inyectar dependencias → retorna función de negocio
const crearServicioRetiro = (deps: Dependencies) => {
  // Paso 2: Esta función solo necesita datos de negocio (closure captura deps)
  return async (cuentaId: string, monto: number): Promise<ResultadoRetiro> => {
    const LOCK_TTL = 5000;

    // PASO 1: Adquirir lock (deps viene del closure)
    const lockResult = await deps.locking.acquire(deps.cache, cuentaId, LOCK_TTL);
    if (!lockResult.success) {
      return { exito: false, mensaje: `No se pudo adquirir lock: ${lockResult.reason}` };
    }

    try {
      // PASO 2: Leer cuenta
      const cuenta = await deps.db.get(cuentaId);
      if (!cuenta) return { exito: false, mensaje: 'Cuenta no encontrada' };

      await sleep(100); // Simula latencia

      // PASO 3: Validar
      if (monto > cuenta.saldo) return { exito: false, mensaje: 'Saldo insuficiente' };

      // PASO 4: Actualizar
      const nuevoSaldo = cuenta.saldo - monto;
      await deps.db.set(cuentaId, { ...cuenta, saldo: nuevoSaldo });

      return { exito: true, nuevoSaldo, mensaje: `Retiro exitoso. Nuevo saldo: $${nuevoSaldo}` };
    } finally {
      // PASO 5: Liberar lock
      await deps.locking.release(deps.cache, cuentaId, lockResult.lockToken);
    }
  };
};

// ============================================================================
// 🧪 DEMO
// ============================================================================

async function demo(): Promise<void> {
  console.log('='.repeat(60));
  console.log('✅ PESSIMISTIC LOCKING - Enfoque Funcional');
  console.log('='.repeat(60));

  // 1️⃣ Configuración de dependencias (una sola vez al iniciar)
  const deps: Dependencies = {
    db: new MemoryDatabase<CuentaBancaria>(),
    cache: new MemoryCache(),
    locking: {
      acquire: acquireLock,
      release: releaseLock,
    },
  };

  // 2️⃣ Crear servicio de negocio (partial application)
  const retirar = crearServicioRetiro(deps);

  await deps.db.set('cuenta-001', {
    id: 'cuenta-001',
    titular: 'Luigy Muñoz',
    saldo: 1000,
    version: 1,
  });

  console.log('📊 Estado inicial: $1000');
  console.log('🎯 Intentando 2 retiros de $800 con LOCK...\n');

  // 3️⃣ Uso limpio: solo datos de negocio, sin deps
  const [r1, r2] = await Promise.all([
    retirar('cuenta-001', 800),  // ✅ Sin deps!
    retirar('cuenta-001', 800),  // ✅ Sin deps!
  ]);

  console.log(`👤 Retiro 1: ${r1.mensaje}`);
  console.log(`👤 Retiro 2: ${r2.mensaje}`);
  console.log(`💰 Saldo final: $${(await deps.db.get('cuenta-001'))?.saldo}`);
}

demo();

export { };