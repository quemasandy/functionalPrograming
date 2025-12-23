/** 🔤 Word Frequency Counter - Enfoque Funcional en Scala
  *
  * Este script demuestra el poder de Scala para programación funcional:
  *   - Inmutabilidad por defecto (val, case class)
  *   - Pattern matching para transformaciones
  *   - Colecciones inmutables con métodos funcionales
  *
  * 📚 Referencia: "Functional Programming in Scala" - Red Book Capítulo 3:
  * Functional Data Structures
  *
  * Scala brilla aquí porque:
  *   1. Las colecciones son inmutables por defecto
  *   2. `foldLeft` es nativo y expresivo
  *   3. Pattern matching hace el código más legible
  *   4. Los case class son inmutables automáticamente
  */

import scala.io.Source
import scala.util.Using

object WordFrequency:

  // ===========================================================================
  // 📦 TIPOS
  // ===========================================================================

  /** Representa una palabra con su frecuencia.
    *
    * `case class` en Scala es INMUTABLE por defecto:
    *   - No necesitamos `readonly` como en TypeScript
    *   - Viene con `equals`, `hashCode`, `copy` gratis
    *   - Es perfecto para datos inmutables
    */
  case class WordCount(word: String, count: Int)

  // ===========================================================================
  // 🔧 FUNCIONES PURAS
  // ===========================================================================

  /** Tokeniza un texto en palabras individuales.
    *
    * @param text
    *   El texto a tokenizar
    * @return
    *   Lista inmutable de palabras normalizadas
    *
    * 📚 En Scala, `.filter`, `.map`, etc. SIEMPRE retornan nuevas colecciones.
    * No hay mutación posible - es inmutable por diseño del lenguaje.
    */
  def tokenize(text: String): List[String] =
    text.toLowerCase // Normalizar a minúsculas
      .replaceAll("[^a-záéíóúüñ\\s]", " ") // Remover caracteres especiales
      .split("\\s+") // Dividir por espacios
      .toList // Convertir Array a List inmutable
      .filter(_.length > 2) // Filtrar palabras muy cortas

  /** Cuenta la frecuencia de cada palabra usando foldLeft.
    *
    * @param words
    *   Lista de palabras a contar
    * @return
    *   Mapa inmutable de palabra → conteo
    *
    * 🔑 CONCEPTO CLAVE: foldLeft (equivalente a reduce en JS)
    *
    * La firma es: foldLeft[B](z: B)(op: (B, A) => B): B
    *   - z: valor inicial (Map vacío)
    *   - op: función que combina acumulador con cada elemento
    *
    * COMPARATIVA TypeScript vs Scala: TS: words.reduce((acc, word) => ({
    * ...acc, [word]: ... }), {}) Scala: words.foldLeft(Map.empty) { (acc, word) =>
    * acc.updated(...) }
    *
    * ¿Por qué Scala es más seguro?
    *   - Map.empty tiene tipo inferido Map[String, Int]
    *   - .updated() retorna un NUEVO mapa (inmutabilidad garantizada por el
    *     tipo)
    *   - No hay `any` ni `as` - tipado completo
    */
  def countFrequencies(words: List[String]): Map[String, Int] =
    words.foldLeft(Map.empty[String, Int]) { (acc, word) =>
      // .getOrElse es como (acc[word] || 0) en TypeScript
      // .updated retorna un NUEVO mapa con el valor actualizado
      acc.updated(word, acc.getOrElse(word, 0) + 1)
    }

  /** Convierte el mapa a una lista ordenada por frecuencia.
    *
    * @param frequencies
    *   Mapa de frecuencias
    * @return
    *   Lista ordenada de WordCount (mayor a menor)
    *
    * 📚 Scala idiomático usa encadenamiento de métodos (method chaining). Cada
    * transformación retorna una NUEVA colección.
    */
  def sortByFrequency(frequencies: Map[String, Int]): List[WordCount] =
    frequencies.toList // Convertir a List de tuplas (String, Int)
      .map {
        case (word, count) => // Pattern matching en la tupla
          WordCount(word, count) // Crear case class
      }
      .sortBy(_.count)(Ordering[Int].reverse) // Ordenar descendente

  /** Pipeline completo: texto → lista ordenada por frecuencia.
    *
    * 📚 Composición de funciones - el output de una es el input de la
    * siguiente.
    *
    * En Scala también podríamos escribirlo con `andThen`: val analyze =
    * tokenize andThen countFrequencies andThen sortByFrequency
    */
  def analyzeWordFrequency(text: String): List[WordCount] =
    val words = tokenize(text)
    val frequencies = countFrequencies(words)
    sortByFrequency(frequencies)

  /** Formatea los resultados para mostrar en consola.
    *
    * @param results
    *   Lista de WordCount
    * @param limit
    *   Cuántos mostrar (opcional)
    * @return
    *   String formateado
    */
  def formatResults(
      results: List[WordCount],
      limit: Option[Int] = None
  ): String =
    val toShow = limit.fold(results)(n => results.take(n))
    val maxWordLength = toShow.map(_.word.length).max

    toShow.zipWithIndex
      .map { case (wc, i) =>
        val rank = f"${i + 1}%3d"
        val word = wc.word.padTo(maxWordLength, ' ')
        val count = f"${wc.count}%4d"
        val bar = "█" * math.min(wc.count, 50)
        s"$rank. $word │ $count │ $bar"
      }
      .mkString("\n")

  // ===========================================================================
  // 🚀 EJECUCIÓN (efectos secundarios)
  // ===========================================================================

  /** Punto de entrada - aquí ocurren los efectos secundarios.
    *
    * 📚 Usamos `Using` para manejo seguro de recursos (como
    * try-with-resources). Es una forma funcional de manejar I/O que garantiza
    * el cierre del archivo.
    */
  def main(args: Array[String]): Unit =
    println("🔤 Word Frequency Counter - Enfoque Funcional en Scala\n")
    println("=" * 60)

    val filePath = "src/01-fundamentals/01-exercises/02-immutability/chat.txt"

    // Using es como try-with-resources pero funcional
    // Garantiza que el Source se cierre incluso si hay excepciones
    Using(Source.fromFile(filePath)) { source =>
      val text = source.mkString

      println(s"📄 Archivo: $filePath")
      println(
        s"📊 Tamaño: ${text.length.toString.reverse.grouped(3).mkString(",").reverse} caracteres\n"
      )

      val results = analyzeWordFrequency(text)

      println(s"🔢 Total de palabras únicas: ${results.length}\n")
      println("📈 Top 50 palabras más frecuentes:\n")
      println(formatResults(results, Some(50)))

      println("\n" + "=" * 60)
      println("✅ Análisis completado de forma funcional (inmutable)")
    }.recover { case e: Exception =>
      println(s"❌ Error al leer el archivo: ${e.getMessage}")
    }

// =============================================================================
// 📊 COMPARATIVA TypeScript vs Scala
// =============================================================================
/** | Aspecto          | TypeScript                       | Scala                                |
  * |:-----------------|:---------------------------------|:-------------------------------------|
  * | Inmutabilidad    | Requiere `readonly` y disciplina | Por defecto con `val` y `case class` |
  * | Colecciones      | Mutables por defecto             | Inmutables por defecto               |
  * | Tipado           | Gradual (permite `any`)          | Estricto (no hay escape)             |
  * | Pattern Matching | Limitado (switch)                | Potente y exhaustivo                 |
  * | Null Safety      | Con `strictNullChecks`           | Con `Option[T]`                      |
  * | Ecosistema       | Enorme (npm)                     | JVM + Scala específico               |
  *
  * 🔑 DIFERENCIA CLAVE: En TypeScript, la inmutabilidad es una CONVENCIÓN que
  * debes seguir. En Scala, es el COMPORTAMIENTO por defecto del lenguaje.
  */

// =============================================================================
// ⚠️ ANTI-PATRÓN vs ✅ PATRÓN
// =============================================================================
/** ⚠️ ANTI-PATRÓN (imperativo con mutación):
  *
  * def countWordsBad(text: String): Map[String, Int] = { val words =
  * text.split(" ") val counts = scala.collection.mutable.Map[String, Int]()
  *
  * for (word <- words) { val w = word.toLowerCase if (counts.contains(w)) {
  * counts(w) += 1 // ❌ Mutación directa } else { counts(w) = 1 } }
  *
  * counts.toMap }
  *
  * PROBLEMAS:
  *   1. Usa `mutable.Map` - pierde garantías de inmutabilidad
  *   2. El `for` muta el estado en cada iteración
  *   3. No es thread-safe
  *   4. Más difícil de razonar y testear
  *
  * ✅ PATRÓN FUNCIONAL (ya implementado arriba): def countFrequencies(words:
  * List[String]): Map[String, Int] = words.foldLeft(Map.empty[String, Int]) {
  * (acc, word) => acc.updated(word, acc.getOrElse(word, 0) + 1) }
  *
  * BENEFICIOS:
  *   1. Inmutable - cada paso crea un nuevo Map
  *   2. Thread-safe por diseño
  *   3. Fácil de razonar (sin estado mutable)
  *   4. Fácil de testear (función pura)
  */

// =============================================================================
// 🎯 RETO DE REFACTORIZACIÓN
// =============================================================================
/** Convierte este código IMPERATIVO a funcional:
  *
  * def filterLongWordsBad(words: Array[String]): Array[String] = { val result =
  * new scala.collection.mutable.ArrayBuffer[String]() var i = 0 while (i <
  * words.length) { if (words(i).length > 5) { result += words(i) } i += 1 }
  * result.toArray }
  *
  * PISTA: Una sola línea con `.filter` es suficiente.
  */
