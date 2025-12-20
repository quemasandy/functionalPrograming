/**
 * =============================================================================
 * TUTORIAL: INMUTABILIDAD EN SCALA
 * =============================================================================
 * 
 * Scala está diseñado para la inmutabilidad desde su núcleo.
 * - 'val' en lugar de 'var'
 * - 'case class' son inmutables por defecto
 * - Colecciones inmutables son el default
 * 
 * =============================================================================
 */

object ImmutabilityTutorial extends App {

  // ===========================================================================
  // PARTE 1: val vs var
  // ===========================================================================

  /**
   * 'val' = valor inmutable (preferir siempre)
   * 'var' = variable mutable (evitar)
   */
  
  val nombre: String = "Ana"    // Inmutable - no puede cambiar
  // nombre = "María"           // ❌ Error de compilación!
  
  var contador: Int = 0         // Mutable - puede cambiar
  contador = 1                  // ✅ Compila (pero evitar)


  // ===========================================================================
  // PARTE 2: case class - Objetos Inmutables
  // ===========================================================================

  /**
   * case class crea automáticamente:
   * - Constructor con todos los campos
   * - Método copy() para crear copias modificadas
   * - equals() y hashCode() basados en valores
   * - toString() legible
   */
  case class Usuario(
    nombre: String,    // Inmutable por defecto
    edad: Int,
    email: String
  )

  // Creamos un usuario
  val usuario1 = Usuario("Ana", 25, "ana@email.com")
  
  // No podemos modificarlo directamente:
  // usuario1.edad = 26  // ❌ Error de compilación!
  
  // Para "modificar", creamos una COPIA con el cambio:
  val usuario2 = usuario1.copy(edad = 26)
  
  println(s"Usuario original: $usuario1")  // Usuario(Ana,25,ana@email.com)
  println(s"Usuario copia: $usuario2")      // Usuario(Ana,26,ana@email.com)
  println(s"¿Son iguales? ${usuario1 == usuario2}")  // false (por el contenido)


  // ===========================================================================
  // PARTE 3: Objetos Anidados
  // ===========================================================================

  /**
   * Cuando tienes case classes anidados, usas copy() en cada nivel
   */
  case class Direccion(ciudad: String, calle: String)
  
  case class Persona(
    nombre: String,
    direccion: Direccion
  )

  val persona = Persona("Carlos", Direccion("Madrid", "Gran Vía 1"))
  
  // Para cambiar la ciudad, necesitamos copy() anidado:
  val personaEnBarcelona = persona.copy(
    direccion = persona.direccion.copy(ciudad = "Barcelona")
  )
  
  println(s"\nPersona original: $persona")
  println(s"Persona en Barcelona: $personaEnBarcelona")


  // ===========================================================================
  // PARTE 4: Colecciones Inmutables
  // ===========================================================================

  /**
   * En Scala, las colecciones por defecto son INMUTABLES:
   * - List, Vector, Set, Map
   * 
   * Cuando "agregas" un elemento, obtienes una NUEVA colección.
   * La original no cambia.
   */
  
  val numeros: List[Int] = List(1, 2, 3, 4, 5)
  
  // Agregar al inicio (operador ::)
  // El :: "prepend" crea una nueva lista con el elemento al inicio
  val conCero: List[Int] = 0 :: numeros
  println(s"\nOriginal: $numeros")       // List(1, 2, 3, 4, 5)
  println(s"Con 0 al inicio: $conCero")  // List(0, 1, 2, 3, 4, 5)
  
  // Agregar al final (operador :+)
  val conSeis: List[Int] = numeros :+ 6
  println(s"Con 6 al final: $conSeis")   // List(1, 2, 3, 4, 5, 6)
  
  // Concatenar listas (operador ++)
  val combinada: List[Int] = numeros ++ List(6, 7, 8)
  println(s"Combinada: $combinada")      // List(1, 2, 3, 4, 5, 6, 7, 8)
  
  // Filtrar elementos
  val pares: List[Int] = numeros.filter(_ % 2 == 0)
  println(s"Solo pares: $pares")         // List(2, 4)
  
  // Transformar elementos
  val dobles: List[Int] = numeros.map(_ * 2)
  println(s"Dobles: $dobles")            // List(2, 4, 6, 8, 10)
  
  // ¡La lista original NUNCA cambió!
  println(s"Original (sin cambios): $numeros")  // List(1, 2, 3, 4, 5)


  // ===========================================================================
  // PARTE 5: Actualizar Elementos en Colecciones
  // ===========================================================================

  /**
   * Para "actualizar" un elemento, creamos una nueva colección
   * con el elemento modificado.
   */
  
  // Actualizar elemento en posición específica
  def actualizarEnIndice[A](lista: List[A], indice: Int, nuevoValor: A): List[A] = {
    // zipWithIndex añade el índice a cada elemento: List((a,0), (b,1), ...)
    // map transforma cada elemento
    lista.zipWithIndex.map {
      case (_, i) if i == indice => nuevoValor  // Si es el índice, usamos nuevo valor
      case (valor, _) => valor                   // Si no, mantenemos el original
    }
  }
  
  val letras = List("a", "b", "c", "d")
  val letrasActualizadas = actualizarEnIndice(letras, 1, "X")
  println(s"\nLetras originales: $letras")         // List(a, b, c, d)
  println(s"Letras actualizadas: $letrasActualizadas")  // List(a, X, c, d)

  // También puedes usar updated() en Vector (más eficiente para acceso por índice)
  val vector = Vector("a", "b", "c", "d")
  val vectorActualizado = vector.updated(1, "X")
  println(s"Vector actualizado: $vectorActualizado")  // Vector(a, X, c, d)


  // ===========================================================================
  // PARTE 6: Mapas Inmutables
  // ===========================================================================

  /**
   * Los Map en Scala también son inmutables por defecto.
   */
  
  val precios: Map[String, Double] = Map(
    "manzana" -> 1.50,
    "naranja" -> 2.00,
    "plátano" -> 1.00
  )
  
  // Agregar/actualizar: crea nuevo Map
  val preciosActualizados = precios + ("pera" -> 1.75)
  println(s"\nPrecios originales: $precios")
  println(s"Precios con pera: $preciosActualizados")
  
  // Eliminar: crea nuevo Map
  val sinNaranja = preciosActualizados - "naranja"
  println(s"Sin naranja: $sinNaranja")
  
  // El Map original no cambió
  println(s"Original sin cambios: $precios")


  // ===========================================================================
  // PARTE 7: Patrón Lens (Lentes) para Actualizaciones Anidadas
  // ===========================================================================

  /**
   * Para estructuras muy anidadas, el patrón copy() se vuelve tedioso.
   * La solución son los "Lenses" - una técnica FP avanzada.
   * 
   * Bibliotecas como Monocle (https://www.optics.dev/Monocle/) proveen lenses.
   * 
   * Ejemplo conceptual (sin biblioteca):
   */
  
  case class Calle(nombre: String, numero: Int)
  case class DireccionCompleta(calle: Calle, ciudad: String, pais: String)
  case class Empleado(nombre: String, direccion: DireccionCompleta)
  case class Empresa(nombre: String, empleados: List[Empleado])

  val miEmpresa = Empresa(
    "TechCorp",
    List(
      Empleado("Ana", DireccionCompleta(Calle("Gran Vía", 10), "Madrid", "España")),
      Empleado("Bob", DireccionCompleta(Calle("Main St", 100), "NYC", "USA"))
    )
  )

  // Cambiar el número de calle del primer empleado (¡muy anidado!)
  val empresaActualizada = miEmpresa.copy(
    empleados = miEmpresa.empleados.zipWithIndex.map {
      case (emp, 0) => emp.copy(
        direccion = emp.direccion.copy(
          calle = emp.direccion.calle.copy(numero = 20)
        )
      )
      case (emp, _) => emp
    }
  )

  println(s"\n Empresa original primer empleado: ${miEmpresa.empleados.head.direccion.calle}")
  println(s"Empresa actualizada primer empleado: ${empresaActualizada.empleados.head.direccion.calle}")


  // ===========================================================================
  // PARTE 8: EJERCICIO PRÁCTICO - Carrito de Compras
  // ===========================================================================

  case class ItemCarrito(productoId: String, cantidad: Int, precio: Double)
  case class Carrito(items: List[ItemCarrito], total: Double)

  // Función para agregar item al carrito (inmutable)
  def agregarAlCarrito(carrito: Carrito, nuevoItem: ItemCarrito): Carrito = {
    // Creamos nueva lista de items con el nuevo item al final
    val nuevosItems = carrito.items :+ nuevoItem
    // Calculamos nuevo total
    val nuevoTotal = carrito.total + (nuevoItem.cantidad * nuevoItem.precio)
    // Retornamos NUEVO carrito
    Carrito(nuevosItems, nuevoTotal)
  }

  // Función para actualizar cantidad (inmutable)
  def actualizarCantidad(carrito: Carrito, productoId: String, nuevaCantidad: Int): Carrito = {
    val nuevosItems = carrito.items.map { item =>
      if (item.productoId == productoId) item.copy(cantidad = nuevaCantidad)
      else item
    }
    val nuevoTotal = nuevosItems.map(i => i.cantidad * i.precio).sum
    Carrito(nuevosItems, nuevoTotal)
  }

  // Función para eliminar item (inmutable)
  def eliminarDelCarrito(carrito: Carrito, productoId: String): Carrito = {
    val nuevosItems = carrito.items.filter(_.productoId != productoId)
    val nuevoTotal = nuevosItems.map(i => i.cantidad * i.precio).sum
    Carrito(nuevosItems, nuevoTotal)
  }

  // Demostración
  println("\n" + "=" * 70)
  println("EJERCICIO: CARRITO INMUTABLE")
  println("=" * 70)

  val carritoVacio = Carrito(List.empty, 0.0)
  println(s"Carrito vacío: $carritoVacio")

  val conItem1 = agregarAlCarrito(carritoVacio, ItemCarrito("A1", 2, 100.0))
  println(s"Con item 1: $conItem1")

  val conItem2 = agregarAlCarrito(conItem1, ItemCarrito("B2", 1, 50.0))
  println(s"Con item 2: $conItem2")

  val cantidadActualizada = actualizarCantidad(conItem2, "A1", 5)
  println(s"Cantidad actualizada: $cantidadActualizada")

  val itemEliminado = eliminarDelCarrito(cantidadActualizada, "A1")
  println(s"Item eliminado: $itemEliminado")

  // ¡Todos los carritos anteriores siguen existiendo!
  println(s"\nCarrito original sigue igual: $conItem2")

  println("\n" + "=" * 70)
  println("RESUMEN: En Scala, la inmutabilidad es el DEFAULT")
  println("- Usa 'val' en lugar de 'var'")
  println("- Usa 'case class' para objetos de datos")
  println("- Usa colecciones inmutables (List, Vector, Map, Set)")
  println("- Usa copy() para crear copias modificadas")
  println("=" * 70)
}
