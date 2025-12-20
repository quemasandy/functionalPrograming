/**
 * =============================================================================
 * TUTORIAL: INMUTABILIDAD EN PROGRAMACIÓN FUNCIONAL
 * =============================================================================
 * 
 * La inmutabilidad significa que una vez que creas un dato, NUNCA lo modificas.
 * En su lugar, crear NUEVOS datos basados en los originales.
 * 
 * ¿Por qué? Porque los datos mutables causan bugs difíciles de rastrear.
 * =============================================================================
 */

// =============================================================================
// PARTE 1: EL PROBLEMA CON LA MUTABILIDAD
// =============================================================================

/**
 * ❌ MAL: Código mutable - Los datos cambian "debajo de tus pies"
 */
function ejemploMutableProblematico(): void {
    console.log("❌ PROBLEMA CON MUTABILIDAD:");
    
    // Creamos un usuario mutable
    const usuario = {
        nombre: "Ana",
        edad: 25,
        direccion: {
            ciudad: "Madrid",
            calle: "Gran Vía 1"
        }
    };
    
    // Guardamos una "referencia" pensando que es una copia
    const usuarioBackup = usuario;
    
    // Modificamos el usuario original
    usuario.nombre = "María";
    usuario.direccion.ciudad = "Barcelona";
    
    // ¡SORPRESA! El backup también cambió
    console.log("Original:", usuario.nombre);        // María
    console.log("Backup:", usuarioBackup.nombre);    // María (¡debería ser Ana!)
    console.log("¿Son el mismo objeto?", usuario === usuarioBackup); // true
    
    // Esto causa BUGS porque:
    // 1. Esperabas tener dos versiones diferentes
    // 2. El backup era para "revertir" si algo falla
    // 3. Ahora no puedes comparar antes/después
}


// =============================================================================
// PARTE 2: TÉCNICAS DE INMUTABILIDAD EN TYPESCRIPT
// =============================================================================

/**
 * TÉCNICA 1: Usar 'readonly' en tipos
 * 
 * 'readonly' previene modificaciones accidentales a nivel de TypeScript
 * (en runtime JS no hay protección, pero el compilador te avisa)
 * :D
 */

// Definimos un tipo con propiedades readonly :)
type UsuarioInmutable = {
    readonly nombre: string;      // No se puede modificar
    readonly edad: number;        // No se puede modificar
    readonly direccion: {
        readonly ciudad: string;  // Objetos anidados también readonly
        readonly calle: string;
    };
};

// También podemos usar el utility type Readonly<T>
type ProductoInmutable = Readonly<{
    id: string;
    nombre: string;
    precio: number;
}>;

// Para arrays usamos ReadonlyArray<T> o readonly T[]
type ListaInmutable = readonly number[];


/**
 * TÉCNICA 2: Spread Operator para crear copias modificadas
 * 
 * En lugar de mutar, creamos un NUEVO objeto con los cambios
 */
function cambiarNombre(
    usuario: UsuarioInmutable, 
    nuevoNombre: string
): UsuarioInmutable {
    // ❌ ESTO NO COMPILA: usuario.nombre = nuevoNombre;
    // usuario.nombre = nuevoNombre; Cannot assign to 'nombre' because it is a read-only property.ts(2540)
    // usuario.direccion.ciudad = "Barcelona"; Cannot assign to 'ciudad' because it is a read-only property.ts(2540)
    
    // ✅ Creamos un nuevo objeto con el nombre cambiado
    return {
        ...usuario,           // Copiamos todas las propiedades
        nombre: nuevoNombre   // Sobrescribimos solo 'nombre'
    };
}

/**
 * TÉCNICA 3: Copia profunda (deep copy) para objetos anidados
 * 
 * El spread operator hace copia SUPERFICIAL, no profunda.
 * Para objetos anidados, necesitamos cuidado especial.
 */
function cambiarCiudad(
    usuario: UsuarioInmutable,
    nuevaCiudad: string
): UsuarioInmutable {
    return {
        ...usuario,
        direccion: {
            ...usuario.direccion,  // Copiamos el objeto direccion
            ciudad: nuevaCiudad    // Sobrescribimos ciudad
        }
    };
}

/**
 * TÉCNICA 4: Métodos inmutables de arrays
 * 
 * Algunos métodos MUTAN el array (evitar):
 *   - push, pop, shift, unshift
 *   - splice, sort (sin copia), reverse (sin copia)
 * 
 * Otros crean NUEVOS arrays (preferir):
 *   - map, filter, reduce
 *   - concat, slice
 *   - [...array] (spread)
 */

function operacionesInmutablesArray(): void {
    const numeros: readonly number[] = [1, 2, 3, 4, 5];
    
    // ❌ ESTO NO COMPILA con readonly:
    // numeros.push(6);
    // numeros[0] = 100;
    
    // ✅ Crear nuevo array con elemento agregado al final
    const conSeis = [...numeros, 6];
    console.log("Original:", numeros);  // [1, 2, 3, 4, 5]
    console.log("Con 6:", conSeis);     // [1, 2, 3, 4, 5, 6]
    
    // ✅ Crear nuevo array con elemento agregado al inicio
    const conCero = [0, ...numeros];
    console.log("Con 0:", conCero);     // [0, 1, 2, 3, 4, 5]
    
    // ✅ Crear nuevo array sin un elemento (eliminar el 3)
    const sinTres = numeros.filter(n => n !== 3);
    console.log("Sin 3:", sinTres);     // [1, 2, 4, 5]
    
    // ✅ Crear nuevo array con elementos transformados
    const dobles = numeros.map(n => n * 2);
    console.log("Dobles:", dobles);     // [2, 4, 6, 8, 10]
    
    // ✅ Crear nuevo array ordenado (copia primero, luego ordena)
    const desordenados = [3, 1, 4, 1, 5, 9, 2, 6];
    const ordenados = [...desordenados].sort((a, b) => a - b);
    console.log("Original:", desordenados); // [3, 1, 4, 1, 5, 9, 2, 6]
    console.log("Ordenado:", ordenados);    // [1, 1, 2, 3, 4, 5, 6, 9]
}


// =============================================================================
// PARTE 3: PATRONES COMUNES DE INMUTABILIDAD
// =============================================================================

/**
 * PATRÓN 1: Actualizar elemento en array por índice
 */
function actualizarEnIndice<T>(
    array: readonly T[],
    indice: number,
    nuevoValor: T
): T[] {
    // Creamos nuevo array: elementos antes + nuevo valor + elementos después
    return [
        ...array.slice(0, indice),      // Elementos antes del índice
        nuevoValor,                      // El nuevo valor
        ...array.slice(indice + 1)       // Elementos después del índice
    ];
}

// const originalArray = [1, 2, 3, 4, 5];
// const updatedArray = actualizarEnIndice(originalArray, 2, 100);
// console.log(updatedArray); // [1, 2, 100, 4, 5]
// console.log(originalArray); // [1, 2, 3, 4, 5] (sin modificar)

/**
 * PATRÓN 2: Eliminar elemento en array por índice
 */
function eliminarEnIndice<T>(
    array: readonly T[],
    indice: number
): T[] {
    return [
        ...array.slice(0, indice),      // Elementos antes
        ...array.slice(indice + 1)       // Elementos después (saltamos el índice)
    ];
}

/**
 * PATRÓN 3: Agregar elemento en posición específica
 */
function insertarEnIndice<T>(
    array: readonly T[],
    indice: number,
    valor: T
): T[] {
    return [
        ...array.slice(0, indice),      // Elementos antes
        valor,                           // Nuevo elemento
        ...array.slice(indice)           // Elementos desde el índice en adelante
    ];
}

// console.log(insertarEnIndice([1, 2, 3, 4, 5], 2, 100));

/**
 * PATRÓN 4: Actualizar propiedad anidada en objeto
 * 
 * Cuando tienes objetos profundamente anidados, creas copias
 * en cada nivel hasta llegar a la propiedad que quieres cambiar.
 */
type Empresa = {
    readonly nombre: string;
    readonly departamentos: readonly {
        readonly nombre: string;
        readonly empleados: readonly {
            readonly id: number;
            readonly nombre: string;
            readonly salario: number;
        }[];
    }[];
};

function aumentarSalario(
    empresa: Empresa,
    departamentoIdx: number,
    empleadoIdx: number,
    aumento: number
): Empresa {
    return {
        ...empresa,
        departamentos: empresa.departamentos.map((dept, dIdx) => 
            dIdx !== departamentoIdx 
                ? dept  // Departamentos que no cambian
                : {
                    ...dept,
                    empleados: dept.empleados.map((emp, eIdx) =>
                        eIdx !== empleadoIdx
                            ? emp  // Empleados que no cambian
                            : {
                                ...emp,
                                salario: emp.salario + aumento
                            }
                    )
                }
        )
    };
}


// =============================================================================
// PARTE 4: BIBLIOTECAS PARA INMUTABILIDAD
// =============================================================================

/**
 * Para proyectos grandes, considera usar bibliotecas especializadas:
 * 
 * 1. Immer (https://immerjs.github.io/immer/)
 *    - Te permite escribir código "mutable" que produce resultados inmutables
 *    - Muy intuitivo para desarrolladores que vienen de OOP
 * 
 * Ejemplo con Immer:
 * 
 *   import produce from 'immer';
 *   
 *   const nuevoUsuario = produce(usuario, draft => {
 *       draft.direccion.ciudad = "Barcelona";  // ¡Parece mutación pero no lo es!
 *   });
 * 
 * 2. Immutable.js (https://immutable-js.com/)
 *    - Estructuras de datos inmutables optimizadas
 *    - Usa "structural sharing" para eficiencia
 * 
 * 3. fp-ts (https://gcanti.github.io/fp-ts/)
 *    - Biblioteca FP completa para TypeScript
 *    - Incluye Option, Either, y más
 */


// =============================================================================
// PARTE 5: EJERCICIOS PRÁCTICOS
// =============================================================================

/**
 * EJERCICIO 1: Implementa función para agregar item a carrito
 * 
 * El carrito original NO debe modificarse.
 */
type ItemCarrito = {
    readonly productoId: string;
    readonly cantidad: number;
    readonly precio: number;
};

type Carrito = {
    readonly items: readonly ItemCarrito[];
    readonly total: number;
};

// Implementa esta función de forma inmutable:
function agregarAlCarrito(
    carrito: Carrito,
    nuevoItem: ItemCarrito
): Carrito {
    // Tu código aquí
    // Pistas:
    // 1. Crea nuevo array de items con el nuevo item
    // 2. Recalcula el total
    // 3. Retorna un NUEVO carrito
    
    return {
        items: [...carrito.items, nuevoItem],
        total: carrito.total + (nuevoItem.cantidad * nuevoItem.precio)
    };
}

/**
 * EJERCICIO 2: Implementa función para actualizar cantidad
 * 
 * Busca el item por productoId y actualiza su cantidad.
 */
function actualizarCantidad(
    carrito: Carrito,
    productoId: string,
    nuevaCantidad: number
): Carrito {
    // Mapeamos los items, cambiando solo el que coincide con productoId
    const nuevosItems = carrito.items.map(item =>
        item.productoId === productoId
            ? { ...item, cantidad: nuevaCantidad }  // Creamos nuevo item con cantidad actualizada
            : item  // Items que no cambian se mantienen igual
    );
    
    // Recalculamos el total
    const nuevoTotal = nuevosItems.reduce(
        (sum, item) => sum + (item.cantidad * item.precio),
        0
    );
    
    return {
        items: nuevosItems,
        total: nuevoTotal
    };
}

/**
 * EJERCICIO 3: Implementa función para eliminar item del carrito
 */
function eliminarDelCarrito(
    carrito: Carrito,
    productoId: string
): Carrito {
    // Filtramos para excluir el item con el productoId dado
    const nuevosItems = carrito.items.filter(
        item => item.productoId !== productoId
    );
    
    // Recalculamos el total
    const nuevoTotal = nuevosItems.reduce(
        (sum, item) => sum + (item.cantidad * item.precio),
        0
    );
    
    return {
        items: nuevosItems,
        total: nuevoTotal
    };
}


// // =============================================================================
// // DEMOSTRACIÓN
// // =============================================================================

// console.log("=".repeat(70));
// console.log("TUTORIAL: INMUTABILIDAD");
// console.log("=".repeat(70));

// ejemploMutableProblematico();

// console.log("\n✅ OPERACIONES INMUTABLES CON ARRAYS:");
// operacionesInmutablesArray();

// console.log("\n✅ EJERCICIOS DEL CARRITO:");

// const carritoVacio: Carrito = { items: [], total: 0 };

// const conPrimerItem = agregarAlCarrito(carritoVacio, {
//     productoId: "A1",
//     cantidad: 2,
//     precio: 100
// });
// console.log("Carrito vacío:", carritoVacio);
// console.log("Con primer item:", conPrimerItem);

// const conSegundoItem = agregarAlCarrito(conPrimerItem, {
//     productoId: "B2",
//     cantidad: 1,
//     precio: 50
// });
// console.log("Con segundo item:", conSegundoItem);

// const cantidadActualizada = actualizarCantidad(conSegundoItem, "A1", 5);
// console.log("Cantidad actualizada:", cantidadActualizada);

// const itemEliminado = eliminarDelCarrito(cantidadActualizada, "A1");
// console.log("Item eliminado:", itemEliminado);

// console.log("\n" + "=".repeat(70));
// console.log("BENEFICIOS DE INMUTABILIDAD:");
// console.log("- Historial completo: todos los estados anteriores existen");
// console.log("- Debugging fácil: puedes comparar antes/después");
// console.log("- Thread-safe: no hay race conditions");
// console.log("- Predecible: los datos nunca cambian inesperadamente");
// console.log("=".repeat(70));


export {};
