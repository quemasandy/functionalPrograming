/** ═══════════════════════════════════════════════════════════════════════════
  * 🎯 EJERCICIO: Café Shop - De Efectos Secundarios a Funciones Puras
  * ═══════════════════════════════════════════════════════════════════════════
  *
  * 📚 Basado en: "Functional Programming in Scala", Capítulo 1
  *
  * 📋 Objetivos de aprendizaje: Al terminar este ejercicio podrás:
  *   - [ ] Identificar efectos secundarios en código existente
  *   - [ ] Refactorizar código impuro a funciones puras
  *   - [ ] Componer funciones puras para resolver problemas complejos
  *   - [ ] Entender por qué las funciones puras son más fáciles de testear
  *
  * ═══════════════════════════════════════════════════════════════════════════
  */

// ============================================================================
// 📊 TIPOS BASE (no modificar)
// ============================================================================

case class CreditCard(number: String, holder: String)

case class Coffee(size: String, price: Int) // price en centavos

// ============================================================================
// PARTE 1: ❌ EL ANTIPATRÓN - Código con Efectos Secundarios
// ============================================================================

/** Esta clase representa una cafetería con efectos secundarios.
  *
  * 🐛 PROBLEMAS:
  *   1. No puedes testear `buyCoffee` sin una conexión real al servidor de
  *      pagos
  *   2. No puedes combinar múltiples compras en una sola transacción
  *   3. El código es difícil de razonar porque depende de estado externo
  */
object CafeWithSideEffects:

  // Simula una conexión a un servidor de pagos externo
  private object paymentServer:
    def charge(cc: CreditCard, amount: Int): Unit =
      println(
        s"💳 Cobrando $$${amount / 100.0} a tarjeta ${cc.number.takeRight(4)}"
      )

  /** ❌ IMPURO: Esta función tiene efectos secundarios
    *
    * Problemas:
    *   - Modifica estado externo (llama al servidor de pagos)
    *   - No es referentially transparent
    *   - Imposible de testear sin mocks complicados
    */
  def buyCoffee(cc: CreditCard): Coffee =
    val cup = Coffee("medium", 350) // $3.50 en centavos

    // 🔴 EFECTO SECUNDARIO: Comunicación con sistema externo
    paymentServer.charge(cc, cup.price)

    cup

  /** ❌ PROBLEMA DE COMPOSICIÓN
    *
    * Si Alice quiere comprar 3 cafés, ¡hacemos 3 transacciones separadas! Esto
    * tiene costos adicionales de procesamiento.
    */
  def buyCoffees(cc: CreditCard, n: Int): List[Coffee] =
    (1 to n).map(_ => buyCoffee(cc)).toList // ¡n cobros separados!

// ============================================================================
// 🔬 Demostración del problema (descomenta para ejecutar)
// ============================================================================

@main def demoAntipatter(): Unit =
  println("=== ANTIPATRÓN: Efectos Secundarios ===\n")

  val aliceCard = CreditCard("4111111111111111", "Alice")

  // Alice compra 3 cafés → ¡3 transacciones separadas!
  println("Alice compra 3 cafés:")
  val aliceCoffees = CafeWithSideEffects.buyCoffees(aliceCard, 3)
  println(s"Resultado: ${aliceCoffees.length} cafés\n")
  println("❌ Problema: 3 cobros separados = 3x comisiones bancarias\n")

// ============================================================================
// PARTE 2: ✅ EL PATRÓN - Funciones Puras con Charge como Valor
// ============================================================================

/** ════════════════════════════════════════════════════════════════════════════
  * 🟢 SOLUCIÓN: Separar la CREACIÓN del cargo de su PROCESAMIENTO
  * ════════════════════════════════════════════════════════════════════════════
  *
  * En lugar de ejecutar el efecto secundario (cobrar), RETORNAMOS una
  * descripción del cargo como un valor. Esto nos permite:
  *
  *   1. Combinar cargos antes de procesarlos
  *   2. Testear sin sistemas externos
  *   3. Razonar sobre el código localmente
  */

/** 🔑 TIPO CLAVE: Charge es un VALOR que describe un cargo
  *
  * No ES el cargo, es una DESCRIPCIÓN de lo que debería ocurrir. Esto es el
  * corazón de la programación funcional: "Describir QUÉ hacer, no CÓMO hacerlo"
  *
  * Usamos case class para:
  *   - Inmutabilidad automática
  *   - Igualdad estructural (== compara contenido)
  *   - Pattern matching
  */
case class Charge(cc: CreditCard, amount: Int):

  /** EJERCICIO 1: Combinar dos cargos
    *
    * Si el otro cargo es para la MISMA tarjeta, combínalos sumando los montos.
    * Si son para tarjetas DIFERENTES, lanza un error.
    *
    * 💡 Pista: En Scala, case class tiene == que compara contenido.
    *
    * @example
    *   val c1 = Charge(aliceCard, 350) val c2 = Charge(aliceCard, 450)
    *   c1.combine(c2) // → Charge(aliceCard, 800)
    */
  def combine(other: Charge): Charge =
    // TODO: Implementa esta función
    // Si cc == other.cc, retorna nuevo Charge con montos sumados
    // Si no, lanza Exception("Can't combine charges to different cards")
    ???

// ============================================================================
// 🧪 TU TURNO: Implementa las funciones puras
// ============================================================================

object PureCafe:

  /** EJERCICIO 2: Comprar un café (versión pura)
    *
    * Esta función debe retornar TANTO el café COMO el cargo. No debe ejecutar
    * ningún efecto secundario.
    *
    * 🌟 Patrón clave: Retornar un par (tupla) con el resultado y el efecto
    *
    * En Scala, creamos una tupla con paréntesis: (a, b)
    *
    * @returns
    *   Una tupla (Coffee, Charge)
    */
  def buyCoffee(cc: CreditCard): (Coffee, Charge) =
    // TODO: Implementa esta función
    // Crea un café medium de $3.50 (350 centavos)
    // Retorna (café, cargo correspondiente)
    ???

  /** EJERCICIO 3: Comprar múltiples cafés
    *
    * Usa buyCoffee() para crear n compras, luego:
    *   - Colecciona todos los cafés en una lista
    *   - Combina todos los cargos en UNO SOLO
    *
    * 💡 Pistas:
    *   - List.fill(n)(x) crea una lista con n copias de x
    *   - listOfPairs.unzip separa List[(A,B)] en (List[A], List[B])
    *   - list.reduce((a,b) => ...) combina elementos de 2 en 2
    *
    * @returns
    *   Una tupla (List[Coffee], Charge) donde Charge es UN SOLO cargo combinado
    */
  def buyCoffees(cc: CreditCard, n: Int): (List[Coffee], Charge) =
    // TODO: Implementa esta función
    //
    // Estructura sugerida:
    // 1. val purchases: List[(Coffee, Charge)] = List.fill(n)(buyCoffee(cc))
    // 2. val (coffees, charges) = purchases.unzip
    // 3. combina los charges con reduce
    ???

  /** EJERCICIO 4 (AVANZADO): Coalesce - Agrupar cargos por tarjeta
    *
    * Dado una lista de cargos de DIFERENTES tarjetas, agrúpalos para que haya
    * UN SOLO cargo por tarjeta.
    *
    * @example
    *   // Alice tiene 2 cargos, Bob tiene 1 coalesce(List( Charge(aliceCard,
    *   350), Charge(bobCard, 450), Charge(aliceCard, 200) )) // → List( //
    *   Charge(aliceCard, 550), // 350 + 200 combinados // Charge(bobCard, 450)
    *   // )
    *
    * 💡 Pistas:
    *   - charges.groupBy(_.cc) agrupa por tarjeta → Map[CreditCard,
    *     List[Charge]]
    *   - map.values da las listas de cargos
    *   - cada lista se reduce con combine
    *
    * 🔵 Este ejercicio es más avanzado, puedes saltarlo y volver después.
    */
  def coalesce(charges: List[Charge]): List[Charge] =
    // TODO: Implementa esta función
    //
    // La solución del libro es una línea elegante:
    // charges.groupBy(_.cc).values.map(_.reduce(_.combine(_))).toList
    //
    // Pero puedes hacerlo paso a paso si prefieres.
    ???

// ============================================================================
// 🧪 TESTS - Descomenta para verificar tu implementación
// ============================================================================

/*
@main def testPureCafe(): Unit =
  println("\n=== PATRÓN: Funciones Puras ===\n")
  
  val aliceCard = CreditCard("4111111111111111", "Alice")
  val bobCard = CreditCard("5555555555554444", "Bob")

  // Test 1: combine
  val charge1 = Charge(aliceCard, 350)
  val charge2 = Charge(aliceCard, 450)
  val combined = charge1.combine(charge2)
  println(s"Test combine: ${if combined.amount == 800 then "✅" else "❌"} (esperado: 800, obtenido: ${combined.amount})")

  // Test 2: buyCoffee
  val (coffee, charge) = PureCafe.buyCoffee(aliceCard)
  println(s"Test buyCoffee:")
  println(s"  - Retorna café: ${if coffee != null then "✅" else "❌"}")
  println(s"  - Retorna cargo: ${if charge.amount == 350 then "✅" else "❌"}")

  // Test 3: buyCoffees
  val (coffees, combinedCharge) = PureCafe.buyCoffees(aliceCard, 3)
  println(s"Test buyCoffees(3):")
  println(s"  - 3 cafés: ${if coffees.length == 3 then "✅" else "❌"}")
  println(s"  - 1 cargo combinado: ${if combinedCharge.amount == 1050 then "✅" else "❌"} (esperado: 1050)")

  // Test 4: coalesce
  val mixedCharges = List(
    Charge(aliceCard, 350),
    Charge(bobCard, 450),
    Charge(aliceCard, 200)
  )
  val coalesced = PureCafe.coalesce(mixedCharges)
  println(s"Test coalesce:")
  println(s"  - Resultado tiene 2 cargos: ${if coalesced.length == 2 then "✅" else "❌"}")

  println("\n🎉 ¡Ejercicio completado!")
 */

// ============================================================================
// 🧠 REFLEXIÓN: Transparencia Referencial
// ============================================================================

/** ═══════════════════════════════════════════════════════════════════════════
  * 📚 TRANSPARENCIA REFERENCIAL (Referential Transparency)
  * ═══════════════════════════════════════════════════════════════════════════
  *
  * Una expresión es REFERENTIALLY TRANSPARENT si puede ser reemplazada por su
  * valor sin cambiar el comportamiento del programa.
  *
  * EJEMPLO CON STRINGS (inmutables en Scala):
  *
  * val x = "Hello, World" val r1 = x.reverse // "dlroW ,olleH" val r2 =
  * x.reverse // "dlroW ,olleH"
  *
  * // Podemos reemplazar x con su valor: val r1 = "Hello, World".reverse //
  * ¡Mismo resultado! val r2 = "Hello, World".reverse // ¡Mismo resultado!
  *
  * CONTRAEJEMPLO CON StringBuilder (mutable):
  *
  * val x = new StringBuilder("Hello") val y = x.append(", World") val r1 =
  * y.toString // "Hello, World" val r2 = y.toString // "Hello, World"
  *
  * // Si reemplazamos y con su expresión: val r1 = x.append(", World").toString
  * // "Hello, World" val r2 = x.append(", World").toString // "Hello, World,
  * World" ← ¡DIFERENTE!
  *
  * // ❌ El resultado cambió porque append() MUTA el StringBuilder
  *
  * ═══════════════════════════════════════════════════════════════════════════
  *
  * 🧪 EJERCICIO MENTAL:
  *
  * Considera estas dos versiones de buyCoffee:
  *
  * VERSIÓN IMPURA: buyCoffee(cc) // Cobra $3.50 a la tarjeta buyCoffee(cc) //
  * Cobra $3.50 a la tarjeta (¡de nuevo!)
  *
  * VERSIÓN PURA: buyCoffee(cc) // Retorna (Coffee, Charge) - SIN cobrar
  * buyCoffee(cc) // Retorna (Coffee, Charge) - SIN cobrar
  *
  * ¿Cuál es más fácil de razonar? ¿Cuál es más fácil de testear?
  *
  * ═══════════════════════════════════════════════════════════════════════════
  */

// ============================================================================
// 📊 DIAGRAMA COMPARATIVO
// ============================================================================

/** ┌─────────────────────────────────────────────────────────────────────────┐
  * │ CON EFECTOS SECUNDARIOS │
  * ├─────────────────────────────────────────────────────────────────────────┤
  * │ │ │ buyCoffee(cc) ──────► Coffee │ │ │ │ │ └───────────────────────► 💳
  * Servidor de Pagos │ │ │ │ │ ▼ │ │ ❌ No puedes testear │ │ ❌ No puedes
  * combinar │ │ ❌ Razonamiento global │ │ │
  * └─────────────────────────────────────────────────────────────────────────┘
  *
  * ┌─────────────────────────────────────────────────────────────────────────┐
  * │ SIN EFECTOS SECUNDARIOS │
  * ├─────────────────────────────────────────────────────────────────────────┤
  * │ │ │ buyCoffee(cc) ──────► (Coffee, Charge) │ │ │ │ │ ┌─────────┴─────────┐
  * │ │ ▼ ▼ │ │ combinar() procesar() │ │ │ │ │ │ ▼ ▼ │ │ (List[Coffee], Charge)
  * 💳 Servidor de Pagos │ │ │ │ ✅ Fácil de testear │ │ ✅ Fácil de combinar │ │
  * ✅ Razonamiento local │ │ │
  * └─────────────────────────────────────────────────────────────────────────┘
  */
