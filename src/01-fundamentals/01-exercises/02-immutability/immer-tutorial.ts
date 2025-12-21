/**
 * =============================================================================
 * TUTORIAL COMPLETO: IMMER.JS - INMUTABILIDAD SIN DOLOR
 * =============================================================================
 *
 * Immer es una biblioteca creada por Michel Weststrate (creador de MobX)
 * que te permite escribir código que PARECE mutable pero produce
 * resultados INMUTABLES.
 *
 * =============================================================================
 * CONCEPTO CENTRAL: "COPY-ON-WRITE"
 * =============================================================================
 *
 * Immer usa un patrón llamado "Copy-on-Write" (Copia al Escribir):
 *
 *   1. Crea un "borrador" (draft) temporal del objeto original
 *   2. Te permite "mutar" ese borrador libremente
 *   3. Cuando terminas, Immer produce un NUEVO objeto inmutable
 *   4. El original NUNCA se modifica
 *
 * Es como editar una foto: haces cambios en una copia, no en el original.
 *
 * =============================================================================
 * ANALOGÍA: EL ARQUITECTO Y LOS PLANOS
 * =============================================================================
 *
 * Imagina que eres un arquitecto y tienes los planos finales de un edificio
 * (el estado original). Un cliente pide cambios.
 *
 * ❌ MAL (Mutación): Tachar directamente los planos originales
 *    - Pierdes el historial
 *    - No puedes deshacer
 *    - Otros pueden estar usando esos planos
 *
 * ✅ CON IMMER:
 *    1. Immer te da una copia transparente para dibujar encima
 *    2. Haces los cambios en esa copia
 *    3. Immer produce un nuevo juego de planos con los cambios
 *    4. Los planos originales quedan intactos
 *
 * =============================================================================
 * REFERENCIA: "Functional Programming in Scala"
 * =============================================================================
 *
 * Este patrón se relaciona con el concepto de "Persistent Data Structures"
 * del libro. Immer implementa "structural sharing" internamente: solo copia
 * las partes que cambiaron, reutilizando las partes que no cambiaron.
 *
 * =============================================================================
 */

import {
  produce,
  Draft,
  Immutable,
  enableMapSet,
  current,
  original,
  freeze,
  castDraft,
} from 'immer';

// =============================================================================
// PARTE 1: CONCEPTOS BÁSICOS - LA FUNCIÓN produce()
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 1.1 Sintaxis básica de produce()
 * -----------------------------------------------------------------------------
 *
 * produce(estadoOriginal, receta) => nuevoEstado
 *
 * - estadoOriginal: El objeto que quieres "modificar" (no se modifica realmente)
 * - receta: Una función que recibe un "draft" y lo muta
 * - nuevoEstado: Un nuevo objeto inmutable con los cambios aplicados
 */

function ejemploBasico(): void {
  console.log('\n=== 1.1 EJEMPLO BÁSICO ===');

  // Estado original (inmutable)
  const usuario = {
    nombre: 'Ana',
    edad: 25,
    direccion: {
      ciudad: 'Madrid',
      calle: 'Gran Vía 1',
    },
  };

  // Usamos produce() para crear una versión modificada
  const usuarioActualizado = produce(usuario, draft => {
    // Dentro de la receta, puedes "mutar" el draft libremente
    // ¡Esto parece mutación pero NO LO ES!
    draft.nombre = 'María';
    draft.edad = 26;
    draft.direccion.ciudad = 'Barcelona';
  });

  // El original NUNCA cambió
  console.log('Original:', usuario);
  // { nombre: "Ana", edad: 25, direccion: { ciudad: "Madrid", ... } }

  // Tenemos un nuevo objeto con los cambios
  console.log('Actualizado:', usuarioActualizado);
  // { nombre: "María", edad: 26, direccion: { ciudad: "Barcelona", ... } }

  // Son objetos diferentes
  console.log('¿Son el mismo objeto?', usuario === usuarioActualizado); // false

  // ¡PERO! La calle no cambió, así que Immer la reutiliza (structural sharing)
  console.log('¿Misma calle?', usuario.direccion.calle === usuarioActualizado.direccion.calle); // true
}

/**
 * -----------------------------------------------------------------------------
 * 1.2 Por qué Immer es más fácil que spread operator
 * -----------------------------------------------------------------------------
 *
 * Para objetos profundamente anidados, el spread se vuelve tedioso.
 * Immer resuelve este problema elegantemente.
 */

// Tipo para demostración
type Empresa = {
  nombre: string;
  departamentos: {
    nombre: string;
    empleados: {
      id: number;
      nombre: string;
      salario: number;
    }[];
  }[];
};

function comparacionConSpread(): void {
  console.log('\n=== 1.2 COMPARACIÓN CON SPREAD ===');

  const empresa: Empresa = {
    nombre: 'TechCorp',
    departamentos: [
      {
        nombre: 'Ingeniería',
        empleados: [
          { id: 1, nombre: 'Ana', salario: 50000 },
          { id: 2, nombre: 'Bob', salario: 60000 },
        ],
      },
      {
        nombre: 'Marketing',
        empleados: [{ id: 3, nombre: 'Carol', salario: 45000 }],
      },
    ],
  };

  // ❌ CON SPREAD: Aumentar salario de Ana (empleado 0 del departamento 0)
  // ¡Mira lo complicado que es!
  const conSpread = {
    ...empresa,
    departamentos: empresa.departamentos.map((dept, dIdx) =>
      dIdx !== 0
        ? dept
        : {
            ...dept,
            empleados: dept.empleados.map((emp, eIdx) =>
              eIdx !== 0
                ? emp
                : {
                    ...emp,
                    salario: emp.salario + 5000,
                  }
            ),
          }
    ),
  };

  // ✅ CON IMMER: ¡Mucho más simple!
  const conImmer = produce(empresa, draft => {
    // Acceso directo y natural
    draft.departamentos[0].empleados[0].salario += 5000;
  });

  console.log('Original:', empresa.departamentos[0].empleados[0].salario); // 50000
  console.log('Con Spread:', conSpread.departamentos[0].empleados[0].salario); // 55000
  console.log('Con Immer:', conImmer.departamentos[0].empleados[0].salario); // 55000
}

/**
 * -----------------------------------------------------------------------------
 * 1.3 Retornar un valor completamente nuevo
 * -----------------------------------------------------------------------------
 *
 * Si retornas algo de la receta, Immer usa ESO como el nuevo estado
 * en lugar del draft mutado.
 */

function retornarNuevoValor(): void {
  console.log('\n=== 1.3 RETORNAR NUEVO VALOR ===');

  const numeros = [1, 2, 3];

  // Opción 1: Mutar el draft
  const modificado = produce(numeros, draft => {
    draft.push(4);
  });
  console.log('Mutando draft:', modificado); // [1, 2, 3, 4]

  // Opción 2: Retornar un nuevo valor (reemplaza todo)
  const reemplazado = produce(numeros, draft => {
    return [10, 20, 30]; // Ignora el draft, usa este valor
  });
  console.log('Retornando nuevo:', reemplazado); // [10, 20, 30]

  // ⚠️ IMPORTANTE: No puedes hacer AMBAS cosas
  // Esto daría error: mutar Y retornar
  // const error = produce(numeros, draft => {
  //     draft.push(4);
  //     return [10, 20, 30];  // ❌ Error!
  // });
}

// =============================================================================
// PARTE 2: CURRIED PRODUCERS - FUNCIONES REUTILIZABLES
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 2.1 Productores "curried" (funciones parciales)
 * -----------------------------------------------------------------------------
 *
 * Cuando llamas produce() con SOLO una función (sin estado inicial),
 * Immer retorna una función reutilizable.
 *
 * Esto es MUY útil para:
 *   - Reducers de Redux
 *   - Transformaciones reutilizables
 *   - Composición de funciones
 */

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
};

type Inventario = {
  productos: Producto[];
  ultimaActualizacion: Date;
};

// Productor curried: recibe el draft, retorna una función
const agregarProducto = produce((draft: Draft<Inventario>, producto: Producto) => {
  draft.productos.push(producto);
  draft.ultimaActualizacion = new Date();
});

const actualizarStock = produce(
  (draft: Draft<Inventario>, productoId: string, cantidad: number) => {
    const producto = draft.productos.find(p => p.id === productoId);
    if (producto) {
      producto.stock += cantidad;
      draft.ultimaActualizacion = new Date();
    }
  }
);

const eliminarProducto = produce((draft: Draft<Inventario>, productoId: string) => {
  const index = draft.productos.findIndex(p => p.id === productoId);
  if (index !== -1) {
    draft.productos.splice(index, 1);
    draft.ultimaActualizacion = new Date();
  }
});

function ejemploCurriedProducers(): void {
  console.log('\n=== 2.1 CURRIED PRODUCERS ===');

  const inventarioInicial: Inventario = {
    productos: [],
    ultimaActualizacion: new Date(),
  };

  // Usando los productores curried
  const paso1 = agregarProducto(inventarioInicial, {
    id: 'A1',
    nombre: 'Laptop',
    precio: 999,
    stock: 10,
  });

  const paso2 = agregarProducto(paso1, {
    id: 'B2',
    nombre: 'Mouse',
    precio: 29,
    stock: 50,
  });

  const paso3 = actualizarStock(paso2, 'A1', 5); // +5 laptops

  const paso4 = eliminarProducto(paso3, 'B2'); // Eliminar mouse

  console.log('Inventario inicial:', inventarioInicial.productos.length); // 0
  console.log('Después de paso1:', paso1.productos.length); // 1
  console.log('Después de paso2:', paso2.productos.length); // 2
  console.log('Stock laptops en paso3:', paso3.productos[0].stock); // 15
  console.log('Después de paso4:', paso4.productos.length); // 1 (solo laptop)
}

// =============================================================================
// PARTE 3: TRABAJANDO CON ARRAYS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 3.1 Operaciones de array dentro del draft
 * -----------------------------------------------------------------------------
 *
 * Dentro del draft, PUEDES usar los métodos mutantes de array
 * (push, pop, splice, etc.) ¡porque estás mutando una copia!
 */

type Tarea = {
  id: number;
  titulo: string;
  completada: boolean;
  prioridad: 'baja' | 'media' | 'alta';
};

type ListaTareas = {
  tareas: Tarea[];
  filtro: 'todas' | 'activas' | 'completadas';
};

function operacionesConArrays(): void {
  console.log('\n=== 3.1 OPERACIONES CON ARRAYS ===');

  const estado: ListaTareas = {
    tareas: [
      { id: 1, titulo: 'Aprender Immer', completada: true, prioridad: 'alta' },
      { id: 2, titulo: 'Escribir tests', completada: false, prioridad: 'media' },
      { id: 3, titulo: 'Refactorizar código', completada: false, prioridad: 'baja' },
    ],
    filtro: 'todas',
  };

  // ✅ Agregar tarea con push
  const conNueva = produce(estado, draft => {
    draft.tareas.push({
      id: 4,
      titulo: 'Revisar PR',
      completada: false,
      prioridad: 'alta',
    });
  });
  console.log('Tareas después de push:', conNueva.tareas.length); // 4

  // ✅ Eliminar tarea con splice
  const sinTarea = produce(estado, draft => {
    const index = draft.tareas.findIndex(t => t.id === 2);
    if (index !== -1) {
      draft.tareas.splice(index, 1);
    }
  });
  console.log('Tareas después de splice:', sinTarea.tareas.length); // 2

  // ✅ Marcar tarea como completada
  const conCompletada = produce(estado, draft => {
    const tarea = draft.tareas.find(t => t.id === 2);
    if (tarea) {
      tarea.completada = true;
    }
  });
  console.log('Tarea 2 completada:', conCompletada.tareas[1].completada); // true

  // ✅ Ordenar tareas por prioridad (in-place en el draft)
  const ordenadas = produce(estado, draft => {
    const prioridadValor = { alta: 3, media: 2, baja: 1 };
    draft.tareas.sort((a, b) => prioridadValor[b.prioridad] - prioridadValor[a.prioridad]);
  });
  console.log('Primera tarea ordenada:', ordenadas.tareas[0].titulo); // "Aprender Immer"

  // ✅ Completar todas las tareas
  const todasCompletadas = produce(estado, draft => {
    draft.tareas.forEach(tarea => {
      tarea.completada = true;
    });
  });
  console.log(
    'Todas completadas:',
    todasCompletadas.tareas.every(t => t.completada)
  ); // true
}

// =============================================================================
// PARTE 4: Map Y Set - HABILITANDO SOPORTE
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 4.1 Usando Map y Set con Immer
 * -----------------------------------------------------------------------------
 *
 * Por defecto, Immer no soporta Map y Set.
 * Debes habilitar el soporte explícitamente.
 */

// Habilitar soporte para Map y Set
enableMapSet();

type Cache = Map<string, { valor: unknown; expira: Date }>;

function operacionesConMapSet(): void {
  console.log('\n=== 4.1 OPERACIONES CON MAP Y SET ===');

  // Ejemplo con Map
  const cache: Cache = new Map([['user:1', { valor: { nombre: 'Ana' }, expira: new Date() }]]);

  const cacheActualizado = produce(cache, draft => {
    draft.set('user:2', { valor: { nombre: 'Bob' }, expira: new Date() });
    draft.delete('user:1');
  });

  console.log('Cache original tiene user:1:', cache.has('user:1')); // true
  console.log('Cache nuevo tiene user:2:', cacheActualizado.has('user:2')); // true
  console.log('Cache nuevo tiene user:1:', cacheActualizado.has('user:1')); // false

  // Ejemplo con Set
  const etiquetas = new Set(['javascript', 'typescript']);

  const etiquetasActualizadas = produce(etiquetas, draft => {
    draft.add('immer');
    draft.add('funcional');
    draft.delete('javascript');
  });

  console.log('Original:', Array.from(etiquetas)); // ["javascript", "typescript"]
  console.log('Actualizado:', Array.from(etiquetasActualizadas)); // ["typescript", "immer", "funcional"]
}

// =============================================================================
// PARTE 5: FUNCIONES AVANZADAS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 5.1 current() - Obtener snapshot del estado actual del draft
 * -----------------------------------------------------------------------------
 *
 * Útil para debugging: obtiene el estado ACTUAL del draft (no el original).
 */

function ejemploCurrent(): void {
  console.log('\n=== 5.1 CURRENT() ===');

  const estado = { contador: 0, historial: [0] };

  const resultado = produce(estado, draft => {
    draft.contador = 5;
    draft.historial.push(5);

    // current() te da el estado actual del draft como objeto normal
    const snapshot = current(draft);
    console.log('Snapshot intermedio:', snapshot); // { contador: 5, historial: [0, 5] }

    draft.contador = 10;
    draft.historial.push(10);
  });

  console.log('Resultado final:', resultado); // { contador: 10, historial: [0, 5, 10] }
}

/**
 * -----------------------------------------------------------------------------
 * 5.2 original() - Obtener el estado original
 * -----------------------------------------------------------------------------
 *
 * Accede al estado ORIGINAL desde dentro de la receta.
 */

function ejemploOriginal(): void {
  console.log('\n=== 5.2 ORIGINAL() ===');

  const estado = { valor: 100, incrementos: 0 };

  const resultado = produce(estado, draft => {
    // original() te da el estado ANTES de cualquier modificación
    const estadoOriginal = original(draft);

    draft.valor = 200;
    draft.incrementos = draft.valor - (estadoOriginal?.valor ?? 0);

    console.log('Valor original:', estadoOriginal?.valor); // 100
    console.log('Valor actual en draft:', draft.valor); // 200
  });

  console.log('Resultado:', resultado); // { valor: 200, incrementos: 100 }
}

/**
 * -----------------------------------------------------------------------------
 * 5.3 freeze() - Congelar objetos profundamente
 * -----------------------------------------------------------------------------
 *
 * freeze() congela un objeto recursivamente, previniendo mutaciones.
 * Immer lo hace automáticamente en producción, pero puedes hacerlo manual.
 */

function ejemploFreeze(): void {
  console.log('\n=== 5.3 FREEZE() ===');

  const objeto = {
    nombre: 'Test',
    anidado: {
      valor: 42,
    },
  };

  // Congelar profundamente
  const congelado = freeze(objeto, true); // true = deep freeze

  // Intentar mutar lanzaría error en strict mode
  try {
    // @ts-ignore - Esto es para demostración
    congelado.nombre = 'Otro';
  } catch (e) {
    console.log('Error al mutar objeto congelado (esperado)');
  }

  console.log('Objeto sigue siendo:', congelado.nombre); // "Test"
}

// =============================================================================
// PARTE 6: PATRONES COMUNES Y MEJORES PRÁCTICAS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 6.1 Patrón: Reducer con Immer (estilo Redux)
 * -----------------------------------------------------------------------------
 */

type ContadorEstado = {
  valor: number;
  historial: number[];
  ultimaAccion: string | null;
};

type ContadorAccion =
  | { type: 'incrementar'; cantidad: number }
  | { type: 'decrementar'; cantidad: number }
  | { type: 'reset' }
  | { type: 'multiplicar'; factor: number };

// Reducer usando Immer
const contadorReducer = produce((draft: Draft<ContadorEstado>, accion: ContadorAccion) => {
  switch (accion.type) {
    case 'incrementar':
      draft.valor += accion.cantidad;
      draft.historial.push(draft.valor);
      draft.ultimaAccion = `+${accion.cantidad}`;
      break;

    case 'decrementar':
      draft.valor -= accion.cantidad;
      draft.historial.push(draft.valor);
      draft.ultimaAccion = `-${accion.cantidad}`;
      break;

    case 'reset':
      draft.valor = 0;
      draft.historial = [0];
      draft.ultimaAccion = 'reset';
      break;

    case 'multiplicar':
      draft.valor *= accion.factor;
      draft.historial.push(draft.valor);
      draft.ultimaAccion = `x${accion.factor}`;
      break;
  }
});

function ejemploReducer(): void {
  console.log('\n=== 6.1 REDUCER CON IMMER ===');

  const estadoInicial: ContadorEstado = {
    valor: 0,
    historial: [0],
    ultimaAccion: null,
  };

  let estado = estadoInicial;

  estado = contadorReducer(estado, { type: 'incrementar', cantidad: 5 });
  console.log('Después de +5:', estado.valor); // 5

  estado = contadorReducer(estado, { type: 'multiplicar', factor: 3 });
  console.log('Después de x3:', estado.valor); // 15

  estado = contadorReducer(estado, { type: 'decrementar', cantidad: 10 });
  console.log('Después de -10:', estado.valor); // 5

  console.log('Historial:', estado.historial); // [0, 5, 15, 5]
}

/**
 * -----------------------------------------------------------------------------
 * 6.2 Patrón: Actualizaciones condicionales
 * -----------------------------------------------------------------------------
 */

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  perfil: {
    bio: string;
    avatar: string | null;
    configuracion: {
      tema: 'claro' | 'oscuro';
      notificaciones: boolean;
    };
  };
};

function actualizacionesCondicionales(): void {
  console.log('\n=== 6.2 ACTUALIZACIONES CONDICIONALES ===');

  const usuario: Usuario = {
    id: 1,
    nombre: 'Ana',
    email: 'ana@example.com',
    perfil: {
      bio: 'Desarrolladora',
      avatar: null,
      configuracion: {
        tema: 'claro',
        notificaciones: true,
      },
    },
  };

  // Actualización condicional: solo cambia si hay valor
  const actualizarPerfil = (
    usuario: Usuario,
    cambios: Partial<{
      bio: string;
      avatar: string;
      tema: 'claro' | 'oscuro';
    }>
  ) =>
    produce(usuario, draft => {
      if (cambios.bio !== undefined) {
        draft.perfil.bio = cambios.bio;
      }
      if (cambios.avatar !== undefined) {
        draft.perfil.avatar = cambios.avatar;
      }
      if (cambios.tema !== undefined) {
        draft.perfil.configuracion.tema = cambios.tema;
      }
    });

  const actualizado = actualizarPerfil(usuario, {
    bio: 'Ingeniera de Software',
    tema: 'oscuro',
    // avatar no se proporciona, no cambia
  });

  console.log('Bio original:', usuario.perfil.bio); // "Desarrolladora"
  console.log('Bio nuevo:', actualizado.perfil.bio); // "Ingeniera de Software"
  console.log('Avatar (sin cambio):', actualizado.perfil.avatar); // null
  console.log('Tema nuevo:', actualizado.perfil.configuracion.tema); // "oscuro"
}

/**
 * -----------------------------------------------------------------------------
 * 6.3 Patrón: Normalización de datos
 * -----------------------------------------------------------------------------
 */

type EntidadNormalizada<T> = {
  byId: Record<string, T>;
  allIds: string[];
};

type ArticuloNormalizado = EntidadNormalizada<{
  id: string;
  titulo: string;
  contenido: string;
  autorId: string;
}>;

function normalizacionDeDatos(): void {
  console.log('\n=== 6.3 NORMALIZACIÓN DE DATOS ===');

  const articulos: ArticuloNormalizado = {
    byId: {
      '1': { id: '1', titulo: 'Intro a Immer', contenido: '...', autorId: 'a1' },
      '2': { id: '2', titulo: 'FP en TypeScript', contenido: '...', autorId: 'a2' },
    },
    allIds: ['1', '2'],
  };

  // Agregar nuevo artículo
  const conNuevo = produce(articulos, draft => {
    const nuevoId = '3';
    draft.byId[nuevoId] = {
      id: nuevoId,
      titulo: 'Patrones Redux',
      contenido: '...',
      autorId: 'a1',
    };
    draft.allIds.push(nuevoId);
  });

  // Actualizar artículo existente
  const conActualizado = produce(articulos, draft => {
    if (draft.byId['1']) {
      draft.byId['1'].titulo = 'Introducción Completa a Immer';
    }
  });

  // Eliminar artículo
  const sinArticulo = produce(articulos, draft => {
    const idAEliminar = '1';
    delete draft.byId[idAEliminar];
    const index = draft.allIds.indexOf(idAEliminar);
    if (index !== -1) {
      draft.allIds.splice(index, 1);
    }
  });

  console.log('Original allIds:', articulos.allIds); // ["1", "2"]
  console.log('Con nuevo allIds:', conNuevo.allIds); // ["1", "2", "3"]
  console.log('Sin artículo 1:', sinArticulo.allIds); // ["2"]
}

// =============================================================================
// PARTE 7: INTEGRACIÓN CON REACT (CONCEPTUAL)
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 7.1 useState con Immer (patrón useImmer)
 * -----------------------------------------------------------------------------
 *
 * En React, combinar useState con Immer simplifica mucho el manejo de estado.
 *
 * NOTA: Este es un ejemplo conceptual. En un proyecto React real,
 * usarías la biblioteca "use-immer".
 *
 * ```tsx
 * import { useImmer } from 'use-immer';
 *
 * function Componente() {
 *     const [estado, actualizarEstado] = useImmer({
 *         usuarios: [],
 *         cargando: false
 *     });
 *
 *     const agregarUsuario = (usuario) => {
 *         actualizarEstado(draft => {
 *             draft.usuarios.push(usuario);
 *         });
 *     };
 *
 *     return ...;
 * }
 * ```
 */

// Simulación de cómo funcionaría useImmer
function simulacionUseImmer<T>(
  estadoInicial: T
): [T, (actualizador: (draft: Draft<T>) => void) => void] {
  let estado = estadoInicial;

  const actualizar = (actualizador: (draft: Draft<T>) => void) => {
    estado = produce(estado, actualizador);
  };

  return [estado, actualizar];
}

function ejemploReactConceptual(): void {
  console.log('\n=== 7.1 PATRÓN REACT (CONCEPTUAL) ===');

  // Esto simula cómo funcionaría en React
  let [estado, actualizar] = simulacionUseImmer({
    items: [] as string[],
    seleccionado: null as string | null,
  });

  console.log('Estado inicial:', estado);

  // Simular acción del usuario
  actualizar(draft => {
    draft.items.push('Item 1');
    draft.items.push('Item 2');
  });

  // En React, esto causaría un re-render con el nuevo estado
  console.log('Después de agregar items:', estado);
}

// =============================================================================
// PARTE 8: ERRORES COMUNES Y CÓMO EVITARLOS
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 8.1 Error: Mutar Y retornar
 * -----------------------------------------------------------------------------
 */

function errorMutarYRetornar(): void {
  console.log('\n=== 8.1 ERROR: MUTAR Y RETORNAR ===');

  const estado = { valor: 1 };

  // ❌ ESTO CAUSA ERROR:
  // const resultado = produce(estado, draft => {
  //     draft.valor = 2;         // Mutación
  //     return { valor: 3 };     // Y también retorno → ERROR!
  // });

  // ✅ Hacer UNA u OTRA cosa:
  // Opción 1: Solo mutar
  const conMutacion = produce(estado, draft => {
    draft.valor = 2;
  });

  // Opción 2: Solo retornar (reemplazo completo)
  const conRetorno = produce(estado, () => {
    return { valor: 3 };
  });

  console.log('Con mutación:', conMutacion); // { valor: 2 }
  console.log('Con retorno:', conRetorno); // { valor: 3 }
}

/**
 * -----------------------------------------------------------------------------
 * 8.2 Error: Asignar el draft a una variable externa
 * -----------------------------------------------------------------------------
 */

function errorAsignarDraft(): void {
  console.log('\n=== 8.2 ERROR: ASIGNAR DRAFT EXTERNAMENTE ===');

  const estado = { valor: 1 };
  let draftExterno: any;

  // ❌ NO hacer esto:
  // const resultado = produce(estado, draft => {
  //     draftExterno = draft;  // ¡El draft no es válido fuera de produce!
  // });
  // draftExterno.valor = 2;  // ¡ERROR! El draft ya no existe

  // ✅ Hacer todas las mutaciones DENTRO de produce
  const resultado = produce(estado, draft => {
    draft.valor = 2;
    // Cualquier cambio debe hacerse aquí dentro
  });

  console.log('Resultado correcto:', resultado);
}

/**
 * -----------------------------------------------------------------------------
 * 8.3 Error: Usar funciones asíncronas directamente
 * -----------------------------------------------------------------------------
 */

async function errorAsync(): Promise<void> {
  console.log('\n=== 8.3 ERROR: FUNCIONES ASÍNCRONAS ===');

  const estado = { datos: null as string | null, cargando: false };

  // ❌ NO hacer esto:
  // const resultado = produce(estado, async draft => {
  //     draft.cargando = true;
  //     const datos = await fetchDatos();  // ¡El draft puede no ser válido aquí!
  //     draft.datos = datos;
  //     draft.cargando = false;
  // });

  // ✅ Separar la lógica asíncrona de Immer
  async function cargarDatos(estadoActual: typeof estado) {
    // Paso 1: Marcar como cargando
    const cargando = produce(estadoActual, draft => {
      draft.cargando = true;
    });

    // Paso 2: Hacer la operación async
    const datos = await Promise.resolve('Datos cargados'); // Simula fetch

    // Paso 3: Actualizar con los datos
    const conDatos = produce(cargando, draft => {
      draft.datos = datos;
      draft.cargando = false;
    });

    return conDatos;
  }

  const resultado = await cargarDatos(estado);
  console.log('Resultado async correcto:', resultado);
}

// =============================================================================
// PARTE 9: RENDIMIENTO Y STRUCTURAL SHARING
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 9.1 Structural Sharing explicado
 * -----------------------------------------------------------------------------
 *
 * Immer no copia TODO el objeto. Solo copia las partes que cambian.
 * Las partes que no cambian se REUTILIZAN (mismo puntero en memoria).
 */

function structuralSharing(): void {
  console.log('\n=== 9.1 STRUCTURAL SHARING ===');

  const estado = {
    usuario: {
      nombre: 'Ana',
      preferencias: {
        tema: 'oscuro',
        idioma: 'es',
      },
    },
    posts: [
      { id: 1, titulo: 'Post 1' },
      { id: 2, titulo: 'Post 2' },
    ],
    metadatos: {
      version: '1.0',
    },
  };

  // Solo cambiamos el tema
  const nuevoEstado = produce(estado, draft => {
    draft.usuario.preferencias.tema = 'claro';
  });

  // Verificar qué se reutiliza y qué es nuevo
  console.log('¿Mismo estado?', estado === nuevoEstado); // false
  console.log('¿Mismo usuario?', estado.usuario === nuevoEstado.usuario); // false (cambiamos algo dentro)
  console.log(
    '¿Mismas preferencias?',
    estado.usuario.preferencias === nuevoEstado.usuario.preferencias
  ); // false (cambiamos tema)
  console.log('¿Mismos posts?', estado.posts === nuevoEstado.posts); // true ✅ (no cambiamos)
  console.log('¿Mismos metadatos?', estado.metadatos === nuevoEstado.metadatos); // true ✅ (no cambiamos)
  console.log('¿Mismo post[0]?', estado.posts[0] === nuevoEstado.posts[0]); // true ✅ (no cambiamos)
}

/**
 * -----------------------------------------------------------------------------
 * 9.2 Cuándo NO usar Immer
 * -----------------------------------------------------------------------------
 *
 * Immer tiene overhead. Para operaciones muy simples, spread es suficiente.
 *
 * ✅ Usar Immer cuando:
 *    - Objetos profundamente anidados
 *    - Múltiples cambios en una operación
 *    - Reducers complejos
 *    - Equipos que vienen de OOP/mutación
 *
 * ❌ Considerar alternativas cuando:
 *    - Objetos planos y simples
 *    - Un solo cambio superficial
 *    - Rendimiento crítico en hot paths
 */

// =============================================================================
// PARTE 10: TIPOS DE TYPESCRIPT CON IMMER
// =============================================================================

/**
 * -----------------------------------------------------------------------------
 * 10.1 Tipos útiles de Immer
 * -----------------------------------------------------------------------------
 */

// Draft<T>: Versión mutable de T (para usar dentro de recetas)
type MiEstado = Readonly<{
  nombre: string;
  items: readonly string[];
}>;

// Dentro de la receta, el tipo es Draft<MiEstado> que es mutable
const procesarEstado = produce((draft: Draft<MiEstado>) => {
  draft.nombre = 'Nuevo nombre'; // OK, draft es mutable
  draft.items.push('nuevo'); // OK, items es mutable en el draft
});

// Immutable<T>: Hacer un tipo profundamente inmutable
type EstadoMutable = {
  nombre: string;
  datos: {
    valores: number[];
  };
};

type EstadoInmutable = Immutable<EstadoMutable>;
// Resultado:
// {
//     readonly nombre: string;
//     readonly datos: {
//         readonly valores: readonly number[];
//     };
// }

function tiposTypeScript(): void {
  console.log('\n=== 10.1 TIPOS TYPESCRIPT ===');

  const estadoInicial: MiEstado = {
    nombre: 'original',
    items: ['item1'],
  };

  const nuevoEstado = procesarEstado(estadoInicial);
  console.log('Estado actualizado:', nuevoEstado);
}

// =============================================================================
// DEMOSTRACIÓN COMPLETA
// =============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('TUTORIAL COMPLETO: IMMER.JS');
  console.log('='.repeat(70));

  // Parte 1: Conceptos básicos
  ejemploBasico();
  comparacionConSpread();
  retornarNuevoValor();

  // Parte 2: Curried producers
  ejemploCurriedProducers();

  // Parte 3: Arrays
  operacionesConArrays();

  // Parte 4: Map y Set
  operacionesConMapSet();

  // Parte 5: Funciones avanzadas
  ejemploCurrent();
  ejemploOriginal();
  ejemploFreeze();

  // Parte 6: Patrones comunes
  ejemploReducer();
  actualizacionesCondicionales();
  normalizacionDeDatos();

  // Parte 7: React (conceptual)
  ejemploReactConceptual();

  // Parte 8: Errores comunes
  errorMutarYRetornar();
  errorAsignarDraft();
  await errorAsync();

  // Parte 9: Rendimiento
  structuralSharing();

  // Parte 10: TypeScript
  tiposTypeScript();

  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN IMMER:');
  console.log('- produce(estado, receta) → nuevoEstado inmutable');
  console.log("- Dentro de receta, puedes 'mutar' el draft libremente");
  console.log('- El estado original NUNCA cambia');
  console.log('- Usa structural sharing para eficiencia');
  console.log('- Ideal para reducers, estado anidado, equipos OOP');
  console.log('='.repeat(70));
}

main().catch(console.error);

export {};
