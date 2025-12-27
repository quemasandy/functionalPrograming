type CuentaBancaria = {
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

type ErrorResultTransaction<E> = { success: false; error: E } & ITransaction;

type ResultTransaction<T, E> =
  | { success: true; data: { transactionId: string, account: T } }
  | ErrorResultTransaction<E>;

type DbErrorType = 'versionMismatch' | 'accountNotFound' | 'accountAlreadyExists';
type TransactionErrorType = 'insufficientFunds' | 'serverError' | DbErrorType;

interface IDatabase {
  create(id: string, data: CuentaBancaria): Promise<ResultDb<CuentaBancaria, DbErrorType>>;
  getById(id: string): Promise<ResultDb<CuentaBancaria, DbErrorType>>;
  updateIfVersionMatches(id: string, data: CuentaBancaria): Promise<ResultDb<CuentaBancaria, DbErrorType>>;
}

class MemoryDb implements IDatabase {
  private db: Map<string, CuentaBancaria> = new Map();

  constructor() {
    this.db = new Map();
  }

  async create(id: string, data: CuentaBancaria): Promise<ResultDb<CuentaBancaria, DbErrorType>> {
    if (this.db.has(id)) {
      return { success: false, error: 'accountAlreadyExists' };
    }
    this.db.set(id, data);
    return { success: true, data };
  }

  async getById(id: string): Promise<ResultDb<CuentaBancaria, DbErrorType>> {
    const cuenta = this.db.get(id);
    if (!cuenta) {
      return { success: false, error: 'accountNotFound' };
    }
    return { success: true, data: cuenta };
  }

  async updateIfVersionMatches(id: string, data: CuentaBancaria): Promise<ResultDb<CuentaBancaria, DbErrorType>> {
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

async function retirarDineroVersionControl(
  transaction: ITransaction,
  db: IDatabase
): Promise<ResultTransaction<CuentaBancaria, TransactionErrorType>> {
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
  await sleep(100); // ⚠️ AQUÍ ESTÁ EL PELIGRO

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

// ============================================================================
// 🔄 GENERIC RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================
// Un helper reutilizable para reintentar operaciones con backoff exponencial.
// Funciona con cualquier operación que retorne Result<T, E>.
// ============================================================================

/**
 * Resultado genérico de un retry: o exitoso, o falló todos los intentos.
 * 
 * - `success: true` → La operación eventualmente tuvo éxito
 * - `success: false` → Se agotaron los reintentos o el error no era retriable
 */
type RetryResult<T, E> =
  | { success: true; data: T; attempts: number }
  | { success: false; error: E; attempts: number; wasRetriable: boolean };

/**
 * Opciones de configuración para el retry.
 * Todos los campos son opcionales con defaults sensatos.
 */
type RetryOptions<E> = {
  maxRetries?: number;        // Máximo de reintentos (default: 3)
  baseDelayMs?: number;       // Delay base en ms (default: 1000)
  maxDelayMs?: number;        // Delay máximo en ms (default: 30000)
  shouldRetry: (error: E) => boolean;  // Predicado: ¿este error es retriable?
  onRetry?: (attempt: number, error: E, nextDelayMs: number) => void;  // Callback para logging
};

// Defaults basados en estándares de la industria (AWS, Stripe, etc.)
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
} as const;

/**
 * Genera jitter aleatorio para evitar "thundering herd"
 * Retorna un valor entre 0 y 1000ms
 */
function jitter(): number {
  return Math.floor(Math.random() * 1000);
}

/**
 * Calcula el delay con backoff exponencial + jitter
 * Formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const delayWithJitter = exponentialDelay + jitter();
  return Math.min(delayWithJitter, maxDelayMs);
}

/**
 * 🎯 HELPER PRINCIPAL: Reintenta una operación con backoff exponencial
 * 
 * @param operation - Función async que retorna Result<T, E>
 * @param options - Opciones de configuración
 * @returns RetryResult con el resultado final y metadata
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => db.updateIfVersionMatches(id, data),
 *   { 
 *     shouldRetry: (err) => err === 'versionMismatch',
 *     onRetry: (attempt, err) => console.log(`Retry ${attempt}: ${err}`)
 *   }
 * );
 */
async function retryWithBackoff<T, E>(
  operation: () => Promise<{ success: true; data: T } | { success: false; error: E }>,
  options: RetryOptions<E>
): Promise<RetryResult<T, E>> {
  const {
    maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries,
    baseDelayMs = DEFAULT_RETRY_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_RETRY_OPTIONS.maxDelayMs,
    shouldRetry,
    onRetry,
  } = options;

  let lastError: E | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await operation();

    if (result.success) {
      return { success: true, data: result.data, attempts: attempt + 1 };
    }

    lastError = result.error;
    const isRetriable = shouldRetry(result.error);

    // Si el error NO es retriable, no tiene sentido reintentar
    if (!isRetriable) {
      return {
        success: false,
        error: result.error,
        attempts: attempt + 1,
        wasRetriable: false
      };
    }

    // Si ya agotamos los reintentos, salimos
    if (attempt >= maxRetries) {
      break;
    }

    // Calcular delay y esperar antes del siguiente intento
    const delayMs = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs);

    // Callback para logging/monitoreo
    if (onRetry) {
      onRetry(attempt + 1, result.error, delayMs);
    }

    await sleep(delayMs);
  }

  return {
    success: false,
    error: lastError!,
    attempts: maxRetries + 1,
    wasRetriable: true
  };
}

// ============================================================================
// 🛠️ HELPER UTILITIES
// ============================================================================

/**
 * Helper para crear un predicado a partir de una lista de errores retriables.
 * Hace que la opción B (predicado) sea tan fácil de usar como la opción A (lista).
 * 
 * @example
 * const isRetriable = isOneOf('versionMismatch', 'timeout');
 * retryWithBackoff(op, { shouldRetry: isRetriable });
 */
const isOneOf = <E>(...retriableErrors: E[]) =>
  (error: E): boolean => retriableErrors.includes(error);

// ============================================================================

async function demostrarRaceConditionVersion(
  transactions: { id: string, cuentaId: string, monto: number }[],
  db: IDatabase
): Promise<{
  fulfilled: ResultTransaction<CuentaBancaria, TransactionErrorType>[],
  rejected: CustomError[]
}
> {
  const promises = transactions.map(transaction =>
    retirarDineroVersionControl(transaction, db)
  );

  const results = await Promise.allSettled(promises);

  const fulfilled = results.filter(result => result.status === 'fulfilled').map(result => result.value)
  const rejected = results.filter(result => result.status === 'rejected').map(result => result.reason)

  return {
    fulfilled,
    rejected
  }
}

// ============================================================================
// 🎯 USO DEL HELPER: Operación individual con retry
// ============================================================================

/**
 * Ejemplo de uso del helper para una sola transacción.
 * Muestra cómo usar retryWithBackoff para una operación individual.
 */
async function retirarDineroConRetry(
  transaction: ITransaction,
  db: IDatabase
): Promise<RetryResult<{ transactionId: string; account: CuentaBancaria }, TransactionErrorType>> {
  return retryWithBackoff(
    // La operación a reintentar (debe retornar Result<T, E>)
    // ⚠️ Wrapeamos en try-catch para convertir excepciones a errores de Result
    async () => {
      try {
        const result = await retirarDineroVersionControl(transaction, db);
        if (result.success) {
          return { success: true, data: result.data };
        }
        return { success: false, error: result.error };
      } catch (error) {
        // Los errores thrown se capturan y convierten a Result
        // Esto los hace VISIBLES en lugar de propagarse como excepciones
        console.error(`⚠️ Excepción capturada en tx ${transaction.id}:`, error);
        return { success: false, error: 'serverError' as TransactionErrorType };
      }
    },
    {
      // Solo reintentamos versionMismatch (errores transientes)
      // serverError NO se reintenta automáticamente (podría ser un bug)
      shouldRetry: (err: TransactionErrorType) => err === 'versionMismatch',

      // Callback para logging/monitoreo (los errores NO se pierden)
      onRetry: (attempt, error, delayMs) => {
        console.log(`🔄 Retry #${attempt} para tx ${transaction.id}: ${error} (esperando ${delayMs}ms)`);
      },
    }
  );
}

// ============================================================================
// 🎯 USO DEL HELPER: Batch de transacciones con retry individual
// ============================================================================

/**
 * Procesa múltiples transacciones, reintentando cada una individualmente.
 * Composición: usa retirarDineroConRetry internamente.
 */
async function retirarDineroResiliente(
  transactions: ITransaction[],
  db: IDatabase
): Promise<{
  successful: RetryResult<{ transactionId: string; account: CuentaBancaria }, TransactionErrorType>[],
  failed: RetryResult<{ transactionId: string; account: CuentaBancaria }, TransactionErrorType>[]
}> {
  // Ejecutamos todas las transacciones en paralelo con retry individual
  const results = await Promise.all(
    transactions.map(tx => retirarDineroConRetry(tx, db))
  );

  // Separamos éxitos de fallos
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  return { successful, failed };
}

async function main() {
  console.log('='.repeat(70));
  console.log('❌ DEMOSTRACIÓN: VERSION LOCKING EN ACCIÓN');
  console.log('='.repeat(70));

  console.log('📊 Inicializando base de datos');
  console.log('🎯 Intentando retiros simultáneos...');

  const db = new MemoryDb();

  db.create('cuenta-001', {
    id: 'cuenta-001',
    titular: 'Juan',
    saldo: 2500,
    version: 0,
  });

  const transactions = [
    { id: '001', cuentaId: 'cuenta-001', monto: 800 },
    { id: '002', cuentaId: 'cuenta-001', monto: 800 },
    { id: '003', cuentaId: 'cuenta-001', monto: 800 },
    { id: '004', cuentaId: 'cuenta-001', monto: 800 },
    { id: '005', cuentaId: 'cuenta-001', monto: 800 },
  ]

  const { successful, failed } = await retirarDineroResiliente(transactions, db)

  console.log('\n✅ Transacciones exitosas:');
  successful.forEach((result) => {
    if (result.success) {
      console.log(`👤 tx ${result.data.transactionId}: Éxito en ${result.attempts} intento(s)`);
      console.log(`   Saldo: $${result.data.account.saldo}`);
    }
  });

  console.log('\n❌ Transacciones fallidas:');
  failed.forEach((result) => {
    if (!result.success) {
      console.log(`👤 Error: ${result.error} después de ${result.attempts} intento(s)`);
      console.log(`   ¿Era retriable? ${result.wasRetriable}`);
    }
  });

  const cuentaFinal = await db.getById('cuenta-001');

  if (!cuentaFinal.success) {
    return cuentaFinal;
  }

  console.log('='.repeat(70));
  console.log(`💰 Saldo final: $${cuentaFinal.data.saldo}`);
  console.log(`⚠️  Prueba Finalizada.`);
  console.log('='.repeat(70));
}

main();

export { };
