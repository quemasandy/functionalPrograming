object SmartImmutability extends App {

  /** =============================================================================
    * 🧠 INMUTABILIDAD INTELIGENTE: EL SECRETO DE LA EFICIENCIA EN FP
    * =============================================================================
    *
    * Referencia: "Functional Programming in Scala" - Capítulo 3 (Data Structures)
    *
    * En Scala, la inmutabilidad está integrada en el lenguaje.
    * Este worksheet demuestra cómo Scala implementa la compartición estructural
    * de forma nativa y segura.
    *
    * 💡 WORKSHEET: Los resultados aparecen inline automáticamente al guardar.
    * =============================================================================
    */

  // ===========================================================================
  // CONCEPTO 1: Lista Inmutable como Sealed Trait
  // ===========================================================================

  /** 🔒 DEFINICIÓN: Lista Enlazada Inmutable (como en FP in Scala)
    *
    * Una lista puede ser:
    *   - Nil: lista vacía
    *   - Cons(head, tail): un elemento seguido del resto de la lista
    *
    * 'sealed' garantiza que no hay más subtipos fuera de este archivo,
    * permitiendo pattern matching exhaustivo.
    */
  sealed trait ImmutableList[+A] // +A = covariante (explicado más adelante)

  case object Nil extends ImmutableList[Nothing] // Nothing = subtipo de todos

  case class Cons[+A](head: A, tail: ImmutableList[A]) extends ImmutableList[A]

  // Objeto companion con operaciones de lista
  object ImmutableList:
    // Constructor desde varargs: ImmutableList(1, 2, 3)
    def apply[A](as: A*): ImmutableList[A] =
      if as.isEmpty then Nil
      else Cons(as.head, apply(as.tail*))

    // Convertir a Scala List (para imprimir fácilmente)
    def toScalaList[A](list: ImmutableList[A]): List[A] = list match
      case Nil        => List.empty
      case Cons(h, t) => h :: toScalaList(t)

  import ImmutableList.*

  // ===========================================================================
  // CONCEPTO 2: COMPARTICIÓN ESTRUCTURAL
  // ===========================================================================

  /** 🔗 PREPEND: Agregar al inicio - O(1)
    *
    * Solo creamos UN nodo nuevo que apunta a la lista existente. No copiamos
    * nada de la estructura original.
    */
  def prepend[A](element: A, list: ImmutableList[A]): ImmutableList[A] =
    Cons(element, list) // O(1) - crea solo un nodo

  /** 📐 TAIL: Obtener el resto - O(1)
    *
    * Simplemente retornamos la referencia existente. El tail ya existe como
    * parte de la estructura.
    */
  def tail[A](list: ImmutableList[A]): ImmutableList[A] = list match
    case Nil        => throw new NoSuchElementException("tail de lista vacía")
    case Cons(_, t) => t // O(1) - solo retorna referencia existente

  /** 🔍 HEAD: Obtener el primer elemento - O(1)
    */
  def head[A](list: ImmutableList[A]): A = list match
    case Nil        => throw new NoSuchElementException("head de lista vacía")
    case Cons(h, _) => h

  // ===========================================================================
  // DEMO 1: ⚡ OPERACIÓN RÁPIDA - Prepend es O(1)
  // ===========================================================================

  println("⚡ OPERACIÓN RÁPIDA: Agregar al inicio (Prepend)")
  println("─" * 50)

  // Lista original: [X, Y, Z]
  val original = ImmutableList("X", "Y", "Z")
  toScalaList(original) // Resultado inline → List(X, Y, Z)

  // Agregar "New" al inicio - O(1)
  val conNew = prepend("New", original)
  toScalaList(conNew) // Resultado inline → List(New, X, Y, Z)

  // La lista original sigue INTACTA
  toScalaList(original) // Sin cambios → List(X, Y, Z)

  // ===========================================================================
  // CONCEPTO 3: EFICIENCIA EN LA PRÁCTICA
  // ===========================================================================

  /** 🐢 INIT: Quitar el último elemento - O(n)
    *
    * Necesitamos reconstruir toda la lista excepto el último elemento, porque
    * no podemos modificar los nodos existentes.
    */
  def init[A](list: ImmutableList[A]): ImmutableList[A] = list match
    case Nil          => throw new NoSuchElementException("init de lista vacía")
    case Cons(_, Nil) => Nil // Solo un elemento -> retornar lista vacía
    case Cons(h, t)   => Cons(h, init(t)) // Reconstruir recursivamente O(n)

  // ===========================================================================
  // DEMO 2: 🐢 OPERACIÓN LENTA - Init es O(n)
  // ===========================================================================

  println("\n🐢 OPERACIÓN LENTA: Quitar del final (Init)")
  println("─" * 50)

  val numeros = ImmutableList(1, 2, 3, 4)
  println(numeros)
  toScalaList(numeros) // Resultado inline → List(1, 2, 3, 4)
  println(toScalaList(numeros))

  val sinUltimo = init(numeros)
  toScalaList(sinUltimo) // Resultado inline → List(1, 2, 3)
  println(toScalaList(sinUltimo))

  // ===========================================================================
  // DEMO 3: 📐 Tail es O(1)
  // ===========================================================================

  println("\n📐 EJEMPLO VISUAL: 'tail' de una Lista")
  println("─" * 50)

  val palabras = ImmutableList("Head", "T", "A", "I", "L")
  println(palabras)
  toScalaList(palabras) // Resultado inline → List(Head, T, A, I, L)
  println(toScalaList(palabras))

  val tailDeLista = tail(palabras)
  toScalaList(tailDeLista) // Resultado inline → List(T, A, I, L)
  println(toScalaList(tailDeLista))

  // Original sin cambios
  toScalaList(palabras) // Resultado inline → List(Head, T, A, I, L)
  println(toScalaList(palabras))

  // ===========================================================================
  // CONCEPTO 4: ADIÓS A LAS COPIAS DEFENSIVAS
  // ===========================================================================

  /** 🛡️ EN SCALA, la inmutabilidad elimina la necesidad de copias defensivas
    *
    * Con case class + val + colecciones inmutables, es IMPOSIBLE modificar los
    * datos compartidos. El compilador lo garantiza.
    */

  // Tipos inmutables (case class = inmutable por defecto)
  case class Usuario(id: String, nombre: String)

  // Repositorio inmutable
  case class RepositorioInmutable(usuarios: ImmutableList[Usuario] = Nil):
    // Retorna un NUEVO repositorio con el usuario agregado
    def agregarUsuario(id: String, nombre: String): RepositorioInmutable =
      RepositorioInmutable(prepend(Usuario(id, nombre), usuarios))

    // ✅ Podemos retornar la referencia sin miedo - es inmutable
    def getUsuarios: ImmutableList[Usuario] = usuarios

  // ===========================================================================
  // DEMO 4: 🛡️ Inmutabilidad garantizada
  // ===========================================================================

  println("\n🛡️ ADIÓS A LAS COPIAS DEFENSIVAS")
  println("─" * 50)

  val repo1 = RepositorioInmutable()
  println(repo1)
  toScalaList(repo1.getUsuarios) // vacío → List()
  val repo2 = repo1.agregarUsuario("1", "Ana")
  println(repo2)
  println(toScalaList(repo2.getUsuarios))
  val repo3 = repo2.agregarUsuario("2", "Bob")
  println(repo3)
  println(toScalaList(repo3.getUsuarios))

  toScalaList(repo1.getUsuarios) // vacío → List()
  toScalaList(repo2.getUsuarios) // con Ana → List(Usuario(1,Ana))
  toScalaList(
    repo3.getUsuarios
  ) // con Ana y Bob → List(Usuario(2,Bob), Usuario(1,Ana))

  // Intentar modificar es un ERROR DE COMPILACIÓN:
  // repo3.usuarios = Nil                    // ❌ val no reassignable
  // repo3.getUsuarios.head.nombre = "X"     // ❌ case class inmutable

  // ===========================================================================
  // 📊 TABLA DE COMPLEJIDAD
  // ===========================================================================

  println("\n? TABLA DE COMPLEJIDAD - Lista Inmutable")
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
  println("* Amortizado  ** Requiere copia defensiva")

  // ===========================================================================
  // 🔄 COMPARATIVA TypeScript vs Scala
  // ===========================================================================

  println("\n? COMPARATIVA: TypeScript vs Scala")
  println("═" * 65)
  println(
    "│ Aspecto                │ TypeScript          │ Scala             │"
  )
  println(
    "├────────────────────────┼─────────────────────┼───────────────────┤"
  )
  println(
    "│ Inmutabilidad default  │ No (requiere effort)│ Sí (val,case class│"
  )
  println(
    "│ readonly               │ Solo compile-time   │ Runtime enforced  │"
  )
  println(
    "│ Pattern matching       │ Limitado            │ Nativo y poderoso │"
  )
  println(
    "│ Covarianza             │ Inferida            │ Explícita (+A)    │"
  )
  println(
    "│ sealed types           │ No nativo           │ Garantiza exhaust.│"
  )
  println(
    "│ Colecciones inmutables │ Requiere disciplina │ Default del stdlib│"
  )
  println("═" * 65)

  // ===========================================================================
  // 📚 RESUMEN
  // ===========================================================================

  println("\n" + "═" * 70)
  println("📚 RESUMEN DE CONCEPTOS:")
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

  // ===========================================================================
  // 🎯 RETO DE REFACTORIZACIÓN
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

  case class HistorialInmutable(historial: ImmutableList[String] = Nil):
    // Retorna un NUEVO historial con el usuario agregado
    def agregar(cambio: String): HistorialInmutable =
      HistorialInmutable(prepend(cambio, historial))

    def deshacer(): HistorialInmutable =
      HistorialInmutable(tail(historial))

    // ✅ Podemos retornar la referencia sin miedo - es inmutable
    def getHistorial: ImmutableList[String] = historial

  // ===========================================================================
  // 🏁 VERIFICACIÓN DE LA SOLUCIÓN
  // ===========================================================================

  println("\n🏁 VERIFICACIÓN DEL RETO:")
  println("─" * 70)

  val h0 = HistorialInmutable()
  println(h0)
  println(h0.getHistorial)
  val h1 = h0.agregar("Cambio 1: Inicialización")
  println(h1)
  println(h1.getHistorial)
  val h2 = h1.agregar("Cambio 2: Configuración")
  println(h2)
  println(h2.getHistorial)
  val h3 = h2.agregar("Cambio 3: Error humano")
  println(h3)
  println(h3.getHistorial)

  println(s"Estado actual (h3): ${toScalaList(h3.getHistorial)}")
  // Esperado: List(Cambio 3, Cambio 2, Cambio 1)

  val hUndo = h3.deshacer()
  println(s"Después de deshacer (hUndo): ${toScalaList(hUndo.getHistorial)}")
  // Esperado: List(Cambio 2, Cambio 1)

  println("\n✅ Inmutabilidad verificada: h3 sigue intacto")
  println(s"h3 original: ${toScalaList(h3.getHistorial)}")
}
