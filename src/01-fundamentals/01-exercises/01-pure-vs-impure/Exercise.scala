object Exercise extends App {
  /**
   * =============================================================================
   * EJERCICIO: FUNCIONES PURAS vs FUNCIONES IMPURAS (Scala)
   * =============================================================================
   * 
   * Este ejercicio te ayudará a entender el concepto central del fragmento:
   * 
   * "Pure functional programming restricts functions to be as they are in 
   * mathematics: binary relations that map arguments to results."
   * 
   * En matemáticas, una función es una RELACIÓN que mapea entradas a salidas.
   * Por ejemplo: f(x) = x + 2
   *   - Si x = 3, entonces f(3) = 5 SIEMPRE
   *   - No importa cuántas veces llames f(3), siempre dará 5
   *   - La función no modifica nada en el "mundo exterior"
   * 
   * =============================================================================
   */
  
  object PureVsImpure extends App {
  
    // =============================================================================
    // PARTE 1: FUNCIONES IMPURAS (con efectos secundarios)
    // =============================================================================
  
    // Variable mutable - ¡Esto es una señal de peligro en FP!
    // En Scala usamos 'var' para variables mutables (evitar en FP)
    var contadorGlobal: Int = 0
  
    /**
     * FUNCIÓN IMPURA #1: Modifica estado global
     * 
     * ¿Por qué es impura?
     * - Modifica una variable externa (contadorGlobal)
     * - Cada vez que la llamas, el resultado cambia
     * - El "efecto secundario" es la modificación del contador
     */
    def incrementarContador(): Int = {
      // Efecto secundario: modificamos una variable externa
      contadorGlobal = contadorGlobal + 1
      // Retornamos el nuevo valor (la última expresión es el return en Scala)
      contadorGlobal
    }
  
    /**
     * FUNCIÓN IMPURA #2: Lee estado global
     * 
     * ¿Por qué es impura?
     * - Depende de una variable externa que puede cambiar
     * - El resultado no depende SOLO de sus argumentos
     * - Es impredecible: el mismo input puede dar diferentes outputs
     */
    def sumarConContador(numero: Int): Int = {
      // El resultado depende de "contadorGlobal" que puede cambiar
      numero + contadorGlobal
    }
  
    /**
     * FUNCIÓN IMPURA #3: Genera efectos en el mundo exterior
     * 
     * ¿Por qué es impura?
     * - println es un "efecto secundario" (I/O - Input/Output)
     * - Estamos interactuando con el mundo exterior
     * - No solo calculamos un valor, también HACEMOS algo
     */
    def saludarUsuario(nombre: String): String = {
      // Efecto secundario: imprimimos en consola
      println(s"¡Hola, $nombre!")
      // Aunque retornamos un valor, ya produjimos un efecto
      s"¡Hola, $nombre!"
    }
  
    /**
     * FUNCIÓN IMPURA #4: Depende del tiempo
     * 
     * ¿Por qué es impura?
     * - El resultado cambia según el momento en que la llamas
     * - No hay forma de predecir el resultado solo con los argumentos
     */
    def obtenerSaludoConHora(nombre: String): String = {
      // java.time.LocalDateTime.now() cambia cada vez que lo llamas
      val hora = java.time.LocalDateTime.now().getHour
      // El resultado depende de cuándo llamas la función
      if (hora < 12) s"Buenos días, $nombre"
      else if (hora < 18) s"Buenas tardes, $nombre"
      else s"Buenas noches, $nombre"
    }
  
    /**
     * FUNCIÓN IMPURA #5: Genera números aleatorios
     * 
     * ¿Por qué es impura?
     * - scala.util.Random produce valores diferentes cada vez
     * - El mismo input no garantiza el mismo output
     */
    def tirarDado(): Int = {
      // Random es inherentemente impuro
      scala.util.Random.nextInt(6) + 1
    }
  
  
    // =============================================================================
    // PARTE 2: FUNCIONES PURAS (sin efectos secundarios)
    // =============================================================================
  
    /**
     * FUNCIÓN PURA #1: Suma simple
     * 
     * ¿Por qué es pura?
     * - Solo depende de sus argumentos (a y b)
     * - Siempre retorna el mismo resultado para los mismos argumentos
     * - No modifica nada externo
     * - No tiene efectos secundarios
     */
    def sumar(a: Int, b: Int): Int = {
      // Solo usamos los parámetros, nada externo
      a + b
    }
  
    /**
     * FUNCIÓN PURA #2: Transformación de datos
     * 
     * ¿Por qué es pura?
     * - Toma un String y retorna otro String
     * - El resultado es 100% predecible
     * - No modifica el String original (los Strings son inmutables)
     */
    def convertirAMayusculas(texto: String): String = {
      // toUpperCase no modifica "texto", crea un nuevo String
      texto.toUpperCase
    }
  
    /**
     * FUNCIÓN PURA #3: Cálculo matemático
     * 
     * ¿Por qué es pura?
     * - Es una fórmula matemática pura
     * - Para el mismo radio, siempre da la misma área
     * - Math.PI es una constante, no cambia
     */
    def calcularAreaCirculo(radio: Double): Double = {
      // Pi es una constante, no una variable mutable
      // El resultado depende SOLO del radio
      Math.PI * radio * radio
    }
  
    /**
     * FUNCIÓN PURA #4: Crear nuevo objeto (sin mutar el original)
     * 
     * ¿Por qué es pura?
     * - No modifica el objeto original
     * - Crea y retorna un NUEVO objeto
     * - El resultado es predecible
     * 
     * Usamos 'case class' que es inmutable por defecto en Scala
     */
    case class Usuario(nombre: String, edad: Int)
  
    def incrementarEdad(usuario: Usuario): Usuario = {
      // ¡NO podemos hacer esto en Scala con case class! (son inmutables)
      // usuario.edad = usuario.edad + 1  // Error de compilación
      
      // En su lugar, usamos 'copy' para crear un NUEVO objeto
      // copy() es un método que Scala genera automáticamente para case classes
      usuario.copy(edad = usuario.edad + 1)
    }
  
    /**
     * FUNCIÓN PURA #5: Trabajar con listas (sin mutar)
     * 
     * ¿Por qué es pura?
     * - No modifica la lista original (List en Scala es inmutable por defecto)
     * - Retorna una NUEVA lista
     * - El resultado es predecible para el mismo input
     */
    def duplicarNumeros(numeros: List[Int]): List[Int] = {
      // map crea una NUEVA lista, no modifica la original
      // Cada elemento se transforma multiplicándolo por 2
      numeros.map(n => n * 2)
      // Alternativa con placeholder: numeros.map(_ * 2)
    }
  
  
    // =============================================================================
    // PARTE 3: DEMOSTRACIÓN PRÁCTICA
    // =============================================================================
  
    println("=" * 60)
    println("DEMOSTRACIÓN: FUNCIONES PURAS vs IMPURAS (Scala)")
    println("=" * 60)
  
    // --- Demostración de impureza ---
    println("\n📛 FUNCIONES IMPURAS:")
    println("-" * 40)
  
    // La función impura da resultados diferentes cada vez
    println(s"incrementarContador(): ${incrementarContador()}") // 1
    println(s"incrementarContador(): ${incrementarContador()}") // 2
    println(s"incrementarContador(): ${incrementarContador()}") // 3
    // ¡El mismo código produce resultados diferentes!
  
    println(s"\nsumarConContador(10): ${sumarConContador(10)}") // 10 + 3 = 13
    incrementarContador() // Cambiamos el estado global
    println(s"sumarConContador(10): ${sumarConContador(10)}") // 10 + 4 = 14
    // ¡Mismo argumento, diferente resultado!
  
    // --- Demostración de pureza ---
    println("\n✅ FUNCIONES PURAS:")
    println("-" * 40)
  
    // La función pura SIEMPRE da el mismo resultado para los mismos argumentos
    println(s"sumar(5, 3): ${sumar(5, 3)}") // 8
    println(s"sumar(5, 3): ${sumar(5, 3)}") // 8
    println(s"sumar(5, 3): ${sumar(5, 3)}") // 8
    // ¡Siempre 8! Esto es "referential transparency" (transparencia referencial)
  
    // Demostración de inmutabilidad
    val usuarioOriginal = Usuario("Ana", 25)
    val usuarioNuevo = incrementarEdad(usuarioOriginal)
  
    println(s"\nUsuario original: $usuarioOriginal") // Usuario(Ana,25)
    println(s"Usuario nuevo: $usuarioNuevo")          // Usuario(Ana,26)
    // ¡El original NO cambió! Esto es inmutabilidad.
  
    val numerosOriginales = List(1, 2, 3, 4, 5)
    val numerosDobles = duplicarNumeros(numerosOriginales)
  
    println(s"\nLista original: $numerosOriginales")  // List(1, 2, 3, 4, 5)
    println(s"Lista modificada: $numerosDobles")     // List(2, 4, 6, 8, 10)
    // ¡El original NO cambió!
  
  
    // =============================================================================
    // PARTE 4: TU EJERCICIO PRÁCTICO
    // =============================================================================
  
    /**
     * EJERCICIO 1: Identifica si estas funciones son puras o impuras
     * 
     * Para cada función, pregúntate:
     * 1. ¿Depende SOLO de sus argumentos?
     * 2. ¿Siempre retorna el mismo resultado para los mismos argumentos?
     * 3. ¿Modifica algo externo (variables globales, objetos mutables)?
     * 4. ¿Produce efectos secundarios (I/O, red, disco)?
     */
  
    // ¿PURA O IMPURA? (descomenta y analiza)
    // def misteriosa1(x: Int): Int = x * x
  
    // ¿PURA O IMPURA?
    // var total = 0
    // def misteriosa2(x: Int): Int = {
    //   total += x
    //   total
    // }
  
    // ¿PURA O IMPURA?
    // def misteriosa3(items: List[String]): Int = items.length
  
    /**
     * EJERCICIO 2: Convierte esta función impura en pura
     * 
     * Función impura original:
     */
    var descuentoGlobal = 0.1 // 10% de descuento
  
    def calcularPrecioFinal(precio: Double): Double = {
      // IMPURA: depende de una variable global
      precio * (1 - descuentoGlobal)
    }
  
    // Tu tarea: escribe una versión PURA de esta función
    // Pista: ¿Qué necesitas pasar como argumento adicional?
  
    // def calcularPrecioFinalPuro(precio: Double, ???): Double = {
    //   // Tu código aquí
    // }
  
  
    /**
     * EJERCICIO 3: Refactoriza esta función impura
     * 
     * Nota: Usamos ArrayBuffer porque es mutable (para demostrar el problema)
     * En código real, usaríamos List (inmutable)
     */
    import scala.collection.mutable.ArrayBuffer
    val carritoDeCompras: ArrayBuffer[Double] = ArrayBuffer()
  
    def agregarAlCarrito(precio: Double): Unit = {
      // IMPURA: modifica un buffer global
      carritoDeCompras += precio
    }
  
    // Tu tarea: escribe una versión PURA usando List inmutable
    // Pista: en lugar de modificar, crea una nueva lista
  
    // def agregarAlCarritoPuro(carrito: List[Double], precio: Double): List[Double] = {
    //   // Tu código aquí - pista: usa :: o :+ para agregar elementos
    // }
  
  
    // =============================================================================
    // RESUMEN CONCEPTUAL
    // =============================================================================
  
    /**
     * CONCLUSIÓN DEL FRAGMENTO:
     * 
     * El texto dice que Scala es un lenguaje funcional "impuro" porque permite
     * AMBOS tipos de funciones (puras e impuras) sin distinguirlas sintácticamente.
     * 
     * Esto significa:
     * - Scala NO te obliga a escribir funciones puras
     * - Scala NO te impide escribir funciones impuras  
     * - Es TU responsabilidad elegir cuándo usar cada una
     * 
     * NOTA IMPORTANTE SOBRE SCALA:
     * Scala te da herramientas para facilitar la programación pura:
     * - 'val' en lugar de 'var' (valores inmutables)
     * - 'case class' (objetos inmutables por defecto)
     * - 'List', 'Set', 'Map' inmutables por defecto
     * - Pero NO te obliga a usarlos
     * 
     * Un lenguaje "puro" como Haskell SÍ distingue entre puras e impuras
     * usando su sistema de tipos (el famoso "IO Monad").
     * 
     * En Scala, puedes usar librerías como Cats Effect o ZIO para
     * obtener un sistema similar de efectos, pero es OPCIONAL.
     * 
     * ¿Por qué importa esto?
     * 
     * FUNCIONES PURAS son más fáciles de:
     * - Testear (siempre mismo input → mismo output)
     * - Razonar (no hay "estado oculto")
     * - Paralelizar (no hay conflictos de estado)
     * - Componer (combinar funciones simples en complejas)
     * - Cachear (memoización)
     * 
     * FUNCIONES IMPURAS son necesarias para:
     * - Interactuar con el mundo (I/O, red, disco)
     * - Generar aleatoriedad
     * - Obtener la hora actual
     * - Cualquier "efecto" observable
     * 
     * El arte de la programación funcional es:
     * MAXIMIZAR las funciones puras y AISLAR las impuras en los bordes del sistema.
     */
  
    println("\n" + "=" * 60)
    println("¡Ejecuta este archivo y observa los resultados!")
    println("Luego, intenta resolver los ejercicios en PARTE 4.")
    println("=" * 60)
  }
  
}