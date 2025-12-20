/**
 * =============================================================================
 * EJERCICIO: FUNCIONES PURAS vs FUNCIONES IMPURAS
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

// =============================================================================
// PARTE 1: FUNCIONES IMPURAS (con efectos secundarios)
// =============================================================================

// Variable global mutable - ¡Esto es una señal de peligro en FP!
// Una variable mutable es un "estado" que puede cambiar con el tiempo.
let contadorGlobal = 0;

/**
 * FUNCIÓN IMPURA #1: Modifica estado global
 * 
 * ¿Por qué es impura?
 * - Modifica una variable externa (contadorGlobal)
 * - Cada vez que la llamas, el resultado cambia
 * - El "efecto secundario" es la modificación del contador
 */
function incrementarContador(): number {
    // Efecto secundario: modificamos una variable externa
    contadorGlobal = contadorGlobal + 1;
    // Retornamos el nuevo valor
    return contadorGlobal;
}

/**
 * FUNCIÓN IMPURA #2: Lee estado global
 * 
 * ¿Por qué es impura?
 * - Depende de una variable externa que puede cambiar
 * - El resultado no depende SOLO de sus argumentos
 * - Es impredecible: el mismo input puede dar diferentes outputs
 */
function sumarConContador(numero: number): number {
    // El resultado depende de "contadorGlobal" que puede cambiar
    // sin que nosotros lo sepamos
    return numero + contadorGlobal;
}

/**
 * FUNCIÓN IMPURA #3: Genera efectos en el mundo exterior
 * 
 * ¿Por qué es impura?
 * - console.log es un "efecto secundario" (I/O - Input/Output)
 * - Estamos interactuando con el mundo exterior
 * - No solo calculamos un valor, también HACEMOS algo
 */
function saludarUsuario(nombre: string): string {
    // Efecto secundario: imprimimos en consola
    console.log(`¡Hola, ${nombre}!`);
    // Aunque retornamos un valor, ya produjimos un efecto
    return `¡Hola, ${nombre}!`;
}

/**
 * FUNCIÓN IMPURA #4: Depende del tiempo
 * 
 * ¿Por qué es impura?
 * - El resultado cambia según el momento en que la llamas
 * - No hay forma de predecir el resultado solo con los argumentos
 */
function obtenerSaludoConHora(nombre: string): string {
    // Date.now() cambia cada vez que lo llamas
    const hora = new Date().getHours();
    // El resultado depende de cuándo llamas la función
    if (hora < 12) {
        return `Buenos días, ${nombre}`;
    } else if (hora < 18) {
        return `Buenas tardes, ${nombre}`;
    } else {
        return `Buenas noches, ${nombre}`;
    }
}

/**
 * FUNCIÓN IMPURA #5: Genera números aleatorios
 * 
 * ¿Por qué es impura?
 * - Math.random() produce valores diferentes cada vez
 * - El mismo input no garantiza el mismo output
 */
function tirarDado(): number {
    // Math.random() es inherentemente impuro
    return Math.floor(Math.random() * 6) + 1;
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
function sumar(a: number, b: number): number {
    // Solo usamos los parámetros, nada externo
    return a + b;
}

/**
 * FUNCIÓN PURA #2: Transformación de datos
 * 
 * ¿Por qué es pura?
 * - Toma un string y retorna otro string
 * - El resultado es 100% predecible
 * - No modifica el string original (los strings son inmutables en JS/TS)
 */
function convertirAMayusculas(texto: string): string {
    // toUpperCase() no modifica "texto", crea un nuevo string
    return texto.toUpperCase();
}

/**
 * FUNCIÓN PURA #3: Cálculo matemático
 * 
 * ¿Por qué es pura?
 * - Es una fórmula matemática pura
 * - Para el mismo radio, siempre da la misma área
 * - Math.PI es una constante, no cambia
 */
function calcularAreaCirculo(radio: number): number {
    // Pi es una constante, no una variable mutable
    // El resultado depende SOLO del radio
    return Math.PI * radio * radio;
}

/**
 * FUNCIÓN PURA #4: Crear nuevo objeto (sin mutar el original)
 * 
 * ¿Por qué es pura?
 * - No modifica el objeto original
 * - Crea y retorna un NUEVO objeto
 * - El resultado es predecible
 */
type Usuario = {
    nombre: string;
    edad: number;
};

function incrementarEdad(usuario: Usuario): Usuario {
    // ¡NO hacemos esto! (mutación)
    // usuario.edad = usuario.edad + 1;
    
    // En su lugar, creamos un NUEVO objeto con la edad incrementada
    // El operador spread (...) copia las propiedades del objeto original
    return {
        ...usuario,           // Copiamos todas las propiedades
        edad: usuario.edad + 1 // Sobrescribimos solo "edad"
    };
}

/**
 * FUNCIÓN PURA #5: Trabajar con arrays (sin mutar)
 * 
 * ¿Por qué es pura?
 * - No modifica el array original
 * - Retorna un NUEVO array
 * - El resultado es predecible para el mismo input
 */
function duplicarNumeros(numeros: number[]): number[] {
    // map() crea un NUEVO array, no modifica el original
    // Cada elemento se transforma multiplicándolo por 2
    return numeros.map(n => n * 2);
}


// =============================================================================
// PARTE 3: DEMOSTRACIÓN PRÁCTICA
// =============================================================================

console.log("=".repeat(60));
console.log("DEMOSTRACIÓN: FUNCIONES PURAS vs IMPURAS");
console.log("=".repeat(60));

// --- Demostración de impureza ---
console.log("\n📛 FUNCIONES IMPURAS:");
console.log("-".repeat(40));

// La función impura da resultados diferentes cada vez
console.log("incrementarContador():", incrementarContador()); // 1
console.log("incrementarContador():", incrementarContador()); // 2
console.log("incrementarContador():", incrementarContador()); // 3
// ¡El mismo código produce resultados diferentes!

console.log("\nsumarConContador(10):", sumarConContador(10)); // 10 + 3 = 13
incrementarContador(); // Cambiamos el estado global
console.log("sumarConContador(10):", sumarConContador(10)); // 10 + 4 = 14
// ¡Mismo argumento, diferente resultado!

// --- Demostración de pureza ---
console.log("\n✅ FUNCIONES PURAS:");
console.log("-".repeat(40));

// La función pura SIEMPRE da el mismo resultado para los mismos argumentos
console.log("sumar(5, 3):", sumar(5, 3)); // 8
console.log("sumar(5, 3):", sumar(5, 3)); // 8
console.log("sumar(5, 3):", sumar(5, 3)); // 8
// ¡Siempre 8! Esto es "referential transparency" (transparencia referencial)

// Demostración de inmutabilidad
const usuarioOriginal: Usuario = { nombre: "Ana", edad: 25 };
const usuarioNuevo = incrementarEdad(usuarioOriginal);

console.log("\nUsuario original:", usuarioOriginal); // { nombre: "Ana", edad: 25 }
console.log("Usuario nuevo:", usuarioNuevo);         // { nombre: "Ana", edad: 26 }
// ¡El original NO cambió! Esto es inmutabilidad.

const numerosOriginales = [1, 2, 3, 4, 5];
const numerosDobles = duplicarNumeros(numerosOriginales);

console.log("\nArray original:", numerosOriginales);  // [1, 2, 3, 4, 5]
console.log("Array modificado:", numerosDobles);     // [2, 4, 6, 8, 10]
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
 * 3. ¿Modifica algo externo (variables globales, objetos, arrays)?
 * 4. ¿Produce efectos secundarios (I/O, red, disco)?
 */

// ¿PURA O IMPURA? (descomenta y analiza)
// function misteriosa1(x: number): number {
//     return x * x;
// }

// ¿PURA O IMPURA?
// let total = 0;
// function misteriosa2(x: number): number {
//     total += x;
//     return total;
// }

// ¿PURA O IMPURA?
// function misteriosa3(items: string[]): number {
//     return items.length;
// }

/**
 * EJERCICIO 2: Convierte esta función impura en pura
 * 
 * Función impura original:
 */
let descuentoGlobal = 0.1; // 10% de descuento

function calcularPrecioFinal(precio: number): number {
    // IMPURA: depende de una variable global
    return precio * (1 - descuentoGlobal);
}

// Tu tarea: escribe una versión PURA de esta función
// Pista: ¿Qué necesitas pasar como argumento adicional?

// function calcularPrecioFinalPuro(precio: number, ???): number {
//     // Tu código aquí
// }


/**
 * EJERCICIO 3: Refactoriza esta función impura
 */
const carritoDeCompras: number[] = [];

function agregarAlCarrito(precio: number): void {
    // IMPURA: modifica un array global
    carritoDeCompras.push(precio);
}

// Tu tarea: escribe una versión PURA
// Pista: en lugar de modificar, crea un nuevo array

// function agregarAlCarritoPuro(carrito: number[], precio: number): number[] {
//     // Tu código aquí
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
 * Un lenguaje "puro" como Haskell SÍ distingue entre puras e impuras
 * usando su sistema de tipos (el famoso "IO Monad").
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

console.log("\n" + "=".repeat(60));
console.log("¡Ejecuta este archivo y observa los resultados!");
console.log("Luego, intenta resolver los ejercicios en PARTE 4.");
console.log("=".repeat(60));


export {};
