// ============================================================================
// 📚 LECCIÓN: FUNCIONES PURAS vs IMPURAS EN SCALA
// ============================================================================
// Este archivo explica TODAS las keywords de Scala usadas, línea por línea.
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// KEYWORD: object
// ─────────────────────────────────────────────────────────────────────────────
// `object` crea un SINGLETON - una única instancia de una "clase" que existe
// globalmente. No necesitas hacer `new Exercise()`, ya existe automáticamente.
//
// Es similar a un módulo en TypeScript o una clase estática en Java.
// ─────────────────────────────────────────────────────────────────────────────

// KEYWORD: extends App
// ─────────────────────────────────────────────────────────────────────────────
// `extends` significa "hereda de" (como en POO tradicional).
// `App` es un trait (interfaz con implementación) que permite ejecutar código
// directamente. Todo el código dentro del object se ejecuta como si fuera main().
//
// Sin `extends App`, necesitarías definir un método main explícito:
//   def main(args: Array[String]): Unit = { ... }
// ─────────────────────────────────────────────────────────────────────────────

object Exercise extends App {

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ OBJETO ANIDADO: PureVsImpure                                            │
  // └─────────────────────────────────────────────────────────────────────────┘
  // Scala permite anidar objetos dentro de otros objetos.
  // Esto crea un namespace/módulo dentro de Exercise.

  object PureVsImpure extends App {

    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: var
    // ─────────────────────────────────────────────────────────────────────────
    // `var` declara una variable MUTABLE (puede cambiar su valor).
    // ⚠️ En programación funcional, evitamos `var` porque rompe la inmutabilidad.
    //
    // KEYWORD: Int
    // `Int` es el tipo de dato para números enteros (32 bits).
    // Scala tiene inferencia de tipos, pero aquí lo declaramos explícitamente
    // con `: Int` (dos puntos + tipo).
    //
    // `= 0` es la asignación inicial del valor.
    // ─────────────────────────────────────────────────────────────────────────

    var contadorGlobal: Int = 0 // Variable mutable que guarda el estado global

    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: def
    // ─────────────────────────────────────────────────────────────────────────
    // `def` define un MÉTODO o FUNCIÓN.
    // Sintaxis: def nombreFuncion(parametros): TipoRetorno = { cuerpo }
    //
    // (): Los paréntesis vacíos indican que no recibe parámetros.
    //     En Scala, `def foo()` y `def foo` son ligeramente diferentes:
    //     - `foo()` es un método que debe llamarse con paréntesis
    //     - `foo` es un método que puede llamarse sin paréntesis
    //
    // : Int - El tipo de retorno viene DESPUÉS del nombre y paréntesis.
    //         Esto es diferente a TypeScript que usa `function foo(): number`
    //
    // = { ... } - El signo igual indica que la función retorna un valor.
    //             Las llaves contienen el cuerpo de la función.
    // ─────────────────────────────────────────────────────────────────────────

    // 🔴 FUNCIÓN IMPURA: Modifica estado global (contadorGlobal)
    def incrementarContador(): Int = {
      // Esta línea reasigna el valor de contadorGlobal
      // `contadorGlobal + 1` crea un nuevo valor, que se asigna de vuelta
      contadorGlobal = contadorGlobal + 1

      // Scala retorna IMPLÍCITAMENTE la última expresión del bloque
      // No necesitas escribir `return contadorGlobal`
      // La siguiente línea es equivalente a: return contadorGlobal;
      contadorGlobal
      // Salida esperada: 1 (primera llamada), 2 (segunda llamada), etc.
    }

    // 🔴 FUNCIÓN IMPURA: Lee estado global (hace que el resultado sea impredecible)
    def sumarConContador(numero: Int): Int = {
      // `numero: Int` - parámetro llamado "numero" de tipo Int
      // El resultado depende tanto de `numero` como del estado global `contadorGlobal`
      numero + contadorGlobal
      // Si contadorGlobal = 2 y numero = 5, salida: 7
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: String
    // ─────────────────────────────────────────────────────────────────────────
    // `String` es el tipo para cadenas de texto (como en Java/TypeScript).
    // ─────────────────────────────────────────────────────────────────────────

    // 🔴 FUNCIÓN IMPURA: Realiza side effect (println imprime a consola)
    def saludarUsuario(nombre: String): String = {
      // ─────────────────────────────────────────────────────────────────────
      // FEATURE: String Interpolation (s"...")
      // ─────────────────────────────────────────────────────────────────────
      // `s"texto $variable"` permite insertar variables dentro de strings.
      // El prefijo `s` antes de las comillas activa la interpolación.
      // `$nombre` se reemplaza por el valor de la variable `nombre`.
      // Para expresiones complejas: s"resultado: ${1 + 2}" → "resultado: 3"
      // ─────────────────────────────────────────────────────────────────────

      // `println` es una función que imprime a la consola (side effect!)
      println(
        s"¡Hola, $nombre!"
      ) // Salida a consola: ¡Hola, Juan! (si nombre = "Juan")

      // Retorna el mismo string (pero el println ya causó el side effect)
      s"¡Hola, $nombre!"
    }

    // 🔴 FUNCIÓN IMPURA: Depende de la hora actual del sistema
    def obtenerSaludoConHora(nombre: String): String = {
      // ─────────────────────────────────────────────────────────────────────
      // KEYWORD: val
      // ─────────────────────────────────────────────────────────────────────
      // `val` declara una variable INMUTABLE (no puede cambiar su valor).
      // ✅ En programación funcional, preferimos `val` sobre `var`.
      // Es como `const` en JavaScript/TypeScript.
      // ─────────────────────────────────────────────────────────────────────

      // java.time.LocalDateTime.now() obtiene la fecha/hora actual
      // .getHour retorna la hora (0-23)
      // ⚠️ Esto es impuro porque depende del "mundo exterior" (reloj del sistema)
      val hora = java.time.LocalDateTime.now().getHour
      // Salida variable: depende de cuándo se ejecute (ej: 14 si son las 2pm)

      // ─────────────────────────────────────────────────────────────────────
      // KEYWORD: if / else if / else
      // ─────────────────────────────────────────────────────────────────────
      // Control de flujo condicional, igual que en otros lenguajes.
      // ¡DIFERENCIA IMPORTANTE! En Scala, `if` es una EXPRESIÓN, no una sentencia.
      // Esto significa que `if` RETORNA un valor:
      //   val resultado = if (condicion) "a" else "b"
      //
      // `<` es el operador "menor que" (less than)
      // ─────────────────────────────────────────────────────────────────────

      if (hora < 12) s"Buenos días, $nombre" // Si hora < 12: retorna esto
      else if (hora < 18)
        s"Buenas tardes, $nombre" // Si hora >= 12 y < 18: retorna esto
      else s"Buenas noches, $nombre" // Si hora >= 18: retorna esto
      // Salida ejemplo a las 10am con nombre="María": "Buenos días, María"
    }

    // 🔴 FUNCIÓN IMPURA: Usa generación aleatoria (no determinista)
    def tirarDado(): Int = {
      // scala.util.Random es la clase para números aleatorios
      // .nextInt(6) genera un número aleatorio entre 0 y 5 (exclusive 6)
      // + 1 lo convierte a rango 1-6 (como un dado real)
      scala.util.Random.nextInt(6) + 1
      // Salida impredecible: 1, 2, 3, 4, 5 o 6 (diferente cada vez)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ FUNCIONES PURAS
    // ─────────────────────────────────────────────────────────────────────────
    // Una función es PURA si:
    // 1. Dado el mismo input, SIEMPRE retorna el mismo output
    // 2. No tiene efectos secundarios (no modifica estado externo)
    // ─────────────────────────────────────────────────────────────────────────

    // ✅ FUNCIÓN PURA: Solo usa sus parámetros, retorno predecible
    def sumar(a: Int, b: Int): Int = {
      // Recibe dos parámetros: a y b, ambos de tipo Int
      // Retorna la suma de ambos
      a + b
      // sumar(2, 3) SIEMPRE retorna 5, sin importar cuántas veces se llame
    }

    // ✅ FUNCIÓN PURA: Transformación sin side effects
    def convertirAMayusculas(texto: String): String = {
      // .toUpperCase es un método de String que retorna una NUEVA cadena
      // en mayúsculas. No modifica la cadena original.
      texto.toUpperCase
      // convertirAMayusculas("hola") → "HOLA"
    }

    // ✅ FUNCIÓN PURA: (para completar)
    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: Double
    // ─────────────────────────────────────────────────────────────────────────
    // `Double` es el tipo para números de punto flotante (64 bits).
    // Úsalo para números decimales como 3.14159
    // ⚠️ Para dinero, mejor usar BigDecimal para evitar errores de precisión
    // ─────────────────────────────────────────────────────────────────────────
    def calcularAreaCirculo(radio: Double): Double = {}
    // TODO: Completa esta función
    // Fórmula: π * radio²
    // Puedes usar: Math.PI * radio * radio
    // Salida esperada para radio=2.0: 12.566370614359172

    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: case class
    // ─────────────────────────────────────────────────────────────────────────
    // `case class` crea una clase de datos INMUTABLE con:
    //   - Constructor automático (no necesitas `new`)
    //   - equals() y hashCode() automáticos
    //   - toString() legible automático
    //   - Método .copy() para crear copias modificadas
    //   - Pattern matching habilitado
    //
    // Es similar a un `type` o `interface` con readonly en TypeScript,
    // pero es una clase real con funcionalidad adicional.
    //
    // Los parámetros del constructor se convierten automáticamente en
    // propiedades públicas e inmutables (val implícito).
    // ─────────────────────────────────────────────────────────────────────────

    case class Usuario(nombre: String, edad: Int)
    // Crea una clase Usuario con dos propiedades: nombre (String) y edad (Int)
    // Uso: val u = Usuario("Ana", 25) - ¡no necesitas `new`!

    // ✅ FUNCIÓN PURA: No modifica el usuario original, retorna uno nuevo
    def incrementarEdad(usuario: Usuario): Usuario = {
      // ─────────────────────────────────────────────────────────────────────
      // MÉTODO: .copy()
      // ─────────────────────────────────────────────────────────────────────
      // .copy() es un método especial de case class que crea una NUEVA
      // instancia con algunos campos modificados.
      //
      // Sintaxis: objeto.copy(campo = nuevoValor)
      // Los campos no especificados mantienen su valor original.
      //
      // Esto es INMUTABILIDAD: no modificamos el original, creamos una copia.
      // ─────────────────────────────────────────────────────────────────────

      usuario.copy(edad = usuario.edad + 1)
      // Si usuario = Usuario("Ana", 25), retorna Usuario("Ana", 26)
      // El usuario original NO se modifica
    }

    // ✅ FUNCIÓN PURA: (para completar)
    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: List
    // ─────────────────────────────────────────────────────────────────────────
    // `List[Int]` es una lista inmutable de enteros.
    // En Scala, List es inmutable por defecto (a diferencia de Java).
    // Se crea con List(1, 2, 3) o List.empty
    // ─────────────────────────────────────────────────────────────────────────
    def duplicarNumeros(numeros: List[Int]): List[Int] = {}
    // TODO: Completa esta función usando .map()
    // Pista: numeros.map(n => n * 2)
    // Salida esperada para List(1, 2, 3): List(2, 4, 6)

    // ─────────────────────────────────────────────────────────────────────────
    // FUNCIÓN: println
    // ─────────────────────────────────────────────────────────────────────────
    // `println` imprime texto a la consola seguido de un salto de línea.
    // Es una función impura porque tiene el side effect de escribir a stdout.
    // ─────────────────────────────────────────────────────────────────────────

    println("DEMOSTRACIÓN: FUNCIONES PURAS vs IMPURAS (Scala)")
    // Salida: DEMOSTRACIÓN: FUNCIONES PURAS vs IMPURAS (Scala)

    // ─────────────────────────────────────────────────────────────────────────
    // FEATURE: Secuencias de escape en strings
    // ─────────────────────────────────────────────────────────────────────────
    // \n = salto de línea (newline)
    // \t = tabulación
    // \\ = backslash literal
    // \" = comilla doble literal (dentro de strings)
    // ─────────────────────────────────────────────────────────────────────────

    println("\n📛 FUNCIONES IMPURAS:")
    // Salida: (línea vacía, luego) 📛 FUNCIONES IMPURAS:

    println("\n✅ FUNCIONES PURAS:")
    // Salida: (línea vacía, luego) ✅ FUNCIONES PURAS:

    // Creación de instancias de case class
    val usuarioOriginal = Usuario("Ana", 25)
    // Crea un Usuario inmutable con nombre="Ana" y edad=25
    // Salida (si imprimes): Usuario(Ana,25)

    val usuarioNuevo = incrementarEdad(usuarioOriginal)
    // Llama a incrementarEdad y guarda el resultado en usuarioNuevo
    // usuarioOriginal sigue siendo Usuario("Ana", 25) - ¡no cambió!
    // usuarioNuevo es Usuario("Ana", 26)

    val numerosOriginales = List(1, 2, 3, 4, 5)
    // Crea una lista inmutable con 5 elementos
    // Salida (si imprimes): List(1, 2, 3, 4, 5)

    val numerosDobles = duplicarNumeros(numerosOriginales)
    // Actualmente retorna List() porque la función está vacía
    // Cuando la completes: List(2, 4, 6, 8, 10)
    // numerosOriginales sigue siendo List(1, 2, 3, 4, 5) - ¡no cambió!

    // Función por completar
    def calcularPrecioFinal(precio: Double): Double = {}
    // TODO: Calcula precio con 10% de descuento
    // Pista: precio * 0.9
    // calcularPrecioFinal(100.0) → 90.0

    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: import
    // ─────────────────────────────────────────────────────────────────────────
    // `import` trae clases/objetos de otros paquetes al scope actual.
    // Similar a import en Java/TypeScript.
    //
    // scala.collection.mutable.ArrayBuffer - ruta completa del paquete
    // ─────────────────────────────────────────────────────────────────────────

    import scala.collection.mutable.ArrayBuffer
    // Ahora podemos usar ArrayBuffer directamente sin el prefijo completo

    // ─────────────────────────────────────────────────────────────────────────
    // CLASE: ArrayBuffer (MUTABLE - ¡evitar en FP!)
    // ─────────────────────────────────────────────────────────────────────────
    // ArrayBuffer es una colección MUTABLE que permite añadir/eliminar elementos.
    // Es como un ArrayList en Java o un Array normal en JavaScript.
    // ⚠️ En FP, preferimos colecciones inmutables (List, Vector, etc.)
    //
    // ArrayBuffer[Double] - es un ArrayBuffer que contiene Doubles
    // ArrayBuffer() - crea un ArrayBuffer vacío (los paréntesis vacíos)
    // ─────────────────────────────────────────────────────────────────────────

    val carritoDeCompras: ArrayBuffer[Double] = ArrayBuffer()
    // Crea un carrito vacío que puede contener precios (Double)
    // Nota: aunque es `val`, el CONTENIDO es mutable (puedes añadir elementos)
    // `val` solo previene reasignar la variable, no mutaciones internas

    // ─────────────────────────────────────────────────────────────────────────
    // KEYWORD: Unit
    // ─────────────────────────────────────────────────────────────────────────
    // `Unit` es el tipo de retorno para funciones que no retornan nada útil.
    // Es equivalente a `void` en Java/TypeScript/C++.
    // El único valor de tipo Unit es `()` (paréntesis vacíos).
    //
    // Si una función tiene side effects y no retorna nada, usa Unit.
    // ─────────────────────────────────────────────────────────────────────────

    // 🔴 FUNCIÓN IMPURA: Modifica estado externo (carritoDeCompras)
    def agregarAlCarrito(precio: Double): Unit = {
      // ─────────────────────────────────────────────────────────────────────
      // OPERADOR: +=
      // ─────────────────────────────────────────────────────────────────────
      // `+=` es un operador que añade un elemento a una colección mutable.
      // Es azúcar sintáctico para carritoDeCompras.addOne(precio)
      // ⚠️ Esto MUTA el ArrayBuffer - es un side effect!
      // ─────────────────────────────────────────────────────────────────────

      carritoDeCompras += precio
      // Modifica carritoDeCompras añadiendo el precio
      // No retorna nada útil (Unit), solo causa el side effect
    }

    println("¡Ejecuta este archivo y observa los resultados!")
    // Salida: ¡Ejecuta este archivo y observa los resultados!

    println("Luego, intenta resolver los ejercicios en PARTE 4.")
    // Salida: Luego, intenta resolver los ejercicios en PARTE 4.
  }

}

// ═══════════════════════════════════════════════════════════════════════════
// 📖 RESUMEN DE KEYWORDS DE SCALA
// ═══════════════════════════════════════════════════════════════════════════
//
// DECLARACIONES:
// ┌──────────────┬────────────────────────────────────────────────────────────┐
// │ Keyword      │ Descripción                                                │
// ├──────────────┼────────────────────────────────────────────────────────────┤
// │ object       │ Singleton - única instancia global                         │
// │ case class   │ Clase de datos inmutable con utilidades automáticas        │
// │ def          │ Define un método/función                                   │
// │ val          │ Variable INMUTABLE (preferido en FP) ✅                    │
// │ var          │ Variable MUTABLE (evitar en FP) ⚠️                         │
// │ import       │ Importa clases/objetos de otros paquetes                   │
// └──────────────┴────────────────────────────────────────────────────────────┘
//
// TIPOS:
// ┌──────────────┬────────────────────────────────────────────────────────────┐
// │ Tipo         │ Descripción                                                │
// ├──────────────┼────────────────────────────────────────────────────────────┤
// │ Int          │ Entero de 32 bits (-2147483648 a 2147483647)              │
// │ Double       │ Punto flotante de 64 bits (decimales)                      │
// │ String       │ Cadena de texto                                            │
// │ Boolean      │ true o false                                               │
// │ Unit         │ Equivalente a void (sin valor de retorno)                  │
// │ List[T]      │ Lista inmutable de tipo T                                  │
// └──────────────┴────────────────────────────────────────────────────────────┘
//
// CONTROL DE FLUJO:
// ┌──────────────┬────────────────────────────────────────────────────────────┐
// │ Keyword      │ Descripción                                                │
// ├──────────────┼────────────────────────────────────────────────────────────┤
// │ if/else      │ Condicional (¡es una expresión que retorna valor!)        │
// │ extends      │ Herencia de clase/trait                                    │
// └──────────────┴────────────────────────────────────────────────────────────┘
//
// CARACTERÍSTICAS ESPECIALES:
// ┌──────────────┬────────────────────────────────────────────────────────────┐
// │ Feature      │ Ejemplo                                                    │
// ├──────────────┼────────────────────────────────────────────────────────────┤
// │ Interpolación│ s"Hola, $nombre" - inserta variables en strings           │
// │ .copy()      │ usuario.copy(edad = 30) - crea copia con cambios          │
// │ Retorno impl │ Última expresión se retorna automáticamente               │
// └──────────────┴────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════
