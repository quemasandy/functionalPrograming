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
type Success<T> = { success: true, value: T };
type Error = { success: false, error: string };
type Result<T> = Success<T> | Error;

function combine(...charges: Charge[]): Result<Charge> {
  if (charges.length === 0) {
    return { success: false, error: "No charges provided" };
  }

  const creditCard = charges[0].cc;

  const validation = charges.every(charge => charge.cc.number === creditCard.number);
  if (!validation) {
    return { success: false, error: "All charges must be for the same credit card" };
  }

  const totalAmount = charges.reduce((acc, charge) => {
    return acc + charge.amount;
  }, 0);

  return { success: true, value: { cc: creditCard, amount: totalAmount } };
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
  // TODO: Implementa esta función
  // Crea un café medium de $3.50 (350 centavos)
  const coffee: Coffee = {
    size: "medium",
    price: 350
  };
  const charge: Charge = {
    cc,
    amount: coffee.price
  };
  // Retorna el café Y el cargo correspondiente
  return { success: true, value: { coffee, charge } };
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
  readonly errors: string[];
};

function buyCoffees(cc: CreditCard, n: number): Result<{ coffees: readonly Coffee[]; charge: Charge }> {
  // ✅ OPTIMIZADO: Una sola pasada con reduce
  // Complejidad: O(n) en lugar de O(6n)
  const { coffees, totalAmount, errors } = Array.from({ length: n }).reduce<BuyCoffeesAccumulator>(
    (acc, _) => {
      const result = buyCoffee(cc);

      if (!result.success) {
        // Acumulamos errores sin detener el proceso
        return {
          ...acc,
          errors: [...acc.errors, result.error]
        };
      }

      // Acumulamos café Y sumamos el monto en la misma pasada
      return {
        coffees: [...acc.coffees, result.value.coffee],
        totalAmount: acc.totalAmount + result.value.charge.amount,
        errors: acc.errors
      };
    },
    { coffees: [], totalAmount: 0, errors: [] } // Estado inicial
  );

  // Validación de errores (ya acumulados, sin pasada extra)
  if (errors.length !== 0) {
    return { success: false, error: JSON.stringify(errors) };
  }

  // Construimos el cargo directamente (sin llamar a combine)
  return {
    success: true,
    value: {
      coffees,
      charge: { cc, amount: totalAmount }
    }
  };
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
  const chargesByCardNumber: { [key: string]: Charge[] } = charges.reduce((acc, charge) => {
    if (!acc[charge.cc.number]) {
      acc[charge.cc.number] = [];
    }
    acc[charge.cc.number] = [...acc[charge.cc.number], charge];
    return acc;
  }, {} as { [key: string]: Charge[] });

  const combinedCharges = Object.values(chargesByCardNumber).map((charges) => combine(...charges));

  const failedCharges = combinedCharges.filter((charge) => !charge.success);
  if (failedCharges.length !== 0) {
    return { success: false, error: JSON.stringify(failedCharges) };
  }

  const successCharges = combinedCharges.filter((charge) => charge.success).map((charge) => charge.value);

  return { success: true, value: successCharges };
}

// ============================================================================
// 🧪 TESTS - Descomenta para verificar tu implementación
// ============================================================================


console.log("\n=== PATRÓN: Funciones Puras ===\n");

const aliceCard: CreditCard = { number: "41111111111654321", holder: "Alice" };

// Test 1: combine
const charge1: Charge = { cc: aliceCard, amount: 350 };
const charge2: Charge = { cc: aliceCard, amount: 450 };
const { value: combined } = combine(charge1, charge2) as { success: true, value: Charge };
console.log(`Test combine: ${combined.amount === 800 ? "✅" : "❌"} (esperado: 800, obtenido: ${combined.amount})`);

// // Test 2: buyCoffee
const { value: result } = buyCoffee(aliceCard) as Success<{ coffee: Coffee; charge: Charge }>;
console.log(`Test buyCoffee:`);
console.log(`  - Retorna café: ${result.coffee ? "✅" : "❌"}`);
console.log(`  - Retorna cargo: ${result.charge.amount === 350 ? "✅" : "❌"}`);

// // Test 3: buyCoffees
const { value: multiResult } = buyCoffees(aliceCard, 3) as Success<{ coffees: readonly Coffee[]; charge: Charge }>;
console.log(`Test buyCoffees(3):`);
console.log(`  * 3 cafés: ${multiResult.coffees.length === 3 ? "✅" : "❌"} obtenidos: ${multiResult.coffees.length}`);
console.log(`  * 1 cargo combinado: ${multiResult.charge.amount === 1050 ? "✅" : "❌"} obtenido: ${multiResult.charge.amount}`);

// // Test 4: coalesce
const bobCard: CreditCard = { number: "5555555555554444", holder: "Bob" };
const mixedCharges: Charge[] = [
  { cc: aliceCard, amount: 350 },
  { cc: bobCard, amount: 450 },
  { cc: aliceCard, amount: 200 }
];
const { value: coalesced } = coalesce(mixedCharges) as Success<Charge[]>;
console.log(`Test coalesce:`);
console.log(`  - Resultado tiene 2 cargos: ${coalesced.length === 2 ? "✅" : "❌"}`);
coalesced.forEach((charge) => console.log(`    - ${JSON.stringify(charge)}`));

console.log("\n🎉 ¡Ejercicio completado!");

export { }