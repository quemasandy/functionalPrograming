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

type DbErrorType = 'versionMismatch' | 'accountNotFound' | 'accountAlreadyExists' | 'serverError';
type TransactionErrorType = 'insufficientFunds' | DbErrorType;

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

type RetryOptions = {
  maxRetries?: number,
  isRetry(error: TransactionErrorType): boolean
}

type OperationResult =
  | { success: true, data: { transactionId: string, account: CuentaBancaria } }
  | { success: false, error: TransactionErrorType, id: string }

type UniversalRetry = (
  operation: () => Promise<OperationResult>,
  options: RetryOptions
) => Promise<OperationResult>

const universalRetry: UniversalRetry = async (operation, options) => {
  const maxRetries = options?.maxRetries || 3;

  let lastError: TransactionErrorType = 'serverError';
  let id: string = '';

  for (let i = 0; i < maxRetries; i++) {

    const operationData = await operation()

    if (operationData.success) {
      return operationData
    }

    const retry = options?.isRetry(operationData.error)
    
    if (!retry) return operationData

    await sleep(jitter())
    
    lastError = operationData.error
    id = operationData.id
    await sleep((2 ** i) * 1000)
  }

  return {
    success: false,
    error: lastError,
    id
  }
}

async function retirarDineroResiliente(
  transactions: { id: string, cuentaId: string, monto: number }[],
  db: IDatabase,
  options?: { maxRetries: number }
): Promise<{
  success: { success: true, data: { transactionId: string, account: CuentaBancaria } }[]
  failed: { success: false, error: TransactionErrorType, id: string }[]
}> {
  const operations = transactions.map((transaction) =>
    universalRetry(
      async () => {
        try {
          return await retirarDineroVersionControl(transaction, db)
        } catch (error) {
          return { success: false, error: 'serverError', id: transaction.id }
        }
      },
      {
        maxRetries: 2,
        isRetry: (error) => error === 'versionMismatch'
      }
    )
  )

  const reponse = await Promise.all(operations)
  const fulfilledTransactions = reponse.filter((tx) => tx.success)
  const rejectedTransactions = reponse.filter((tx) => !tx.success)

  return {
    success: fulfilledTransactions,
    failed: rejectedTransactions
  }
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

  const { success, failed } = await retirarDineroResiliente(transactions, db)

  console.log('✅ Transacciones procesadas:');
  success.forEach((result) => {
    const txId = result.data.transactionId;
    console.log(`👤 tx ${txId}: ${JSON.stringify(result, null, 2)}`);
  })

  console.log('❌ Transacciones fallidas:');
  failed.forEach((result) => {
    const txId = result.id;
    console.log(`👤 tx ${txId}: ${result.error}`);
  })

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
