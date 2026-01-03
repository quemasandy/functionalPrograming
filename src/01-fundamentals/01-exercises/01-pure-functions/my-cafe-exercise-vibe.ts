interface CreditCard {
  readonly number: string;
  readonly holder: string;
}

interface Coffee {
  readonly size: "small" | "medium" | "large";
  readonly price: number; // en centavos (evitamos floats para dinero)
}

interface Charge {
  readonly cc: CreditCard;
  readonly amount: number; // en centavos
}

// ============================================================================
// 🧪 TU TURNO: Implementa las funciones puras
// ============================================================================

/**
 * EJERCICIO 1: Combinar dos cargos
 * 
 * Si ambos cargos son para la MISMA tarjeta, combínalos sumando los montos.
 * Si son para tarjetas DIFERENTES, lanza un error.
 * 
 * 💡 Pista: Compara cc.number para determinar si son la misma tarjeta.
 * 
 * @example
 * const c1: Charge = { cc: aliceCard, amount: 350 };
 * const c2: Charge = { cc: aliceCard, amount: 450 };
 * combine(c1, c2) // → { cc: aliceCard, amount: 800 }
 */

type CafeError =
  | { readonly _tag: "NoChargesProvided" }
  | { readonly _tag: "CardMismatch"; readonly cards: readonly CreditCard[] }
  | { readonly _tag: "CoffeePurchaseFailed"; readonly reason: string }
  | { readonly _tag: "MultiplePurchasesFailed"; readonly errors: readonly CafeError[] };

// Constructores - Facilitan crear errores con type inference
const CafeError = {
  noCharges: (): CafeError => ({ _tag: "NoChargesProvided" }),
  cardMismatch: (cards: readonly CreditCard[]): CafeError => ({ _tag: "CardMismatch", cards }),
  purchaseFailed: (reason: string): CafeError => ({ _tag: "CoffeePurchaseFailed", reason }),
  multipleFailed: (errors: readonly CafeError[]): CafeError => ({ _tag: "MultiplePurchasesFailed", errors }),
} as const;

/**
 * Result tipado con errores estructurados
 */
type Success<T> = { readonly _tag: "Success"; readonly value: T };
type Failure<E> = { readonly _tag: "Failure"; readonly error: E };
type Result<T, E = CafeError> = Success<T> | Failure<E>;

// Constructores para Result
const Result = {
  success: <T>(value: T): Result<T, never> => ({ _tag: "Success", value }),
  failure: <E>(error: E): Result<never, E> => ({ _tag: "Failure", error }),
} as const;

/**
 * 🔍 Helper para pattern matching exhaustivo de errores
 * El compilador te avisa si olvidas manejar un caso
 */
function formatCafeError(error: CafeError): string {
  switch (error._tag) {
    case "NoChargesProvided":
      return "No se proporcionaron cargos";
    case "CardMismatch":
      return `Tarjetas diferentes: ${error.cards.map(c => c.holder).join(", ")}`;
    case "CoffeePurchaseFailed":
      return `Compra fallida: ${error.reason}`;
    case "MultiplePurchasesFailed":
      return `Múltiples fallos:\n${error.errors.map(e => `  - ${formatCafeError(e)}`).join("\n")}`;
    // Si agregas un nuevo _tag y no lo manejas, TypeScript te avisará aquí
  }
}

function combine(...charges: Charge[]): Result<Charge> {
  if (charges.length === 0) {
    return Result.failure(CafeError.noCharges());
  }

  const creditCard = charges[0].cc;

  // Encuentra tarjetas que no coinciden
  const mismatchedCards = charges
    .filter(charge => charge.cc.number !== creditCard.number)
    .map(charge => charge.cc);

  if (mismatchedCards.length > 0) {
    // ✅ Error tipado: incluye las tarjetas que no coinciden
    return Result.failure(CafeError.cardMismatch([creditCard, ...mismatchedCards]));
  }

  const totalAmount = charges.reduce((acc, charge) => acc + charge.amount, 0);
  return Result.success({ cc: creditCard, amount: totalAmount });
}

/**
 * EJERCICIO 2: Comprar un café (versión pura)
 * 
 * Esta función debe retornar TANTO el café COMO el cargo.
 * No debe ejecutar ningún efecto secundario.
 * 
 * 🌟 Patrón clave: Retornar un par (tupla) con el resultado y el efecto
 * 
 * @returns Un objeto con { coffee, charge }
 */
function buyCoffee(cc: CreditCard): Result<{ coffee: Coffee; charge: Charge }> {
  const coffee: Coffee = { size: "medium", price: 350 };
  const charge: Charge = { cc, amount: coffee.price };
  return Result.success({ coffee, charge });
}

/**
 * EJERCICIO 3: Comprar múltiples cafés
 * 
 * Usa buyCoffee() para crear n compras, luego:
 * - Colecciona todos los cafés en un array
 * - Combina todos los cargos en UNO SOLO
 * 
 * 💡 Pistas:
 * - Usa Array.from({ length: n }) para crear n elementos
 * - Usa .map() para transformar
 * - Usa .reduce() para combinar los cargos
 * 
 * @returns Un objeto con { coffees, charge } donde charge es UN SOLO cargo combinado
 */
/**
 * Tipo para el acumulador del reduce - Single Source of Truth
 * Contiene todo lo que necesitamos acumular en UNA sola pasada
 */
type BuyCoffeesAccumulator = {
  readonly coffees: Coffee[];
  readonly totalAmount: number;
  readonly errors: CafeError[];  // ✅ Errores tipados, no strings
};

function buyCoffees(cc: CreditCard, n: number): Result<{ coffees: readonly Coffee[]; charge: Charge }> {
  // ✅ OPTIMIZADO: Una sola pasada con reduce + errores tipados
  const { coffees, totalAmount, errors } = Array.from({ length: n }).reduce<BuyCoffeesAccumulator>(
    (acc, _) => {
      const result = buyCoffee(cc);

      if (result._tag === "Failure") {
        return { ...acc, errors: [...acc.errors, result.error] };
      }

      return {
        coffees: [...acc.coffees, result.value.coffee],
        totalAmount: acc.totalAmount + result.value.charge.amount,
        errors: acc.errors
      };
    },
    { coffees: [], totalAmount: 0, errors: [] }
  );

  if (errors.length > 0) {
    // ✅ Retorna errores estructurados que el consumidor puede inspeccionar
    return Result.failure(CafeError.multipleFailed(errors));
  }

  return Result.success({ coffees, charge: { cc, amount: totalAmount } });
}

/**
 * EJERCICIO 4 (AVANZADO): Coalesce - Agrupar cargos por tarjeta
 * 
 * Dado un array de cargos de DIFERENTES tarjetas, agrúpalos
 * para que haya UN SOLO cargo por tarjeta.
 * 
 * @example
 * // Alice tiene 2 cargos, Bob tiene 1
 * coalesce([
 *   { cc: aliceCard, amount: 350 },
 *   { cc: bobCard, amount: 450 },
 *   { cc: aliceCard, amount: 200 }
 * ])
 * // → [
 * //     { cc: aliceCard, amount: 550 },  // 350 + 200 combinados
 * //     { cc: bobCard, amount: 450 }
 * //   ]
 * 
 * 💡 Pistas:
 * - Primero agrupa por cc.number
 * - Luego combina cada grupo con reduce
 * 
 * 🔵 Este ejercicio es más avanzado, puedes saltarlo y volver después.
 */
function coalesce(charges: readonly Charge[]): Result<readonly Charge[]> {
  // Agrupar por número de tarjeta
  const chargesByCardNumber = charges.reduce<Record<string, Charge[]>>(
    (acc, charge) => ({
      ...acc,
      [charge.cc.number]: [...(acc[charge.cc.number] || []), charge]
    }),
    {}
  );

  // Combinar cada grupo
  const results = Object.values(chargesByCardNumber).map(group => combine(...group));

  // Separar éxitos y fallos con una sola pasada
  const { successes, failures } = results.reduce<{
    successes: Charge[];
    failures: CafeError[];
  }>(
    (acc, result) => {
      if (result._tag === "Success") {
        return { ...acc, successes: [...acc.successes, result.value] };
      }
      return { ...acc, failures: [...acc.failures, result.error] };
    },
    { successes: [], failures: [] }
  );

  if (failures.length > 0) {
    // ✅ Errores tipados con todos los fallos estructurados
    return Result.failure(CafeError.multipleFailed(failures));
  }

  return Result.success(successes);
}

// ============================================================================
// 🧪 TESTS - Descomenta para verificar tu implementación
// ============================================================================


console.log("\n=== PATRÓN: Errores Tipados (Discriminated Unions) ===\n");

const aliceCard: CreditCard = { number: "41111111111654321", holder: "Alice" };

// Test 1: combine - éxito
const charge1: Charge = { cc: aliceCard, amount: 350 };
const charge2: Charge = { cc: aliceCard, amount: 450 };
const combineResult = combine(charge1, charge2);
if (combineResult._tag === "Success") {
  console.log(`Test combine: ✅ (esperado: 800, obtenido: ${combineResult.value.amount})`);
} else {
  console.log(`Test combine: ❌ Error: ${formatCafeError(combineResult.error)}`);
}

// Test 2: buyCoffee
const coffeeResult = buyCoffee(aliceCard);
if (coffeeResult._tag === "Success") {
  console.log(`Test buyCoffee:`);
  console.log(`  - Retorna café: ✅`);
  console.log(`  - Retorna cargo: ${coffeeResult.value.charge.amount === 350 ? "✅" : "❌"}`);
} else {
  console.log(`Test buyCoffee: ❌ Error: ${formatCafeError(coffeeResult.error)}`);
}

// Test 3: buyCoffees
const multiResult = buyCoffees(aliceCard, 3);
if (multiResult._tag === "Success") {
  console.log(`Test buyCoffees(3):`);
  console.log(`  * 3 cafés: ${multiResult.value.coffees.length === 3 ? "✅" : "❌"}`);
  console.log(`  * 1 cargo combinado: ${multiResult.value.charge.amount === 1050 ? "✅" : "❌"}`);
} else {
  console.log(`Test buyCoffees: ❌ Error: ${formatCafeError(multiResult.error)}`);
}

// Test 4: coalesce
const bobCard: CreditCard = { number: "5555555555554444", holder: "Bob" };
const mixedCharges: Charge[] = [
  { cc: aliceCard, amount: 350 },
  { cc: bobCard, amount: 450 },
  { cc: aliceCard, amount: 200 }
];
const coalesceResult = coalesce(mixedCharges);
if (coalesceResult._tag === "Success") {
  console.log(`Test coalesce:`);
  console.log(`  - Resultado tiene 2 cargos: ${coalesceResult.value.length === 2 ? "✅" : "❌"}`);
  coalesceResult.value.forEach((charge) => console.log(`    - ${charge.cc.holder}: $${charge.amount / 100}`));
} else {
  console.log(`Test coalesce: ❌ Error: ${formatCafeError(coalesceResult.error)}`);
}

// ============================================================================
// 🆕 TEST: Demostración de errores tipados
// ============================================================================
console.log("\n=== 🆕 Demo: Errores Tipados vs Stringly Typed ===\n");

// Simulamos un error de tarjetas diferentes
const charlieCard: CreditCard = { number: "378282246310005", holder: "Charlie" };
const errorResult = combine(
  { cc: aliceCard, amount: 100 },
  { cc: bobCard, amount: 200 },
  { cc: charlieCard, amount: 300 }
);

if (errorResult._tag === "Failure") {
  const error = errorResult.error;

  // ✅ Pattern matching exhaustivo - el compilador verifica que manejamos todos los casos
  if (error._tag === "CardMismatch") {
    console.log("🎯 Error tipado permite:");
    console.log(`   - Saber exactamente qué tipo de error es: ${error._tag}`);
    console.log(`   - Acceder a datos estructurados:`);
    error.cards.forEach(card => {
      console.log(`     • Tarjeta: ${card.holder} (${card.number.slice(-4)})`);
    });
    console.log(`\n   🔴 Antes (stringly typed): "All charges must be for the same credit card"`);
    console.log(`   🟢 Ahora (typed error): Objeto con todas las tarjetas involucradas`);
  }

  // También podemos usar formatCafeError para un mensaje legible
  console.log(`\n📝 Mensaje formateado: ${formatCafeError(error)}`);
}

console.log("\n🎉 ¡Ejercicio completado!");

export { }