---
trigger: always_on
---

# 📝 Plantilla y Reglas para Lecciones

> **Propósito**: Estructura obligatoria para cada lección y reglas de código/ejemplos.

---

## 📝 ESTRUCTURA DE CADA LECCIÓN

**Duración objetivo: ~15 minutos** (a menos que el tema requiera más)

### Plantilla Obligatoria

```markdown
## 🎯 [Nombre del Concepto]

### 📋 Objetivos de aprendizaje
Al terminar esta lección podrás:
- [ ] [Objetivo 1: identificar/reconocer algo]
- [ ] [Objetivo 2: implementar/aplicar algo]
- [ ] [Objetivo 3: evitar/detectar el antipatrón]

### 📚 Prerrequisitos
- [Lección XX: Concepto necesario]

---

### ¿Qué problema resuelve?
[1-2 párrafos: el pain point en desarrollo de software]

### Analogía del mundo real
[Metáfora memorable y concreta]

### 📊 Diagrama conceptual
[ASCII art que visualice el concepto]

---

## ❌ El Antipatrón
[Código malo con explicación de POR QUÉ es malo]

## ✅ El Patrón
[Código correcto con comentarios del flujo de datos]

---

## ⚠️ Errores Comunes

| Error | Por qué ocurre | Cómo evitarlo |
|-------|---------------|---------------|
| [Error 1] | [Causa] | [Solución] |

## 🔄 TypeScript vs Scala
[Tabla comparativa + explicación de diferencias]

## 🧠 Checkpoint de Comprensión
1. ¿Cuál es la diferencia clave entre [X] e [Y]?
2. ¿Por qué usamos [patrón] en vez de [antipatrón]?
3. ¿En qué situación NO usarías este patrón?

## 🧪 Reto de Refactorización
[Código para que el estudiante practique]
```

---

## 💻 REGLAS DE CÓDIGO

### TypeScript
```typescript
// ✅ SIEMPRE
"strict": true                    // En tsconfig.json
readonly                          // Por defecto en propiedades
const                             // Por defecto en variables
function pura(x: Type): Return    // Tipos explícitos siempre
type Result<T> = Success<T> | Failure  // Union types para errores

// ⛔ NUNCA
any                               // Prohibido totalmente
let                               // Solo si hay justificación explícita
as Type                           // Type assertions sin validación
// @ts-ignore                     // Jamás
```

### Scala 3
```scala
// ✅ SIEMPRE
val                               // Inmutable por defecto
case class                        // Para ADTs
enum                              // Para sum types
given/using                       // Nueva sintaxis Scala 3
extension methods                 // Para enriquecer tipos
pattern matching exhaustivo       // El compilador debe verificar

// ⛔ NUNCA
var                               // Solo si hay justificación explícita
null                              // Usar Option
return                            // Implícito siempre
throw                             // Usar Either/Try
```

---

## 📊 CONTRASTE OBLIGATORIO

**SIEMPRE** mostrar ambas versiones para cada concepto:

| Sección | Qué Mostrar | Propósito |
|---------|-------------|-----------|
| 🔴 Antipatrón | Código imperativo/malo | Entender el problema |
| 🟢 Patrón | Código funcional/bueno | Entender la solución |
| 👶 Junior vs 👨‍💼 Senior | Ambos estilos | Mostrar madurez del código |

### Formato de Contraste
```typescript
// ❌ ANTIPATRÓN: [Nombre del problema]
// 🐛 Bug potencial: [Qué puede fallar]
// 💸 En fintech: [Consecuencia real]
[código malo]

// ✅ PATRÓN: [Nombre de la solución]  
// 🛡️ Garantiza: [Qué propiedad asegura]
// 🏦 Usado en: [Empresa real]
[código bueno]
```

---

## ✏️ REGLAS DE COMENTARIOS

- ❌ NO comentar lo obvio (`const x = 1; // asigna 1 a x`)
- ✅ SÍ comentar el POR QUÉ (`readonly` fuerza inmutabilidad)
- ✅ SÍ explicar flujo de datos en pipes/chains

---

## 🌍 DOMINIOS Y EJEMPLOS VARIADOS

### Estructura de ejemplos por concepto (3 ejemplos)
1. 📦 **Genérico/abstracto** → Listas, strings, números
2. 🌍 **Otra industria** → Gaming, E-commerce, Healthcare, IoT, Social Media, AI/ML, Educación
3. 🏦 **Financiero/crítico** → Pagos, transacciones, auditoría

### Cuándo fintech es obligatorio
| Concepto | Por qué |
|----------|---------|
| Idempotencia | Evitar cobros duplicados |
| Precisión decimal | `0.1 + 0.2 !== 0.3` es fatal |
| Inmutabilidad | Ledgers append-only |
| Concurrencia | Race conditions en balances |

### Regla de oro para dinero
```typescript
// ⛔ NUNCA usar floats para dinero
const price: number = 19.99;           // Floats pierden precisión

// ✅ SIEMPRE usar enteros en la menor unidad
const priceInCents: number = 1999;     // Aritmética exacta
```

---

## 🔬 ANÁLISIS AVANZADO (solo cuando aplique)

### ⚖️ Trade-off Analysis
| Enfoque | Pros | Contras | Cuándo usar |
|---------|------|---------|-------------|
| A       | ...  | ...     | ...         |
| B       | ...  | ...     | ...         |

### 🏛️ Architecture Review
| Dimensión | Qué evaluar |
|-----------|-------------|
| **Escalabilidad** | ¿Cómo se comporta con 10x, 100x carga? |
| **Mantenibilidad** | ¿Es fácil de modificar y depurar? |
| **Disponibilidad** | ¿Tiene single points of failure? |
| **Consistencia** | ¿Garantiza integridad de datos? |

### 📊 Complejidad Computacional
| Operación | Tiempo | Espacio | Notas |
|-----------|--------|---------|-------|
| insert    | O(1)   | O(1)    | Amortizado |
| lookup    | O(n)   | O(1)    | Peor caso |

> 💡 Incluir análisis avanzado solo cuando el concepto involucre decisiones de diseño significativas.

---

*Ver también: `AGENT_RULES.md` para el rol del agente y referencia del libro.*
