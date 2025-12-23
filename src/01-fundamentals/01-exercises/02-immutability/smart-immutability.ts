/**
 * =============================================================================
 * 🧠 INMUTABILIDAD INTELIGENTE: EL SECRETO DE LA EFICIENCIA EN FP
 * =============================================================================
 *
 * Referencia: "Functional Programming in Scala" - Capítulo 3 (Data Structures)
 *
 * En la programación funcional, las estructuras de datos son INMUTABLES.
 * Pero, ¿no es eso terriblemente ineficiente? ¿Copiar todo cada vez?
 *
 * ¡NO! El secreto es la "COMPARTICIÓN ESTRUCTURAL" (structural sharing).
 * Las operaciones crean NUEVAS estructuras que REUTILIZAN la mayor parte
 * de los datos originales, en lugar de copiarlos.
 *
 * =============================================================================
 */

// =============================================================================
// CONCEPTO 1: ¿Qué es una Estructura de Datos Inmutable?
// =============================================================================

/**
 * 🔒 ANALOGÍA: Piensa en un DOCUMENTO SELLADO
 *
 * Imagina un documento legal que, una vez firmado y sellado, no puede ser
 * modificado. Si necesitas hacer un cambio, debes crear un NUEVO documento.
 *
 * Pero aquí está el truco: puedes REFERENCIAR partes del documento original
 * sin copiarlo todo. Por ejemplo, "Ver anexo del documento original".
 *
 * Esto es exactamente lo que hacen las estructuras de datos inmutables.
 */

// Una Lista Enlazada Inmutable simple (como la de FP in Scala)
// Cada nodo solo tiene un valor y una referencia al resto de la lista
type ImmutableList<A> = Nil | Cons<A>;

// Nil representa la lista vacía
interface Nil {
  readonly _tag: 'Nil';
}

// Cons representa un nodo con un valor y el resto de la lista
interface Cons<A> {
  readonly _tag: 'Cons';
  readonly head: A; // El valor de este nodo
  readonly tail: ImmutableList<A>; // Referencia al resto (¡no una copia!)
}

// Constructores helper
const nil: Nil = { _tag: 'Nil' };

function cons<A>(head: A, tail: ImmutableList<A>): Cons<A> {
  return { _tag: 'Cons', head, tail };
}

// Verificadores de tipo
function isNil<A>(list: ImmutableList<A>): list is Nil {
  return list._tag === 'Nil';
}

function isCons<A>(list: ImmutableList<A>): list is Cons<A> {
  return list._tag === 'Cons';
}

// =============================================================================
// CONCEPTO 2: COMPARTICIÓN ESTRUCTURAL (Structural Sharing)
// =============================================================================

/**
 * 🔗 PRINCIPIO CLAVE: Reutilización en Lugar de Copia
 *
 * Cuando creamos una nueva lista, NO copiamos los nodos existentes.
 * ¡Solo creamos NUEVAS REFERENCIAS a ellos!
 *
 * Ejemplo:
 *   listaOriginal = [A] -> [B] -> [C] -> Nil
 *
 *   Al agregar "N" al inicio:
 *   nuevaLista = [N] -> [A] -> [B] -> [C] -> Nil
 *                        ↑
 *                        │
 *   listaOriginal ───────┘ (¡sigue apuntando a [A]!)
 *
 *   Solo creamos UN nuevo nodo [N], el resto se REUTILIZA.
 */

// Crear lista desde array (helper)
function fromArray<A>(arr: readonly A[]): ImmutableList<A> {
  // Construimos la lista de derecha a izquierda
  // Empezamos con nil y vamos agregando al frente
  let result: ImmutableList<A> = nil;
  for (let i = arr.length - 1; i >= 0; i--) {
    result = cons(arr[i], result);
  }
  return result;
}

// Convertir lista a array (helper)
function toArray<A>(list: ImmutableList<A>): A[] {
  const result: A[] = [];
  let current = list;
  while (isCons(current)) {
    result.push(current.head);
    current = current.tail;
  }
  return result;
}

// Agregar al inicio: O(1) - ¡Solo creamos un nodo!
function prepend<A>(element: A, list: ImmutableList<A>): ImmutableList<A> {
  // Este es el corazón de la compartición estructural:
  // Creamos UN solo nodo nuevo que APUNTA a toda la lista existente
  // No copiamos nada de la lista original
  return cons(element, list); // O(1) - tiempo constante
}

// =============================================================================
// CONCEPTO 3: EFICIENCIA EN LA PRÁCTICA
// =============================================================================

/**
 * ⚡ RÁPIDO: Agregar al Principio (prepend) - O(1)
 *
 * Solo creamos un nuevo nodo que apunta a la lista existente.
 *
 * [New] -> [X] -> [Y] -> [Z] -> Nil
 *           ↑
 *           └── La lista original se reutiliza completa
 */
function demoPrependRapido(): void {
  console.log('⚡ OPERACIÓN RÁPIDA: Agregar al inicio (Prepend)');
  console.log('─'.repeat(50));

  // Lista original: [X, Y, Z]
  const original = fromArray(['X', 'Y', 'Z']);
  console.log('[original]', original);
  console.log('Lista original:', toArray(original));
  const a_array = toArray(original);
  console.log('[a_array]', a_array);
  console.log('[a_array]', Array.isArray(a_array));
  console.log('[a_array]', typeof a_array);

  // Agregar "New" al inicio - O(1)
  const conNew = prepend('New', original);
  console.log('[conNew]', conNew);
  console.log("Con 'New' al inicio:", toArray(conNew));

  // ¡La lista original sigue INTACTA!
  console.log('Lista original (sin cambios):', toArray(original));

  console.log('\n📊 Análisis:');
  console.log('   - Creamos solo 1 nodo nuevo');
  console.log('   - Reutilizamos 3 nodos existentes');
  console.log('   - Complejidad: O(1) tiempo constante');
  console.log();
}

/**
 * 🐢 LENTO: Quitar del Final (init) - O(n)
 *
 * Necesitamos crear copias de TODOS los nodos excepto el último,
 * porque cada nodo apunta al siguiente y no puede ser modificado.
 *
 * Original: [1] -> [2] -> [3] -> [4] -> Nil
 *
 * Para quitar [4]:
 * Nuevo:    [1'] -> [2'] -> [3'] -> Nil
 *
 * Cada [n'] es un NUEVO nodo (copia del valor, nueva referencia)
 */
function init<A>(list: ImmutableList<A>): ImmutableList<A> {
  if (isNil(list)) {
    throw new Error('init de lista vacía');
  }
  // Si solo queda un elemento, retornamos lista vacía
  if (isNil(list.tail)) {
    return nil;
  }
  // Recursivamente: mantenemos head, aplicamos init al tail
  // Esto crea una COPIA de cada nodo (O(n) total)
  return cons(list.head, init(list.tail));
}

function demoInitLento(): void {
  console.log('🐢 OPERACIÓN LENTA: Quitar del final (Init)');
  console.log('─'.repeat(50));

  // Lista original: [1, 2, 3, 4]
  const original = fromArray([1, 2, 3, 4]);
  console.log('[original]', original);
  // [
  //   '[original]', {
  //     _tag: 'Cons',
  //     head: 1,
  //     tail: {
  //       _tag: 'Cons',
  //       head: 2,
  //       tail: {
  //         _tag: 'Cons',
  //         head: 3,
  //         tail: { _tag: 'Cons', head: 4, tail: {...} }
  //       }
  //     }
  //   }
  // ]
  console.log('Lista original:', toArray(original));

  // Quitar el último elemento - O(n)
  const sinUltimo = init(original);
  console.log('Sin el último:', toArray(sinUltimo));

  console.log('\n📊 Análisis:');
  console.log('   - Copiamos 3 nodos (todos excepto el eliminado)');
  console.log('   - No pudimos reutilizar nada de la estructura');
  console.log('   - Complejidad: O(n) donde n = longitud de la lista');
  console.log();
}

// =============================================================================
// CONCEPTO 4: EJEMPLO VISUAL - 'tail' de una Lista
// =============================================================================

/**
 * 📐 Obtener la "cola" (tail) de una lista
 *
 * tail([Head] -> [A] -> [I] -> [L] -> Nil)
 *      └─────────────────────────────────────────→ retorna referencia directa
 *               [A] -> [I] -> [L] -> Nil
 *
 * NO crea copias - solo retorna la referencia existente.
 * El tail de una lista ya existe como parte de la estructura.
 */
function tail<A>(list: ImmutableList<A>): ImmutableList<A> {
  if (isNil(list)) {
    throw new Error('tail de lista vacía');
  }
  // Simplemente retornamos la referencia al tail existente
  // ¡No copiamos nada! La estructura ya existe.
  return list.tail; // O(1) - tiempo constante
}

function head<A>(list: ImmutableList<A>): A {
  if (isNil(list)) {
    throw new Error('head de lista vacía');
  }
  return list.head;
}

function demoTail(): void {
  console.log("📐 EJEMPLO VISUAL: 'tail' de una Lista");
  console.log('─'.repeat(50));

  // Original: [Head] -> [T] -> [A] -> [I] -> [L] -> Nil
  const original = fromArray(['Head', 'T', 'A', 'I', 'L']);
  console.log('Lista original:', toArray(original));

  // Obtener tail - O(1), solo retorna una referencia existente
  const tailDeLista = tail(original);
  console.log('Tail de la lista:', toArray(tailDeLista));

  // La lista original SIGUE INTACTA
  console.log('Original (sin cambios):', toArray(original));

  console.log('\n💡 Clave:');
  console.log('   - tail() NO copia nada');
  console.log('   - Solo retorna la referencia al resto de la lista');
  console.log('   - ¡Esta parte de la lista ya existía!');
  console.log();
}

// =============================================================================
// CONCEPTO 5: ADIÓS A LAS COPIAS DEFENSIVAS
// =============================================================================

/**
 * 🛡️ COPIAS DEFENSIVAS: El problema mutable
 *
 * En programación imperativa, cuando pasas objetos mutables a otra función,
 * debes hacer "copias defensivas" para evitar que la función los modifique.
 *
 * Con inmutabilidad, esto es INNECESARIO porque nadie puede modificar los datos.
 */

// ❌ ENFOQUE MUTABLE: Necesita copias defensivas
class RepositorioMutable {
  private usuarios: { id: string; nombre: string }[] = [];

  agregarUsuario(id: string, nombre: string): void {
    this.usuarios.push({ id, nombre });
  }

  // ⚠️ ¡PELIGRO! Si retornamos la referencia directa,
  // el código externo puede modificar nuestra lista
  getUsuariosSinProteccion(): { id: string; nombre: string }[] {
    return this.usuarios; // ❌ Expone el estado interno
  }

  // ✅ "Copia defensiva" - crear una nueva copia para proteger
  getUsuariosConCopia(): { id: string; nombre: string }[] {
    // Copiamos TODO para proteger el estado interno
    // Esto es O(n) en tiempo y memoria
    return this.usuarios.map(u => ({ ...u }));
  }
}

const testU = new RepositorioMutable();
testU.agregarUsuario('1', 'Ana');
testU.agregarUsuario('2', 'Bob');
const testUSinProteccion = testU.getUsuariosConCopia();
testUSinProteccion.push({ id: '3', nombre: 'hack' });

// console.log('Usuarios originales:', testU.getUsuariosConCopia());

// ✅ ENFOQUE INMUTABLE: No necesita copias defensivas
type UsuarioInmutable = {
  readonly id: string;
  readonly nombre: string;
};

class RepositorioInmutable {
  private readonly usuarios: ImmutableList<UsuarioInmutable>;

  constructor(usuarios: ImmutableList<UsuarioInmutable> = nil) {
    this.usuarios = usuarios;
  }

  // Retorna un NUEVO repositorio con el usuario agregado
  agregarUsuario(id: string, nombre: string): RepositorioInmutable {
    const nuevoUsuario: UsuarioInmutable = { id, nombre };
    return new RepositorioInmutable(prepend(nuevoUsuario, this.usuarios));
  }

  // ✅ Podemos retornar la referencia directa sin miedo
  // Nadie puede modificar una estructura inmutable
  getUsuarios(): ImmutableList<UsuarioInmutable> {
    return this.usuarios; // ¡Seguro! No se puede modificar
  }
}

const testUI = new RepositorioInmutable();
const l1 = testUI.agregarUsuario('1', 'Ana');
const l2 = testUI.agregarUsuario('2', 'Bob');
const testUInmutable = testUI.getUsuarios();
// console.log('[l2]', toArray(l2.getUsuarios()));
// testUInmutable.push({ id: '3', nombre: 'hack' });

// console.log('Usuarios originales:', testUI.getUsuarios());

function demoCopiasDefensivas(): void {
  console.log('🛡️ ADIÓS A LAS COPIAS DEFENSIVAS');
  console.log('─'.repeat(50));

  console.log('\n❌ PROBLEMA CON MUTABILIDAD:');
  const repoMutable = new RepositorioMutable();
  repoMutable.agregarUsuario('1', 'Ana');
  repoMutable.agregarUsuario('2', 'Bob');

  // Sin copia defensiva, el código externo puede romper el estado interno
  const listaInsegura = repoMutable.getUsuariosSinProteccion();
  console.log('Usuarios originales:', listaInsegura);

  // 😱 ¡Modificamos el estado interno del repositorio!
  listaInsegura.push({ id: 'HACKER', nombre: 'Intruso' });
  listaInsegura[0].nombre = 'ANA MODIFICADA';

  console.log('Después de la manipulación externa:');
  console.log('  Estado interno corrupto:', repoMutable.getUsuariosSinProteccion());

  console.log('\n✅ CON INMUTABILIDAD:');
  let repoInmutable = new RepositorioInmutable();
  repoInmutable = repoInmutable.agregarUsuario('1', 'Ana');
  repoInmutable = repoInmutable.agregarUsuario('2', 'Bob');

  // Podemos compartir la referencia sin miedo
  const listaSegura = repoInmutable.getUsuarios();
  console.log('[listaSegura]', listaSegura);
  console.log('[listaSegura]', listaSegura);
  console.log('Usuarios:', toArray(listaSegura));

  // No hay forma de modificar listaSegura - es inmutable
  
  // listaSegura.head.nombre = "X";  // ❌ Error de TypeScript
  // listaSegura._tag = "Nil";       // ❌ Error de TypeScript

  console.log('Estado interno protegido:', toArray(repoInmutable.getUsuarios()));
  console.log();
}

// =============================================================================
// TABLA COMPARATIVA DE COMPLEJIDAD
// =============================================================================

function tablaComplejidad(): void {
  console.log('📊 TABLA DE COMPLEJIDAD - Lista Inmutable vs Array Mutable');
  console.log('═'.repeat(65));
  console.log('│ Operación              │ Lista Inmutable │ Array Mutable │');
  console.log('├────────────────────────┼─────────────────┼───────────────┤');
  console.log('│ Agregar al INICIO      │      O(1)       │     O(n)      │');
  console.log('│ Agregar al FINAL       │      O(n)       │     O(1)*     │');
  console.log('│ Quitar del INICIO      │      O(1)       │     O(n)      │');
  console.log('│ Quitar del FINAL       │      O(n)       │     O(1)      │');
  console.log('│ Acceso por índice      │      O(n)       │     O(1)      │');
  console.log('│ Compartir datos        │      O(1)       │     O(n)**    │');
  console.log('═'.repeat(65));
  console.log('* Amortizado');
  console.log('** Requiere copia defensiva para seguridad');
  console.log();
}

// =============================================================================
// DEMOSTRACIÓN PRINCIPAL
// =============================================================================

// console.log('═'.repeat(70));
// console.log('🧠 INMUTABILIDAD INTELIGENTE: EL SECRETO DE LA EFICIENCIA EN FP');
// console.log('═'.repeat(70));
// console.log();

// demoPrependRapido();
// demoInitLento();
// demoTail();
// tablaComplejidad();
// demoCopiasDefensivas();

// console.log('═'.repeat(70));
// console.log('📚 RESUMEN DE CONCEPTOS DEL GRÁFICO:');
// console.log('═'.repeat(70));
// console.log(`
// 1. ESTRUCTURAS INMUTABLES
//    → Una vez creadas, nunca cambian
//    → Las operaciones devuelven NUEVAS estructuras

// 2. COMPARTICIÓN ESTRUCTURAL
//    → No copiamos datos, reutilizamos referencias
//    → Eficiente en memoria y tiempo

// 3. EFICIENCIA PRÁCTICA
//    → Prepend (agregar al inicio): O(1) - Rápido
//    → Init (quitar del final): O(n) - Lento
//    → Diseña tus algoritmos para aprovechar las operaciones rápidas

// 4. ADIÓS COPIAS DEFENSIVAS
//    → Los datos inmutables se pueden compartir sin riesgo
//    → No hay modificaciones inesperadas
//    → Código más simple y seguro
// `);
// console.log('═'.repeat(70));

// =============================================================================
// RETO DE REFACTORIZACIÓN
// =============================================================================

// console.log('\n🎯 RETO DE REFACTORIZACIÓN:');
// console.log('─'.repeat(70));
// console.log(`
// Tienes este código IMPERATIVO/MUTABLE. Piensa cómo lo harías funcional:

// ❌ CÓDIGO MALO (mutable):

class Historial {
    private cambios: string[] = [];

    registrar(cambio: string): void {
        this.cambios.push(cambio);  // Mutación
    }

    deshacer(): void {
        this.cambios.pop();  // Mutación
    }

    getCambios(): string[] {
        return this.cambios;  // ¡Expone el estado!
    }
}

const historial = new Historial();
historial.registrar("Cambio 1");
historial.registrar("Cambio 2");
historial.deshacer();
const changes = historial.getCambios();
changes.push("hack 3")
changes.push("hack 4")
changes[0] = "hack 1"
console.log(changes);


class HistorialInmutable {
    constructor(private readonly cambios: ImmutableList<string> = nil) {
    }

    registrar(cambio: string): HistorialInmutable {
        return new HistorialInmutable(prepend(cambio, this.cambios));
    }

    deshacer(): HistorialInmutable {
        return new HistorialInmutable(tail(this.cambios));
    }

    getCambios(): ImmutableList<string> {
        return this.cambios;
    }
}

let historial2 = new HistorialInmutable();
historial2 = historial2.registrar("Cambio 1");
historial2 = historial2.registrar("Cambio 2");
historial2 = historial2.deshacer();
const changesImmutable = historial2.getCambios();
console.log('[changesImmutable]', changesImmutable);
console.log('[changesImmutable]', toArray(changesImmutable));
// changesImmutable.push("hack 3")
// changesImmutable._tag = "Nil"
// changesImmutable.head = "Nil"
// changesImmutable.tail = "Nil"


// 💭 PREGUNTA: 
//    ¿Cómo implementarías este Historial de forma inmutable usando
//    una lista enlazada? ¿Qué operaciones serían O(1)?

//    Pista: "registrar" debería ser prepend, "deshacer" debería ser tail.
// `);
// console.log('─'.repeat(70));

function length(lista: ImmutableList<number>): number {
  if (lista._tag === 'Nil') {
    return 0; // Caso base
  } else {
    // TypeScript ya sabe que aquí 'lista' es 'Cons'
    console.log('[lista]', lista.tail);
    return 1 + length(lista.tail); // Recursión
  }
}

const lista = prepend(3, prepend(2, prepend(1, nil)));
console.log(length(lista)); // 3
console.log(length(nil)); // 0  

export {};
