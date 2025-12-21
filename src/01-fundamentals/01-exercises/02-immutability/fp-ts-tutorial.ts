/**
 * =============================================================================
 * TUTORIAL COMPLETO: FP-TS - PROGRAMACIÓN FUNCIONAL TIPADA EN TYPESCRIPT
 * =============================================================================
 *
 * fp-ts es una biblioteca que trae conceptos de Haskell/Scala a TypeScript.
 * Proporciona tipos como Option, Either, Task, IO, y más.
 *
 * =============================================================================
 * ¿POR QUÉ FP-TS?
 * =============================================================================
 *
 * TypeScript no tiene tipos funcionales nativos como Scala. fp-ts llena ese vacío:
 *
 *   1. Option<A>  → Reemplaza null/undefined de forma segura
 *   2. Either<E,A> → Manejo de errores
 *  sin excepciones
 *   3. Task<A>    → Operaciones asíncronas puras
 *   4. IO<A>      → Efectos secundarios controlados
 *   5. Reader<R,A> → Inyección de dependencias funcional
 *
 * =============================================================================
 * REFERENCIA: "Functional Programming in Scala"
 * =============================================================================
 *
 * Los conceptos de fp-ts están directamente inspirados en el libro:
 *   - Capítulo 4: Option (handling errors without exceptions)
 *   - Capítulo 4: Either (error handling)
 *   - Capítulo 7: Parallelism
 *   - Capítulo 11-13: Monads, Applicative Functors
 *
 * =============================================================================
 * ORGANIZACIÓN DE FP-TS
 * =============================================================================
 *
 * fp-ts está organizado en módulos. Cada tipo tiene su propio módulo:
 *
 *   import * as Option from 'fp-ts/Option'     // Option<A>
 *   import * as Either from 'fp-ts/Either'     // Either<E, A>
 *   import * as Arr from 'fp-ts/Array'      // Funciones para arrays
 *   import * as Task from 'fp-ts/Task'       // Task<A>
 *   import { pipe, flow } from 'fp-ts/function'  // Utilidades
 *
 * =============================================================================
 */

// Importaciones principales de fp-ts
import * as Option from 'fp-ts/Option';
import * as Either from 'fp-ts/Either';
import * as Arr from 'fp-ts/Array';
import * as NonEmptyArray from 'fp-ts/NonEmptyArray';
import * as Task from 'fp-ts/Task';
import * as TaskEither from 'fp-ts/TaskEither';
import * as IO from 'fp-ts/IO';
import * as Reader from 'fp-ts/Reader';
import { pipe, flow, identity } from 'fp-ts/function';
import { Monoid } from 'fp-ts/Monoid';
import { Ord } from 'fp-ts/Ord';

// =============================================================================
// PARTE 1: OPTION - VALORES OPCIONALES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 1.1 ¿Qué es Option?
 * -----------------------------------------------------------------------------
 *
 * Option<A> representa un valor que puede existir (Some<A>) o no existir (None).
 * Es la alternativa funcional a null/undefined.
 *
 * ANALOGÍA: La Caja de Schrödinger
 *
 *   Option es como una caja que puede contener un gato o estar vacía:
 *   - Some(gato) → La caja tiene un gato
 *   - None       → La caja está vacía
 *
 *   Nunca abres la caja directamente (null pointer exception).
 *   En su lugar, describes QUÉ HACER si hay gato o si está vacía.
 */

function basicsOption(): void {
    console.log('\n=== 1.1 OPTION BÁSICO ===');

    // ✅ Crear Option
    const algunValor: Option.Option<number> = Option.some(42);
    const sinValor: Option.Option<number> = Option.none;

    console.log('some(42):', algunValor); // { _tag: 'Some', value: 42 }
    console.log('none:', sinValor); // { _tag: 'None' }

    // ✅ fromNullable - Convertir valor que puede ser null/undefined
    const deNull = Option.fromNullable(null);
    const deValor = Option.fromNullable('hola');

    console.log('fromNullable(null):', deNull); // { _tag: 'None' }
    console.log("fromNullable('hola'):", deValor); // { _tag: 'Some', value: 'hola' }

    // ✅ fromPredicate - Crear Some si cumple predicado
    const soloPositivos = Option.fromPredicate((n: number) => n > 0);
    console.log('fromPredicate(5):', soloPositivos(5)); // Some(5)
    console.log('fromPredicate(-1):', soloPositivos(-1)); // None
}

/**
 * -----------------------------------------------------------------------------
 * 1.2 Transformando Option con pipe y map
 * -----------------------------------------------------------------------------
 *
 * pipe() es la función fundamental de fp-ts.
 * Pasa un valor a través de una serie de funciones.
 *
 * pipe(x, f, g, h) === h(g(f(x)))
 */

function transformandoOption(): void {
    console.log('\n=== 1.2 TRANSFORMANDO OPTION ===');

    const numero: Option.Option<number> = Option.some(5);

    // ✅ map - Transforma el valor DENTRO del Option
    const doble = pipe(
        numero,
        Option.map(n => n * 2)
    );
    console.log('map (*2):', doble); // Some(10)

    // ✅ Si es None, map no hace nada
    const nada: Option.Option<number> = Option.none;
    const dobleDeNada = pipe(
        nada,
        Option.map(n => n * 2)
    );
    console.log('map de None:', dobleDeNada); // None

    // ✅ Encadenar múltiples transformaciones
    const resultado = pipe(
        Option.some(10),
        Option.map(n => n + 5), // Some(15)
        Option.map(n => n * 2), // Some(30)
        Option.map(n => `Resultado: ${n}`) // Some("Resultado: 30")
    );
    console.log('Encadenado:', resultado);
}

/**
 * -----------------------------------------------------------------------------
 * 1.3 flatMap (chain) - Cuando las funciones retornan Option
 * -----------------------------------------------------------------------------
 *
 * Si tienes una función A → Option<B>, usa flatMap/chain en lugar de map.
 * Evita tener Option<Option<B>>.
 */

// Funciones que pueden fallar (retornan Option)
const dividir = (a: number, b: number): Option.Option<number> =>
    b === 0 ? Option.none : Option.some(a / b);

const raizCuadrada = (n: number): Option.Option<number> =>
    n < 0 ? Option.none : Option.some(Math.sqrt(n));

function flatMapOption(): void {
    console.log('\n=== 1.3 FLATMAP (CHAIN) ===');

    // ✅ Encadenar operaciones que pueden fallar
    const resultado = pipe(
        Option.some(16),
        Option.flatMap(n => dividir(n, 4)), // Some(4)
        Option.flatMap(n => raizCuadrada(n)) // Some(2)
    );
    console.log('16 / 4, luego sqrt:', resultado); // Some(2)

    // ✅ Si alguna falla, todo el pipeline retorna None
    const conError = pipe(
        Option.some(16),
        Option.flatMap(n => dividir(n, 0)), // None (división por 0)
        Option.flatMap(n => raizCuadrada(n)) // No se ejecuta
    );
    console.log('16 / 0, luego sqrt:', conError); // None
}

/**
 * -----------------------------------------------------------------------------
 * 1.4 Extrayendo el valor de Option
 * -----------------------------------------------------------------------------
 */

function extrayendoOption(): void {
    console.log('\n=== 1.4 EXTRAYENDO VALOR ===');

    const conValor: Option.Option<number> = Option.some(42);
    const sinValor: Option.Option<number> = Option.none;

    // ✅ getOrElse - Valor por defecto si es None
    const valorODefault1 = pipe(
        conValor,
        Option.getOrElse(() => 0)
    );
    const valorODefault2 = pipe(
        sinValor,
        Option.getOrElse(() => 0)
    );
    console.log('getOrElse Some:', valorODefault1); // 42
    console.log('getOrElse None:', valorODefault2); // 0

    // ✅ fold - Manejar ambos casos explícitamente
    const mensaje1 = pipe(
        conValor,
        Option.fold(
            () => 'No hay valor', // Si es None
            n => `El valor es ${n}` // Si es Some
        )
    );
    console.log('fold Some:', mensaje1); // "El valor es 42"

    // ✅ match - Alias más legible de fold
    const mensaje2 = pipe(
        sinValor,
        Option.match(
            () => 'Vacío',
            n => `Lleno: ${n}`
        )
    );
    console.log('match None:', mensaje2); // "Vacío"

    // ✅ isSome e isNone - Type guards
    if (Option.isSome(conValor)) {
        console.log('Es Some, valor:', conValor.value); // 42
    }

    if (Option.isNone(sinValor)) {
        console.log('Es None');
        console.log(sinValor);
    }
}

/**
 * -----------------------------------------------------------------------------
 * 1.5 Caso práctico: Buscar en datos
 * -----------------------------------------------------------------------------
 */

type Usuario = {
    id: number;
    nombre: string;
    email: string | null;
    direccion?: {
        ciudad: string;
        calle: string;
    };
};

const usuarios: Usuario[] = [
    {
        id: 1,
        nombre: 'Ana',
        email: 'ana@example.com',
        direccion: { ciudad: 'Madrid', calle: 'Gran Vía' },
    },
    { id: 2, nombre: 'Bob', email: null },
    { id: 3, nombre: 'Carol', email: 'carol@example.com' },
];

// Función pura para buscar usuario
const buscarUsuario = (id: number): Option.Option<Usuario> =>
    pipe(
        usuarios.find(u => u.id === id),
        Option.fromNullable
    );

// Función para obtener email
const obtenerEmail = (usuario: Usuario): Option.Option<string> =>
    Option.fromNullable(usuario.email);

// Función para obtener ciudad
const obtenerCiudad = (usuario: Usuario): Option.Option<string> =>
    pipe(
        Option.fromNullable(usuario.direccion),
        Option.map(d => d.ciudad)
    );

function casosPracticosOption(): void {
    console.log('\n=== 1.5 CASO PRÁCTICO OPTION ===');

    // Buscar usuario y obtener email (encadenando Options)
    const emailDeAna = pipe(buscarUsuario(1), Option.flatMap(obtenerEmail));
    console.log('Email de Ana:', emailDeAna); // Some("ana@example.com")

    const emailDeBob = pipe(buscarUsuario(2), Option.flatMap(obtenerEmail));
    console.log('Email de Bob:', emailDeBob); // None (Bob no tiene email)

    // Buscar usuario y obtener ciudad
    const ciudadDeAna = pipe(buscarUsuario(1), Option.flatMap(obtenerCiudad));
    console.log('Ciudad de Ana:', ciudadDeAna); // Some("Madrid")

    const ciudadDeCarol = pipe(buscarUsuario(3), Option.flatMap(obtenerCiudad));
    console.log('Ciudad de Carol:', ciudadDeCarol); // None (Carol no tiene dirección)

    // Usuario que no existe
    const usuarioFantasma = buscarUsuario(99);
    console.log('Usuario 99:', usuarioFantasma); // None
}

// =============================================================================
// PARTE 2: EITHER - ERRORES CON INFORMACIÓN
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 2.1 ¿Qué es Either?
 * -----------------------------------------------------------------------------
 *
 * Either<E, A> representa un valor que puede ser:
 *   - Left<E>  → Un error de tipo E
 *   - Right<A> → Un éxito de tipo A
 *
 * A diferencia de Option, Either LLEVA INFORMACIÓN sobre el error.
 *
 * CONVENCIÓN: Right is right (correcto). Left is wrong (error).
 */

// Tipos de error personalizados
type ErrorValidacion =
    | { tipo: 'CAMPO_VACIO'; campo: string }
    | { tipo: 'EMAIL_INVALIDO'; email: string }
    | { tipo: 'EDAD_INVALIDA'; edad: number };

function basicsEither(): void {
    console.log('\n=== 2.1 EITHER BÁSICO ===');

    // ✅ Crear Either
    const exito: Either.Either<string, number> = Either.right(42);
    const error: Either.Either<string, number> = Either.left('Algo salió mal');

    console.log('right(42):', exito); // { _tag: 'Right', right: 42 }
    console.log('left(...):', error); // { _tag: 'Left', left: 'Algo salió mal' }

    // ✅ fromPredicate con error
    const validarPositivo = Either.fromPredicate(
        (n: number) => n > 0,
        n => `${n} no es positivo` // Función que genera el error
    );

    console.log('validarPositivo(5):', validarPositivo(5)); // Right(5)
    console.log('validarPositivo(-1):', validarPositivo(-1)); // Left("-1 no es positivo")
}

/**
 * -----------------------------------------------------------------------------
 * 2.2 Transformando Either
 * -----------------------------------------------------------------------------
 */

// Funciones de validación que retornan Either
const validarNombre = (nombre: string): Either.Either<ErrorValidacion, string> =>
    nombre.trim().length === 0
        ? Either.left({ tipo: 'CAMPO_VACIO', campo: 'nombre' })
        : Either.right(nombre.trim());

const validarEmail = (email: string): Either.Either<ErrorValidacion, string> =>
    !email.includes('@') ? Either.left({ tipo: 'EMAIL_INVALIDO', email }) : Either.right(email);

const validarEdad = (edad: number): Either.Either<ErrorValidacion, number> =>
    edad < 0 || edad > 150 ? Either.left({ tipo: 'EDAD_INVALIDA', edad }) : Either.right(edad);

function transformandoEither(): void {
    console.log('\n=== 2.2 TRANSFORMANDO EITHER ===');

    // ✅ map - Transforma el valor Right
    const resultado = pipe(
        Either.right(10),
        Either.map(n => n * 2),
        Either.map(n => `Resultado: ${n}`)
    );
    console.log('map Right:', resultado); // Right("Resultado: 20")

    // ✅ map no afecta Left
    const conError = pipe(
        Either.left('error inicial') as Either.Either<string, number>,
        Either.map(n => n * 2) // No se ejecuta
    );
    console.log('map Left:', conError); // Left("error inicial")

    // ✅ mapLeft - Transforma el error
    const errorTransformado = pipe(
        Either.left('error :D'),
        Either.mapLeft(e => `Error transformado: ${e}`)
    );
    console.log('mapLeft:', errorTransformado);

    // ✅ bimap - Transforma ambos lados
    const bimapped = pipe(
        Either.right(5) as Either.Either<string, number>,
        Either.bimap(
            e => `Error: ${e}`, // Transforma Left
            n => n * 2 // Transforma Right
        )
    );
    console.log('bimap Right:', bimapped); // Right(10)
}

/**
 * -----------------------------------------------------------------------------
 * 2.3 Encadenando operaciones con Either
 * -----------------------------------------------------------------------------
 */

type UsuarioValidado = {
    nombre: string;
    email: string;
    edad: number;
};

// Función que valida todo y crea usuario
const crearUsuarioValidado = (
    nombre: string,
    email: string,
    edad: number
): Either.Either<ErrorValidacion, UsuarioValidado> =>
    pipe(
        validarNombre(nombre),
        Either.flatMap(nombreValido =>
            pipe(
                validarEmail(email),
                Either.flatMap(emailValido =>
                    pipe(
                        validarEdad(edad),
                        Either.map(edadValida => ({
                            nombre: nombreValido,
                            email: emailValido,
                            edad: edadValida,
                        }))
                    )
                )
            )
        )
    );

function encadenandoEither(): void {
    console.log('\n=== 2.3 ENCADENANDO EITHER ===');

    // ✅ Todo válido
    const usuarioValido = crearUsuarioValidado('Ana', 'ana@example.com', 25);
    console.log('Usuario válido:', usuarioValido);
    // Right({ nombre: "Ana", email: "ana@example.com", edad: 25 })

    // ✅ Falla en el nombre
    const nombreVacio = crearUsuarioValidado('', 'ana@example.com', 25);
    console.log('Nombre vacío:', nombreVacio);
    // Left({ tipo: 'CAMPO_VACIO', campo: 'nombre' })

    // ✅ Falla en el email
    const emailMalo = crearUsuarioValidado('Ana', 'sin-arroba', 25);
    console.log('Email malo:', emailMalo);
    // Left({ tipo: 'EMAIL_INVALIDO', email: 'sin-arroba' })

    // ✅ Falla en la edad
    const edadMala = crearUsuarioValidado('Ana', 'ana@example.com', -5);
    console.log('Edad mala:', edadMala);
    // Left({ tipo: 'EDAD_INVALIDA', edad: -5 })
}

/**
 * -----------------------------------------------------------------------------
 * 2.4 Extrayendo valores de Either
 * -----------------------------------------------------------------------------
 */

function extrayendoEither(): void {
    console.log('\n=== 2.4 EXTRAYENDO EITHER ===');

    const exito: Either.Either<string, number> = Either.right(42);
    const error: Either.Either<string, number> = Either.left('falló');

    // ✅ getOrElse - Valor por defecto si es Left
    const valor1 = pipe(
        exito,
        Either.getOrElse(() => 0)
    );
    const valor2 = pipe(
        error,
        Either.getOrElse(() => 0)
    );
    console.log('getOrElse Right:', valor1); // 42
    console.log('getOrElse Left:', valor2); // 0

    // ✅ fold/match - Manejar ambos casos
    const mensaje = pipe(
        error,
        Either.match(
            e => `Error: ${e}`,
            n => `Éxito: ${n}`
        )
    );
    console.log('match Left:', mensaje); // "Error: falló"

    // ✅ isLeft e isRight - Type guards
    if (Either.isRight(exito)) {
        console.log('Es Right, valor:', exito.right);
    }

    if (Either.isLeft(error)) {
        console.log('Es Left, error:', error.left);
    }
}

// =============================================================================
// PARTE 3: ARRAY - OPERACIONES FUNCIONALES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 3.1 Funciones de Array en fp-ts
 * -----------------------------------------------------------------------------
 */

function operacionesArray(): void {
    console.log('\n=== 3.1 ARRAY EN FP-TS ===');

    const numeros = [1, 2, 3, 4, 5];

    // ✅ map, filter, reduce (como en JS pero para pipe)
    const resultado = pipe(
        numeros,
        Arr.map(n => n * 2),
        Arr.filter(n => n > 4)
    );
    console.log('map y filter:', resultado); // [6, 8, 10]

    // ✅ head y last - Retornan Option
    const primero = Arr.head(numeros);
    const ultimo = Arr.last(numeros);
    console.log('head:', primero); // Some(1)
    console.log('last:', ultimo); // Some(5)

    const vacio: number[] = [];
    console.log('head de []:', Arr.head(vacio)); // None

    // ✅ lookup - Obtener por índice (retorna Option)
    console.log('lookup(2):', Arr.lookup(2)(numeros)); // Some(3)
    console.log('lookup(99):', Arr.lookup(99)(numeros)); // None

    // ✅ findFirst - Buscar primer elemento que cumple condición
    const primerPar = pipe(
        numeros,
        Arr.findFirst(n => n % 2 === 0)
    );
    console.log('findFirst par:', primerPar); // Some(2)

    // ✅ partition - Dividir según predicado
    const { left: impares, right: pares } = pipe(
        numeros,
        Arr.partition(n => n % 2 === 0)
    );
    console.log('partition pares:', pares); // [2, 4]
    console.log('partition impares:', impares); // [1, 3, 5]

    // ✅ sort con Ord
    const ordenarDesc: Ord<number> = {
        equals: (x, y) => x === y,
        compare: (x, y) => (x > y ? -1 : x < y ? 1 : 0),
    };
    const descendente = pipe(numeros, Arr.sort(ordenarDesc));
    console.log('sort desc:', descendente); // [5, 4, 3, 2, 1]

    // ✅ uniq - Elementos únicos
    const conDuplicados = [1, 2, 2, 3, 3, 3];
    const unicos = pipe(conDuplicados, Arr.uniq({ equals: (x, y) => x === y }));
    console.log('uniq:', unicos); // [1, 2, 3]

    // ✅ zip - Combinar dos arrays
    const letras = ['a', 'b', 'c'];
    const zipped = pipe(numeros, Arr.zip(letras));
    console.log('zip:', zipped); // [[1, 'a'], [2, 'b'], [3, 'c']]
}

/**
 * -----------------------------------------------------------------------------
 * 3.2 NonEmptyArray - Arrays que no pueden estar vacíos
 * -----------------------------------------------------------------------------
 */

function nonEmptyArray(): void {
    console.log('\n=== 3.2 NON-EMPTY ARRAY ===');

    // ✅ Crear NonEmptyArray
    const nea = NonEmptyArray.of(1); // [1] garantizado no vacío
    console.log('NonEmptyArray.of(1):', nea);

    // ✅ fromArray - Convierte array a Option<NonEmptyArray>
    const desde = NonEmptyArray.fromArray([1, 2, 3]);
    const desdeVacio = NonEmptyArray.fromArray([]);
    console.log('fromArray([1,2,3]):', desde); // Some([1, 2, 3])
    console.log('fromArray([]):', desdeVacio); // None

    // ✅ head y last son seguros (no retornan Option)
    const nums: NonEmptyArray.NonEmptyArray<number> = [1, 2, 3];
    console.log('head (seguro):', NonEmptyArray.head(nums)); // 1 (no Option)
    console.log('last (seguro):', NonEmptyArray.last(nums)); // 3 (no Option)

    // ✅ group - Agrupar consecutivos
    const consecutivos = [1, 1, 2, 2, 2, 3];
    const agrupados = NonEmptyArray.group({ equals: (x, y) => x === y })(consecutivos);
    console.log('group:', agrupados); // [[1, 1], [2, 2, 2], [3]]
}

// =============================================================================
// PARTE 4: TASK Y TASKEITHER - OPERACIONES ASÍNCRONAS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 4.1 Task - Operaciones asíncronas puras
 * -----------------------------------------------------------------------------
 *
 * Task<A> es una función que retorna Promise<A>.
 * Es "lazy": no se ejecuta hasta que la llamas.
 *
 * Task es como IO pero para operaciones asíncronas.
 */

function basicsTask(): void {
    console.log('\n=== 4.1 TASK BÁSICO ===');

    // ✅ Crear Task
    const taskSimple: Task.Task<number> = () => Promise.resolve(42);

    // ✅ Task.of - Crear Task con valor
    const taskDe42 = Task.of(42);

    // ✅ Task es lazy - no se ejecuta automáticamente
    const taskConLog: Task.Task<string> = () => {
        console.log('Ejecutando Task...');
        return Promise.resolve('Hecho');
    };

    console.log('Task creada pero no ejecutada aún');

    // Ejecutar Task
    taskConLog().then(resultado => {
        console.log('Resultado:', resultado);
    });
}

/**
 * -----------------------------------------------------------------------------
 * 4.2 TaskEither - Async con manejo de errores
 * -----------------------------------------------------------------------------
 *
 * TaskEither<E, A> = Task<Either<E, A>>
 *
 * Combina operaciones asíncronas con manejo de errores.
 */

// Simular llamada a API
const fetchUsuario = (id: number): TaskEither.TaskEither<string, Usuario> =>
    id === 1
        ? TaskEither.right({ id: 1, nombre: 'Ana', email: 'ana@example.com' })
        : TaskEither.left(`Usuario ${id} no encontrado`);

const fetchPosts = (userId: number): TaskEither.TaskEither<string, string[]> =>
    TaskEither.right([`Post 1 de usuario ${userId}`, `Post 2 de usuario ${userId}`]);

async function taskEitherDemo(): Promise<void> {
    console.log('\n=== 4.2 TASKEITHER ===');

    // ✅ Encadenar operaciones async que pueden fallar
    const obtenerPostsDeUsuario = (id: number) =>
        pipe(
            fetchUsuario(id),
            TaskEither.flatMap(usuario => fetchPosts(usuario.id)),
            TaskEither.map(posts => posts.join(', '))
        );

    // Ejecutar y obtener resultado
    const resultado1 = await obtenerPostsDeUsuario(1)();
    console.log('Posts de usuario 1:', resultado1);
    // Right("Post 1 de usuario 1, Post 2 de usuario 1")

    const resultado2 = await obtenerPostsDeUsuario(99)();
    console.log('Posts de usuario 99:', resultado2);
    // Left("Usuario 99 no encontrado")

    // ✅ tryCatch - Convertir Promise en TaskEither
    const fetchConTryCatch = (url: string): TaskEither.TaskEither<Error, string> =>
        TaskEither.tryCatch(
            () => Promise.resolve(`Datos de ${url}`), // Simula fetch
            error => new Error(String(error))
        );

    const resultado3 = await fetchConTryCatch('https://api.example.com')();
    console.log('tryCatch:', resultado3);
}

// =============================================================================
// PARTE 5: IO - EFECTOS SECUNDARIOS CONTROLADOS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 5.1 IO - Encapsulando efectos
 * -----------------------------------------------------------------------------
 *
 * IO<A> es una función () => A que encapsula un efecto secundario.
 * Es "lazy": describe el efecto sin ejecutarlo.
 *
 * Permite RAZONAR sobre efectos de forma pura.
 */

function basicsIO(): void {
    console.log('\n=== 5.1 IO BÁSICO ===');

    // ✅ IO que lee la hora actual
    const obtenerHora: IO.IO<Date> = () => new Date();

    // ✅ IO que genera número aleatorio
    const aleatorio: IO.IO<number> = () => Math.random();

    // ✅ IO que escribe en consola
    const logMensaje =
        (msg: string): IO.IO<void> =>
            () =>
                console.log(msg);

    // ✅ Componer IOs
    const programa = pipe(
        obtenerHora,
        IO.map(fecha => `La hora es: ${fecha.toISOString()}`),
        IO.flatMap(mensaje => logMensaje(mensaje))
    );

    // Ejecutar el programa
    console.log('Ejecutando IO:');
    programa(); // Imprime la hora
}

// =============================================================================
// PARTE 6: READER - INYECCIÓN DE DEPENDENCIAS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 6.1 Reader - Dependencias funcionales
 * -----------------------------------------------------------------------------
 *
 * Reader<R, A> es una función R => Arr.
 * Permite inyectar dependencias de forma funcional.
 */

// Definir tipo de configuración
type Config = {
    apiUrl: string;
    apiKey: string;
    timeout: number;
};

// Funciones que dependen de Config
const getApiUrl: Reader.Reader<Config, string> = config => config.apiUrl;
const getApiKey: Reader.Reader<Config, string> = config => config.apiKey;

// Construir URL completa
const buildRequest = (endpoint: string): Reader.Reader<Config, string> =>
    pipe(
        Reader.ask<Config>(), // Obtener la configuración completa
        Reader.map(config => `${config.apiUrl}${endpoint}?key=${config.apiKey}`)
    );

function readerDemo(): void {
    console.log('\n=== 6.1 READER ===');

    const config: Config = {
        apiUrl: 'https://api.example.com',
        apiKey: 'secret123',
        timeout: 5000,
    };

    // Ejecutar Reader pasando la configuración
    const url = buildRequest('/users')(config);
    console.log('URL construida:', url);
    // "https://api.example.com/users?key=secret123"

    // ✅ Componer Readers
    const programa = pipe(
        buildRequest('/posts'),
        Reader.map(url => `Fetching from: ${url}`)
    );

    console.log('Programa:', programa(config));
}

// =============================================================================
// PARTE 7: PIPE Y FLOW - COMPOSICIÓN
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 7.1 pipe vs flow
 * -----------------------------------------------------------------------------
 *
 * pipe(valor, f, g, h) → Comienza con un valor
 * flow(f, g, h)        → Crea una nueva función compuesta
 */

function pipeVsFlow(): void {
    console.log('\n=== 7.1 PIPE VS FLOW ===');

    // Funciones simples
    const doble = (n: number) => n * 2;
    const masUno = (n: number) => n + 1;
    const aCadena = (n: number) => `Resultado: ${n}`;

    // ✅ pipe - Ejecuta inmediatamente con un valor
    const conPipe = pipe(5, doble, masUno, aCadena);
    console.log('pipe(5, ...):', conPipe); // "Resultado: 11"

    // ✅ flow - Crea una función compuesta
    const funcionCompuesta = flow(doble, masUno, aCadena);
    console.log('flow(...):', typeof funcionCompuesta); // "function"
    console.log('flow(...)(5):', funcionCompuesta(5)); // "Resultado: 11"
    console.log('flow(...)(10):', funcionCompuesta(10)); // "Resultado: 21"

    // ✅ flow es útil para reutilizar transformaciones
    const procesarNumeros = flow(
        Arr.map(doble),
        Arr.filter(n => n > 5),
        Arr.map(aCadena)
    );

    console.log('flow con array:', procesarNumeros([1, 2, 3, 4, 5]));
    // ["Resultado: 6", "Resultado: 8", "Resultado: 10"]
}

// =============================================================================
// PARTE 8: MONOID Y SEMIGROUP - COMBINANDO VALORES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 8.1 Monoid - Combinar valores con identidad
 * -----------------------------------------------------------------------------
 *
 * Un Monoid es un tipo con:
 *   1. Una operación concat(a, b) → c
 *   2. Un elemento identidad (empty)
 *
 * Ejemplos:
 *   - Números con suma: concat = +, empty = 0
 *   - Strings con concatenación: concat = +, empty = ""
 *   - Arrays: concat = [...a, ...b], empty = []
 */

function monoidDemo(): void {
    console.log('\n=== 8.1 MONOID ===');

    // ✅ Monoid para suma
    const monoidSuma: Monoid<number> = {
        concat: (x, y) => x + y,
        empty: 0,
    };

    const suma = [1, 2, 3, 4, 5].reduce(monoidSuma.concat, monoidSuma.empty);
    console.log('Monoid suma:', suma); // 15

    // ✅ Monoid para producto
    const monoidProducto: Monoid<number> = {
        concat: (x, y) => x * y,
        empty: 1,
    };

    const producto = [1, 2, 3, 4, 5].reduce(monoidProducto.concat, monoidProducto.empty);
    console.log('Monoid producto:', producto); // 120

    // ✅ Monoid para objetos
    type Stats = { suma: number; count: number };
    const monoidStats: Monoid<Stats> = {
        concat: (x, y) => ({
            suma: x.suma + y.suma,
            count: x.count + y.count,
        }),
        empty: { suma: 0, count: 0 },
    };

    const stats = [
        { suma: 10, count: 2 },
        { suma: 20, count: 3 },
        { suma: 15, count: 1 },
    ].reduce(monoidStats.concat, monoidStats.empty);

    console.log('Monoid stats:', stats); // { suma: 45, count: 6 }
}

// =============================================================================
// PARTE 9: PATRONES AVANZADOS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 9.1 Do-notation style (similar a Haskell/Scala)
 * -----------------------------------------------------------------------------
 */

function doNotation(): void {
    console.log('\n=== 9.1 DO-NOTATION ===');

    // Simular cálculo con múltiples pasos
    const calcularDescuento = (precio: number, cupon: string): Either.Either<string, number> =>
        pipe(
            Either.Do, // Iniciar "do-notation"
            Either.bind('precioBase', () =>
                precio > 0 ? Either.right(precio) : Either.left('Precio inválido')
            ),
            Either.bind('descuento', () =>
                cupon === 'AHORRO10'
                    ? Either.right(0.1)
                    : cupon === 'AHORRO20'
                        ? Either.right(0.2)
                        : Either.left(`Cupón ${cupon} no válido`)
            ),
            Either.map(({ precioBase, descuento }) => precioBase * (1 - descuento))
        );

    console.log('AHORRO10:', calcularDescuento(100, 'AHORRO10')); // Right(90)
    console.log('AHORRO20:', calcularDescuento(100, 'AHORRO20')); // Right(80)
    console.log('INVALIDO:', calcularDescuento(100, 'XXX')); // Left("Cupón XXX no válido")
}

/**
 * -----------------------------------------------------------------------------
 * 9.2 Traverse - Convertir Array<Option> a Option<Array>
 * -----------------------------------------------------------------------------
 */

function traverseDemo(): void {
    console.log('\n=== 9.2 TRAVERSE ===');

    // Función que puede fallar
    const dividirPor2 = (n: number): Option.Option<number> =>
        n % 2 === 0 ? Option.some(n / 2) : Option.none;

    // ✅ traverse - Aplicar función y "invertir" la estructura
    const numeros1 = [2, 4, 6, 8];
    const resultado1 = pipe(numeros1, Arr.traverse(Option.Applicative)(dividirPor2));
    console.log('traverse [2,4,6,8]:', resultado1); // Some([1, 2, 3, 4])

    const numeros2 = [2, 3, 6, 8]; // 3 es impar
    const resultado2 = pipe(numeros2, Arr.traverse(Option.Applicative)(dividirPor2));
    console.log('traverse [2,3,6,8]:', resultado2); // None (porque 3 falla)

    // ✅ sequence - Cuando ya tienes Array<Option>
    const opciones: Option.Option<number>[] = [Option.some(1), Option.some(2), Option.some(3)];
    const secuenciado = pipe(opciones, Arr.sequence(Option.Applicative));
    console.log('sequence [Some,Some,Some]:', secuenciado); // Some([1, 2, 3])

    const conNone: Option.Option<number>[] = [Option.some(1), Option.none, Option.some(3)];
    const secuenciadoConNone = pipe(conNone, Arr.sequence(Option.Applicative));
    console.log('sequence [Some,None,Some]:', secuenciadoConNone); // None
}

// =============================================================================
// PARTE 10: COMPARACIÓN CON SCALA
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 10.1 Equivalencias fp-ts ↔ Scala
 * -----------------------------------------------------------------------------
 *
 * | fp-ts              | Scala                    |
 * |--------------------|--------------------------|
 * | Option<A>          | Option[A]                |
 * | Option.some(a)          | Some(a)                  |
 * | Option.none             | None                     |
 * | Option.map(f)           | .map(f)                  |
 * | Option.flatMap(f)       | .flatMap(f)              |
 * | Option.getOrElse(() => d) | .getOrElse(d)          |
 * | Option.fold(onNone, onSome) | .fold(ifEmpty)(f)    |
 * | Either<E, A>       | Either[E, A]             |
 * | Either.right(a)         | Right(a)                 |
 * | Either.left(e)          | Left(e)                  |
 * | Task<A>            | IO[A] o Future[A]        |
 * | TaskEither<E, A>   | EitherT[Future, E, A]    |
 * | pipe(x, f, g)      | x.pipe(f).pipe(g) o f(g(x)) |
 * | flow(f, g)         | f andThen g              |
 *
 * En Scala, los métodos están en el objeto (x.map(f)).
 * En fp-ts, las funciones están en módulos (Option.map(f)(x) o pipe(x, Option.map(f))).
 */

// =============================================================================
// DEMOSTRACIÓN COMPLETA
// =============================================================================

async function main(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 EL RETO DEL MANTENIMIENTO: De null a Either');
    console.log('='.repeat(70));

    // =========================================================================
    // VERSIÓN 1: IMPERATIVO CON NULL (El código original)
    // =========================================================================
    console.log('\n📌 VERSIÓN 1: Imperativo con null');
    console.log('-'.repeat(50));

    // ❌ PROBLEMA: Tu jefe dice "el frontend necesita saber POR QUÉ falló"
    // Con null, solo sabemos que falló, pero no por qué.

    const validarEmailImperativoNull = (email: string): { email: string, domain: string, domainUpper: string } | null => {
        // 1. ¿Tiene @?
        if (!email.includes("@")) {
            return null;  // ❌ ¿Por qué null? No sabemos
        }
        // 2. ¿Es gmail?
        if (email.includes("@gmail.com")) {
            return null;  // ❌ ¿Por qué null? No sabemos  
        }

        const emailNormalizado = email.trim().toLowerCase();
        const domain = emailNormalizado.split("@")[1];

        // 3. ¿Dominio muy corto?
        if (domain.length < 5) {
            return null;  // ❌ ¿Por qué null? No sabemos
        }

        return { email: emailNormalizado, domain, domainUpper: domain.toUpperCase() };
    };

    console.log('validar("hola@domain.com"):', validarEmailImperativoNull("hola@domain.com"));
    console.log('validar("hola"):', validarEmailImperativoNull("hola")); // null - ¿Por qué?
    console.log('validar("x@gmail.com"):', validarEmailImperativoNull("x@gmail.com")); // null - ¿Por qué?
    console.log('validar("x@ab.co"):', validarEmailImperativoNull("x@ab.co")); // null - ¿Por qué?

    // =========================================================================
    // VERSIÓN 2: IMPERATIVO CON ERRORES (El cambio que pide tu jefe)
    // =========================================================================
    console.log('\n📌 VERSIÓN 2: Imperativo con errores descriptivos');
    console.log('-'.repeat(50));

    // 😓 PROBLEMA: Tenemos que ir uno por uno, cambiar firma, recordar el patrón
    type EmailResult = { email: string; domain: string; domainUpper: string };
    type EmailError =
        | { tipo: 'FALTA_ARROBA' }
        | { tipo: 'DOMINIO_GMAIL' }
        | { tipo: 'DOMINIO_MUY_CORTO'; longitud: number };

    const validarEmailImperativoError = (email: string): { ok: true; data: EmailResult } | { ok: false; error: EmailError } => {
        if (!email.includes("@")) {
            return { ok: false, error: { tipo: 'FALTA_ARROBA' } };
        }
        if (email.includes("@gmail.com")) {
            return { ok: false, error: { tipo: 'DOMINIO_GMAIL' } };
        }

        const emailNormalizado = email.trim().toLowerCase();
        const domain = emailNormalizado.split("@")[1];

        if (domain.length < 5) {
            return { ok: false, error: { tipo: 'DOMINIO_MUY_CORTO', longitud: domain.length } };
        }

        return { ok: true, data: { email: emailNormalizado, domain, domainUpper: domain.toUpperCase() } };
    };

    // 😓 Y ahora hay que checkear ok/error en cada uso...
    const resultado = validarEmailImperativoError("hola");
    if (resultado.ok) {
        console.log('Éxito:', resultado.data);
    } else {
        console.log('Error:', resultado.error); // { tipo: 'FALTA_ARROBA' }
    }

    // =========================================================================
    // VERSIÓN 3: FUNCIONAL CON OPTION (Pierde info del error)
    // =========================================================================
    console.log('\n📌 VERSIÓN 3: Funcional con Option');
    console.log('-'.repeat(50));

    // 🤔 Option es elegante pero... solo dice "Some" o "None"
    // No nos dice POR QUÉ falló

    const validarEmailOption = flow(
        Option.fromPredicate((email: string) => email.includes("@")),
        Option.filter((email: string) => !email.includes("@gmail.com")),
        Option.map(email => email.trim().toLowerCase()),
        Option.flatMap(email => pipe(
            Option.Do,
            Option.let("email", () => email),
            Option.bind("domain", () => Option.fromNullable(email.split("@")[1])),
            Option.filter(({ domain }) => domain.length >= 5),
            Option.let("domainUpper", ({ domain }) => domain.toUpperCase()),
        ))
    );

    console.log('Option("hola@domain.com"):', validarEmailOption("hola@domain.com")); // Some(...)
    console.log('Option("hola"):', validarEmailOption("hola")); // None ← ¿Por qué? No sabemos
    console.log('Option("x@gmail.com"):', validarEmailOption("x@gmail.com")); // None ← ¿Por qué?

    // =========================================================================
    // VERSIÓN 4: FUNCIONAL CON EITHER (¡La mejor de ambos mundos!)
    // =========================================================================
    console.log('\n📌 VERSIÓN 4: Funcional con Either (¡LA SOLUCIÓN!)');
    console.log('-'.repeat(50));

    // ✅ Either<E, A> = Left(error) | Right(éxito)
    // Mantiene la elegancia funcional Y nos da información del error
    //
    // Equivalente en Scala:
    //   def validarEmail(input: String): Either[EmailError, EmailResult] =
    //     for {
    //       _      <- Either.cond(input.contains("@"), (), FaltaArroba)
    //       _      <- Either.cond(!input.contains("@gmail.com"), (), DominioGmail)
    //       email  = input.trim.toLowerCase
    //       domain <- email.split("@").lift(1).toRight(FaltaArroba)
    //       _      <- Either.cond(domain.length >= 5, (), DominioMuyCorto(domain.length))
    //     } yield EmailResult(email, domain, domain.toUpperCase)

    const validarEmailEither = (input: string): Either.Either<EmailError, EmailResult> =>
        pipe(
            // Inicializamos con el tipo de error explícito para que TS unifique correctamente
            Either.right<EmailError, {}>({}),
            // 1. Validar que contiene "@"
            Either.filterOrElse(
                () => input.includes("@"),
                (): EmailError => ({ tipo: 'FALTA_ARROBA' })
            ),
            // 2. Validar que NO es gmail
            Either.filterOrElse(
                () => !input.includes("@gmail.com"),
                (): EmailError => ({ tipo: 'DOMINIO_GMAIL' })
            ),
            // 3. Normalizar email y extraer dominio
            Either.flatMap(() => {
                const email = input.trim().toLowerCase();
                const parts = email.split("@");
                const domain = parts[1];

                if (!domain) {
                    return Either.left<EmailError, EmailResult>({ tipo: 'FALTA_ARROBA' });
                }

                if (domain.length < 5) {
                    return Either.left<EmailError, EmailResult>({ tipo: 'DOMINIO_MUY_CORTO', longitud: domain.length });
                }

                return Either.right<EmailError, EmailResult>({
                    email,
                    domain,
                    domainUpper: domain.toUpperCase(),
                });
            })
        );

    // ✅ Ahora tenemos la información del error Y composición elegante
    const casos = [
        "hola@domain.com",  // ✅ Válido
        "hola",             // ❌ FALTA_ARROBA
        "x@gmail.com",      // ❌ DOMINIO_GMAIL  
        "x@ab.co",          // ❌ DOMINIO_MUY_CORTO (5 chars, necesita >=5)
    ];

    casos.forEach(email => {
        const resultado = validarEmailEither(email);
        const mensaje = pipe(
            resultado,
            Either.match(
                // onLeft: Transformar error a mensaje amigable
                (error) => {
                    switch (error.tipo) {
                        case 'FALTA_ARROBA': return '❌ El email debe contener @';
                        case 'DOMINIO_GMAIL': return '❌ No aceptamos emails de Gmail';
                        case 'DOMINIO_MUY_CORTO': return `❌ Dominio muy corto (${error.longitud} chars, mínimo 5)`;
                    }
                },
                // onRight: Éxito
                (data) => `✅ Válido: ${data.email} → dominio: ${data.domainUpper}`
            )
        );
        console.log(`Either("${email}"):`, mensaje);
    });

    // =========================================================================
    // RESUMEN COMPARATIVO
    // =========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN: ¿Cuándo usar qué?');
    console.log('='.repeat(70));
    console.log(`
    | Situación                        | Herramienta | Razón                    |
    |----------------------------------|-------------|--------------------------|
    | Valor puede existir o no         | Option<A>   | Simple, sin info extra   |
    | Error con información descriptiva| Either<E,A> | Errores tipados          |
    | Múltiples errores a la vez       | Validated   | Acumula todos los errores|
    | Operación asíncrona que falla    | TaskEither  | Async + Either           |
    
    💡 Regla práctica:
       - ¿El usuario necesita saber POR QUÉ falló? → Either
       - ¿Solo necesitas saber SI hay valor? → Option
    `);
}

main().catch(console.error);

export { };
