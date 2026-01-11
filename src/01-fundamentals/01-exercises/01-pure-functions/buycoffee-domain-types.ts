/**
 * ============================================================================
 * ☕ LA ESENCIA DE LA PROGRAMACIÓN FUNCIONAL
 * ============================================================================
 * 
 * Este tutorial implementa los conceptos de la infografía:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  PROBLEMA: Código con Efectos Secundarios                              │
 * │  - función comprarCafe() procesa pago directamente                     │
 * │  - Difícil de probar (requiere servidor de pagos real)                 │
 * │  - No se puede reutilizar ni componer                                  │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  SOLUCIÓN: Funciones Puras                                             │
 * │  - función comprarCafe() retorna (Café, Cargo) como valores            │
 * │  - Fácil de probar y razonar                                           │
 * │  - Composición y reutilización simples                                 │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * PRINCIPIOS FUNDAMENTALES:
 * 
 * 1. FUNCIÓN PURA: Su salida depende únicamente de sus entradas
 *    y no tiene efectos secundarios observables.
 * 
 * 2. TRANSPARENCIA REFERENCIAL: f(x) = y
 *    Una expresión puede ser reemplazada por su valor sin afectar
 *    el comportamiento del programa.
 * 
 * 3. EFECTO SECUNDARIO: Cualquier interacción con el exterior:
 *    modificar variables, I/O, lanzar excepciones, etc.
 * 
 * REFERENCIA: "Functional Programming in Scala" - Capítulo 1
 * El ejemplo del café es el ejemplo canónico del libro.
 * 
 * ============================================================================
 */

// =============================================================================
// TIPOS DE DOMINIO (Inmutables)
// =============================================================================

/** Representa una taza de café */
interface Coffee {
  readonly id: string;
  readonly type: 'espresso' | 'latte' | 'cappuccino';
  readonly size: 'small' | 'medium' | 'large';
  readonly price: number;
}

/** Representa una tarjeta de crédito */
interface CreditCard {
  readonly number: string;
  readonly holder: string;
  readonly expiryMonth: number;
  readonly expiryYear: number;
}

/** Representa un cargo a una tarjeta */
interface Charge {
  readonly creditCard: CreditCard;
  readonly amount: number;
}

export { Coffee, CreditCard, Charge };
