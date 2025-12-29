type BankAccount = {
  id: string;
  titular: string;
  saldo: number;
  version: number;
};

type ITransaction = {
  id: string,
  cuentaId: string,
  monto: number
}

type ResultDb<T, E> =
  | { success: true; data: T }
  | { success: false; error: E }

type TransactionSuccess = { transactionId: string, account: BankAccount };
type TransactionFail = { success: false; error: TransactionError } & ITransaction;

type ResultTransaction =
  | { success: true; data: TransactionSuccess }
  | TransactionFail;

type DbErrorType = 'versionMismatch' | 'accountNotFound' | 'accountAlreadyExists' | 'serverError';
type TransactionError = DbErrorType | 'insufficientFunds';

type IdempotencyStatus = 'pending' | 'completed';

type IdempotencyEntry<T> = {
  transactionId: string;
  status: IdempotencyStatus;
  result?: T;  // Solo presente cuando status === 'completed'
  createdAt: Date;
};

type IdempotencyMetadata = {
  wasReplayed: boolean;
  originalTimestamp?: Date;
};

type WithIdempotency<T> = T & { idempotent: IdempotencyMetadata };

interface IDatabase {
  create(id: string, data: BankAccount): Promise<ResultDb<BankAccount, DbErrorType>>;
  getById(id: string): Promise<ResultDb<BankAccount, DbErrorType>>;
  updateIfVersionMatches(id: string, data: BankAccount): Promise<ResultDb<BankAccount, DbErrorType>>;
}

class MemoryDb implements IDatabase {
  private db: Map<string, BankAccount> = new Map();

  constructor() {
    this.db = new Map();
  }

  async create(id: string, data: BankAccount): Promise<ResultDb<BankAccount, DbErrorType>> {
    if (this.db.has(id)) {
      return { success: false, error: 'accountAlreadyExists' };
    }
    this.db.set(id, data);
    return { success: true, data };
  }

  async getById(id: string): Promise<ResultDb<BankAccount, DbErrorType>> {
    const cuenta = this.db.get(id);
    if (!cuenta) {
      return { success: false, error: 'accountNotFound' };
    }
    return { success: true, data: cuenta };
  }

  async updateIfVersionMatches(id: string, data: BankAccount): Promise<ResultDb<BankAccount, DbErrorType>> {
    const cuenta = this.db.get(id);
    if (!cuenta) {
      return { success: false, error: 'accountNotFound' };
    }
    if (cuenta.version !== data.version) {
      return { success: false, error: 'versionMismatch' };
    }

    const updatedCuenta = {
      ...data,
      version: data.version + 1,
    };

    this.db.set(id, updatedCuenta);
    return { success: true, data: updatedCuenta };
  }
}

interface IIdempotencyStore<T> {
  // Registra una transacción como "pending" ANTES de ejecutarla
  // Retorna false si ya existe (duplicado detectado)
  registerPending(transactionId: string): Promise<boolean>;

  // Marca la transacción como completada CON su resultado
  markCompleted(transactionId: string, result: T): Promise<void>;

  // Obtiene el entry si existe (para retornar resultado cacheado)
  get(transactionId: string): Promise<IdempotencyEntry<T> | undefined>;
}

class MemoryIdempotencyStore<T> implements IIdempotencyStore<T> {
  private store: Map<string, IdempotencyEntry<T>> = new Map();

  async registerPending(transactionId: string): Promise<boolean> {
    // Si ya existe, es un duplicado
    if (this.store.has(transactionId)) {
      return false;
    }

    // Registrar como pending ANTES de ejecutar
    this.store.set(transactionId, {
      transactionId,
      status: 'pending',
      createdAt: new Date(),
    });

    return true;
  }

  async markCompleted(transactionId: string, result: T): Promise<void> {
    const entry = this.store.get(transactionId);
    if (entry) {
      entry.status = 'completed';
      entry.result = result;
    }
  }

  async get(transactionId: string): Promise<IdempotencyEntry<T> | undefined> {
    return this.store.get(transactionId);
  }
}

class CustomError extends Error {
  public readonly transactionId: string;

  constructor(message: string, transaction: ITransaction) {
    super(message);
    this.transactionId = transaction.id;
  }

  toString() {
    return `Error: ${this.message} - transactionId: ${this.transactionId}`;
  }
}

async function withDrawVersionControl(
  transaction: ITransaction,
  db: IDatabase
): Promise<ResultTransaction> {
  console.log(`Iniciando transacción ${transaction.id}`);
  // PASO 1: Leemos el estado actual (LECTURA)
  const cuenta = await db.getById(transaction.cuentaId);

  if (!cuenta.success) {
    return { success: false, error: cuenta.error, ...transaction };
  }

  // simular error del server
  if (transaction.id === '002') {
    throw new CustomError('serverError', transaction);
  }
  // Simulamos latencia de red/base de datos
  await sleep(1000); // ⚠️ AQUÍ ESTÁ EL PELIGRO

  // PASO 2: Validamos la regla de negocio
  if (transaction.monto > cuenta.data.saldo) {
    return { success: false, error: 'insufficientFunds', ...transaction };
  }

  // PASO 3: Calculamos el nuevo estado
  const nuevoSaldo = cuenta.data.saldo - transaction.monto;

  // Más latencia simulada
  await sleep(50);

  const updatedCuenta = await db.updateIfVersionMatches(transaction.cuentaId, {
    id: transaction.cuentaId,
    titular: cuenta.data.titular,
    saldo: nuevoSaldo,
    version: cuenta.data.version,
  });

  if (!updatedCuenta.success) {
    return { success: false, error: updatedCuenta.error, ...transaction };
  }

  return {
    success: true,
    data: {
      transactionId: transaction.id,
      account: updatedCuenta.data,
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitter() {
  return Math.floor(Math.random() * 1000)
}

function calculateBackOffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponentialBackoff = Math.pow(2, attempt) * baseDelayMs;
  const delay = exponentialBackoff + jitter();
  return Math.min(delay, maxDelayMs);
}

type RetryOptions<E> = {
  maxRetries: number,
  baseDelayMs: number,
  maxDelayMs: number,
  isRetry(error: E): boolean,
  onRetry?: (id: string, attempt: number, error: E, nextDelayMs: number) => void;
}

type RetryResult<T, E> =
  | { success: true; data: T; attempts: number }
  | { success: false; error: E | string; id: string; attempts: number; wasRetriable: boolean };

// const universalRetry = async <T, E>(
//   operation: () => Promise<{ success: true; data: T } | { success: false; error: E; id: string }>,
//   options: RetryOptions<E>
// ): Promise<RetryResult<T, E>> => {
// ¿Cuál es la diferencia entre usar arrow functions y funciones nombradas?

async function universalRetry<T, E>(
  operation: () => Promise<{ success: true; data: T } | { success: false; error: E; id: string }>,
  options: RetryOptions<E>
): Promise<RetryResult<T, E>> {
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    isRetry,
    onRetry
  } = options;

  let lastError: E | string = '';
  let id: string = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {

    const operationData = await operation()

    if (operationData.success) {
      return {
        success: true,
        data: operationData.data,
        attempts: attempt + 1
      }
    }

    id = operationData.id
    const retry = isRetry(operationData.error)

    if (!retry) return {
      success: false,
      error: operationData.error,
      id,
      attempts: attempt + 1,
      wasRetriable: false
    }

    lastError = operationData.error

    const delayMs = calculateBackOffDelay(attempt, baseDelayMs, maxDelayMs)

    if (onRetry) {
      onRetry(id, attempt + 1, lastError, delayMs)
    }

    await sleep(delayMs)
  }

  return {
    success: false,
    error: lastError,
    id,
    attempts: maxRetries,
    wasRetriable: true
  }
}

// Tipo para el resultado con metadata de idempotencia
type IdempotentRetryResult = WithIdempotency<RetryResult<TransactionSuccess, TransactionError>>;

async function withDrawWithRetries(
  transaccion: ITransaction,
  db: IDatabase,
  idempotencyStore: IIdempotencyStore<RetryResult<TransactionSuccess, TransactionError>>
): Promise<IdempotentRetryResult> {

  // ═══════════════════════════════════════════════════════════════════════
  // PASO 1: Verificar si ya existe (duplicado o pending)
  // ═══════════════════════════════════════════════════════════════════════
  //
  const existingEntry = await idempotencyStore.get(transaccion.id);

  if (existingEntry) {
    // Caso A: Ya completada → retornar resultado cacheado
    if (existingEntry.status === 'completed' && existingEntry.result) {
      console.log(`🔄 Tx ${transaccion.id}: Duplicado detectado, retornando resultado cacheado`);
      return {
        ...existingEntry.result,
        idempotent: {
          wasReplayed: true,
          originalTimestamp: existingEntry.createdAt,
        }
      };
    }

    // Caso B: Pending → esperar a que termine y retornar su resultado
    console.log(`⏳ Tx ${transaccion.id}: En estado 'pending', esperando resultado...`);
    return await waitForCompletedResult(transaccion.id, idempotencyStore);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PASO 2: Registrar como pending ANTES de ejecutar
  // ═══════════════════════════════════════════════════════════════════════
  const wasNew = await idempotencyStore.registerPending(transaccion.id);

  // ⚠️ RACE CONDITION: Si no somos los primeros, otra tx ganó la carrera
  if (!wasNew) {
    console.log(`⏳ Tx ${transaccion.id}: Otra transacción ganó la carrera, esperando su resultado...`);
    return await waitForCompletedResult(transaccion.id, idempotencyStore);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PASO 3: Ejecutar la operación con reintentos
  // ═══════════════════════════════════════════════════════════════════════
  const result = await universalRetry(
    async () => {
      try {
        return await withDrawVersionControl(transaccion, db);
      } catch (error) {
        console.error(`⚠️ Excepción capturada en tx ${transaccion.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'unknownError';
        const transactionError = errorMessage as TransactionError;
        return { success: false, error: transactionError, id: transaccion.id };
      }
    },
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10_000,
      isRetry: (error) => ['versionMismatch', 'serverError'].includes(error),
      onRetry: (id, attempt, error, delay) => {
        console.warn(`🔄 Retry #${attempt} for tx ${id}: ${error} (waiting ${delay}ms)`);
      }
    }
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PASO 4: Marcar como completada (éxito O fallo - verdadera idempotencia)
  // ═══════════════════════════════════════════════════════════════════════
  await idempotencyStore.markCompleted(transaccion.id, result);

  return {
    ...result,
    idempotent: {
      wasReplayed: false,
    }
  };
}

// Helper: Esperar con polling hasta que una transacción pending termine
async function waitForCompletedResult(
  transactionId: string,
  store: IIdempotencyStore<RetryResult<TransactionSuccess, TransactionError>>,
  maxWaitMs: number = 30000,
  pollIntervalMs: number = 100
): Promise<IdempotentRetryResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const entry = await store.get(transactionId);

    if (entry?.status === 'completed' && entry.result) {
      console.log(`✅ Tx ${transactionId}: Resultado de transacción original obtenido`);
      return {
        ...entry.result,
        idempotent: {
          wasReplayed: true,
          originalTimestamp: entry.createdAt,
        }
      };
    }

    await sleep(pollIntervalMs);
  }

  // Timeout: la transacción original probablemente crasheó
  throw new Error(`Timeout esperando resultado de tx ${transactionId}`);
}

type RetiroResult = {
  success: IdempotentRetryResult[];
  failed: IdempotentRetryResult[];
}

async function withDrawBatch(
  transactions: ITransaction[],
  db: IDatabase,
  idempotencyStore: IIdempotencyStore<RetryResult<TransactionSuccess, TransactionError>>
): Promise<RetiroResult> {
  const operations = transactions.map(
    (transaction) => withDrawWithRetries(transaction, db, idempotencyStore)
  )

  const response = await Promise.all(operations)
  const { success, failed } = response.reduce(
    (acc, tx) => {
      tx.success ? acc.success.push(tx) : acc.failed.push(tx)
      return acc
    },
    { success: [], failed: [] } as RetiroResult
  )

  return {
    success,
    failed
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔑 DEMOSTRACIÓN: IDEMPOTENCIA REAL EN ACCIÓN');
  console.log('='.repeat(70));

  console.log('📊 Inicializando base de datos e idempotency store');
  console.log('🎯 Intentando retiros simultáneos (incluyendo duplicados)...');

  const db = new MemoryDb();
  const idempotencyStore = new MemoryIdempotencyStore<RetryResult<TransactionSuccess, TransactionError>>();

  db.create('cuenta-001', {
    id: 'cuenta-001',
    titular: 'Juan',
    saldo: 4400,
    version: 0,
  });

  // ⚠️ NOTA: tx '001' aparece DOS VECES - la idempotencia debe detectar el duplicado
  const transactions = [
    { id: '001', cuentaId: 'cuenta-001', monto: 800 },
    { id: '002', cuentaId: 'cuenta-001', monto: 800 },
    { id: '001', cuentaId: 'cuenta-001', monto: 800 }, // ← DUPLICADO
    { id: '003', cuentaId: 'cuenta-001', monto: 800 },
    { id: '004', cuentaId: 'cuenta-001', monto: 800 },
    { id: '005', cuentaId: 'cuenta-001', monto: 800 },
  ]

  const { success, failed } = await withDrawBatch(transactions, db, idempotencyStore)

  console.log('\n✅ Transacciones exitosas:');
  success.forEach((result) => {
    if (result.success) {
      const replayIndicator = result.idempotent.wasReplayed ? '🔄 REPLAYED' : '✨ NEW';
      console.log(`${replayIndicator} | Tx ${result.data.transactionId}`);
      console.log(`    Saldo resultante: $${result.data.account.saldo}`);
      console.log(`    Intentos: ${result.attempts}`);
      if (result.idempotent.originalTimestamp) {
        console.log(`    Timestamp original: ${result.idempotent.originalTimestamp.toISOString()}`);
      }
    }
  })

  console.log('\n❌ Transacciones fallidas:');
  failed.forEach((result) => {
    if (!result.success) {
      const replayIndicator = result.idempotent.wasReplayed ? '🔄 REPLAYED' : '✨ NEW';
      console.log(`${replayIndicator} | Tx ${result.id}: ${result.error}`);
      console.log(`    ¿Era retriable? ${result.wasRetriable}`);
      console.log(`    Intentos: ${result.attempts}`);
    }
  })

  const cuentaFinal = await db.getById('cuenta-001');

  if (!cuentaFinal.success) {
    return cuentaFinal;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`💰 Saldo final: $${cuentaFinal.data.saldo}`);
  console.log(`📊 Transacciones únicas procesadas: ${success.filter(s => !s.idempotent.wasReplayed).length}`);
  console.log(`🔄 Duplicados detectados: ${success.filter(s => s.idempotent.wasReplayed).length + failed.filter(f => f.idempotent.wasReplayed).length}`);
  console.log(`⚠️  Prueba Finalizada.`);
  console.log('='.repeat(70));
}

main();

export { };

