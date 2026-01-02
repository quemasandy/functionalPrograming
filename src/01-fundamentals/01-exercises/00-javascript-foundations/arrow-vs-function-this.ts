/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎯 MASTERCLASS: Arrow Functions vs Function Declarations
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 📋 Objetivos de aprendizaje:
 * - [ ] Entender la diferencia entre `this` dinámico y `this` léxico
 * - [ ] Saber cuándo usar Arrow Functions vs Function Declarations
 * - [ ] Evitar el bug clásico de pérdida de contexto en callbacks
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 LA DIFERENCIA FUNDAMENTAL
// ═══════════════════════════════════════════════════════════════════════════════
//
//   Function Declaration          Arrow Function
//   ─────────────────────         ──────────────────
//
//   `this` = DINÁMICO             `this` = LÉXICO
//   (depende de QUIÉN llama)      (depende de DÓNDE se definió)
//
//   function foo() {              const foo = () => {
//     console.log(this);            console.log(this);
//   }                             }
//
//   ↓ `this` cambia según         ↓ `this` es el del scope
//     cómo lo llames                donde fue creada
//
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// ❌ ANTIPATRÓN: El Problema Clásico (Function Declaration en callbacks)
// ─────────────────────────────────────────────────────────────────────────────

class PaymentProcessorBad {
  private baseUrl = "https://api.stripe.com";

  processPayment(amount: number) {
    // 🐛 BUG: En el callback, `this` NO es la instancia de PaymentProcessor
    setTimeout(function () {
      // @ts-expect-error - Demostración del bug
      console.log(this.baseUrl);  // ❌ undefined o error!
      // `this` aquí es `window` (browser) o `undefined` (strict mode)
    }, 1000);
  }
}

// const processorBad = new PaymentProcessorBad();
// processorBad.processPayment(100);  // 💥 Error: Cannot read property 'baseUrl' of undefined

/**
 * ¿Por qué falla?
 * ──────────────────────────────────────────────────────────────────
 * Cuando usas function() { ... } dentro de un callback:
 * 
 * 1. setTimeout LLAMA a tu función
 * 2. setTimeout no "sabe" que era un método de tu clase
 * 3. `this` se pierde → apunta a window/undefined
 * ──────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PATRÓN: La Solución (Arrow Function)
// ─────────────────────────────────────────────────────────────────────────────

class PaymentProcessorGood {
  private baseUrl = "https://api.stripe.com";

  processPayment(amount: number) {
    // ✅ Arrow function captura `this` del lugar donde fue definida
    setTimeout(() => {
      console.log(this.baseUrl);  // ✅ "https://api.stripe.com"
      // `this` aquí ES la instancia de PaymentProcessor
    }, 1000);
  }
}

const processorGood = new PaymentProcessorGood();
processorGood.processPayment(100);  // ✅ Funciona perfectamente


// ═══════════════════════════════════════════════════════════════════════════════
// 🎓 REGLA DE ORO - CUÁNDO USAR CADA UNO
// ═══════════════════════════════════════════════════════════════════════════════
//
// ┌──────────────────────────────────────────┬─────────────┬──────────────────────────────────────┐
// │ Situación                                │ Usa         │ Por qué                              │
// ├──────────────────────────────────────────┼─────────────┼──────────────────────────────────────┤
// │ Callbacks dentro de clases               │ () => {}    │ Captura `this` de la clase           │
// │ Event handlers en clases                 │ () => {}    │ Mantiene referencia a la instancia   │
// │ Array methods (map, filter, etc.)        │ () => {}    │ Más conciso + captura `this`         │
// │ Métodos que necesitan `this` dinámico    │ function    │ Permite re-binding                   │
// │ Funciones de nivel superior (utilities)  │ function    │ Hace hoisting + más claro            │
// │ Constructores                            │ function    │ Arrow functions NO pueden ser const. │
// └──────────────────────────────────────────┴─────────────┴──────────────────────────────────────┘
//
// ═══════════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ARROW FUNCTIONS: Ejemplos de cuándo usarlas
// ─────────────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  isActive: boolean;
}

class UserService {
  users: User[] = [
    { id: '1', name: 'Alice', isActive: true },
    { id: '2', name: 'Bob', isActive: false },
    { id: '3', name: 'Charlie', isActive: true },
  ];

  // 1. Callbacks en métodos de clase
  findActive(): User[] {
    return this.users.filter(u => u.isActive);  // ✅ Conciso
  }

  // 2. Callbacks de Array methods
  getUserNames(): string[] {
    return this.users.map(u => u.name);  // ✅ Arrow para transformaciones
  }

  // 3. Async callbacks
  async fetchAll(): Promise<void> {
    // Simulación
    await Promise.resolve().then(() => {
      console.log(`Loaded ${this.users.length} users`);  // ✅ `this` correcto
    });
  }
}

// 4. Funciones cortas inline
const add = (a: number, b: number): number => a + b;
const multiply = (a: number, b: number): number => a * b;

// 5. Composición funcional
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (a: A): C => f(g(a));

const addOne = (n: number): number => n + 1;
const double = (n: number): number => n * 2;

const addOneThenDouble = compose(double, addOne);
console.log("compose(double, addOne)(5) =", addOneThenDouble(5));  // 12


// ─────────────────────────────────────────────────────────────────────────────
// 🔵 FUNCTION DECLARATION: Ejemplos de cuándo usarlas
// ─────────────────────────────────────────────────────────────────────────────

// 1. Funciones que necesitan hoisting (puedes llamarlas antes de definirlas)
console.log("sum(2, 3) =", sum(2, 3));  // ✅ Funciona, declaración es "elevada"

function sum(a: number, b: number): number {
  return a + b;
}

// 2. Generadores
function* numberGenerator(): Generator<number> {
  yield 1;
  yield 2;
  yield 3;
}

// 3. Funciones recursivas con nombre claro (mejor stack traces)
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);  // nombre visible en stack traces
}

console.log("factorial(5) =", factorial(5));  // 120


// ═══════════════════════════════════════════════════════════════════════════════
// 🏦 EJEMPLO FINANCIERO COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
}

interface Receipt {
  transactionId: string;
  timestamp: Date;
  amount: number;
}

type Result<T> = { success: true; value: T } | { success: false; error: string };

class TransactionProcessor {
  private ledger: Transaction[] = [];
  private readonly serviceName = "PaymentService";

  // ✅ Método normal - function syntax implícita en clases
  processTransaction(tx: Transaction): Promise<Result<Receipt>> {
    return this.validateTransaction(tx)
      .then(validated => {
        // ✅ Arrow: captura `this` de processTransaction
        return this.executePayment(validated);
      })
      .then(result => {
        // ✅ Arrow: sigue capturando el `this` correcto
        this.ledger.push({ ...tx, status: 'completed' });
        this.logSuccess(result);
        return { success: true as const, value: result };
      })
      .catch(error => {
        // ✅ Arrow: `this` sigue siendo la instancia
        this.logError(error);
        return { success: false as const, error: error.message };
      });
  }

  private validateTransaction(tx: Transaction): Promise<Transaction> {
    if (tx.amount <= 0) {
      return Promise.reject(new Error("Invalid amount"));
    }
    return Promise.resolve(tx);
  }

  private executePayment(tx: Transaction): Promise<Receipt> {
    return Promise.resolve({
      transactionId: tx.id,
      timestamp: new Date(),
      amount: tx.amount
    });
  }

  private logSuccess(result: Receipt): void {
    console.log(`[${this.serviceName}] ✅ Success:`, result.transactionId);
  }

  private logError(error: Error): void {
    console.error(`[${this.serviceName}] ❌ Error:`, error.message);
  }

  getLedger(): readonly Transaction[] {
    return this.ledger;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ EN PROGRAMACIÓN FUNCIONAL
// ═══════════════════════════════════════════════════════════════════════════════
//
// En FP puro, **casi siempre usamos Arrow Functions** porque:
//
// 1. No usamos `this` - Las funciones puras no dependen de contexto externo
// 2. Son expresiones - Se pueden asignar, pasar como argumentos
// 3. Composición natural - `const composed = f => g => x => f(g(x))`
//
// ═══════════════════════════════════════════════════════════════════════════════

// Ejemplo de estilo FP puro: Todo arrows, sin this
type Money = { amount: number; currency: string };
type UserId = string;
type Config = { apiKey: string; baseUrl: string };

// Curried function - cada arrow devuelve otra función
const validateAmount = (money: Money): Result<Money> =>
  money.amount > 0
    ? { success: true, value: money }
    : { success: false, error: "Amount must be positive" };

// Composición sin `this`
const pipe = <A, B, C>(
  f: (a: A) => B,
  g: (b: B) => C
) => (a: A): C => g(f(a));

const toUpperCase = (s: string): string => s.toUpperCase();
const addExclamation = (s: string): string => s + "!";

const shout = pipe(toUpperCase, addExclamation);
console.log("shout('hello') =", shout("hello"));  // "HELLO!"


// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 RESUMEN VISUAL - ÁRBOL DE DECISIÓN
// ═══════════════════════════════════════════════════════════════════════════════
//
//                    ¿Estás dentro de una clase/objeto?
//                                 │
//                       ┌─────────┴─────────┐
//                       ▼                   ▼
//                      SÍ                  NO
//                       │                   │
//                       ▼                   ▼
//                  ¿Es un               ¿Necesitas
//                  callback?            hoisting?
//                       │                   │
//                  ┌────┴────┐         ┌────┴────┐
//                  ▼         ▼         ▼         ▼
//                 SÍ        NO        SÍ        NO
//                  │         │         │         │
//                  ▼         ▼         ▼         ▼
//               Arrow     Method    function   Arrow
//               () =>       o       function   () =>
//                         method
//
// ═══════════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CONCLUSIÓN
// ═══════════════════════════════════════════════════════════════════════════════
//
// ┌─────────────────────────────────────────┬────────────────────────────────────┐
// │ Si haces...                             │ Usa                                │
// ├─────────────────────────────────────────┼────────────────────────────────────┤
// │ Programación Funcional pura             │ 🟢 Arrow Functions 99% del tiempo  │
// │ OOP con clases                          │ 🟢 Arrows para callbacks           │
// │ Utilities/helpers de nivel superior     │ 🔵 Function declarations           │
// └─────────────────────────────────────────┴────────────────────────────────────┘
//
// En Programación Funcional → Prácticamente siempre Arrow Functions
// porque no dependemos de `this`.
//
// ═══════════════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
// 🧪 DEMO: Ejecutar ejemplos
// ─────────────────────────────────────────────────────────────────────────────

async function runDemo() {
  console.log("\n═══ DEMO: Arrow vs Function ═══\n");

  // UserService demo
  const userService = new UserService();
  console.log("Active users:", userService.findActive().map(u => u.name));
  console.log("All names:", userService.getUserNames());

  // TransactionProcessor demo
  const processor = new TransactionProcessor();
  const tx: Transaction = {
    id: 'tx-001',
    amount: 150,
    currency: 'USD',
    status: 'pending'
  };

  const result = await processor.processTransaction(tx);
  console.log("Transaction result:", result);
  console.log("Ledger:", processor.getLedger());
}

runDemo();
