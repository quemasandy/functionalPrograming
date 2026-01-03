/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🎯 EJERCICIO: Café Shop - De Efectos Secundarios a Funciones Puras
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 📚 Basado en: "Functional Programming in Scala", Capítulo 1
 * 
 * 📋 Objetivos de aprendizaje:
 * Al terminar este ejercicio podrás:
 * - [ ] Identificar efectos secundarios en código existente
 * - [ ] Refactorizar código impuro a funciones puras
 * - [ ] Componer funciones puras para resolver problemas complejos
 * - [ ] Entender por qué las funciones puras son más fáciles de testear
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { success } from "../08-monads/monad-laws-masterclass";

// ============================================================================
// 📊 TIPOS BASE (no modificar)
// ============================================================================

interface CreditCard {
  readonly number: string;
  readonly holder: string;
}

interface Coffee {
  readonly size: "small" | "medium" | "large";
  readonly price: number; // en centavos (evitamos floats para dinero)
}

// ============================================================================
// PARTE 1: ❌ EL ANTIPATRÓN - Código con Efectos Secundarios
// ============================================================================

/**
 * Esta clase representa una cafetería con efectos secundarios.
 * 
 * 🐛 PROBLEMAS:
 * 1. No puedes testear `buyCoffee` sin una conexión real al servidor de pagos
 * 2. No puedes combinar múltiples compras en una sola transacción
 * 3. El código es difícil de razonar porque depende de estado externo
 */
class CafeWithSideEffects {
  // Simula una conexión a un servidor de pagos externo
  private paymentServer = {
    charge: (cc: CreditCard, amount: number): void => {
      console.log(`💳 Cobrando $${(amount / 100).toFixed(2)} a tarjeta ${cc.number.slice(-4)}`);
      // En la realidad: HTTP request, base de datos, etc.
    }
  };

  /**
   * ❌ IMPURO: Esta función tiene efectos secundarios
   * 
   * Problemas:
   * - Modifica estado externo (llama al servidor de pagos)
   * - No es referentially transparent
   * - Imposible de testear sin mocks complicados
   */
  buyCoffee(cc: CreditCard): Coffee {
    const cup: Coffee = { size: "medium", price: 350 }; // $3.50

    // 🔴 EFECTO SECUNDARIO: Comunicación con sistema externo
    this.paymentServer.charge(cc, cup.price);

    return cup;
  }

  /**
   * ❌ PROBLEMA DE COMPOSICIÓN
   * 
   * Si Alice quiere comprar 3 cafés, ¡hacemos 3 transacciones separadas!
   * Esto tiene costos adicionales de procesamiento.
   */
  buyCoffees(cc: CreditCard, n: number): readonly Coffee[] {
    const coffees: Coffee[] = [];
    for (let i = 0; i < n; i++) {
      coffees.push(this.buyCoffee(cc)); // ¡3 cobros separados!
    }
    return coffees;
  }
}

// 🔬 Demostración del problema:
// console.log("=== ANTIPATRÓN: Efectos Secundarios ===\n");

// const impureCafe = new CafeWithSideEffects();
// const aliceCard: CreditCard = { number: "41111111111654321", holder: "Alice" };

// // Alice compra 3 cafés → ¡3 transacciones separadas!
// console.log("Alice compra 3 cafés:");
// const aliceCoffees = impureCafe.buyCoffees(aliceCard, 3);
// console.log(`Resultado: ${aliceCoffees.length} cafés\n`);
// console.log("❌ Problema: 3 cobros separados = 3x comisiones bancarias\n");

// ============================================================================
// PARTE 2: ✅ EL PATRÓN - Funciones Puras con Charge como Valor
// ============================================================================

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🟢 SOLUCIÓN: Separar la CREACIÓN del cargo de su PROCESAMIENTO
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * En lugar de ejecutar el efecto secundario (cobrar), RETORNAMOS
 * una descripción del cargo como un valor. Esto nos permite:
 * 
 * 1. Combinar cargos antes de procesarlos
 * 2. Testear sin sistemas externos
 * 3. Razonar sobre el código localmente
 */

/**
 * 🔑 TIPO CLAVE: Charge es un VALOR que describe un cargo
 * 
 * No ES el cargo, es una DESCRIPCIÓN de lo que debería ocurrir.
 * Esto es el corazón de la programación funcional:
 * "Describir QUÉ hacer, no CÓMO hacerlo"
 */
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
function buyCoffees(cc: CreditCard, n: number): Result<{ coffees: readonly Coffee[]; charge: Charge }> {
  const buyCoffeesResult  = Array.from({ length: n }, () => buyCoffee(cc));
  const successCoffees = buyCoffeesResult.filter((coffee) => coffee.success);
  const failedCoffees = buyCoffeesResult.filter((coffee) => !coffee.success);

  if (failedCoffees.length !== 0) {
    return {success: false, error: JSON.stringify(failedCoffees)};
  }

  const coffees = successCoffees.map((coffee) => coffee.value.coffee);
  const charges = successCoffees.map((coffee) => coffee.value.charge);

  const charge = combine(...charges);
  if (!charge.success) {
    return {success: false, error: charge.error};
  }

  return {
    success: true,
    value: {
      coffees,
      charge: charge.value
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
  const chargesByCardNumber: {[key: string]: Charge[]} = charges.reduce((acc, charge) => {
    if (!acc[charge.cc.number]) {
      acc[charge.cc.number] = [];
    }
    acc[charge.cc.number] = [...acc[charge.cc.number], charge];
    return acc;
  }, {} as {[key: string]: Charge[]});

  const combinedCharges = Object.values(chargesByCardNumber).map((charges) => combine(...charges));

  const failedCharges = combinedCharges.filter((charge) => !charge.success);
  if (failedCharges.length !== 0) {
    return {success: false, error: JSON.stringify(failedCharges)};
  }

  const successCharges = combinedCharges.filter((charge) => charge.success).map((charge) => charge.value);

  return {success: true, value: successCharges};
}

// ============================================================================
// 🧪 TESTS - Descomenta para verificar tu implementación
// ============================================================================


console.log("\n=== PATRÓN: Funciones Puras ===\n");

const aliceCard: CreditCard = { number: "41111111111654321", holder: "Alice" };

// Test 1: combine
// const charge1: Charge = { cc: aliceCard, amount: 350 };
// const charge2: Charge = { cc: aliceCard, amount: 450 };
// const { value: combined } = combine(charge1, charge2) as { success: true, value: Charge };
// console.log(`Test combine: ${combined.amount === 800 ? "✅" : "❌"} (esperado: 800, obtenido: ${combined.amount})`);

// // Test 2: buyCoffee
// const { value: result } = buyCoffee(aliceCard) as Success<{ coffee: Coffee; charge: Charge }>;
// console.log(`Test buyCoffee:`);
// console.log(`  - Retorna café: ${result.coffee ? "✅" : "❌"}`);
// console.log(`  - Retorna cargo: ${result.charge.amount === 350 ? "✅" : "❌"}`);

// // Test 3: buyCoffees
// const {value: multiResult} = buyCoffees(aliceCard, 3) as Success<{ coffees: readonly Coffee[]; charge: Charge }>;
// console.log(`Test buyCoffees(3):`);
// console.log(`  * 3 cafés: ${multiResult.coffees.length === 3 ? "✅" : "❌"} obtenidos: ${multiResult.coffees.length}`);
// console.log(`  * 1 cargo combinado: ${multiResult.charge.amount === 1050 ? "✅" : "❌"} obtenido: ${multiResult.charge.amount}`);

// // Test 4: coalesce
// const bobCard: CreditCard = { number: "5555555555554444", holder: "Bob" };
// const mixedCharges: Charge[] = [
//   { cc: aliceCard, amount: 350 },
//   { cc: bobCard, amount: 450 },
//   { cc: aliceCard, amount: 200 }
// ];
// const {value: coalesced} = coalesce(mixedCharges) as Success<Charge[]>;
// console.log(`Test coalesce:`);
// console.log(`  - Resultado tiene 2 cargos: ${coalesced.length === 2 ? "✅" : "❌"}`);
// coalesced.forEach((charge) => console.log(`    - ${JSON.stringify(charge)}`));

// console.log("\n🎉 ¡Ejercicio completado!");


// ============================================================================
// 🧠 REFLEXIÓN: Transparencia Referencial
// ============================================================================

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TRANSPARENCIA REFERENCIAL (Referential Transparency)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Una expresión es REFERENTIALLY TRANSPARENT si puede ser reemplazada
 * por su valor sin cambiar el comportamiento del programa.
 * 
 * EJEMPLO CON STRINGS (inmutables):
 * 
 *   const x = "Hello, World";
 *   const r1 = x.split("").reverse().join("");  // "dlroW ,olleH"
 *   const r2 = x.split("").reverse().join("");  // "dlroW ,olleH"
 *   
 *   // Podemos reemplazar x con su valor:
 *   const r1 = "Hello, World".split("").reverse().join("");  // ¡Mismo resultado!
 *   const r2 = "Hello, World".split("").reverse().join("");  // ¡Mismo resultado!
 * 
 * EJEMPLO CON ARRAYS (mutables):
 * 
 *   const arr = [1, 2, 3];
 *   const r1 = arr.push(4);  // 4 (length)
 *   const r2 = arr.push(5);  // 5 (length)
 *   
 *   // Si reemplazamos arr:
 *   const r1 = [1, 2, 3].push(4);  // 4, arr = [1, 2, 3, 4]
 *   const r2 = [1, 2, 3].push(5);  // 4 ← ¡DIFERENTE! arr = [1, 2, 3, 5]
 *   
 *   // ❌ El resultado cambió porque push() MUTA el array
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 🧪 EJERCICIO MENTAL:
 * 
 * Considera estas dos versiones de buyCoffee:
 * 
 * VERSIÓN IMPURA:
 *   buyCoffee(cc)    // Cobra $3.50 a la tarjeta
 *   buyCoffee(cc)    // Cobra $3.50 a la tarjeta (¡de nuevo!)
 *   
 * VERSIÓN PURA:
 *   buyCoffee(cc)    // Retorna { coffee, charge } - SIN cobrar
 *   buyCoffee(cc)    // Retorna { coffee, charge } - SIN cobrar
 *   
 * ¿Cuál es más fácil de razonar? ¿Cuál es más fácil de testear?
 * 
 * La versión pura es REFERENTIALLY TRANSPARENT porque llamarla
 * múltiples veces con los mismos argumentos SIEMPRE retorna el mismo valor
 * sin modificar nada en el mundo exterior.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ============================================================================
// 📊 BENEFICIOS VISUALIZADOS
// ============================================================================

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    CON EFECTOS SECUNDARIOS                             │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │   buyCoffee(cc) ──────► Coffee                                         │
 * │         │                                                               │
 * │         └───────────────────────► 💳 Servidor de Pagos                 │
 * │                                          │                              │
 * │                                          ▼                              │
 * │                              ❌ No puedes testear                       │
 * │                              ❌ No puedes combinar                      │
 * │                              ❌ Razonamiento global                     │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    SIN EFECTOS SECUNDARIOS                             │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │   buyCoffee(cc) ──────► { Coffee, Charge }                             │
 * │                                    │                                    │
 * │                          ┌─────────┴─────────┐                         │
 * │                          ▼                   ▼                          │
 * │                    combinar()           procesar()                     │
 * │                          │                   │                          │
 * │                          ▼                   ▼                          │
 * │              { Coffee[], Charge }    💳 Servidor de Pagos              │
 * │                                                                         │
 * │              ✅ Fácil de testear                                       │
 * │              ✅ Fácil de combinar                                      │
 * │              ✅ Razonamiento local                                     │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

export { combine, buyCoffee, buyCoffees, coalesce, Charge, Coffee, CreditCard };
