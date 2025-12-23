/**
 * 🔤 Word Frequency Counter - Enfoque Funcional
 * 
 * Este script demuestra cómo procesar texto de manera funcional:
 * 1. Leer el archivo
 * 2. Tokenizar cada palabra
 * 3. Contar frecuencias
 * 4. Ordenar de mayor a menor frecuencia
 * 
 * 📚 Referencia: "Functional Programming in Scala" - Capítulo 3 (Estructuras de datos funcionales)
 * 
 * ⚠️ ANTI-PATRÓN (imperativo con mutación):
 * ```typescript
 * const counts: Record<string, number> = {};
 * for (const word of words) {
 *   if (counts[word]) {
 *     counts[word]++;  // ❌ Mutación directa
 *   } else {
 *     counts[word] = 1;
 *   }
 * }
 * ```
 * 
 * ✅ PATRÓN FUNCIONAL (reduce sin mutación):
 * Usamos `reduce` para acumular el conteo de forma inmutable.
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// 📦 TIPOS
// =============================================================================

/**
 * Representa una palabra con su frecuencia de aparición.
 * Usamos `readonly` para garantizar inmutabilidad (TS no lo hace por defecto).
 */
type WordFrequency = Readonly<{
  word: string;
  count: number;
}>;

/**
 * Un mapa inmutable de palabras a sus conteos.
 * `Readonly<Record<K, V>>` previene mutaciones accidentales.
 */
type FrequencyMap = Readonly<Record<string, number>>;

// =============================================================================
// 🔧 FUNCIONES PURAS (sin side effects)
// =============================================================================

/**
 * Tokeniza un texto en palabras individuales.
 * 
 * @param text - El texto a tokenizar
 * @returns Array de palabras en minúsculas (sin caracteres especiales)
 * 
 * 📚 En FP, preferimos funciones que:
 * - Son PURAS: mismo input → mismo output
 * - No mutan: creamos nuevas estructuras
 * - Son COMPONIBLES: pueden encadenarse con otras funciones
 */
const tokenize = (text: string): readonly string[] => {
  return text
    // Convertir a minúsculas para normalizar
    .toLowerCase()
    // Reemplazar caracteres especiales y puntuación por espacios
    .replace(/[^a-záéíóúüñ\s]/gi, ' ')
    // Dividir por espacios (uno o más)
    .split(/\s+/)
    // Filtrar strings vacíos y palabras muy cortas (ruido)
    .filter(word => word.length > 2);
};

/**
 * Cuenta la frecuencia de cada palabra usando `reduce`.
 * 
 * @param words - Array de palabras a contar
 * @returns Mapa inmutable de palabra → conteo
 * 
 * 🔑 CONCEPTO CLAVE: `reduce` es el corazón de FP.
 * Acumula un resultado procesando cada elemento SIN MUTAR el acumulador.
 * 
 * Equivalente en Scala: words.foldLeft(Map.empty[String, Int]) { ... }
 */
const countFrequencies = (words: readonly string[]): FrequencyMap => {
  return words.reduce<FrequencyMap>(
    // Acumulador: el mapa de frecuencias que vamos construyendo
    (acc, word) => ({
      ...acc,  // ✅ Spread: crea NUEVO objeto con las propiedades existentes
      // Actualizamos el conteo: si existe, incrementamos; si no, iniciamos en 1
      [word]: (acc[word] || 0) + 1
    }),
    // Valor inicial: un objeto vacío (inmutable)
    {} as FrequencyMap
  );
};

/**
 * Convierte el mapa de frecuencias a un array ordenado.
 * 
 * @param frequencies - Mapa de palabra → conteo
 * @returns Array de WordFrequency ordenado de mayor a menor frecuencia
 * 
 * 🔑 PIPELINE FUNCIONAL:
 * Object.entries → map → sort
 * Cada paso transforma los datos sin mutar el original.
 */
const sortByFrequency = (frequencies: FrequencyMap): readonly WordFrequency[] => {
  return Object.entries(frequencies)
    // Transformar cada [key, value] en un objeto WordFrequency
    .map(([word, count]): WordFrequency => ({ word, count }))
    // Ordenar de mayor a menor (b - a para orden descendente)
    .sort((a, b) => b.count - a.count);
};

/**
 * Pipeline completo: texto → palabras ordenadas por frecuencia.
 * 
 * Esta es la función de composición que une todas las funciones puras.
 * 
 * 📚 En "Functional Programming in Scala", esto sería:
 * text |> tokenize |> countFrequencies |> sortByFrequency
 * (usando el operador pipe)
 */
const analyzeWordFrequency = (text: string): readonly WordFrequency[] => {
  // Composición de funciones: la salida de una es la entrada de la siguiente
  const words = tokenize(text);
  const frequencies = countFrequencies(words);
  const sorted = sortByFrequency(frequencies);
  return sorted;
};

/**
 * Formatea los resultados para mostrar en consola.
 * 
 * @param results - Array de WordFrequency
 * @param limit - Cuántos resultados mostrar (default: todos)
 */
const formatResults = (
  results: readonly WordFrequency[],
  limit?: number
): string => {
  const toShow = limit ? results.slice(0, limit) : results;

  // Encontrar la palabra más larga para alinear
  const maxWordLength = Math.max(...toShow.map(r => r.word.length));

  return toShow
    .map((r, i) => {
      const rank = String(i + 1).padStart(3, ' ');
      const word = r.word.padEnd(maxWordLength, ' ');
      const count = String(r.count).padStart(4, ' ');
      const bar = '█'.repeat(Math.min(r.count, 50)); // Barra visual
      return `${rank}. ${word} │ ${count} │ ${bar}`;
    })
    .join('\n');
};

// =============================================================================
// 🚀 EJECUCIÓN (lado impuro - efectos secundarios)
// =============================================================================

/**
 * Función principal - aquí ocurren los efectos secundarios:
 * - Lectura de archivo (I/O)
 * - Escritura a consola (I/O)
 * 
 * 📚 En FP, separamos las funciones puras del "mundo exterior".
 * Las funciones puras están arriba; los efectos, aquí abajo.
 * 
 * Esto se llama "Functional Core, Imperative Shell" o
 * "Ports and Adapters" en Clean Architecture.
 */
const main = (): void => {
  console.log('🔤 Word Frequency Counter - Enfoque Funcional\n');
  console.log('='.repeat(60));

  // 1. Leer el archivo (efecto)
  const filePath = path.join(__dirname, 'chat.txt');
  const text = fs.readFileSync(filePath, 'utf-8');

  console.log(`📄 Archivo: ${filePath}`);
  console.log(`📊 Tamaño: ${text.length.toLocaleString()} caracteres\n`);

  // 2. Procesar con funciones puras
  const results = analyzeWordFrequency(text);

  console.log(`🔢 Total de palabras únicas: ${results.length}\n`);
  console.log('📈 Top 50 palabras más frecuentes:\n');

  const formattedResults = formatResults(results, 50);
  console.log(formattedResults);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Análisis completado de forma funcional (inmutable)');

  // 3. Guardar resultados en archivo (efecto)
  const outputPath = path.join(__dirname, 'resultados.txt');
  const fullOutput = [
    '🔤 Word Frequency Counter - Resultados',
    '='.repeat(60),
    `📄 Archivo analizado: chat.txt`,
    `📊 Tamaño: ${text.length.toLocaleString()} caracteres`,
    `🔢 Total de palabras únicas: ${results.length}`,
    '',
    '📈 Todas las palabras ordenadas por frecuencia:',
    '',
    formatResults(results),  // Todas las palabras
    '',
    '='.repeat(60),
    '✅ Generado con enfoque funcional (inmutable)'
  ].join('\n');

  fs.writeFileSync(outputPath, fullOutput, 'utf-8');
  console.log(`\n💾 Resultados guardados en: ${outputPath}`);
};

// Ejecutar
main();

// =============================================================================
// 🎯 RETO DE REFACTORIZACIÓN
// =============================================================================
/**
 * Aquí tienes código IMPERATIVO (malo). Intenta pensarlo funcionalmente
 * antes de ver la solución arriba.
 * 
 * ```typescript
 * function countWords(text: string) {
 *   const words = text.split(' ');
 *   const counts: any = {};
 *   
 *   for (let i = 0; i < words.length; i++) {
 *     const word = words[i].toLowerCase();
 *     if (counts[word]) {
 *       counts[word]++;
 *     } else {
 *       counts[word] = 1;
 *     }
 *   }
 *   
 *   const result = [];
 *   for (const word in counts) {
 *     result.push({ word: word, count: counts[word] });
 *   }
 *   
 *   // Bubble sort (¡mal!)
 *   for (let i = 0; i < result.length; i++) {
 *     for (let j = 0; j < result.length - 1; j++) {
 *       if (result[j].count < result[j + 1].count) {
 *         const temp = result[j];
 *         result[j] = result[j + 1];
 *         result[j + 1] = temp;
 *       }
 *     }
 *   }
 *   
 *   return result;
 * }
 * ```
 * 
 * PROBLEMAS:
 * 1. Usa `any` - pierde seguridad de tipos
 * 2. Muta `counts` directamente
 * 3. Usa `for` imperativo en lugar de `reduce`
 * 4. Muta `result` con bubble sort
 * 5. No es componible - hace todo en una sola función monolítica
 */
