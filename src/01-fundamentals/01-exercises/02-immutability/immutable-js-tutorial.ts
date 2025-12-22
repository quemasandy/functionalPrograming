/**
 * =============================================================================
 * TUTORIAL COMPLETO: IMMUTABLE.JS - ESTRUCTURAS DE DATOS PERSISTENTES
 * =============================================================================
 *
 * Immutable.js es una biblioteca de Facebook que proporciona estructuras de
 * datos inmutables y persistentes para JavaScript.
 *
 * =============================================================================
 * ¿QUÉ SON LAS ESTRUCTURAS DE DATOS PERSISTENTES?
 * =============================================================================
 *
 * Una estructura de datos "persistente" mantiene versiones anteriores de sí
 * misma cuando se modifica. En lugar de mutar, crea una nueva versión.
 *
 * ANALOGÍA: Git para tus datos
 *
 *   Imagina que tus datos son como un repositorio Git:
 *   - Cada "modificación" crea un nuevo commit (versión)
 *   - Las versiones anteriores siguen existiendo
 *   - Puedes volver a cualquier versión anterior
 *   - Solo se almacenan las diferencias (eficiencia)
 *
 * =============================================================================
 * STRUCTURAL SHARING (Compartición Estructural)
 * =============================================================================
 *
 * El secreto de la eficiencia de Immutable.js es el "structural sharing":
 *
 *   - Cuando creas una nueva versión, NO se copia todo
 *   - Solo se copian las partes que cambiaron
 *   - Las partes sin cambios se REUTILIZAN (mismo puntero en memoria)
 *
 * Ejemplo visual:
 *
 *   Original:    [A] -> [B] -> [C] -> [D]
 *
 *   Cambiar C:   [A] -> [B] -> [C'] -> [D']   (A y B se reutilizan)
 *                          \
 *                           [C] -> [D]        (versión original intacta)
 *
 * =============================================================================
 * REFERENCIA: "Functional Programming in Scala"
 * =============================================================================
 *
 * Este concepto se explica en el capítulo sobre estructuras de datos
 * funcionales. Immutable.js implementa técnicas similares a las listas
 * funcionales de Scala/Haskell.
 *
 * =============================================================================
 */

import {
  List,
  Map,
  Set,
  OrderedMap,
  OrderedSet,
  Stack,
  Record,
  Seq,
  Range,
  Repeat,
  fromJS,
  is,
  hash,
  isImmutable,
  isCollection,
  isKeyed,
  isIndexed,
} from 'immutable';

// =============================================================================
// PARTE 1: LIST - LISTAS INMUTABLES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 1.1 Creación de Lists
 * -----------------------------------------------------------------------------
 *
 * List es similar a Array pero inmutable.
 * Optimizada para operaciones en los extremos (inicio/fin).
 */

function creacionDeLists(): void {
  console.log('\n=== 1.1 CREACIÓN DE LISTS ===');

  // Crear List vacía
  const vacia = List();
  console.log('Lista vacía:', vacia.toArray()); // []

  // Crear List desde array
  const desdeArray = List([1, 2, 3, 4, 5]);
  console.log('Desde array:', desdeArray.toArray()); // [1, 2, 3, 4, 5]

  // Crear List con List.of()
  const conOf = List.of(10, 20, 30);
  console.log('Con of():', conOf.toArray()); // [10, 20, 30]

  // Crear List desde iterables
  const desdeSetNativo = List(new globalThis.Set([1, 2, 3]));
  console.log('Desde Set nativo:', desdeSetNativo.toArray()); // [1, 2, 3]
}

/**
 * -----------------------------------------------------------------------------
 * 1.2 Operaciones básicas con List
 * -----------------------------------------------------------------------------
 */

function operacionesList(): void {
  console.log('\n=== 1.2 OPERACIONES CON LIST ===');

  const lista = List([1, 2, 3]);

  // ✅ push() - Agregar al final (retorna NUEVA lista)
  const conCuatro = lista.push(4);
  console.log('Original:', lista.toArray()); // [1, 2, 3] ¡Sin cambios!
  console.log('Con push:', conCuatro.toArray()); // [1, 2, 3, 4]

  // ✅ unshift() - Agregar al inicio
  const conCero = lista.unshift(0);
  console.log('Con unshift:', conCero.toArray()); // [0, 1, 2, 3]

  // ✅ pop() - Eliminar último
  const sinUltimo = lista.pop();
  console.log('Con pop:', sinUltimo.toArray()); // [1, 2]

  // ✅ shift() - Eliminar primero
  const sinPrimero = lista.shift();
  console.log('Con shift:', sinPrimero.toArray()); // [2, 3]

  // ✅ set() - Cambiar elemento en índice
  const cambiado = lista.set(1, 99);
  console.log('Con set(1, 99):', cambiado.toArray()); // [1, 99, 3]

  // ✅ delete() - Eliminar en índice
  const eliminado = lista.delete(1);
  console.log('Con delete(1):', eliminado.toArray()); // [1, 3]

  // ✅ insert() - Insertar en posición
  const insertado = lista.insert(1, 1.5);
  console.log('Con insert(1, 1.5):', insertado.toArray()); // [1, 1.5, 2, 3]

  // ✅ update() - Actualizar con función
  const actualizado = lista.update(0, val => (val ?? 0) * 10);
  console.log('Con update:', actualizado.toArray()); // [10, 2, 3]

  // ✅ get() - Obtener elemento
  console.log('get(1):', lista.get(1)); // 2
  console.log('get(99):', lista.get(99)); // undefined
  console.log("get(99, 'default'):", lista.get(99, -1)); // -1

  // ✅ first() y last()
  console.log('first():', lista.first()); // 1
  console.log('last():', lista.last()); // 3
}

/**
 * -----------------------------------------------------------------------------
 * 1.3 Transformaciones de List (map, filter, reduce)
 * -----------------------------------------------------------------------------
 */

function transformacionesList(): void {
  console.log('\n=== 1.3 TRANSFORMACIONES DE LIST ===');

  const numeros = List([1, 2, 3, 4, 5]);

  // ✅ map() - Transformar cada elemento
  const dobles = numeros.map(n => n * 2);
  console.log('map (dobles):', dobles.toArray()); // [2, 4, 6, 8, 10]

  // ✅ filter() - Filtrar elementos
  const pares = numeros.filter(n => n % 2 === 0);
  console.log('filter (pares):', pares.toArray()); // [2, 4]

  // ✅ reduce() - Reducir a un valor
  const suma = numeros.reduce((acc, n) => acc + n, 0);
  console.log('reduce (suma):', suma); // 15

  // ✅ flatMap() - map + flatten
  const expandido = numeros.flatMap(n => List([n, n * 10]));
  console.log('flatMap:', expandido.toArray()); // [1, 10, 2, 20, 3, 30, 4, 40, 5, 50]

  // ✅ take() y skip()
  console.log('take(3):', numeros.take(3).toArray()); // [1, 2, 3]
  console.log('skip(2):', numeros.skip(2).toArray()); // [3, 4, 5]

  // ✅ slice()
  console.log('slice(1, 4):', numeros.slice(1, 4).toArray()); // [2, 3, 4]

  // ✅ reverse()
  console.log('reverse():', numeros.reverse().toArray()); // [5, 4, 3, 2, 1]

  // ✅ sort()
  const desordenados = List([3, 1, 4, 1, 5, 9, 2, 6]);
  console.log('sort():', desordenados.sort().toArray()); // [1, 1, 2, 3, 4, 5, 6, 9]

  // ✅ sortBy() - Ordenar por propiedad
  type Persona = { nombre: string; edad: number };
  const personas = List<Persona>([
    { nombre: 'Ana', edad: 30 },
    { nombre: 'Bob', edad: 25 },
    { nombre: 'Carol', edad: 35 },
  ]);
  const porEdad = personas.sortBy(p => p.edad);
  console.log('sortBy(edad):', porEdad.toArray());

  // ✅ groupBy() - Agrupar
  const porParidad = numeros.groupBy(n => (n % 2 === 0 ? 'par' : 'impar'));
  console.log('groupBy (pares):', porParidad.get('par')?.toArray()); // [2, 4]
  console.log('groupBy (impares):', porParidad.get('impar')?.toArray()); // [1, 3, 5]
}

/**
 * -----------------------------------------------------------------------------
 * 1.4 Búsqueda en List
 * -----------------------------------------------------------------------------
 */

function busquedaEnList(): void {
  console.log('\n=== 1.4 BÚSQUEDA EN LIST ===');

  const numeros = List([1, 2, 3, 4, 5, 3, 6]);

  // ✅ find() - Encontrar primer elemento que cumple condición
  console.log(
    'find(>3):',
    numeros.find(n => n > 3)
  ); // 4

  // ✅ findIndex()
  console.log(
    'findIndex(>3):',
    numeros.findIndex(n => n > 3)
  ); // 3

  // ✅ findLast() y findLastIndex()
  console.log(
    'findLast(===3):',
    numeros.findLast(n => n === 3)
  ); // 3
  console.log(
    'findLastIndex(===3):',
    numeros.findLastIndex(n => n === 3)
  ); // 5

  // ✅ indexOf() y lastIndexOf()
  console.log('indexOf(3):', numeros.indexOf(3)); // 2
  console.log('lastIndexOf(3):', numeros.lastIndexOf(3)); // 5

  // ✅ includes()
  console.log('includes(3):', numeros.includes(3)); // true
  console.log('includes(99):', numeros.includes(99)); // false

  // ✅ some() y every()
  console.log(
    'some(>4):',
    numeros.some(n => n > 4)
  ); // true
  console.log(
    'every(>0):',
    numeros.every(n => n > 0)
  ); // true

  // ✅ count() con predicado
  console.log(
    'count(===3):',
    numeros.count(n => n === 3)
  ); // 2
}

// =============================================================================
// PARTE 2: MAP - MAPAS INMUTABLES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 2.1 Creación y operaciones básicas de Map
 * -----------------------------------------------------------------------------
 *
 * Map es similar a Object o Map nativo pero inmutable.
 * Las claves pueden ser de cualquier tipo (incluso objetos).
 */

function operacionesMap(): void {
  console.log('\n=== 2.1 MAP INMUTABLE ===');

  // Crear Map desde objeto (usando tipo genérico para flexibilidad)
  const usuario = Map<string, unknown>({
    nombre: 'Ana',
    edad: 25,
    ciudad: 'Madrid',
  });

  // ✅ get() - Obtener valor
  console.log("get('nombre'):", usuario.get('nombre')); // "Ana"
  console.log("get('noExiste'):", usuario.get('noExiste')); // undefined
  console.log("get('noExiste', 'default'):", usuario.get('noExiste', 'default')); // "default"

  // ✅ set() - Establecer valor (retorna NUEVO Map)
  const conEmail = usuario.set('email', 'ana@example.com');
  console.log('Original tiene email:', usuario.has('email')); // false
  console.log('Nuevo tiene email:', conEmail.has('email')); // true

  // ✅ delete() - Eliminar clave
  const sinCiudad = usuario.delete('ciudad');
  console.log('Sin ciudad:', sinCiudad.toJS()); // { nombre: "Ana", edad: 25 }

  // ✅ update() - Actualizar con función
  const cumpleaños = usuario.update('edad', edad => (edad as number) + 1);
  console.log('Después de cumpleaños:', cumpleaños.get('edad')); // 26

  // ✅ merge() - Combinar Maps
  const datosExtra = Map<string, unknown>({ profesion: 'Ingeniera', ciudad: 'Barcelona' });
  const combinado = usuario.merge(datosExtra);
  console.log('Merge:', combinado.toJS());
  // { nombre: "Ana", edad: 25, ciudad: "Barcelona", profesion: "Ingeniera" }

  // ✅ mergeDeep() - Combinar profundamente
  const anidado1 = Map({ config: Map({ tema: 'oscuro', idioma: 'es' }) });
  const anidado2 = Map({ config: Map({ tema: 'claro' }) });
  const deepMerge = anidado1.mergeDeep(anidado2);
  console.log('MergeDeep:', deepMerge.toJS());
  // { config: { tema: "claro", idioma: "es" } }
}

/**
 * -----------------------------------------------------------------------------
 * 2.2 Acceso a datos anidados
 * -----------------------------------------------------------------------------
 */

function datosAnidadosMap(): void {
  console.log('\n=== 2.2 DATOS ANIDADOS EN MAP ===');

  // Crear estructura anidada
  const usuario = Map({
    nombre: 'Ana',
    perfil: Map({
      bio: 'Desarrolladora',
      redes: Map({
        twitter: '@ana',
        github: 'ana-dev',
      }),
    }),
    preferencias: Map({
      tema: 'oscuro',
      notificaciones: true,
    }),
  });

  // ✅ getIn() - Acceder a path anidado
  console.log("getIn(['perfil', 'bio']):", usuario.getIn(['perfil', 'bio']));
  // "Desarrolladora"

  console.log(
    "getIn(['perfil', 'redes', 'twitter']):",
    usuario.getIn(['perfil', 'redes', 'twitter']),
    usuario.getIn(['perfil', 'redes', 'twitter', 'github', 'linkedin'])
  );
  // "@ana"

  // ✅ setIn() - Establecer en path anidado
  const conLinkedIn = usuario.setIn(['perfil', 'redes', 'linkedin'], 'ana-linkedin');
  console.log('LinkedIn añadido:', conLinkedIn.getIn(['perfil', 'redes', 'linkedin']));

  // ✅ updateIn() - Actualizar en path anidado
  const bioActualizada = usuario.updateIn(['perfil', 'bio'], bio => `${bio} Senior`);
  console.log('Bio actualizada:', bioActualizada.getIn(['perfil', 'bio']));
  // "Desarrolladora Senior"

  // ✅ deleteIn() - Eliminar en path anidado
  const sinTwitter = usuario.deleteIn(['perfil', 'redes', 'twitter']);
  console.log('Twitter:', usuario.getIn(['perfil', 'redes', 'twitter'])); // undefined
  console.log('Twitter eliminado:', sinTwitter.getIn(['perfil', 'redes', 'twitter'])); // undefined

  console.log(JSON.stringify(usuario, null, 2));
  console.log(JSON.stringify(sinTwitter, null, 2));

  // ✅ hasIn() - Verificar existencia en path
  console.log("hasIn(['perfil', 'redes']):", usuario.hasIn(['perfil', 'redes'])); // true
}

/**
 * -----------------------------------------------------------------------------
 * 2.3 Iteración sobre Map
 * -----------------------------------------------------------------------------
 */

function iteracionMap(): void {
  console.log('\n=== 2.3 ITERACIÓN SOBRE MAP ===');

  const scores = Map({
    Ana: 95,
    Bob: 87,
    Carol: 92,
  });

  // ✅ forEach()
  console.log('forEach:');
  scores.forEach((valor, clave) => {
    console.log(`  ${clave}: ${valor}`);
  });

  // ✅ map() - Transforma valores
  const bonificados = scores.map(score => score + 5);
  console.log('map (+5):', bonificados.toJS()); // { Ana: 100, Bob: 92, Carol: 97 }

  // ✅ filter() - Filtra entradas
  const aprobados = scores.filter(score => score >= 90);
  console.log('filter (>=90):', aprobados.toJS()); // { Ana: 95, Carol: 92 }

  // ✅ keys(), values(), entries()
  console.log('keys:', scores.keys());
  console.log('values:', scores.valueSeq().toArray()); // [95, 87, 92]

  // ✅ mapKeys() - Transforma claves
  const clavesMayusculas = scores.mapKeys(k => k.toUpperCase());
  console.log('mapKeys:', clavesMayusculas.toJS()); // { ANA: 95, BOB: 87, CAROL: 92 }

  // ✅ flip() - Intercambia claves y valores
  const invertido = scores.flip();
  console.log('flip:', invertido.toJS()); // { 95: "Ana", 87: "Bob", 92: "Carol" }
}

// =============================================================================
// PARTE 3: SET - CONJUNTOS INMUTABLES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 3.1 Operaciones con Set
 * -----------------------------------------------------------------------------
 */

function operacionesSet(): void {
  console.log('\n=== 3.1 SET INMUTABLE ===');

  // Crear Set
  const numeros = Set([1, 2, 3, 4, 5]);
  const otroSet = Set([4, 5, 6, 7, 8]);

  // ✅ add() - Agregar elemento
  const conSeis = numeros.add(6);
  const conUno = numeros.add(1); // Ya existe, no cambia
  console.log('add(6):', conSeis.toArray()); // [1, 2, 3, 4, 5, 6]
  console.log('add(1) (ya existe):', conUno === numeros); // true (mismo objeto)

  // ✅ delete() - Eliminar elemento
  const sinTres = numeros.delete(3);
  console.log('delete(3):', sinTres.toArray()); // [1, 2, 4, 5]

  // ✅ has() - Verificar existencia
  console.log('has(3):', numeros.has(3)); // true
  console.log('has(99):', numeros.has(99)); // false

  // ✅ union() - Unión de sets
  const union = numeros.union(otroSet);
  console.log('union:', union.toArray()); // [1, 2, 3, 4, 5, 6, 7, 8]

  // ✅ intersect() - Intersección
  const interseccion = numeros.intersect(otroSet);
  console.log('intersect:', interseccion.toArray()); // [4, 5]

  // ✅ subtract() - Diferencia
  const diferencia = numeros.subtract(otroSet);
  console.log('subtract:', diferencia.toArray()); // [1, 2, 3]

  // ✅ isSubset() e isSuperset()
  const pequeño = Set([1, 2]);
  console.log('isSubset:', pequeño.isSubset(numeros)); // true
  console.log('isSuperset:', numeros.isSuperset(pequeño)); // true
}

// =============================================================================
// PARTE 4: RECORD - OBJETOS CON FORMA DEFINIDA
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 4.1 Definición y uso de Records
 * -----------------------------------------------------------------------------
 *
 * Record es como un Map pero con forma fija y valores por defecto.
 * Ideal para modelar entidades del dominio.
 */

// Definir la forma del Record
const UsuarioRecord = Record({
  id: 0,
  nombre: '',
  email: '',
  activo: true,
  roles: List<string>(),
});

// Tipo TypeScript para el Record
type UsuarioRecordType = typeof UsuarioRecord.prototype;

function operacionesRecord(): void {
  console.log('\n=== 4.1 RECORD ===');

  // Crear instancia
  const ana = UsuarioRecord({
    id: 1,
    nombre: 'Ana',
    email: 'ana@example.com',
  });

  console.log('ana:', ana.toJS());

  // ✅ Acceso por propiedad (con tipos!)
  console.log('ana.nombre:', ana.get('nombre')); // "Ana"
  console.log('ana.activo:', ana.get('activo')); // true (valor por defecto)

  // ✅ set() - Modificar (retorna nuevo Record)
  const anaActualizada = ana.set('email', 'ana.nueva@example.com');
  console.log('Email actualizado:', anaActualizada.get('email'));

  // ✅ update() - Actualizar con función
  const conRol = ana.update('roles', roles => roles.push('admin')).update('roles', roles => roles.push('user'));
  console.log('Roles:', conRol.get('roles').toArray()); // ["admin"]

  // ✅ merge()
  const datosNuevos = { nombre: 'Ana García', activo: false };
  const anaMerged = ana.merge(datosNuevos);
  console.log('Merged:', anaMerged.toJS());

  // ✅ Convertir a objeto plano
  console.log('toJS():', ana.toJS());
  console.log('toObject():', ana.toObject());
}

/**
 * -----------------------------------------------------------------------------
 * 4.2 Records anidados
 * -----------------------------------------------------------------------------
 */

// Definir Records anidados
const DireccionRecord = Record({
  calle: '',
  ciudad: '',
  codigoPostal: '',
});

const PersonaRecord = Record({
  nombre: '',
  edad: 0,
  direccion: DireccionRecord(),
});

function recordsAnidados(): void {
  console.log('\n=== 4.2 RECORDS ANIDADOS ===');

  const persona = PersonaRecord({
    nombre: 'Ana',
    edad: 25,
    direccion: DireccionRecord({
      calle: 'Gran Vía 1',
      ciudad: 'Madrid',
      codigoPostal: '28001',
    }),
  });

  // Acceso anidado
  console.log('Ciudad:', persona.get('direccion').get('ciudad')); // "Madrid"

  // Actualización anidada con setIn
  const cambiadaCiudad = persona.setIn(['direccion', 'ciudad'], 'Barcelona');
  console.log('Nueva ciudad:', cambiadaCiudad.get('direccion').get('ciudad')); // "Barcelona"

  // Original sin cambios
  console.log('Original:', persona.get('direccion').get('ciudad')); // "Madrid"
}

// =============================================================================
// PARTE 5: SEQ - SECUENCIAS LAZY
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 5.1 Evaluación perezosa (Lazy Evaluation)
 * -----------------------------------------------------------------------------
 *
 * Seq NO ejecuta las operaciones hasta que realmente necesitas el resultado.
 * Esto permite encadenar operaciones sin crear estructuras intermedias.
 */

function secuenciasLazy(): void {
  console.log('\n=== 5.1 SEQ - EVALUACIÓN PEREZOSA ===');

  // Crear secuencia desde array grande
  const numeros = Range(1, 1001); // 1 a 1000

  // ✅ Encadenar operaciones sin ejecutar
  const resultado = numeros
    .filter(n => n % 2 === 0) // Solo pares
    .map(n => n * n) // Cuadrados
    .take(5); // Solo los primeros 5

  // Las operaciones se ejecutan aquí, cuando convertimos a array
  console.log('Primeros 5 cuadrados de pares:', resultado.toArray());
  // [4, 16, 36, 64, 100]

  // ✅ Crear Seq desde colección existente
  const lista = List([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const seqDeLista = Seq(lista)
    .filter(n => n > 5)
    .map(n => n * 2);

  // No se ha ejecutado nada todavía
  console.log('Seq creada (sin ejecutar aún)');

  // Ejecutar
  console.log('Resultado:', seqDeLista.toArray()); // [12, 14, 16, 18, 20]

  // ✅ Range y Repeat
  console.log('Range(0, 10, 2):', Range(0, 10, 2).toArray()); // [0, 2, 4, 6, 8]
  console.log("Repeat('x', 3):", Repeat('x', 3).toArray()); // ['x', 'x', 'x']
}

// =============================================================================
// PARTE 6: CONVERSIÓN E INTEROPERABILIDAD
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 6.1 fromJS() y toJS()
 * -----------------------------------------------------------------------------
 */

function conversionJS(): void {
  console.log('\n=== 6.1 CONVERSIÓN CON JS ===');

  // ✅ fromJS() - Convierte objeto JS a estructuras Immutable (profundo)
  const objetoJS = {
    nombre: 'Ana',
    tags: ['developer', 'typescript'],
    perfil: {
      bio: 'Desarrolladora',
      redes: {
        twitter: '@ana',
        github: 'ana-dev',
      },
    },
  };

  const inmutable = fromJS(objetoJS);
  console.log('fromJS tipo:', inmutable.constructor.name); // Map
  console.log('Es Immutable:', isImmutable(inmutable)); // true

  // El array se convierte en List
  console.log('Tags es List:', List.isList(inmutable.get('tags'))); // true

  // ✅ toJS() - Convierte de vuelta a JS plano (profundo)
  const deVuelta = inmutable.toJS();
  console.log('toJS():', deVuelta);
  console.log('Es Immutable:', isImmutable(inmutable)); // true
  console.log('Es Immutable:', isImmutable(deVuelta)); // false

  // ✅ toArray() y toObject()
  const lista = List([1, 2, 3]);
  console.log('toArray():', lista.toArray()); // [1, 2, 3]

  const mapa = Map({ a: 1, b: 2 });
  console.log('toObject():', mapa.toObject()); // { a: 1, b: 2 }
}

// =============================================================================
// PARTE 7: COMPARACIÓN E IGUALDAD
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 7.1 Igualdad de valor vs referencia
 * -----------------------------------------------------------------------------
 *
 * Una de las ventajas de Immutable.js es la comparación por VALOR.
 * Dos estructuras con el mismo contenido son consideradas iguales.
 */

function igualdadDeValor(): void {
  console.log('\n=== 7.1 IGUALDAD DE VALOR ===');

  // En JS nativo, objetos diferentes nunca son iguales
  const jsObj1 = { a: 1, b: 2 };
  const jsObj2 = { a: 1, b: 2 };
  console.log('JS: {} === {}:', jsObj1 === jsObj2); // false

  // En Immutable.js, el CONTENIDO determina la igualdad
  const map1 = Map({ a: 1, b: 2 });
  const map2 = Map({ a: 1, b: 2 });
  console.log('Immutable: Map === Map:', is(map1, map2)); // true

  // Esto funciona para estructuras anidadas
  const anidado1 = Map({ data: List([1, 2, 3]) });
  const anidado2 = Map({ data: List([1, 2, 3]) });
  console.log('Anidado is():', is(anidado1, anidado2)); // true

  const a = List([1,2,3]);
  const b = List([1,2,3]);
  console.log('List is():', is(a, b));

  // ✅ hash() - Obtener hash del valor
  console.log('hash(map1):', hash(map1));
  console.log('hash(map2):', hash(map2));
  console.log('Hashes iguales:', hash(map1) === hash(map2)); // true

  // ✅ equals() - Método de instancia
  console.log('map1.equals(map2):', map1.equals(map2)); // true
}

// =============================================================================
// PARTE 8: ORDERED COLLECTIONS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 8.1 OrderedMap y OrderedSet
 * -----------------------------------------------------------------------------
 *
 * Mantienen el orden de inserción.
 */

function coleccionesOrdenadas(): void {
  console.log('\n=== 8.1 COLECCIONES ORDENADAS ===');

  // ✅ OrderedMap - Map que mantiene orden de inserción
  const orderedMap = OrderedMap().set('tercero', 3).set('primero', 1).set('segundo', 2);

  console.log('OrderedMap keys:', orderedMap.keySeq().toArray());
  // ["tercero", "primero", "segundo"] - orden de inserción

  // Map normal no garantiza orden
  const regularMap = Map().set('tercero', 3).set('primero', 1).set('segundo', 2);

  console.log('Regular Map keys:', regularMap.keySeq().toArray());

  // ✅ OrderedSet
  const orderedSet = OrderedSet(['z', 'a', 'm', 'b']);
  console.log('OrderedSet:', orderedSet.toArray()); // ['z', 'a', 'm', 'b']

  // Set normal no garantiza orden
  const regularSet = Set(['z', 'a', 'm', 'b']);
  console.log('Regular Set:', regularSet.toArray());
}

// =============================================================================
// PARTE 9: STACK - PILAS INMUTABLES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 9.1 Operaciones con Stack
 * -----------------------------------------------------------------------------
 */

function operacionesStack(): void {
  console.log('\n=== 9.1 STACK ===');

  // LIFO: Last In, First Out
  const pila = Stack(['a', 'b', 'c']);

  // ✅ push() - Agregar al tope
  const conD = pila.push('d');
  console.log("push('d'):", conD.toArray()); // ['d', 'a', 'b', 'c']

  // ✅ pop() - Eliminar del tope
  const sinTope = pila.pop();
  console.log('pop():', sinTope.toArray()); // ['b', 'c']

  // ✅ peek() - Ver el tope sin eliminar
  console.log('peek():', pila.peek()); // 'a'

  // ✅ Encadenar operaciones
  const resultado = Stack<string>()
    .push('primero')
    .push('segundo')
    .push('tercero')
    .pop()
    .push('nuevo');

  console.log('Encadenado:', resultado.toArray()); // ['nuevo', 'segundo', 'primero']
}

// =============================================================================
// PARTE 10: PATRONES Y MEJORES PRÁCTICAS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 10.1 Patrón: Estado de aplicación
 * -----------------------------------------------------------------------------
 */

// Definir el estado con Records
const AppStateRecord = Record({
  usuarios: List<ReturnType<typeof UsuarioRecord>>(),
  cargando: false,
  error: null as string | null,
  paginaActual: 1,
});

function patronEstadoApp(): void {
  console.log('\n=== 10.1 PATRÓN: ESTADO DE APP ===');

  // Estado inicial
  let estado = AppStateRecord();

  // Agregar usuario
  estado = estado.update('usuarios', usuarios =>
    usuarios.push(
      UsuarioRecord({
        id: 1,
        nombre: 'Ana',
        email: 'ana@example.com',
      })
    )
  );

  // Agregar otro usuario
  estado = estado.update('usuarios', usuarios =>
    usuarios.push(
      UsuarioRecord({
        id: 2,
        nombre: 'Bob',
        email: 'bob@example.com',
      })
    )
  );

  // Cambiar página
  estado = estado.set('paginaActual', 2);

  console.log('Usuarios:', estado.get('usuarios').size); // 2
  console.log('Página:', estado.get('paginaActual')); // 2
  console.log('Estado completo:', estado.toJS());
}

/**
 * -----------------------------------------------------------------------------
 * 10.2 Patrón: Normalización de datos
 * -----------------------------------------------------------------------------
 */

function patronNormalizacion(): void {
  console.log('\n=== 10.2 PATRÓN: NORMALIZACIÓN ===');

  // Estado normalizado: entidades por ID + lista de IDs
  const estadoNormalizado = Map({
    byId: Map({
      '1': Map({ id: '1', titulo: 'Post 1', autorId: 'a1' }),
      '2': Map({ id: '2', titulo: 'Post 2', autorId: 'a2' }),
      '3': Map({ id: '3', titulo: 'Post 3', autorId: 'a1' }),
    }),
    allIds: List(['1', '2', '3']),
  });

  // ✅ Agregar nuevo post
  const nuevoPost = Map({ id: '4', titulo: 'Post 4', autorId: 'a1' });
  const conNuevo = estadoNormalizado
    .setIn(['byId', '4'], nuevoPost)
    .update('allIds', ids => (ids as List<string>).push('4'));

  console.log('Posts después de agregar:', (conNuevo.get('allIds') as List<string>).size); // 4
  console.log('Posts después de agregar:', (conNuevo.get('allIds') as List<string>).toArray()); // 4

  // ✅ Actualizar post existente
  const actualizado = conNuevo.setIn(['byId', '1', 'titulo'], 'Post 1 Actualizado');

  console.log('Post 1 actualizado:', actualizado.getIn(['byId', '1', 'titulo']));

  // ✅ Filtrar posts de un autor
  const postsDeA1 = (actualizado.get('allIds') as List<string>)
    .map(id => actualizado.getIn(['byId', id]))
    .filter(post => (post as Map<string, unknown>).get('autorId') === 'a2');

  console.log('Posts de a1:', postsDeA1.size); // 3
  console.log('Posts de a1:', postsDeA1.toString()); // 3
}

/**
 * -----------------------------------------------------------------------------
 * 10.3 Cuándo usar Immutable.js vs alternativas
 * -----------------------------------------------------------------------------
 *
 * ✅ Usar Immutable.js cuando:
 *    - Estado de aplicación grande y complejo
 *    - Necesitas comparación por valor eficiente
 *    - Operaciones frecuentes en colecciones grandes
 *    - Historial de cambios (undo/redo)
 *
 * ⚠️ Considerar alternativas cuando:
 *    - Proyecto pequeño (overhead de aprender API)
 *    - Interoperabilidad constante con código JS (conversiones)
 *    - Bundle size es crítico (~60kb minificado)
 *
 * ALTERNATIVAS:
 *    - Immer: Sintaxis "mutable", menos overhead
 *    - Native JS + disciplina: spread operator, Object.freeze
 *    - ts-belt / remeda: Funciones utilitarias inmutables
 */

// =============================================================================
// DEMOSTRACIÓN COMPLETA
// =============================================================================

console.log('='.repeat(70));
console.log('TUTORIAL COMPLETO: IMMUTABLE.JS');
console.log('='.repeat(70));

// PARTE 1: List
creacionDeLists();
operacionesList();
transformacionesList();
busquedaEnList();

// PARTE 2: Map
operacionesMap();
datosAnidadosMap();
iteracionMap();

// PARTE 3: Set
operacionesSet();

// PARTE 4: Record
operacionesRecord();
recordsAnidados();

// PARTE 5: Seq
secuenciasLazy();

// PARTE 6: Conversión
conversionJS();

// PARTE 7: Igualdad
igualdadDeValor();

// PARTE 8: Ordered
coleccionesOrdenadas();

// PARTE 9: Stack
operacionesStack();

// PARTE 10: Patrones
patronEstadoApp();
patronNormalizacion();

console.log('\n' + '='.repeat(70));
console.log('RESUMEN IMMUTABLE.JS:');
console.log('- List, Map, Set, Stack: estructuras inmutables básicas');
console.log('- Record: objetos con forma fija y valores por defecto');
console.log('- Seq: evaluación perezosa para eficiencia');
console.log('- Structural sharing: solo copia lo que cambia');
console.log('- Igualdad por valor: is(a, b) compara contenido');
console.log('- Ideal para: estado complejo, historial, React/Redux');
console.log('='.repeat(70));

export { };
