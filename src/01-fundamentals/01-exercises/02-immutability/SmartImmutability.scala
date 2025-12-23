/**
 * =============================================================================
 * 🧠 INMUTABILIDAD INTELIGENTE: EL SECRETO DE LA EFICIENCIA EN FP
 * =============================================================================
 *
 * Referencia: "Functional Programming in Scala" - Capítulo 3 (Data Structures)
 *
 * En Scala, la inmutabilidad está integrada en el lenguaje.
 * Este archivo demuestra cómo Scala implementa la compartición estructural
 * de forma nativa y segura.
 *
 * =============================================================================
 */

object SmartImmutability extends App {

  // ===========================================================================
  // CONCEPTO 1: Lista Inmutable como Sealed Trait
  // ===========================================================================

  /**
   * 🔒 DEFINICIÓN: Lista Enlazada Inmutable (como en FP in Scala)
   *
   * Una lista puede ser:
   * - Nil: lista vacía
   * - Cons(head, tail): un elemento seguido del resto de la lista
   *
   * 'sealed' garantiza que no hay más subtipos fuera de este archivo,
   * permitiendo pattern matching exhaustivo.
   */
  sealed trait ImmutableList[+A]  // +A = covariante (explicado más adelante)

  case object Nil extends ImmutableList[Nothing]  // Nothing = subtipo de todos

  case class Cons[+A](head: A, tail: ImmutableList[A]) extends ImmutableList[A]

  // Objeto companion con operaciones de lista
  object ImmutableList {

    // Constructor desde varargs: ImmutableList(1, 2, 3)
    def apply[A](as: A*): ImmutableList[A] =
      if (as.isEmpty) Nil
      else Cons(as.head, apply(as.tail: _*))

    // Convertir a Scala List (para imprimir fácilmente)
    def toScalaList[A](list: ImmutableList[A]): List[A] = list match {
      case Nil => List.empty
      case Cons(h, t) => h :: toScalaList(t)
    }
  }

  import ImmutableList._

  // ===========================================================================
  // CONCEPTO 2: COMPARTICIÓN ESTRUCTURAL
  // ===========================================================================

  /**
   * 🔗 PREPEND: Agregar al inicio - O(1)
   *
   * Solo creamos UN nodo nuevo que apunta a la lista existente.
   * No copiamos nada de la estructura original.
   */
  def prepend[A](element: A, list: ImmutableList[A]): ImmutableList[A] =
    Cons(element, list)  // O(1) - crea solo un nodo

  /**
   * 📐 TAIL: Obtener el resto - O(1)
   *
   * Simplemente retornamos la referencia existente.
   * El tail ya existe como parte de la estructura.
   */
  def tail[A](list: ImmutableList[A]): ImmutableList[A] = list match {
    case Nil => throw new NoSuchElementException("tail de lista vacía")
    case Cons(_, t) => t  // O(1) - solo retorna referencia existente
  }

  /**
   * 🔍 HEAD: Obtener el primer elemento - O(1)
   */
  def head[A](list: ImmutableList[A]): A = list match {
    case Nil => throw new NoSuchElementException("head de lista vacía")
    case Cons(h, _) => h
  }

  // ===========================================================================
  // CONCEPTO 3: EFICIENCIA EN LA PRÁCTICA
  // ===========================================================================

  /**
   * ⚡ DEMOSTRACIÓN: Prepend es O(1)
   */
  def demoPrependRapido(): Unit = {
    println("⚡ OPERACIÓN RÁPIDA: Agregar al inicio (Prepend)")
    println("─" * 50)

    // Lista original: [X, Y, Z]
    val original = ImmutableList("X", "Y", "Z")
    println(s"Lista original: ${toScalaList(original)}")

    // Agregar "New" al inicio - O(1)
    val conNew = prepend("New", original)
    println(s"Con 'New' al inicio: ${toScalaList(conNew)}")

    // La lista original sigue INTACTA
    println(s"Lista original (sin cambios): ${toScalaList(original)}")

    println("\n📊 Análisis:")
    println("   - Creamos solo 1 nodo nuevo (Cons)")
    println("   - Reutilizamos toda la lista original como tail")
    println("   - Complejidad: O(1) tiempo constante")
    println()
  }

  /**
   * 🐢 INIT: Quitar el último elemento - O(n)
   *
   * Necesitamos reconstruir toda la lista excepto el último elemento,
   * porque no podemos modificar los nodos existentes.
   */
  def init[A](list: ImmutableList[A]): ImmutableList[A] = list match {
    case Nil => throw new NoSuchElementException("init de lista vacía")
    case Cons(_, Nil) => Nil  // Solo un elemento -> retornar lista vacía
    case Cons(h, t) => Cons(h, init(t))  // Reconstruir recursivamente O(n)
  }

  def demoInitLento(): Unit = {
    println("🐢 OPERACIÓN LENTA: Quitar del final (Init)")
    println("─" * 50)

    val original = ImmutableList(1, 2, 3, 4)
    println(s"Lista original: ${toScalaList(original)}")

    val sinUltimo = init(original)
    println(s"Sin el último: ${toScalaList(sinUltimo)}")

    println("\n📊 Análisis:")
    println("   - Copiamos 3 nodos (todos excepto el eliminado)")
    println("   - Cada llamada recursiva crea un nuevo Cons")
    println("   - Complejidad: O(n) donde n = longitud de la lista")
    println()
  }

  /**
   * 📐 DEMOSTRACIÓN: Tail es O(1)
   */
  def demoTail(): Unit = {
    println("📐 EJEMPLO VISUAL: 'tail' de una Lista")
    println("─" * 50)

    val original = ImmutableList("Head", "T", "A", "I", "L")
    println(s"Lista original: ${toScalaList(original)}")

    val tailDeLista = tail(original)
    println(s"Tail de la lista: ${toScalaList(tailDeLista)}")

    println(s"Original (sin cambios): ${toScalaList(original)}")

    println("\n💡 Clave:")
    println("   - tail() NO copia nada")
    println("   - Solo pattern-match y retorna la referencia existente")
    println("   - ¡Esta parte de la lista ya existía!")
    println()
  }

  // ===========================================================================
  // CONCEPTO 4: ADIÓS A LAS COPIAS DEFENSIVAS
  // ===========================================================================

  /**
   * 🛡️ EN SCALA, la inmutabilidad elimina la necesidad de copias defensivas
   *
   * Con case class + val + colecciones inmutables, es IMPOSIBLE modificar
   * los datos compartidos. El compilador lo garantiza.
   */

  // Tipos inmutables (case class = inmutable por defecto)
  case class Usuario(id: String, nombre: String)

  // Repositorio inmutable
  case class RepositorioInmutable(usuarios: ImmutableList[Usuario] = Nil) {

    // Retorna un NUEVO repositorio con el usuario agregado
    def agregarUsuario(id: String, nombre: String): RepositorioInmutable =
      RepositorioInmutable(prepend(Usuario(id, nombre), usuarios))

    // ✅ Podemos retornar la referencia sin miedo - es inmutable
    def getUsuarios: ImmutableList[Usuario] = usuarios
  }

  def demoCopiasDefensivas(): Unit = {
    println("🛡️ ADIÓS A LAS COPIAS DEFENSIVAS")
    println("─" * 50)

    println("\n✅ EN SCALA (inmutable por diseño):")

    val repo1 = RepositorioInmutable()
    val repo2 = repo1.agregarUsuario("1", "Ana")
    val repo3 = repo2.agregarUsuario("2", "Bob")

    println(s"Repo1 (vacío): ${toScalaList(repo1.getUsuarios)}")
    println(s"Repo2 (con Ana): ${toScalaList(repo2.getUsuarios)}")
    println(s"Repo3 (con Ana y Bob): ${toScalaList(repo3.getUsuarios)}")

    // Intentar modificar es un ERROR DE COMPILACIÓN:
    // repo3.usuarios = Nil                    // ❌ val no reassignable
    // repo3.getUsuarios.head.nombre = "X"     // ❌ case class inmutable

    println("\n💡 En Scala:")
    println("   - case class + val = inmutable por default")
    println("   - No existe 'getUsuariosSinProteccion' vs 'getUsuariosConCopia'")
    println("   - Todo es seguro automáticamente")
    println()
  }

  // ===========================================================================
  // CONCEPTO 5: COMPARATIVA TypeScript vs Scala
  // ===========================================================================

  def comparativaLenguajes(): Unit = {
    println("🔄 COMPARATIVA: TypeScript vs Scala")
    println("═" * 65)
    println("│ Aspecto                │ TypeScript          │ Scala             │")
    println("├────────────────────────┼─────────────────────┼───────────────────┤")
    println("│ Inmutabilidad default  │ No (requiere effort)│ Sí (val,case class│")
    println("│ readonly               │ Solo compile-time   │ Runtime enforced  │")
    println("│ Pattern matching       │ Limitado            │ Nativo y poderoso │")
    println("│ Covarianza             │ Inferida            │ Explícita (+A)    │")
    println("│ sealed types           │ No nativo           │ Garantiza exhaust.│")
    println("│ Colecciones inmutables │ Requiere disciplina │ Default del stdlib│")
    println("═" * 65)
    println()
  }

  // ===========================================================================
  // TABLA DE COMPLEJIDAD
  // ===========================================================================

  def tablaComplejidad(): Unit = {
    println("📊 TABLA DE COMPLEJIDAD - Lista Inmutable")
    println("═" * 65)
    println("│ Operación              │ Lista Inmutable │ Array Mutable │")
    println("├────────────────────────┼─────────────────┼───────────────┤")
    println("│ Agregar al INICIO (::) │      O(1)       │     O(n)      │")
    println("│ Agregar al FINAL       │      O(n)       │     O(1)*     │")
    println("│ tail (quitar inicio)   │      O(1)       │     O(n)      │")
    println("│ init (quitar final)    │      O(n)       │     O(1)      │")
    println("│ Acceso por índice      │      O(n)       │     O(1)      │")
    println("│ Compartir datos        │      O(1)       │     O(n)**    │")
    println("═" * 65)
    println("* Amortizado")
    println("** Requiere copia defensiva para seguridad")
    println()
  }

  // ===========================================================================
  // DEMOSTRACIÓN PRINCIPAL
  // ===========================================================================

  println("═" * 70)
  println("🧠 INMUTABILIDAD INTELIGENTE EN SCALA")
  println("═" * 70)
  println()

  demoPrependRapido()
  demoInitLento()
  demoTail()
  tablaComplejidad()
  comparativaLenguajes()
  demoCopiasDefensivas()

  println("═" * 70)
  println("📚 RESUMEN DE CONCEPTOS DEL GRÁFICO:")
  println("═" * 70)
  println("""
1. ESTRUCTURAS INMUTABLES EN SCALA
   → case class + val = inmutable por defecto
   → sealed trait permite pattern matching exhaustivo
   → El compilador GARANTIZA inmutabilidad

2. COMPARTICIÓN ESTRUCTURAL
   → Cons(head, tail) solo guarda referencias
   → prepend (::) es O(1) y reutiliza toda la lista
   → Scala List implementa esto nativamente

3. EFICIENCIA PRÁCTICA
   → head/tail: O(1) - acceso inmediato
   → last/init: O(n) - requiere recorrer/copiar
   → Diseña algoritmos que trabajen del frente hacia atrás

4. SCALA vs TYPESCRIPT
   → Scala: inmutabilidad es el DEFAULT del lenguaje
   → TypeScript: requiere disciplina (readonly, const, etc.)
   → Scala detecta errores en COMPILE-TIME
  """)
  println("═" * 70)

  // ===========================================================================
  // RETO DE REFACTORIZACIÓN
  // ===========================================================================

  println("\n🎯 RETO DE REFACTORIZACIÓN:")
  println("─" * 70)
  println("""
Tienes este código IMPERATIVO. Piénsalo de forma funcional:

❌ CÓDIGO MALO (mutable con var):

var historial = List.empty[String]

def registrar(cambio: String): Unit = {
    historial = historial :+ cambio  // Lento O(n)
}

def deshacer(): Unit = {
    historial = historial.init  // Lento O(n)
}

💭 PREGUNTAS:
   1. ¿Por qué :+ (append) es O(n) pero :: (prepend) es O(1)?
   2. ¿Cómo reescribirías esto para que ambas operaciones sean O(1)?
   3. ¿Necesitas var o puedes hacerlo completamente inmutable?

✅ PISTA: Usa prepend para "registrar" y tail para "deshacer".
   El historial se lee en orden inverso (el más reciente primero).
  """)
  println("─" * 70)
}
