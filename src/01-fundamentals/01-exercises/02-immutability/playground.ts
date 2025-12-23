// ¿Qué es una interface? 
interface Nil {
  // ¿Cuál es el comportamiento o qué efecto tiene en el código decir que esta propiedad es read-only? 
  readonly _tag: 'Nil';
}

interface Cons<A> {
  readonly _tag: 'Cons';
  readonly head: A; // El valor de este nodo
  // Ayúdame a entender si "tail" es una referencia al resto. ¿Qué ganancias tengo? ¿Hay una ganancia de performance o qué? 
  readonly tail: ImmutableList<A>; // Referencia al resto (¡no una copia!)
}

type ImmutableList<A> = Cons<A> | Nil;

function cons<A>(head: A, tail: ImmutableList<A>): Cons<A> {
  return { _tag: 'Cons', head, tail };
}

const nil: Nil = { _tag: 'Nil' };

// Verificadores de tipo
// que significa "list is Nil"?
function isNil<A>(list: ImmutableList<A>): list is Nil {
  return list._tag === 'Nil';
}

function isCons<A>(list: ImmutableList<A>): list is Cons<A> {
  return list._tag === 'Cons';
}

function length(lista: ImmutableList<number>): number {
  if (isNil(lista)) {
    return 0; // Caso base
  } else {
    return 1 + length(lista.tail); // Recursión
  }
}

function sum(lista: ImmutableList<number>): number {
  if (isNil(lista)) {
    return 0; // Caso base
  } else {
    return lista.head + sum(lista.tail); // Recursión
  }
}

// Construir listas enlazadas de esta forma son objetos que están enlazados de forma gigante. 
// No consumen demasiada memoria, o sea, tienen un límite, y en algún momento me voy a quedar sin memoria. 
// Debería preocuparme por la memoria. ¿Cuándo debería empezarme a preocupar por la memoria?
// Estar listos de esta forma es más eficiente que hacer [start, ...list]
// Si hago esto en JavaScript, [start, ...list] creará una copia de la lista, por lo que no es eficiente. estoy en los cierto ?
function List(start: number, end: number): ImmutableList<number> {
  if (start > end) {
    return nil;
  } else {
    return cons(start, List(start + 1, end));
  }
}

function ListLifo(start: number, end: number): ImmutableList<number> {
  if (start > end) {
    return nil;
  } else {
    return cons(end, ListLifo(start, end - 1));
  }
}

function toArray<A>(lista: ImmutableList<A>): A[] {
  const result: A[] = [];
  let current = lista;
  while (isCons(current)) {
    result.push(current.head);
    current = current.tail;
  }
  return result;
}

// const lista = List(1, 10);
const lista = ListLifo(1, 10);
// lista._tag = 'Nil';
// lista.head = 2;
// lista.tail = 2;
console.log('[lista]', lista);
console.log('[lista] JS', toArray(lista));
console.log(length(lista));
console.log(sum(lista)); 

// Complejidad: O(1) tiempo constante ¿Qué quieres decir con "complejidad" o "uno tiempo constante"? O sea, ¿qué quieres decir con esto? (o, entre paréntesis, uno: tiempo constante). 

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
// En una lista muy grande, por ejemplo de unos mil elementos, hacer una copia de todos no sería muy costoso.

// ¿Cómo manejas cuando son listas muy grandes y quieres quitar el último elemento? ¿Cómo se maneja eso? 
// // Esto crea una COPIA de cada nodo (O(n) total) ¿Qué quieres decir con "O(n) total"?
// O(1) - tiempo constante ¿Qué quieres decir con "O(1)"?
// que es la programación imperativa ?
// Si quiero usar programación funcional en mis programas, ¿tengo que empezar a escribir todos estos métodos o existen librerías que puedo utilizar? 

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

// Ayúdame a entender esta tabla. 
// O(1)*¿Qué quieres decir con esto?  O(1)
// O(n)** ¿Qué quieres decir con esto? O(n)**
// porque los * y **

export {};