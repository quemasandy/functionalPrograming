/** ═══════════════════════════════════════════════════════════════════════════
  * 🎯 EJERCICIO RESUELTO: Café Shop - De Efectos Secundarios a Funciones Puras
  * ═══════════════════════════════════════════════════════════════════════════
  *
  * 📚 Basado en: "Functional Programming in Scala", Capítulo 1
  *
  * 🎓 GUÍA PARA PRINCIPIANTES EN SCALA
  *
  * Este archivo contiene comentarios exhaustivos explicando cada palabra clave
  * y concepto de Scala para que puedas aprender el lenguaje mientras resuelves
  * los ejercicios de programación funcional.
  *
  * ═══════════════════════════════════════════════════════════════════════════
  */

// ============================================================================
// 📖 GLOSARIO DE PALABRAS CLAVE DE SCALA
// ============================================================================
//
// case class  → Define una clase inmutable con igualdad estructural automática
// object      → Define un singleton (objeto único, no se puede instanciar múltiples veces)
// def         → Define un método o función
// val         → Variable inmutable (como `const` en JavaScript/TypeScript)
// var         → Variable mutable (evitar en FP)
// ???         → Placeholder que lanza NotImplementedError (para código TODO)
// =>          → Sintaxis de función lambda / flecha de función
// =           → Asignación (en val/var) o cuerpo de función (después de def)
// :           → Separador de tipo (variable: Tipo)
// @main       → Anotación que marca el punto de entrada del programa
// private     → Modificador de acceso: solo visible dentro de la clase/objeto
// Unit        → Equivalente a `void` en otros lenguajes (no retorna nada útil)
// List        → Colección inmutable de elementos del mismo tipo
// Map         → Colección de pares clave-valor
// Tuple       → Par o grupo de valores: (a, b) es una tupla de 2 elementos
// throw       → Lanzar una excepción
// if/else     → Condicional (en Scala es una EXPRESIÓN, retorna un valor)
// ============================================================================

// ============================================================================
// 📊 TIPOS BASE (no modificar)
// ============================================================================

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ case class CreditCard(number: String, holder: String)                   │
// └─────────────────────────────────────────────────────────────────────────┘
//
// PALABRA CLAVE: case class
// ─────────────────────────
// `case class` es una forma especial de definir clases en Scala que
// automáticamente te da:
//   1. Inmutabilidad: los campos no pueden cambiar después de crear el objeto
//   2. Constructor automático: no necesitas `new CreditCard(...)`
//   3. Igualdad estructural: `==` compara los contenidos, no las referencias
//   4. toString automático: imprime los valores de forma legible
//   5. Pattern matching: puedes descomponer la estructura con `match`
//   6. copy(): método para crear copias con algunos campos modificados
//
// SINTAXIS: case class NombreClase(campo1: Tipo1, campo2: Tipo2)
//
// Los paréntesis contienen los PARÁMETROS del constructor.
// Cada parámetro tiene: nombreCampo: Tipo
//
// En este caso:
//   - number: String  → El número de la tarjeta como texto
//   - holder: String  → El nombre del titular de la tarjeta
//
case class CreditCard(number: String, holder: String)

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ case class Coffee(size: String, price: Int)                             │
// └─────────────────────────────────────────────────────────────────────────┘
//
// Otra case class que representa un café.
//
// ¿Por qué price es Int y no Double?
// ─────────────────────────────────
// En sistemas financieros NUNCA usamos números de punto flotante (Float/Double)
// para dinero porque tienen errores de precisión.
//
// Ejemplo del problema: 0.1 + 0.2 = 0.30000000000000004 (¡no es 0.3!)
//
// SOLUCIÓN: Usamos la unidad más pequeña (centavos) como enteros.
// $3.50 = 350 centavos (Int)
//
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

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ object CafeWithSideEffects:                                             │
// └─────────────────────────────────────────────────────────────────────────┘
//
// PALABRA CLAVE: object
// ─────────────────────
// `object` define un SINGLETON: un objeto único que existe una sola vez.
// No necesitas (ni puedes) usar `new` para crear instancias.
//
// Es similar a un módulo en otros lenguajes. Todos sus métodos son como
// métodos estáticos (métodos de clase en Java).
//
// SINTAXIS SCALA 3: object NombreObjeto:
//   [contenido indentado]
//
// Los dos puntos `:` al final abren un bloque de indentación (bracketed syntax).
// Todo lo que está indentado pertenece al objeto.
// En Scala 2 se usaban llaves: object NombreObjeto { ... }
//
object CafeWithSideEffects:

  // ┌───────────────────────────────────────────────────────────────────────┐
  // │ private object paymentServer:                                          │
  // └───────────────────────────────────────────────────────────────────────┘
  //
  // PALABRA CLAVE: private
  // ──────────────────────
  // `private` es un modificador de acceso que hace que este objeto solo sea
  // visible DENTRO de CafeWithSideEffects. Código externo no puede acceder.
  //
  // Aquí tenemos un objeto ANIDADO dentro de otro objeto.
  // paymentServer es otro singleton que simula un servidor de pagos.
  //
  private object paymentServer:

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ def charge(cc: CreditCard, amount: Int): Unit =                     │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // PALABRA CLAVE: def
    // ──────────────────
    // `def` define un método o función.
    //
    // SINTAXIS: def nombreMetodo(param1: Tipo1, param2: Tipo2): TipoRetorno = cuerpo
    //
    // Desglose de este método:
    //   - charge         → nombre del método
    //   - (cc: CreditCard, amount: Int) → parámetros con sus tipos
    //   - : Unit         → tipo de retorno (Unit = void, no retorna nada útil)
    //   - =              → separa la firma del cuerpo
    //   - println(...)   → el cuerpo del método
    //
    // PALABRA CLAVE: Unit
    // ───────────────────
    // `Unit` es el tipo que indica "no retorna ningún valor interesante".
    // Es similar a `void` en Java/C++ o `undefined` en TypeScript.
    // Cuando ves Unit, sabes que el método tiene EFECTOS SECUNDARIOS.
    //
    def charge(cc: CreditCard, amount: Int): Unit =
      // ┌───────────────────────────────────────────────────────────────────┐
      // │ println(s"💳 Cobrando $$${amount / 100.0} a tarjeta ${...}")       │
      // └───────────────────────────────────────────────────────────────────┘
      //
      // println: Función que imprime en la consola (efecto secundario!)
      //
      // s"..." : String Interpolation
      // ─────────────────────────────
      // La `s` antes de las comillas activa la interpolación de strings.
      // Dentro del string puedes usar:
      //   - ${expresion} → inserta el resultado de la expresión
      //   - $variable    → inserta el valor de una variable simple
      //   - $$           → escapa el símbolo $ (imprime un $ literal)
      //
      // amount / 100.0  → Convierte centavos a dólares
      // cc.number       → Accede al campo number de la tarjeta
      // .takeRight(4)   → Toma los últimos 4 caracteres (últimos 4 dígitos)
      //
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
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ val cup = Coffee("medium", 350)                                      │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // PALABRA CLAVE: val
    // ──────────────────
    // `val` define una variable INMUTABLE (constante).
    // Una vez asignado un valor, NO puede cambiar.
    // Equivalente a `const` en JavaScript/TypeScript.
    //
    // Coffee("medium", 350) crea una instancia de Coffee.
    // Nota: Con case class NO necesitas `new`.
    //   - "medium" → el tamaño
    //   - 350      → $3.50 en centavos
    //
    val cup = Coffee("medium", 350) // $3.50 en centavos

    // 🔴 EFECTO SECUNDARIO: Comunicación con sistema externo
    // Esta línea HACE algo (cobra dinero), no solo calcula un valor.
    // Por eso esta función es IMPURA.
    paymentServer.charge(cc, cup.price)

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ cup                                                                  │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // RETORNO IMPLÍCITO
    // ─────────────────
    // En Scala, la ÚLTIMA expresión de una función es su valor de retorno.
    // No necesitas escribir `return cup`.
    // Solo escribes la expresión y Scala la retorna automáticamente.
    //
    cup

  /** ❌ PROBLEMA DE COMPOSICIÓN
    *
    * Si Alice quiere comprar 3 cafés, ¡hacemos 3 transacciones separadas! Esto
    * tiene costos adicionales de procesamiento.
    */
  def buyCoffees(cc: CreditCard, n: Int): List[Coffee] =
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ (1 to n).map(_ => buyCoffee(cc)).toList                              │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // (1 to n): Crea un Range (rango) de 1 a n inclusive.
    //   Ejemplo: (1 to 3) = Range(1, 2, 3)
    //
    // .map(f): Transforma cada elemento aplicando la función f
    //   Es una función de orden superior (HOF): recibe una función como parámetro.
    //
    // _ => buyCoffee(cc): Función lambda (anónima)
    //   - _  → parámetro ignorado (no nos importa el número, solo cuántas veces)
    //   - => → flecha que separa parámetros del cuerpo
    //   - buyCoffee(cc) → lo que retorna la lambda
    //
    // .toList: Convierte el resultado a una List inmutable
    //
    // ⚠️ PROBLEMA: Esto hace n llamadas separadas a buyCoffee,
    // lo que significa n cobros separados al servidor de pagos!
    //
    (1 to n).map(_ => buyCoffee(cc)).toList // ¡n cobros separados!

// ============================================================================
// 🔬 Demostración del problema
// ============================================================================

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ @main def demoAntipattern(): Unit =                                     │
// └─────────────────────────────────────────────────────────────────────────┘
//
// PALABRA CLAVE: @main
// ───────────────────
// `@main` es una ANOTACIÓN que marca el punto de entrada del programa.
// Es como `public static void main(String[] args)` en Java.
// El nombre del método se convierte en el comando para ejecutar.
//
// Para ejecutar: `scala-cli run . --main-class demoAntipattern`
// O desde tu IDE, busca el botón "Run" junto al método.
//
@main def demoAntipattern(): Unit =
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

  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║ EJERCICIO 1 RESUELTO: Combinar dos cargos                              ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ def combine(other: Charge): Charge =                                    │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // MÉTODO DE INSTANCIA
  // ───────────────────
  // Este método está DENTRO de la case class Charge, lo que significa:
  //   - Es un método de INSTANCIA (se llama sobre un objeto Charge)
  //   - Tiene acceso a `this` implícitamente
  //   - `cc` y `amount` se refieren a los campos de ESTA instancia
  //   - `other.cc` y `other.amount` son los campos del OTRO charge
  //
  // Parámetro: other: Charge
  //   - Recibe OTRA instancia de Charge para combinar
  //
  // Retorno: Charge
  //   - Retorna un NUEVO Charge (inmutabilidad: no modificamos el original)
  //
  def combine(other: Charge): Charge =
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ if cc == other.cc then                                              │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // IF COMO EXPRESIÓN
    // ─────────────────
    // En Scala, if/else es una EXPRESIÓN, no una sentencia.
    // Esto significa que if/else TIENE un valor, que puedes asignar o retornar.
    //
    // SINTAXIS SCALA 3:
    //   if condicion then expresionTrue else expresionFalse
    //
    // cc == other.cc:
    //   - cc → el CreditCard de ESTA instancia (this.cc implícito)
    //   - other.cc → el CreditCard del OTRO cargo
    //   - == → comparación de CONTENIDO (porque es case class!)
    //     En case class, == compara valor por valor, no referencias.
    //
    if cc == other.cc then
      // Si son la MISMA tarjeta, creamos un nuevo Charge combinado
      // Charge(cc, amount + other.amount):
      //   - cc → la tarjeta (es la misma para ambos)
      //   - amount + other.amount → suma de ambos montos
      //
      // INMUTABILIDAD: No modificamos this ni other.
      // Creamos un NUEVO objeto Charge con los valores combinados.
      //
      Charge(cc, amount + other.amount)
    else
      // ┌───────────────────────────────────────────────────────────────────┐
      // │ throw Exception("Can't combine charges to different cards")       │
      // └───────────────────────────────────────────────────────────────────┘
      //
      // PALABRA CLAVE: throw
      // ───────────────────
      // `throw` lanza una excepción, interrumpiendo el flujo normal.
      // En FP pura, preferimos evitar throw y usar Either/Option.
      // Pero para este ejercicio de aprendizaje, es aceptable.
      //
      // Exception("mensaje") crea una nueva instancia de Exception.
      //
      throw Exception("Can't combine charges to different cards")

// ============================================================================
// 🧪 IMPLEMENTACIÓN DE LAS FUNCIONES PURAS
// ============================================================================

object PureCafe:

  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║ EJERCICIO 2 RESUELTO: Comprar un café (versión pura)                   ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ def buyCoffee(cc: CreditCard): (Coffee, Charge) =                       │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // RETORNANDO UNA TUPLA
  // ────────────────────
  // Esta función retorna DOS valores: un Coffee y un Charge.
  // En Scala, usamos TUPLAS para agrupar múltiples valores.
  //
  // Tipo de retorno: (Coffee, Charge)
  //   - Los paréntesis con coma definen una tupla de 2 elementos
  //   - Es como un "par" o "duo" de valores
  //
  // 🎯 PATRÓN FUNCIONAL: En lugar de EJECUTAR el efecto (cobrar),
  // RETORNAMOS una descripción del efecto (el Charge).
  // Esto hace la función PURA: misma entrada → misma salida, siempre.
  //
  def buyCoffee(cc: CreditCard): (Coffee, Charge) =
    // Creamos el café (igual que antes)
    val cup = Coffee("medium", 350)

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ (cup, Charge(cc, cup.price))                                        │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // CREANDO UNA TUPLA
    // ─────────────────
    // (valor1, valor2) crea una tupla.
    // Retornamos:
    //   1. cup → el café que compramos
    //   2. Charge(cc, cup.price) → descripción del cargo a realizar
    //
    // ¡NO hay efectos secundarios! Solo creamos objetos y los retornamos.
    // Esta función es PURA: puedes llamarla mil veces sin cobrar nada.
    //
    (cup, Charge(cc, cup.price))

  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║ EJERCICIO 3 RESUELTO: Comprar múltiples cafés                          ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ def buyCoffees(cc: CreditCard, n: Int): (List[Coffee], Charge) =        │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // PARÁMETROS:
  //   - cc: CreditCard → la tarjeta para cobrar
  //   - n: Int → número de cafés a comprar
  //
  // RETORNO: (List[Coffee], Charge)
  //   - Una tupla con:
  //     1. Lista de todos los cafés
  //     2. UN SOLO cargo combinado (no n cargos separados!)
  //
  // 🎯 VENTAJA: Solo hacemos UN cobro al servidor de pagos,
  // en lugar de n cobros separados. ¡Ahorramos en comisiones!
  //
  def buyCoffees(cc: CreditCard, n: Int): (List[Coffee], Charge) =
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ PASO 1: Crear n compras                                             │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // List.fill(n)(expresion)
    // ───────────────────────
    // Crea una lista con n copias del resultado de evaluar la expresión.
    // ¡OJO! La expresión se evalúa n veces, no se copia el mismo valor.
    //
    // Ejemplo: List.fill(3)(buyCoffee(cc))
    // Evalúa buyCoffee(cc) 3 veces y crea List((coffee1, charge1), (coffee2, charge2), (coffee3, charge3))
    //
    // Tipo resultante: List[(Coffee, Charge)]
    //   - Una lista de tuplas (pares café-cargo)
    //
    val purchases: List[(Coffee, Charge)] = List.fill(n)(buyCoffee(cc))

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ PASO 2: Separar cafés de cargos                                     │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // .unzip: Separa una lista de tuplas en una tupla de listas
    // ─────────────────────────────────────────────────────────────────────
    // List[(A, B)].unzip → (List[A], List[B])
    //
    // Ejemplo:
    //   List((cafe1, charge1), (cafe2, charge2)).unzip
    //   → (List(cafe1, cafe2), List(charge1, charge2))
    //
    // DESTRUCTURING (Desestructuración)
    // ─────────────────────────────────
    // val (coffees, charges) = ...
    //
    // Esto "desempaca" una tupla en variables individuales.
    // Si unzip retorna (listaCafes, listaCargos):
    //   - coffees → listaCafes
    //   - charges → listaCargos
    //
    val (coffees, charges) = purchases.unzip

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ PASO 3: Combinar todos los cargos en uno solo                       │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // .reduce(f): Combina todos los elementos de una lista en uno solo
    // ────────────────────────────────────────────────────────────────
    // Aplica una función binaria (que toma 2 argumentos) de izquierda a derecha.
    //
    // Ejemplo con List(a, b, c).reduce(f):
    //   f(a, b) → x
    //   f(x, c) → resultado final
    //
    // charges.reduce(_.combine(_))
    // ────────────────────────────
    // Equivalente a: charges.reduce((c1, c2) => c1.combine(c2))
    //
    // Sintaxis de guión bajo (_):
    //   - El primer _ representa el primer parámetro
    //   - El segundo _ representa el segundo parámetro
    //   - Es una forma abreviada de escribir lambdas simples
    //
    // Resultado: UN SOLO Charge con la suma de todos los montos
    //
    val combinedCharge: Charge = charges.reduce(_.combine(_))

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ Retorno: (coffees, combinedCharge)                                  │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // Retornamos una tupla con:
    //   1. Lista de todos los cafés
    //   2. UN SOLO cargo combinado
    //
    (coffees, combinedCharge)

  // ╔═════════════════════════════════════════════════════════════════════════╗
  // ║ EJERCICIO 4 RESUELTO (AVANZADO): Coalesce - Agrupar cargos por tarjeta ║
  // ╚═════════════════════════════════════════════════════════════════════════╝
  //
  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ def coalesce(charges: List[Charge]): List[Charge] =                     │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // PROPÓSITO:
  // Dado una lista de cargos de DIFERENTES tarjetas, agruparlos para que
  // haya UN SOLO cargo por tarjeta.
  //
  // EJEMPLO:
  //   Input:  List(Charge(alice, 350), Charge(bob, 450), Charge(alice, 200))
  //   Output: List(Charge(alice, 550), Charge(bob, 450))
  //
  // Alice tenía 2 cargos (350 + 200 = 550) → ahora tiene 1
  // Bob tenía 1 cargo (450) → sigue teniendo 1
  //
  def coalesce(charges: List[Charge]): List[Charge] =
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ charges.groupBy(_.cc)                                               │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // .groupBy(f): Agrupa elementos por una clave
    // ───────────────────────────────────────────
    // Toma una función que extrae una "clave" de cada elemento.
    // Retorna un Map[Clave, List[Elementos con esa clave]]
    //
    // charges.groupBy(_.cc)
    //   - _.cc → la clave es el CreditCard del cargo
    //   - Resultado: Map[CreditCard, List[Charge]]
    //
    // Ejemplo:
    //   List(Charge(alice, 350), Charge(bob, 450), Charge(alice, 200))
    //   .groupBy(_.cc) →
    //   Map(
    //     alice → List(Charge(alice, 350), Charge(alice, 200)),
    //     bob   → List(Charge(bob, 450))
    //   )
    //
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ .values                                                             │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // .values: Extrae solo los valores del Map (ignora las claves)
    // ────────────────────────────────────────────────────────────
    // Map[K, V].values → Iterable[V]
    //
    // En nuestro caso: Iterable[List[Charge]]
    // O sea, una colección de listas de cargos (un grupo por tarjeta)
    //
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ .map(_.reduce(_.combine(_)))                                        │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // .map(f): Transforma cada elemento aplicando f
    //
    // Para CADA lista de cargos (un grupo por tarjeta):
    //   _.reduce(_.combine(_)) → combina todos los cargos en uno
    //
    // Resultado: Iterable[Charge] (un cargo por tarjeta)
    //
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ .toList                                                             │
    // └─────────────────────────────────────────────────────────────────────┘
    //
    // .toList: Convierte el Iterable a una List
    //
    // SOLUCIÓN COMPLETA EN UNA LÍNEA:
    // Esta es la "solución elegante" mencionada en el ejercicio.
    //
    charges.groupBy(_.cc).values.map(_.reduce(_.combine(_))).toList

// ============================================================================
// 🧪 TESTS - Ejecuta para verificar la implementación
// ============================================================================

@main def testPureCafe(): Unit =
  println("\n=== PATRÓN: Funciones Puras ===\n")

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Creación de datos de prueba                                            │
  // └─────────────────────────────────────────────────────────────────────────┘
  val aliceCard = CreditCard("4111111111111111", "Alice")
  val bobCard = CreditCard("5555555555554444", "Bob")

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Test 1: combine                                                         │
  // └─────────────────────────────────────────────────────────────────────────┘
  val charge1 = Charge(aliceCard, 350)
  val charge2 = Charge(aliceCard, 450)
  val combined = charge1.combine(charge2)

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ if ... then "✅" else "❌"                                              │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // EXPRESIÓN TERNARIA EN SCALA
  // ───────────────────────────
  // En Scala, if/else es una expresión que retorna un valor.
  // Esto reemplaza al operador ternario (? :) de otros lenguajes.
  //
  println(s"Test combine: ${
      if combined.amount == 800 then "✅" else "❌"
    } (esperado: 800, obtenido: ${combined.amount})")

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Test 2: buyCoffee                                                       │
  // └─────────────────────────────────────────────────────────────────────────┘
  //
  // val (coffee, charge) = PureCafe.buyCoffee(aliceCard)
  //
  // DESTRUCTURING DE TUPLA
  // ──────────────────────
  // buyCoffee retorna (Coffee, Charge).
  // Con esta sintaxis, "desempacamos" el par en dos variables:
  //   - coffee → el primer elemento (Coffee)
  //   - charge → el segundo elemento (Charge)
  //
  val (coffee, charge) = PureCafe.buyCoffee(aliceCard)
  println(s"Test buyCoffee:")
  println(s"  - Retorna café: ${if coffee != null then "✅" else "❌"}")
  println(s"  - Retorna cargo: ${if charge.amount == 350 then "✅" else "❌"}")

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Test 3: buyCoffees                                                      │
  // └─────────────────────────────────────────────────────────────────────────┘
  val (coffees, combinedCharge) = PureCafe.buyCoffees(aliceCard, 3)
  println(s"Test buyCoffees(3):")
  println(s"  - 3 cafés: ${if coffees.length == 3 then "✅" else "❌"}")
  println(s"  - 1 cargo combinado: ${
      if combinedCharge.amount == 1050 then "✅" else "❌"
    } (esperado: 1050)")

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ Test 4: coalesce                                                        │
  // └─────────────────────────────────────────────────────────────────────────┘
  val mixedCharges = List(
    Charge(aliceCard, 350),
    Charge(bobCard, 450),
    Charge(aliceCard, 200)
  )
  val coalesced = PureCafe.coalesce(mixedCharges)
  println(s"Test coalesce:")
  println(s"  - Resultado tiene 2 cargos: ${
      if coalesced.length == 2 then "✅" else "❌"
    }")

  // Verificación adicional: los montos están correctos
  val aliceTotal = coalesced.find(_.cc == aliceCard).map(_.amount).getOrElse(0)
  val bobTotal = coalesced.find(_.cc == bobCard).map(_.amount).getOrElse(0)
  println(s"  - Alice total: ${
      if aliceTotal == 550 then "✅" else "❌"
    } (esperado: 550, obtenido: $aliceTotal)")
  println(s"  - Bob total: ${
      if bobTotal == 450 then "✅" else "❌"
    } (esperado: 450, obtenido: $bobTotal)")

  println("\n🎉 ¡Ejercicio completado!")

// ============================================================================
// 📖 RESUMEN DE CONCEPTOS CLAVE
// ============================================================================
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. FUNCIÓN PURA                                                         │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ Una función es PURA si:                                                 │
// │   - Misma entrada → siempre la misma salida                             │
// │   - No tiene efectos secundarios (no modifica nada externo)             │
// │   - Es REFERENTIALLY TRANSPARENT                                        │
// │                                                                         │
// │ buyCoffee impura:  cc → Coffee (+ cobra $$ como efecto)                 │
// │ buyCoffee pura:    cc → (Coffee, Charge) (solo crea valores)            │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. SEPARAR DESCRIPCIÓN DE EJECUCIÓN                                     │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ En lugar de EJECUTAR efectos, DESCRIBIMOS qué efectos queremos.         │
// │                                                                         │
// │ Charge no ES un cobro, es una DESCRIPCIÓN de un cobro a realizar.       │
// │ Esto nos permite:                                                       │
// │   - Combinar múltiples cargos antes de procesarlos                      │
// │   - Testear sin servidores externos                                     │
// │   - Razonar localmente sobre el código                                  │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. SINTAXIS SCALA 3 APRENDIDA                                           │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ case class     → Clase inmutable con igualdad estructural               │
// │ object         → Singleton (objeto único)                               │
// │ def            → Define una función                                     │
// │ val            → Variable inmutable                                     │
// │ (a, b)         → Tupla de dos elementos                                 │
// │ if...then...else → Expresión condicional (¡retorna un valor!)          │
// │ List.fill(n)(x) → Lista con n elementos                                 │
// │ list.unzip     → Separa List[(A,B)] en (List[A], List[B])              │
// │ list.reduce(f) → Combina todos los elementos en uno                     │
// │ map.groupBy(f) → Agrupa elementos por una clave                         │
// │ _.campo        → Shorthand para lambda: x => x.campo                    │
// │ @main          → Marca el punto de entrada del programa                 │
// └─────────────────────────────────────────────────────────────────────────┘
