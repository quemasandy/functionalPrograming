/**
 * ============================================================================
 * ☕ BUYCOFFEE: Efecto Secundario vs. Enfoque Puro
 * ============================================================================
 * 
 * Este archivo visualiza exactamente el diagrama:
 * 
 * ┌─────────────────────────────┬─────────────────────────────────────────────┐
 * │  WITH A SIDE EFFECT         │  WITHOUT A SIDE EFFECT                      │
 * ├─────────────────────────────┼─────────────────────────────────────────────┤
 * │  Credit card → buyCoffee    │  Credit card → buyCoffee                    │
 * │       ↓                     │       ↓                                     │
 * │  Send transaction           │  Cup + Charge (como valor)                  │
 * │       ↓                     │                                             │
 * │  Credit card server         │  List(charge1, charge2, ...) → Coalesce     │
 * │       ↓                     │       ↓                                     │
 * │  Cup                        │  Un solo Charge combinado                   │
 * └─────────────────────────────┴─────────────────────────────────────────────┘
 * 
 * PROBLEMAS DEL LADO IZQUIERDO:
 * - "Can't test buyCoffee without credit card server"
 * - "Can't combine two transactions into one"
 * 
 * BENEFICIOS DEL LADO DERECHO:
 * - "If buyCoffee returns a charge object instead of performing a side effect,
 *    a caller can easily combine several charges into one transaction."
 * - "(and can easily test the buyCoffee function without needing a payment processor)"
 * 
 * REFERENCIA: "Functional Programming in Scala" - Capítulo 1
 * 
 * ============================================================================
 */

// =============================================================================
// TIPOS BASE
// =============================================================================

interface CreditCard {
  readonly number: string;
  readonly holder: string;
}

interface Cup {
  readonly id: string;
  readonly coffeeType: string;
  readonly price: number;
}

/**
 * CHARGE: La clave del enfoque funcional
 * 
 * En vez de EJECUTAR una transacción, RETORNAMOS la INTENCIÓN de cobrar.
 * Un Charge es un VALOR que describe qué cobrar, no una acción.
 */
interface Charge {
  readonly cc: CreditCard;
  readonly amount: number;
}

// =============================================================================
// ❌ CON EFECTO SECUNDARIO (Lado izquierdo del diagrama)
// =============================================================================

/**
 * Simula el servidor de tarjetas de crédito.
 * Esta es una dependencia externa que hace difícil testear.
 */
class CreditCardServer {
  private transactionCount = 0;

  async processTransaction(cc: CreditCard, amount: number): Promise<void> {
    this.transactionCount++;
    console.log(`  💳 [SERVER] Transaction #${this.transactionCount}: $${amount.toFixed(2)}`);
    // Simula latencia de red
    await new Promise(r => setTimeout(r, 50));
  }

  getTransactionCount(): number {
    return this.transactionCount;
  }
}

// Instancia global del servidor (problema: estado global)
const creditCardServer = new CreditCardServer();

/**
 * ❌ buyCoffee CON EFECTO SECUNDARIO
 * 
 * DIAGRAMA: Credit card → buyCoffee → Send transaction → Credit card server → Cup
 * 
 * PROBLEMAS:
 * 1. No puedo testear sin el servidor de tarjetas
 * 2. Si compro 12 cafés, hago 12 transacciones separadas
 */
async function buyCoffeeWithSideEffect(cc: CreditCard): Promise<Cup> {
  const cup: Cup = {
    id: `cup-${Date.now()}`,
    coffeeType: 'Latte',
    price: 3.50,
  };

  // ❌ EFECTO SECUNDARIO: Llamada al servidor de pagos
  await creditCardServer.processTransaction(cc, cup.price);

  return cup;
}

/**
 * ❌ Comprar 12 cafés = 12 transacciones
 */
async function buy12CoffeesWithSideEffect(cc: CreditCard): Promise<Cup[]> {
  console.log('\n❌ COMPRANDO 12 CAFÉS (CON EFECTO SECUNDARIO)\n');

  const cups: Cup[] = [];

  for (let i = 0; i < 12; i++) {
    // Cada iteración hace una transacción
    const cup = await buyCoffeeWithSideEffect(cc);
    cups.push(cup);
  }

  console.log(`\n  ⚠️ Resultado: 12 cafés, 12 transacciones separadas`);
  console.log(`  ⚠️ Total transacciones al servidor: ${creditCardServer.getTransactionCount()}\n`);

  return cups;
}

// =============================================================================
// ✅ SIN EFECTO SECUNDARIO (Lado derecho del diagrama)
// =============================================================================

/**
 * ✅ buyCoffee SIN EFECTO SECUNDARIO
 * 
 * DIAGRAMA: Credit card → buyCoffee → Cup + Charge (como valor)
 * 
 * BENEFICIOS:
 * 1. Puedo testear sin servidor de pagos
 * 2. Puedo COMBINAR (coalesce) múltiples charges en uno solo
 */
function buyCoffeeWithoutSideEffect(cc: CreditCard): [Cup, Charge] {
  const cup: Cup = {
    id: `cup-${Date.now()}`,
    coffeeType: 'Latte',
    price: 3.50,
  };

  // ✅ NO hay efecto secundario
  // En vez de EJECUTAR el pago, RETORNAMOS la intención de cobrar
  const charge: Charge = {
    cc: cc,
    amount: cup.price,
  };

  // Retornamos AMBOS: el café y el cargo (como valor)
  return [cup, charge];
}

/**
 * ✅ COALESCE: Combinar múltiples charges en uno solo
 * 
 * DIAGRAMA: List(charge1, charge2, ...) → Coalesce → Charge
 * 
 * Esta es la clave: podemos COMBINAR los charges antes de procesarlos.
 */
function coalesce(charges: Charge[]): Charge {
  if (charges.length === 0) {
    throw new Error('Cannot coalesce empty list');
  }

  // Verificar que todos son de la misma tarjeta
  const firstCard = charges[0].cc.number;
  for (const charge of charges) {
    if (charge.cc.number !== firstCard) {
      throw new Error('Cannot coalesce charges from different cards');
    }
  }

  // Combinar todos los montos en UN SOLO charge
  const totalAmount = charges.reduce((sum, c) => sum + c.amount, 0);

  return {
    cc: charges[0].cc,
    amount: totalAmount,
  };
}

/**
 * ✅ Comprar 12 cafés = 1 sola transacción
 */
async function buy12CoffeesWithoutSideEffect(cc: CreditCard): Promise<Cup[]> {
  console.log('\n✅ COMPRANDO 12 CAFÉS (SIN EFECTO SECUNDARIO)\n');

  const cups: Cup[] = [];
  const charges: Charge[] = [];

  // Paso 1: Llamar buyCoffee 12 veces (PURO, sin efectos)
  console.log('  📦 Paso 1: Crear 12 compras (puro, sin transacciones)\n');
  for (let i = 0; i < 12; i++) {
    const [cup, charge] = buyCoffeeWithoutSideEffect(cc);
    cups.push(cup);
    charges.push(charge);
    console.log(`     Café #${i + 1}: $${charge.amount.toFixed(2)}`);
  }

  // Paso 2: COALESCE - Combinar todos los charges en uno
  console.log('\n  🔀 Paso 2: Coalesce (combinar charges en uno solo)\n');
  const combinedCharge = coalesce(charges);
  console.log(`     Cargo combinado: $${combinedCharge.amount.toFixed(2)}`);

  // Paso 3: Procesar UN SOLO pago (único efecto secundario)
  console.log('\n  💳 Paso 3: Procesar UN SOLO pago\n');
  await creditCardServer.processTransaction(combinedCharge.cc, combinedCharge.amount);

  console.log(`\n  ✅ Resultado: 12 cafés, 1 sola transacción\n`);

  return cups;
}

// =============================================================================
// 🧪 DEMOSTRACIÓN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' BUYCOFFEE: Efecto Secundario vs. Enfoque Puro');
  console.log('═══════════════════════════════════════════════════════════════');

  const myCard: CreditCard = {
    number: '4111-1111-1111-1111',
    holder: 'John Doe',
  };

  // Versión con efecto secundario
  await buy12CoffeesWithSideEffect(myCard);

  console.log('───────────────────────────────────────────────────────────────');

  // Versión sin efecto secundario
  await buy12CoffeesWithoutSideEffect(myCard);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n📊 RESUMEN:\n');
  console.log('  ❌ Con efecto secundario:');
  console.log('     - 12 cafés = 12 transacciones');
  console.log('     - No puedo testear sin servidor');
  console.log('     - Función acoplada a la acción de pago\n');
  console.log('  ✅ Sin efecto secundario (puro):');
  console.log('     - 12 cafés = 12 Charges (valores)');
  console.log('     - Coalesce → 1 solo Charge combinado');
  console.log('     - 1 sola transacción al final');
  console.log('     - Fácil de testear sin servidor\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main();

// =============================================================================
// 🧪 TESTEAR SIN SERVIDOR (Demostración)
// =============================================================================

console.log('\n🧪 BONUS: TESTEANDO SIN SERVIDOR DE PAGOS\n');

// ✅ PUEDO testear buyCoffeeWithoutSideEffect sin ningún servidor
function testBuyCoffee() {
  const testCard: CreditCard = { number: '1234', holder: 'Test' };

  const [cup, charge] = buyCoffeeWithoutSideEffect(testCard);

  // Verificaciones simples, sin mocks, sin servidor
  console.log(`  ✅ Cup price: $${cup.price.toFixed(2)}`);
  console.log(`  ✅ Charge amount: $${charge.amount.toFixed(2)}`);
  console.log(`  ✅ Charge card: ${charge.cc.number}`);
  console.log(`  ✅ Price matches charge: ${cup.price === charge.amount}`);
}

testBuyCoffee();

console.log('\n  💡 ¡Sin servidor de pagos, sin mocks, sin async!\n');

export { buyCoffeeWithSideEffect, buyCoffeeWithoutSideEffect, coalesce, Charge, Cup, CreditCard };
