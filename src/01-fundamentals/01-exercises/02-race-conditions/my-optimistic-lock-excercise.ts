
type Inventario = {
  readonly cantidad: number;
  readonly version: number
};

type ResponseSuccess<T> = {
  success: true;
  data: T;
};

type ResponseError = {
  success: false;
  error: string;
};

type Response<T> =
  | ResponseSuccess<T>
  | ResponseError;

type Metadata = {
  metadata?: {
    retries?: number;
    txId?: number;
    errorsStack?: string[];
  }
};

type RetryResponse<T> =
  | ResponseSuccess<T> & Metadata
  | ResponseError & Metadata;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function procesarPago() {
  await sleep(100);
}

async function WithRetry<T>(
  fn: () => Promise<Response<T>>,
  options: {
    retries: number;
    isRetryableError?: (error: string) => boolean;
    logger?: (message: string) => void;
  }
): Promise<RetryResponse<T>> {
  const saveFn = async (): Promise<Response<T>> => {
    try {
      return await fn()
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "UnknownError" }
    }
  };

  const errorsStack: string[] = [];
  let lastError: string = "withoutAttempts";

  for (let i = 0; i < options.retries; i++) {
    const result = await saveFn();
    if (result.success) {
      return { ...result, metadata: { retries: i } };
    }

    lastError = result.error;
    errorsStack.push(lastError);

    const isRetryable = options.isRetryableError && options.isRetryableError(lastError);
    if (!isRetryable) {
      return { success: false, error: lastError, metadata: { retries: i + 1, errorsStack } };
    }

    if (options.logger) {
      options.logger(`Retry ${i + 1} failed: ${result.error}`);
    }
  }

  return { success: false, error: lastError, metadata: { retries: options.retries, errorsStack } };
}

let inventario: Inventario = { cantidad: 10, version: 1 };

async function comprarProducto(data: { txId: number, cantidad: number }): Promise<Response<Inventario>> {
  console.log('[comprarProducto]', data.txId);

  const versionActual = inventario.version;

  if (inventario.cantidad < data.cantidad) {
    return { success: false, error: "InsuficientQuantity" };
  }

  await procesarPago();
  if (data.txId === 3) throw new Error("Fraud");

  if (versionActual !== inventario.version) {
    return { success: false, error: "VersionMissMatch" };
  }

  const newInventario = {
    ...inventario,
    cantidad: inventario.cantidad - data.cantidad,
    version: inventario.version + 1,
  };
  inventario = newInventario;

  return { success: true, data: inventario };
}


async function comprarProductoWithRetry(data: { txId: number, cantidad: number }): Promise<RetryResponse<Inventario>> {
  const result = await WithRetry(
    () => comprarProducto(data),
    {
      retries: 3,
      isRetryableError: (error) => ["VersionMissMatch"].includes(error),
      logger: (message) => console.warn(`[logger] ${message}`)
    }
  );

  return {
    ...result,
    metadata: {
      retries: result.metadata?.retries,
      txId: data.txId,
      ...(!result.success && { errorsStack: result.metadata?.errorsStack }),
    }
  };
}

async function main() {
  const result = await Promise.all([
    comprarProductoWithRetry({ txId: 1, cantidad: 3 }),
    comprarProductoWithRetry({ txId: 2, cantidad: 3 }),
    comprarProductoWithRetry({ txId: 3, cantidad: 3 }),
    comprarProductoWithRetry({ txId: 4, cantidad: 3 }),
    comprarProductoWithRetry({ txId: 5, cantidad: 3 }),
    comprarProductoWithRetry({ txId: 6, cantidad: 3 }),
    comprarProductoWithRetry({ txId: 7, cantidad: 3 }),
  ]);
  result.forEach((r) => {
    if (r.success) {
      console.log("compra exitosa", r.data, r.metadata);
    } else {
      console.log("compra fallida", r.error, r.metadata);
    }
  });
  console.log("=".repeat(70));
  console.log("Inventario Last State", inventario);
  console.log("=".repeat(70));
}

main();

export { }
//  PISTAS:
//  1. Convierte `inventario` en un objeto con `{ cantidad: number, version: number }`
//  2. Al intentar la compra, guarda la versión actual
//  3. Antes de actualizar, verifica que la versión no haya cambiado
//  4. Si cambió, reintenta la operación
