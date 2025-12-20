/**
 * =============================================================================
 * ¿POR QUÉ LAS FUNCIONES PURAS SON IMPORTANTES PARA CONSTRUIR BUEN SOFTWARE?
 * =============================================================================
 * 
 * Este archivo responde las preguntas fundamentales sobre funciones puras
 * con ejemplos concretos de bugs y problemas que resuelven.
 */

// =============================================================================
// PREGUNTA 1: ¿Por qué f(3) = 5 SIEMPRE es importante?
// =============================================================================

/**
 * RESPUESTA: Porque hace el código TESTEABLE y PREDECIBLE.
 * 
 * Imagina que tienes que escribir tests para estas dos funciones:
 */

// FUNCIÓN PURA - Fácil de testear
function calcularImpuesto(precio: number, tasaImpuesto: number): number {
    return precio * tasaImpuesto;
}

// Test simple y confiable:
// expect(calcularImpuesto(100, 0.16)).toBe(16) // ¡SIEMPRE PASA!

// FUNCIÓN IMPURA - Difícil de testear
let tasaImpuestoGlobal = 0.16;

function calcularImpuestoImpuro(precio: number): number {
    return precio * tasaImpuestoGlobal;
}

// Test problemático:
// expect(calcularImpuestoImpuro(100)).toBe(16) // ¿Pasará? ¡DEPENDE!
// Otro test en otro archivo podría haber cambiado tasaImpuestoGlobal a 0.21
// Tu test falla "misteriosamente" y pierdes horas debuggeando

/**
 * PROBLEMA REAL EN PRODUCCIÓN:
 * 
 * En sistemas grandes con cientos de tests ejecutándose en paralelo,
 * las funciones impuras causan "flaky tests" (tests que a veces pasan
 * y a veces fallan). Esto destruye la confianza en tu suite de tests.
 */


// =============================================================================
// PREGUNTA 2: ¿Por qué println/console.log/Datadog es un problema?
// =============================================================================

/**
 * RESPUESTA: El logging en sí NO es un problema. El problema es MEZCLAR
 * la lógica de negocio con los efectos secundarios.
 * 
 * Veamos el problema concreto:
 */

// ❌ MAL: Lógica de negocio mezclada con logging
function calcularDescuentoMal(precio: number, esClienteVIP: boolean): number {
    console.log(`Calculando descuento para precio: ${precio}`);
    
    const descuento = esClienteVIP ? 0.20 : 0.10;
    
    // Enviamos a Datadog (simulado)
    // datadogClient.trackMetric('descuento_aplicado', descuento);
    console.log(`Enviando métrica a Datadog: ${descuento}`);
    
    const precioFinal = precio * (1 - descuento);
    
    console.log(`Precio final: ${precioFinal}`);
    
    return precioFinal;
}

/**
 * ¿Por qué esto es un problema?
 * 
 * 1. NO PUEDES TESTEAR LA LÓGICA SIN LOS EFECTOS
 *    - Cada test imprime basura en la consola
 *    - Si Datadog está caído, tu función FALLA aunque la lógica sea correcta
 *    - Tienes que mockear console.log y Datadog en cada test
 * 
 * 2. NO PUEDES REUSAR LA LÓGICA
 *    - ¿Qué pasa si necesitas calcular el descuento sin loggear?
 *    - ¿Qué pasa si en otro contexto quieres enviar a otro sistema de métricas?
 *    - La lógica está "atrapada" con los efectos
 * 
 * 3. DIFÍCIL DE RAZONAR
 *    - ¿Esta función calcula algo o hace algo?
 *    - Tiene múltiples responsabilidades
 */

// ✅ BIEN: Separar la lógica pura de los efectos
function calcularDescuentoPuro(precio: number, esClienteVIP: boolean): number {
    // SOLO calcula. Nada más.
    const descuento = esClienteVIP ? 0.20 : 0.10;
    return precio * (1 - descuento);
}

// Los efectos se manejan en la "capa exterior" (infraestructura)
function procesarDescuentoConLogging(precio: number, esClienteVIP: boolean): number {
    // AQUÍ están los efectos, claramente separados
    console.log(`Calculando descuento para precio: ${precio}`);
    
    // Llamamos a la función PURA
    const precioFinal = calcularDescuentoPuro(precio, esClienteVIP);
    
    // Más efectos
    console.log(`Precio final: ${precioFinal}`);
    // datadogClient.trackMetric('descuento_aplicado', ...);
    
    return precioFinal;
}

/**
 * BENEFICIO CONCRETO:
 * - calcularDescuentoPuro() es 100% testeable sin mocks
 * - Puedes reusar la lógica pura en cualquier contexto
 * - La función impura es solo un "wrapper" que añade efectos
 */


// =============================================================================
// PREGUNTA 3: ¿Por qué modificar el objeto input es mala idea?
// =============================================================================

/**
 * RESPUESTA: Porque causa BUGS SILENCIOSOS que son muy difíciles de encontrar.
 * 
 * Escenario real:
 */

// Un usuario en tu sistema
type Usuario = {
    nombre: string;
    edad: number;
    saldo: number;
};

// ❌ MAL: Función que MUTA el objeto original
function aplicarDescuentoMutando(usuario: Usuario): Usuario {
    // Mutamos directamente el objeto recibido
    usuario.saldo = usuario.saldo * 0.9; // 10% de descuento
    return usuario;
}

// El BUG en acción:
function demostrarBugMutacion() {
    const cliente = { nombre: "María", edad: 30, saldo: 1000 };
    
    // Guardamos una "copia" para comparar después
    const clienteOriginal = cliente; // ⚠️ ¡Esto NO es una copia!
    
    // Aplicamos descuento
    const clienteConDescuento = aplicarDescuentoMutando(cliente);
    
    console.log("Cliente original:", clienteOriginal.saldo); // ¡500! No 1000
    console.log("Cliente con descuento:", clienteConDescuento.saldo); // 500
    
    // ¡AMBOS son el MISMO objeto!
    console.log("¿Son el mismo objeto?", cliente === clienteConDescuento); // true
    
    // Tu código esperaba tener dos versiones del cliente
    // pero solo tienes una, y está modificada
}

/**
 * BUGS REALES QUE ESTO CAUSA:
 * 
 * 1. HISTORIAL PERDIDO
 *    - Necesitas el estado "antes" para auditoría
 *    - Pero ya lo destruiste
 * 
 * 2. RACE CONDITIONS
 *    - Thread A lee usuario.saldo = 1000
 *    - Thread B modifica usuario.saldo = 500
 *    - Thread A usa usuario.saldo (que ahora es 500, no 1000)
 *    - BOOM: Bug imposible de reproducir
 * 
 * 3. EFECTOS A DISTANCIA
 *    - Modificas un objeto en función A
 *    - Eso rompe función B que esperaba el valor original
 *    - El bug aparece en B, no en A donde está el problema
 */

// ✅ BIEN: Función que crea un NUEVO objeto
function aplicarDescuentoSinMutar(usuario: Usuario): Usuario {
    // Creamos un nuevo objeto, el original queda intacto
    return {
        ...usuario,                        // Copiamos todas las propiedades
        saldo: usuario.saldo * 0.9         // Sobrescribimos solo saldo
    };
}

function demostrarSolucion() {
    const cliente = { nombre: "María", edad: 30, saldo: 1000 };
    
    const clienteConDescuento = aplicarDescuentoSinMutar(cliente);
    
    console.log("Cliente original:", cliente.saldo);              // 1000 ✅
    console.log("Cliente con descuento:", clienteConDescuento.saldo); // 900 ✅
    console.log("¿Son el mismo objeto?", cliente === clienteConDescuento); // false ✅
    
    // Ahora tienes DOS versiones independientes
    // Puedes comparar, auditar, revertir, etc.
}


// =============================================================================
// PREGUNTA 4: ¿Por qué modificar un array es "impredecible"?
// =============================================================================

/**
 * RESPUESTA: Porque múltiples partes del código pueden tener
 * REFERENCIAS al mismo array.
 */

// ❌ MAL: Función que muta el array original
function duplicarNumerosMutando(numeros: number[]): number[] {
    for (let i = 0; i < numeros.length; i++) {
        numeros[i] = numeros[i] * 2; // Mutamos el array original
    }
    return numeros;
}

// El BUG en acción:
function demostrarBugArrayMutable() {
    const precios = [100, 200, 300];
    
    // Función A necesita los precios originales para un reporte
    const reporteOriginal = `Precios: ${precios.join(', ')}`;
    
    // Función B necesita los precios duplicados para otro cálculo
    const preciosDuplicados = duplicarNumerosMutando(precios);
    
    // Función A intenta usar los precios "originales" después
    const reporteFinal = `Precios originales: ${precios.join(', ')}`;
    
    console.log(reporteOriginal);  // "Precios: 100, 200, 300"
    console.log(reporteFinal);      // "Precios originales: 200, 400, 600" ❌ ¡BUG!
    
    // ¡Los precios "originales" ya no son originales!
}

// ✅ BIEN: Función que crea un nuevo array
function duplicarNumerosSinMutar(numeros: readonly number[]): number[] {
    // map() crea un NUEVO array
    return numeros.map(n => n * 2);
}

function demostrarSolucionArray() {
    const precios = [100, 200, 300];
    
    const reporteOriginal = `Precios: ${precios.join(', ')}`;
    
    const preciosDuplicados = duplicarNumerosSinMutar(precios);
    
    const reporteFinal = `Precios originales: ${precios.join(', ')}`;
    
    console.log(reporteOriginal);  // "Precios: 100, 200, 300"
    console.log(reporteFinal);      // "Precios originales: 100, 200, 300" ✅
    console.log(`Precios duplicados: ${preciosDuplicados.join(', ')}`); // 200, 400, 600 ✅
}


// =============================================================================
// PREGUNTA 5: ¿Las funciones impuras son "malas"?
// =============================================================================

/**
 * RESPUESTA: ¡NO! Las funciones impuras son NECESARIAS.
 * 
 * Sin efectos secundarios, tu programa no puede:
 * - Leer/escribir archivos
 * - Hacer llamadas HTTP
 * - Mostrar algo en pantalla
 * - Guardar en base de datos
 * - Enviar emails
 * 
 * ¿POR QUÉ ESTAS ACCIONES SON IMPURAS?
 * ------------------------------------
 * Son "efectos secundarios" porque:
 * 1. MODIFICAN algo fuera de la función (archivo, DB, red)
 * 2. El resultado depende del MUNDO EXTERNO (¿el servidor está arriba?)
 * 3. Llamarlas dos veces puede dar resultados diferentes
 * 4. No puedes "deshacer" un email enviado
 * 
 * Una función PURA solo depende de sus inputs y no cambia nada afuera.
 * La clave es SABER que son impuras y manejarlas conscientemente.
 */

// Arquitectura recomendada: "Functional Core, Imperative Shell"

// 1. NÚCLEO FUNCIONAL (funciones puras) - Tu lógica de negocio
function calcularPrecioFinal(
    precioBase: number,
    descuento: number,
    impuesto: number
): number {
    const precioConDescuento = precioBase * (1 - descuento);
    const precioConImpuesto = precioConDescuento * (1 + impuesto);
    return Math.round(precioConImpuesto * 100) / 100;
}

// 2. SHELL IMPERATIVO (funciones impuras) - Interacción con el mundo
async function procesarCompra(productoId: string): Promise<void> {
    // IMPURO: Leer de base de datos
    const producto = await fetchProducto(productoId);
    
    // IMPURO: Obtener configuración
    const config = await fetchConfig();
    
    // PURO: Calcular precio (toda la lógica está aquí)
    const precioFinal = calcularPrecioFinal(
        producto.precio,
        config.descuento,
        config.impuesto
    );
    
    // IMPURO: Guardar en base de datos
    await guardarOrden(productoId, precioFinal);
    
    // IMPURO: Enviar email
    await enviarConfirmacion(producto.email, precioFinal);
}

// Stubs para el ejemplo
async function fetchProducto(id: string) { return { precio: 100, email: "test@test.com" }; }
async function fetchConfig() { return { descuento: 0.1, impuesto: 0.16 }; }
async function guardarOrden(id: string, precio: number) { }
async function enviarConfirmacion(email: string, precio: number) { }

/**
 * ¿QUÉ ES UN STUB?
 * -----------------
 * Un "stub" es una IMPLEMENTACIÓN FALSA/SIMPLIFICADA de una función.
 * Se usa para:
 * 1. Poder ejecutar el código sin tener la DB real
 * 2. Hacer tests sin depender de servicios externos
 * 3. Mostrar la FIRMA de la función sin implementar la lógica real
 * 
 * Ejemplo: fetchProducto() arriba solo retorna datos de prueba,
 * no se conecta a ninguna base de datos real.
 * 
 * En producción, reemplazarías el stub por la implementación real.
 */


// =============================================================================
// PREGUNTA 6: ¿Por qué la paralelización requiere funciones puras?
// =============================================================================

/**
 * RESPUESTA: Porque con estado mutable, los threads se "pisan" entre sí.
 * 
 * Este es uno de los bugs MÁS DIFÍCILES de resolver en la industria.
 */

// ❌ MAL: Estado compartido mutable
let contadorGlobal = 0;

function incrementarContador(): void {
    /**
     * ¿QUÉ SIGNIFICA "NO ES ATÓMICA"?
     * --------------------------------
     * Una operación ATÓMICA es INDIVISIBLE: ocurre completamente o no ocurre.
     * Como un átomo que no se puede dividir (en el sentido original).
     * 
     * `contadorGlobal = contadorGlobal + 1` PARECE una sola operación,
     * pero internamente son TRES pasos:
     * 
     *   1. LEER:    Obtener el valor actual de contadorGlobal → 0
     *   2. CALCULAR: Sumar 1 → resultado = 1
     *   3. ESCRIBIR: Guardar el resultado en contadorGlobal → 1
     * 
     * El problema: entre el paso 1 y el paso 3, OTRO proceso puede
     * ejecutar SUS pasos 1, 2, 3, causando que uno de los cambios
     * se pierda (race condition).
     * 
     * SOLUCIÓN: Usar operaciones VERDADERAMENTE atómicas que hacen
     * leer-modificar-escribir en UN SOLO paso indivisible.
     */
    // Se descompone en: 1) leer valor, 2) sumar 1, 3) escribir valor
    contadorGlobal = contadorGlobal + 1;
}

/**
 * BUG DE RACE CONDITION:
 * 
 *   Thread A                    Thread B
 *   --------                    --------
 *   lee contador = 0
 *                               lee contador = 0
 *   suma 1 → resultado = 1
 *                               suma 1 → resultado = 1
 *   escribe 1
 *                               escribe 1
 * 
 *   RESULTADO FINAL: contador = 1
 *   RESULTADO ESPERADO: contador = 2
 * 
 *   ¡Perdiste una operación!
 */

// ✅ BIEN: Funciones puras con datos inmutables
// Cada "thread" trabaja con su propia copia de los datos
function procesarEnParalelo(items: readonly number[]): number[] {
    // map puede ejecutarse en paralelo de forma segura
    // porque cada invocación trabaja con valores independientes
    return items.map(item => item * 2);
}

/**
 * ¿POR QUÉ IMPORTA LA PARALELIZACIÓN?
 * 
 * 1. RENDIMIENTO: CPUs modernos tienen 8, 16, 32+ núcleos
 *    Si no puedes paralelizar, desperdicias el 90% de tu CPU
 * 
 * 2. ESCALABILIDAD: Servicios en la nube procesan miles de requests
 *    Cada request debe ser independiente
 * 
 * 3. BIG DATA: Procesar millones de registros requiere distribuir
 *    el trabajo en múltiples máquinas
 */


// =============================================================================
// PREGUNTA 7: ¿Por qué las funciones impuras no se pueden componer/cachear?
// =============================================================================

/**
 * COMPOSICIÓN: Combinar funciones simples en funciones más complejas
 */

// ✅ Funciones puras SE COMPONEN fácilmente
const agregarImpuesto = (precio: number): number => precio * 1.16;
const aplicarDescuento = (precio: number): number => precio * 0.9;
const redondear = (precio: number): number => Math.round(precio * 100) / 100;

// Composición: crear una función nueva a partir de otras
const calcularPrecioCompleto = (precio: number): number =>
    redondear(agregarImpuesto(aplicarDescuento(precio)));

// O con pipe (más legible)
const pipe = <T>(...fns: ((x: T) => T)[]) => 
    (x: T): T => fns.reduce((acc, fn) => fn(acc), x);

const calcularPrecioConPipe = pipe(
    aplicarDescuento,
    agregarImpuesto,
    redondear
);

// Resultado predecible:
console.log(calcularPrecioConPipe(100)); // 104.4 SIEMPRE

// ❌ Funciones impuras NO SE COMPONEN bien
let descuentoActual = 0.1;
const aplicarDescuentoImpuro = (precio: number): number => precio * (1 - descuentoActual);

// Esta composición es PELIGROSA:
const calcularPrecioInestable = pipe(
    aplicarDescuentoImpuro,  // ¿Qué descuento usará? ¡Depende del estado global!
    agregarImpuesto,
    redondear
);

// El resultado cambia si alguien modifica descuentoActual

/**
 * MEMOIZACIÓN (caché de resultados):
 * Guardar el resultado de una función para no recalcularlo.
 */

// ✅ Memoización con función pura
const memo = new Map<string, number>();

function fibonacciPuro(n: number): number {
    if (n <= 1) return n;
    
    const key = `fib_${n}`;
    if (memo.has(key)) {
        return memo.get(key)!; // Devolvemos el resultado cacheado
    }
    
    const resultado = fibonacciPuro(n - 1) + fibonacciPuro(n - 2);
    memo.set(key, resultado);
    return resultado;
}

// memo.get("fib_10") SIEMPRE será 55
// Podemos cachear porque el resultado es DETERMINÍSTICO

// ❌ NO puedes memoizar funciones impuras
function obtenerPrecioActual(productoId: string): number {
    // El precio cambia con el tiempo
    return Math.random() * 100; // Simulando precio variable
}

// ¿Cachear esto? ¡IMPOSIBLE!
// El resultado de ayer no es válido hoy


// =============================================================================
// PREGUNTA 8: ¿Funciones puras = Dominio, Funciones impuras = Infraestructura?
// =============================================================================

/**
 * ¡EXACTAMENTE! Esto es "Functional Core, Imperative Shell"
 * o en Clean Architecture: "Dominio puro, Infraestructura impura"
 */

// ========================
// CAPA DE DOMINIO (PURA)
// ========================

// Entidades inmutables
type Orden = {
    readonly id: string;
    readonly items: readonly ItemOrden[];
    readonly estado: 'pendiente' | 'pagada' | 'enviada';
};

type ItemOrden = {
    readonly productoId: string;
    readonly cantidad: number;
    readonly precioUnitario: number;
};

// Funciones de dominio PURAS
function calcularTotal(orden: Orden): number {
    return orden.items.reduce(
        (total, item) => total + (item.cantidad * item.precioUnitario),
        0
    );
}

function marcarComoPagada(orden: Orden): Orden {
    // Retornamos una NUEVA orden, no mutamos
    return { ...orden, estado: 'pagada' };
}

function puedeSerEnviada(orden: Orden): boolean {
    return orden.estado === 'pagada' && orden.items.length > 0;
}

// ========================
// CAPA DE APLICACIÓN (ORQUESTACIÓN)
// ========================

// Aquí es donde las funciones puras se conectan con las impuras
async function procesarPagoUseCase(
    ordenId: string,
    // Dependencias inyectadas (pueden ser impuras)
    repositorio: { obtenerOrden: (id: string) => Promise<Orden>, guardar: (o: Orden) => Promise<void> },
    pasarelaPago: { cobrar: (monto: number) => Promise<boolean> },
    notificador: { enviarEmail: (email: string) => Promise<void> }
): Promise<Orden> {
    // IMPURO: Leer de base de datos
    const orden = await repositorio.obtenerOrden(ordenId);
    
    // PURO: Calcular total (lógica de negocio)
    const total = calcularTotal(orden);
    
    // IMPURO: Cobrar
    const pagoExitoso = await pasarelaPago.cobrar(total);
    
    if (!pagoExitoso) {
        throw new Error('Pago fallido');
    }
    
    // PURO: Actualizar estado (lógica de negocio)
    const ordenPagada = marcarComoPagada(orden);
    
    // IMPURO: Guardar en base de datos
    await repositorio.guardar(ordenPagada);
    
    // IMPURO: Enviar notificación
    await notificador.enviarEmail('orden pagada');
    
    return ordenPagada;
}

// ========================
// CAPA DE INFRAESTRUCTURA (IMPURA)
// ========================

// Implementaciones concretas de las dependencias
const repositorioReal = {
    obtenerOrden: async (id: string): Promise<Orden> => {
        // IMPURO: Conexión a base de datos real
        // return await db.query('SELECT * FROM ordenes WHERE id = ?', [id]);
        return { id, items: [], estado: 'pendiente' }; // Mock
    },
    guardar: async (orden: Orden): Promise<void> => {
        // IMPURO: Escribir en base de datos
        // await db.query('UPDATE ordenes SET ...', [orden]);
    }
};

/**
 * RESUMEN FINAL - LA ARQUITECTURA IDEAL:
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │  INFRAESTRUCTURA (Impura)                               │
 * │  - Base de datos                                        │
 * │  - APIs externas                                        │
 * │  - Sistema de archivos                                  │
 * │  - Logging/Métricas                                     │
 * └─────────────────────────────────────────────────────────┘
 *                          │
 *                          ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │  APLICACIÓN (Orquestación)                              │
 * │  - Conecta las piezas                                   │
 * │  - Llama funciones puras e impuras                      │
 * │  - Define el "flujo" del caso de uso                    │
 * └─────────────────────────────────────────────────────────┘
 *                          │
 *                          ▼
 * ┌─────────────────────────────────────────────────────────┐
 * │  DOMINIO (Puro) ⭐ EL CORAZÓN                           │
 * │  - Entidades inmutables                                 │
 * │  - Reglas de negocio                                    │
 * │  - Validaciones                                         │
 * │  - Cálculos                                             │
 * │  - 100% testeable sin mocks                             │
 * │  - 100% predecible                                      │
 * │  - 0 dependencias externas                              │
 * └─────────────────────────────────────────────────────────┘
 * 
 * BENEFICIO: Tu lógica de negocio es 100% pura y testeable.
 * Los efectos secundarios están aislados en los "bordes" del sistema.
 */


// =============================================================================
// EJECUCIÓN DE DEMOS
// =============================================================================

console.log("=".repeat(70));
console.log("DEMOSTRACIÓN: ¿POR QUÉ IMPORTAN LAS FUNCIONES PURAS?");
console.log("=".repeat(70));

console.log("\n📛 BUG por mutación de objetos:");
demostrarBugMutacion();

console.log("\n✅ Solución con inmutabilidad:");
demostrarSolucion();

console.log("\n📛 BUG por mutación de arrays:");
demostrarBugArrayMutable();

console.log("\n✅ Solución con arrays inmutables:");
demostrarSolucionArray();

console.log("\n✅ Composición de funciones puras:");
console.log(`calcularPrecioConPipe(100) = ${calcularPrecioConPipe(100)}`);

console.log("\n" + "=".repeat(70));
console.log("¡Las funciones puras hacen tu código más seguro y mantenible!");
console.log("=".repeat(70));
