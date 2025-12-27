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

const universalRetry = async (operation: any, options: RetryOptions) => {
  const maxRetries = options?.maxRetries || 3;
  
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    await sleep(jitter())

    const operetion = await operation()
  
    if (operetion.success) {
      return {success: true, data: operetion.data}
    }

    const retry = options?.isRetry(operetion.error)

    if (!retry) return {success: false, error: operetion.error}
    
    lastError = operetion.error
    await sleep((2 ** i) * 1000)
  }

  return {
    success: false,
    error: lastError
  }
}

async function retirarDineroResiliente(
  transactions: { id: string, cuentaId: string, monto: number }[],
  db: IDatabase,
  options?: { maxRetries: number }
): Promise<{
  success: {success: true, data: {transactionId: string, account: CuentaBancaria} }[]
  failed: {success: false, error: TransactionErrorType, transactionId: string }[]
}> {

  const reponse = await Promise.all(transactions.map(
    (transaction) => universalRetry(
      async () => {
        try {
          return await retirarDineroVersionControl(transaction, db)
        } catch (error) {
          return {success: false, error: 'serverError', transactionId: transaction.id}
        }
      },
      {
        maxRetries: 2,
        isRetry: (error) => error === 'versionMismatch'
      }
    )
  ));

  const fulfilledTransactions = reponse.filter((tx: any) => tx.success) as {success: true, data: {transactionId: string, account: CuentaBancaria} }[]
  const rejectedTransactions = reponse.filter((tx: any) => !tx.success) as {success: false, error: TransactionErrorType, transactionId: string }[]

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
    // console.log(`Retry Attempt: ${result.retry}`)
    const txId = result.success ? result.data.transactionId : result.id;
    console.log(`👤 tx ${txId}: ${JSON.stringify(result, null, 2)}`);
  })

  console.log('❌ Transacciones fallidas:');
  failed.forEach((result) => {
    // console.log(`Retry Attempt: ${result.retry}`)
    console.log(`👤 tx ${result.transactionId}: ${result.error}`);
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
