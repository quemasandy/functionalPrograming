/**
 * =============================================================================
 * TUTORIAL: MÉTODOS MUTABLES vs INMUTABLES EN JAVASCRIPT/TYPESCRIPT
 * =============================================================================
 *
 * En programación funcional, la regla de oro es:
 *   "NUNCA modifiques datos existentes, CREA nuevos datos"
 *
 * JavaScript tiene métodos que violan esta regla (mutan el original).
 * Este tutorial te enseña cuáles evitar y qué alternativas usar.
 *
 * =============================================================================
 * ¿POR QUÉ ALGUNOS MÉTODOS MUTAN?
 * =============================================================================
 *
 * JavaScript fue diseñado en 1995 para scripts simples en navegadores.
 * 
 * En esa época, la memoria era escasa y cara, por lo que:
 *
 *   1. Modificar "in-place" era más eficiente que crear copias
 *   2. No se pensaba en concurrencia ni en estados compartidos
 *   ¿Cuál es la diferencia entre concurrente y paralelo?
 *   3. El paradigma dominante era imperativo/OOP, no funcional
 *
 * Hoy, con hardware potente y aplicaciones complejas, los beneficios
 * de la inmutabilidad (debugging, concurrencia, predictibilidad)
 * superan ampliamente el costo de crear copias.
 *
 * =============================================================================
 */

// =============================================================================
// PARTE 1: MÉTODOS QUE MUTAN ARRAYS (EVITAR)
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 1. push() - Agrega elementos al FINAL del array
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original, retorna la nueva longitud
 *
 * ¿Por qué muta?
 *   - Diseñado para eficiencia: no crea copia, solo expande el array existente
 *   - Retorna un número (length), no el array, porque es una operación "en sitio"
 */
function demoPush(): void {
  console.log('\n--- push() ---');

  // ❌ MAL: Push muta el array original
  const original = [1, 2, 3];
  const resultado = original.push(4); // retorna 4 (nueva longitud)

  console.log('Original después de push:', original); // [1, 2, 3, 4] ¡MUTADO!
  console.log('Resultado de push:', resultado); // 4 (no es el array)

  // ✅ BIEN: Alternativa inmutable con spread operator
  const inmutable = [1, 2, 3];
  const nuevoArray = [...inmutable, 4]; // Crea NUEVO array

  console.log('Inmutable original:', inmutable); // [1, 2, 3] ¡SIN CAMBIOS!
  console.log('Nuevo array:', nuevoArray); // [1, 2, 3, 4]

  // ✅ ALTERNATIVA 2: concat()
  const conConcat = inmutable.concat(4);
  console.log('Inmutable original:', inmutable); // [1, 2, 3] ¡SIN CAMBIOS!
  console.log('Con concat:', conConcat); // [1, 2, 3, 4]
}

/**
 * -----------------------------------------------------------------------------
 * 2. pop() - Elimina y retorna el ÚLTIMO elemento
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original, retorna el elemento eliminado
 *
 * ¿Por qué muta?
 *   - Operación de "pila" (stack) clásica: LIFO (Last In, First Out)
 *   - Diseñado para gestión de memoria eficiente en estructuras de datos
 */
function demoPop(): void {
  console.log('\n--- pop() ---');

  // ❌ MAL: Pop muta el array original
  const original = [1, 2, 3, 4];
  const eliminado = original.pop(); // retorna 4

  console.log('Original después de pop:', original); // [1, 2, 3] ¡MUTADO!
  console.log('Elemento eliminado:', eliminado); // 4

  // ✅ BIEN: Alternativa inmutable con slice
  const inmutable = [1, 2, 3, 4];
  const sinUltimo = inmutable.slice(0, -1); // Todos menos el último
  const ultimoElemento = inmutable[inmutable.length - 1];

  console.log('Inmutable original:', inmutable); // [1, 2, 3, 4] ¡SIN CAMBIOS!
  console.log('Sin último:', sinUltimo); // [1, 2, 3]
  console.log('Último elemento:', ultimoElemento); // 4
}

/**
 * -----------------------------------------------------------------------------
 * 3. shift() - Elimina y retorna el PRIMER elemento
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original, retorna el elemento eliminado
 *
 * ¿Por qué muta?
 *   - Operación de "cola" (queue): FIFO (First In, First Out)
 *   - Muy costoso internamente: debe re-indexar TODOS los elementos
 */
function demoShift(): void {
  console.log('\n--- shift() ---');

  // ❌ MAL: Shift muta el array
  const original = [1, 2, 3, 4];
  const eliminado = original.shift(); // retorna 1

  console.log('Original después de shift:', original); // [2, 3, 4] ¡MUTADO!
  console.log('Elemento eliminado:', eliminado); // 1

  // ✅ BIEN: Alternativa inmutable con slice
  const inmutable = [1, 2, 3, 4];
  const sinPrimero = inmutable.slice(1); // Todos desde el índice 1
  const primerElemento = inmutable[0];

  console.log('Inmutable original:', inmutable); // [1, 2, 3, 4] ¡SIN CAMBIOS!
  console.log('Sin primero:', sinPrimero); // [2, 3, 4]
  console.log('Primer elemento:', primerElemento); // 1

  // ✅ ALTERNATIVA: Destructuring
  const [cabeza, ...cola] = inmutable;
  console.log('Cabeza:', cabeza); // 1
  console.log('Cola:', cola); // [2, 3, 4]
}

/**
 * -----------------------------------------------------------------------------
 * 4. unshift() - Agrega elementos al INICIO del array
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original, retorna la nueva longitud
 *
 * ¿Por qué muta?
 *   - Opuesto a push(), para operaciones de cola
 *   - Internamente costoso: debe mover todos los elementos
 */
function demoUnshift(): void {
  console.log('\n--- unshift() ---');

  // ❌ MAL: Unshift muta el array
  const original = [2, 3, 4];
  const nuevaLongitud = original.unshift(1); // retorna 4

  console.log('Original después de unshift:', original); // [1, 2, 3, 4] ¡MUTADO!
  console.log('Nueva longitud:', nuevaLongitud); // 4

  // ✅ BIEN: Alternativa inmutable con spread
  const inmutable = [2, 3, 4];
  const conElementoAlInicio = [1, ...inmutable];

  console.log('Inmutable original:', inmutable); // [2, 3, 4] ¡SIN CAMBIOS!
  console.log('Con elemento al inicio:', conElementoAlInicio); // [1, 2, 3, 4]
}

/**
 * -----------------------------------------------------------------------------
 * 5. splice() - Elimina/reemplaza/agrega elementos en cualquier posición
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original, retorna los elementos eliminados
 *
 * ¿Por qué muta?
 *   - Es la "navaja suiza" de manipulación de arrays
 *   - Diseñado para máxima flexibilidad a costa de seguridad
 *
 * NOTA IMPORTANTE:
 *   - splice() → MUTA (con 'p' de "peligroso")
 *   - slice()  → NO MUTA (sin 'p' de "puro")
 */
function demoSplice(): void {
  console.log('\n--- splice() ---');

  // ❌ MAL: Splice muta el array
  const original = [1, 2, 3, 4, 5];
  const eliminados = original.splice(2, 2, 99, 100); // Desde índice 2, eliminar 2, insertar 99 y 100

  console.log('Original después de splice:', original); // [1, 2, 99, 100, 5] ¡MUTADO!
  console.log('Elementos eliminados:', eliminados); // [3, 4]

  // ✅ BIEN: Alternativa inmutable combinando slice y spread
  const inmutable = [1, 2, 3, 4, 5];

  // Para eliminar elementos en posición 2 y 3:
  const sinElementos = [
    ...inmutable.slice(0, 2), // Elementos antes del índice 2
    ...inmutable.slice(4), // Elementos desde el índice 4
  ];
  console.log('Inmutable original:', inmutable); // [1, 2, 3, 4, 5] ¡SIN CAMBIOS!
  console.log('Sin elementos 2 y 3:', sinElementos); // [1, 2, 5]

  // Para reemplazar elementos:
  const conReemplazo = [
    ...inmutable.slice(0, 2), // [1, 2]
    99,
    100, // Nuevos elementos
    ...inmutable.slice(4), // [5]
  ];
  console.log('Con reemplazo:', conReemplazo); // [1, 2, 99, 100, 5]
}

/**
 * -----------------------------------------------------------------------------
 * 6. sort() - Ordena el array
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original Y lo retorna (engañoso)
 *
 * ¿Por qué muta?
 *   - Algoritmos de ordenamiento clásicos operan "in-place"
 *   - Optimizado para uso de memoria (no crea copia)
 *
 * TRAMPA: Retorna el mismo array (mutado), lo que confunde a muchos
 */
function demoSort(): void {
  console.log('\n--- sort() ---');

  // ❌ MAL: Sort muta el array original
  const original = [3, 1, 4, 1, 5, 9, 2, 6];
  const resultado = original.sort((a, b) => a - b);

  console.log('Original después de sort:', original); // [1, 1, 2, 3, 4, 5, 6, 9] ¡MUTADO!
  console.log('¿Son el mismo array?', original === resultado); // true (¡TRAMPA!)

  // ✅ BIEN: Copiar primero, luego ordenar
  const inmutable = [3, 1, 4, 1, 5, 9, 2, 6];
  const ordenado = [...inmutable].sort((a, b) => a - b);

  console.log('Inmutable original:', inmutable); // [3, 1, 4, 1, 5, 9, 2, 6] ¡SIN CAMBIOS!
  console.log('Ordenado:', ordenado); // [1, 1, 2, 3, 4, 5, 6, 9]

  console.log('¿Son el mismo array?', inmutable === ordenado); // false
  // ✅ ALTERNATIVA ES2023+: toSorted() - nativo inmutable
  // const ordenadoNativo = inmutable.toSorted((a, b) => a - b);
}

/**
 * -----------------------------------------------------------------------------
 * 7. reverse() - Invierte el orden del array
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original Y lo retorna (misma trampa que sort)
 *
 * ¿Por qué muta?
 *   - Optimizado para no usar memoria extra
 *   - Intercambia elementos "in-place"
 */
function demoReverse(): void {
  console.log('\n--- reverse() ---');

  // ❌ MAL: Reverse muta el array
  const original = [1, 2, 3, 4, 5];
  const resultado = original.reverse();

  console.log('Original después de reverse:', original); // [5, 4, 3, 2, 1] ¡MUTADO!
  console.log('¿Son el mismo array?', original === resultado); // true

  // ✅ BIEN: Copiar primero, luego invertir
  const inmutable = [1, 2, 3, 4, 5];
  const invertido = [...inmutable].reverse();

  console.log('Inmutable original:', inmutable); // [1, 2, 3, 4, 5] ¡SIN CAMBIOS!
  console.log('Invertido:', invertido); // [5, 4, 3, 2, 1]

  console.log('¿Son el mismo array?', inmutable === invertido); // false

  // ✅ ALTERNATIVA ES2023+: toReversed() - nativo inmutable
  // const invertidoNativo = inmutable.toReversed();
}

/**
 * -----------------------------------------------------------------------------
 * 8. fill() - Rellena el array con un valor
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original
 */
function demoFill(): void {
  console.log('\n--- fill() ---');

  // ❌ MAL: Fill muta el array
  const original = [1, 2, 3, 4, 5];
  original.fill(0, 1, 4); // Rellena con 0 desde índice 1 hasta 4

  console.log('Original después de fill:', original); // [1, 0, 0, 0, 5] ¡MUTADO!

  // ✅ BIEN: Usar map para crear nuevo array
  const inmutable = [1, 2, 3, 4, 5];
  const rellenado = inmutable.map((val, idx) => (idx >= 1 && idx < 4 ? 0 : val));

  console.log('Inmutable original:', inmutable); // [1, 2, 3, 4, 5] ¡SIN CAMBIOS!
  console.log('Rellenado:', rellenado); // [1, 0, 0, 0, 5]
}

/**
 * -----------------------------------------------------------------------------
 * 9. copyWithin() - Copia parte del array a otra posición
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el array original (poco conocido pero peligroso)
 */
function demoCopyWithin(): void {
  console.log('\n--- copyWithin() ---');

  // ❌ MAL: copyWithin muta el array
  const original = [1, 2, 3, 4, 5];
  original.copyWithin(0, 3); // Copia desde índice 3 al inicio

  console.log('Original después de copyWithin:', original); // [4, 5, 3, 4, 5] ¡MUTADO!

  // ✅ BIEN: Crear nuevo array con la lógica deseada
  const inmutable = [1, 2, 3, 4, 5];
  const copiado = [
    ...inmutable.slice(3), // [4, 5]
    ...inmutable.slice(2, 3 + 2), // Ajustar según necesidad
  ];
  // Nota: La alternativa exacta depende del caso de uso específico
  console.log('Inmutable original:', inmutable); // [1, 2, 3, 4, 5] ¡SIN CAMBIOS!
}

// =============================================================================
// PARTE 2: MÉTODOS QUE MUTAN OBJETOS (EVITAR)
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 1. Object.assign() al objeto existente
 * -----------------------------------------------------------------------------
 *
 * ⚠️ DEPENDE: Muta si el primer argumento es un objeto existente
 */
function demoObjectAssign(): void {
  console.log('\n--- Object.assign() ---');

  // ❌ MAL: Muta el primer argumento
  const original = { a: 1, b: 2 };
  Object.assign(original, { c: 3 });

  console.log('Original mutado:', original); // { a: 1, b: 2, c: 3 } ¡MUTADO!

  // ✅ BIEN: Usar objeto vacío como primer argumento
  const inmutable = { a: 1, b: 2 };
  const nuevo = Object.assign({}, inmutable, { c: 3 });

  console.log('Inmutable original:', inmutable); // { a: 1, b: 2 } ¡SIN CAMBIOS!
  console.log('Nuevo objeto:', nuevo); // { a: 1, b: 2, c: 3 }

  // ✅ MEJOR: Usar spread operator
  const conSpread = { ...inmutable, c: 3 };
  console.log('Con spread:', conSpread); // { a: 1, b: 2, c: 3 }
}

/**
 * -----------------------------------------------------------------------------
 * 2. delete - Elimina propiedades de objetos
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: Modifica el objeto original
 */
function demoDelete(): void {
  console.log('\n--- delete ---');

  // ❌ MAL: Delete muta el objeto
  const original = { a: 1, b: 2, c: 3 };
  delete (original as any).b;

  console.log('Original después de delete:', original); // { a: 1, c: 3 } ¡MUTADO!

  // ✅ BIEN: Destructuring con rest
  const inmutable = { a: 1, b: 2, c: 3 };
  const { b, ...sinB } = inmutable;

  console.log('Inmutable original:', inmutable); // { a: 1, b: 2, c: 3 } ¡SIN CAMBIOS!
  console.log('Sin propiedad b:', sinB); // { a: 1, c: 3 }
  console.log('Valor de b:', b); // 2
}

/**
 * -----------------------------------------------------------------------------
 * 3. Asignación directa de propiedades
 * -----------------------------------------------------------------------------
 *
 * ❌ MUTANTE: obj.prop = value modifica el objeto
 */
function demoDirectAssignment(): void {
  console.log('\n--- Asignación directa ---');

  // ❌ MAL: Asignación directa muta
  const original = { nombre: 'Ana', edad: 25 };
  original.edad = 26;

  console.log('Original mutado:', original); // { nombre: "Ana", edad: 26 } ¡MUTADO!

  // ✅ BIEN: Crear nuevo objeto con spread
  const inmutable = { nombre: 'Ana', edad: 25 };
  const actualizado = { ...inmutable, edad: 26 };

  console.log('Inmutable original:', inmutable); // { nombre: "Ana", edad: 25 } ¡SIN CAMBIOS!
  console.log('Actualizado:', actualizado); // { nombre: "Ana", edad: 26 }
}

// =============================================================================
// PARTE 3: MÉTODOS INMUTABLES (SEGUROS) - USAR ESTOS
// =============================================================================

/**
 * Estos métodos NUNCA modifican el array/objeto original.
 * Siempre retornan un NUEVO array/valor.
 */

function metodosInmutablesArrays(): void {
  console.log('\n=== MÉTODOS INMUTABLES DE ARRAYS ===');

  const numeros = [1, 2, 3, 4, 5];

  // ✅ map() - Transforma cada elemento
  const dobles = numeros.map(n => n * 2);
  console.log('map:', dobles); // [2, 4, 6, 8, 10]

  // ✅ filter() - Filtra elementos
  const pares = numeros.filter(n => n % 2 === 0);
  console.log('filter:', pares); // [2, 4]

  // ✅ reduce() - Reduce a un valor
  const suma = numeros.reduce((acc, n) => acc + n, 0);
  console.log('reduce:', suma); // 15

  // ✅ slice() - Extrae porción (DIFERENTE de splice!)
  const porcion = numeros.slice(1, 4);
  console.log('slice:', porcion); // [2, 3, 4]

  // ✅ concat() - Concatena arrays
  const concatenado = numeros.concat([6, 7]);
  console.log('concat:', concatenado); // [1, 2, 3, 4, 5, 6, 7]

  // ✅ flat() - Aplana arrays anidados
  const anidado = [
    [1, 2],
    [3, 4],
  ];
  const plano = anidado.flat();
  console.log('flat:', plano); // [1, 2, 3, 4]

  // ✅ flatMap() - map + flat en uno
  const expandido = numeros.flatMap(n => [n, n * 10]);
  console.log('flatMap:', expandido); // [1, 10, 2, 20, 3, 30, 4, 40, 5, 50]

  // ✅ find() - Encuentra primer elemento
  const encontrado = numeros.find(n => n > 3);
  console.log('find:', encontrado); // 4

  // ✅ findIndex() - Encuentra índice
  const indice = numeros.findIndex(n => n > 3);
  console.log('findIndex:', indice); // 3

  // ✅ every() - Todos cumplen condición
  const todosMayores = numeros.every(n => n > 0);
  console.log('every:', todosMayores); // true

  // ✅ some() - Al menos uno cumple
  const algunPar = numeros.some(n => n % 2 === 0);
  console.log('some:', algunPar); // true

  // ✅ includes() - Contiene elemento
  const contiene3 = numeros.includes(3);
  console.log('includes:', contiene3); // true

  // ✅ join() - Une como string
  const unido = numeros.join('-');
  console.log('join:', unido); // "1-2-3-4-5"

  console.log('\nOriginal intacto:', numeros); // [1, 2, 3, 4, 5]
}

/**
 * ES2023+ introdujo versiones inmutables de métodos mutantes
 */
function metodosES2023(): void {
  console.log('\n=== NUEVOS MÉTODOS ES2023+ (Inmutables) ===');

  const numeros = [3, 1, 4, 1, 5];

  // ✅ toSorted() - Versión inmutable de sort()
  // const ordenado = numeros.toSorted((a, b) => a - b);
  console.log('toSorted: [Disponible en ES2023+]');

  // ✅ toReversed() - Versión inmutable de reverse()
  // const invertido = numeros.toReversed();
  console.log('toReversed: [Disponible en ES2023+]');

  // ✅ toSpliced() - Versión inmutable de splice()
  // const spliced = numeros.toSpliced(2, 1, 99);
  console.log('toSpliced: [Disponible en ES2023+]');

  // ✅ with() - Reemplaza elemento en índice (inmutable)
  // const conCambio = numeros.with(2, 99);
  console.log('with: [Disponible en ES2023+]');

  console.log('Original intacto:', numeros);
}

// =============================================================================
// PARTE 4: TABLA RESUMEN
// =============================================================================

/**
 * =============================================================================
 * RESUMEN: MÉTODOS A EVITAR Y SUS ALTERNATIVAS
 * =============================================================================
 *
 * | MÉTODO MUTANTE     | RETORNA              | ALTERNATIVA INMUTABLE           |
 * |--------------------|----------------------|---------------------------------|
 * | push(elem)         | nueva longitud       | [...arr, elem]                  |
 * | pop()              | elemento eliminado   | arr.slice(0, -1)                |
 * | shift()            | elemento eliminado   | arr.slice(1)                    |
 * | unshift(elem)      | nueva longitud       | [elem, ...arr]                  |
 * | splice(i, n, ...)  | elementos eliminados | [...arr.slice(0,i), ...nuevos, ...arr.slice(i+n)] |
 * | sort(fn)           | mismo array mutado   | [...arr].sort(fn) o toSorted() |
 * | reverse()          | mismo array mutado   | [...arr].reverse() o toReversed() |
 * | fill(val, i, j)    | mismo array mutado   | arr.map((v, idx) => ...)        |
 * | copyWithin(...)    | mismo array mutado   | construir nuevo array           |
 *
 * | OPERACIÓN OBJETO   | ALTERNATIVA INMUTABLE                          |
 * |--------------------|------------------------------------------------|
 * | obj.prop = val     | { ...obj, prop: val }                          |
 * | delete obj.prop    | const { prop, ...rest } = obj; usar rest       |
 * | Object.assign(obj) | Object.assign({}, obj) o { ...obj }            |
 *
 * =============================================================================
 * REGLA MNEMOTÉCNICA
 * =============================================================================
 *
 * spLice → L de "Letal" (muta)
 * sLice  → L de "Limpio" (no muta)
 *
 * Si un método retorna el MISMO array → probablemente MUTA
 * Si un método retorna un NUEVO array → probablemente ES SEGURO
 *
 * =============================================================================
 */

// =============================================================================
// PARTE 5: PATRONES FUNCIONALES PARA OPERACIONES COMUNES
// =============================================================================

// Tipo helper para hacer readonly profundo
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Patrón 1: Agregar elemento al final (reemplazo de push)
 */
function append<T>(array: readonly T[], elemento: T): T[] {
  return [...array, elemento];
}

/**
 * Patrón 2: Agregar elemento al inicio (reemplazo de unshift)
 */
function prepend<T>(array: readonly T[], elemento: T): T[] {
  return [elemento, ...array];
}

/**
 * Patrón 3: Eliminar último elemento (reemplazo de pop)
 */
function removeLast<T>(array: readonly T[]): { array: T[]; removed: T | undefined } {
  return {
    array: array.slice(0, -1),
    removed: array[array.length - 1],
  };
}

/**
 * Patrón 4: Eliminar primer elemento (reemplazo de shift)
 */
function removeFirst<T>(array: readonly T[]): { array: T[]; removed: T | undefined } {
  const [first, ...rest] = array;
  return {
    array: rest,
    removed: first,
  };
}

/**
 * Patrón 5: Actualizar elemento en índice específico
 */
function updateAt<T>(array: readonly T[], index: number, value: T): T[] {
  return array.map((item, i) => (i === index ? value : item));
}

/**
 * Patrón 6: Insertar elemento en posición específica
 */
function insertAt<T>(array: readonly T[], index: number, value: T): T[] {
  return [...array.slice(0, index), value, ...array.slice(index)];
}

/**
 * Patrón 7: Eliminar elemento en posición específica
 */
function removeAt<T>(array: readonly T[], index: number): T[] {
  return [...array.slice(0, index), ...array.slice(index + 1)];
}

/**
 * Patrón 8: Actualizar propiedad de objeto
 */
function updateProp<T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value };
}

/**
 * Patrón 9: Eliminar propiedad de objeto
 */
function removeProp<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const { [key]: _, ...rest } = obj;
  return rest as Omit<T, K>;
}

// =============================================================================
// DEMOSTRACIÓN
// =============================================================================

console.log('='.repeat(70));
console.log('TUTORIAL: MÉTODOS MUTABLES vs INMUTABLES');
console.log('='.repeat(70));

console.log('\n📛 MÉTODOS QUE MUTAN (EVITAR):');
demoPush();
demoPop();
demoShift();
demoUnshift();
demoSplice();
demoSort();
demoReverse();
demoFill();
demoCopyWithin();

console.log('\n📛 OPERACIONES QUE MUTAN OBJETOS:');
demoObjectAssign();
demoDelete();
demoDirectAssignment();

console.log('\n✅ MÉTODOS INMUTABLES (USAR ESTOS):');
metodosInmutablesArrays();
metodosES2023();

console.log('\n' + '='.repeat(70));
console.log('CONCLUSIÓN:');
console.log('- En PF, SIEMPRE crea nuevos datos en lugar de modificar existentes');
console.log('- Usa spread (...), slice(), map(), filter(), reduce()');
console.log('- Evita push, pop, shift, splice, sort (sin copia), reverse (sin copia)');
console.log('- En ES2023+: usa toSorted(), toReversed(), toSpliced(), with()');
console.log('='.repeat(70));

export {};
