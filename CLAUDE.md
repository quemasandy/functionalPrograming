# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a functional programming learning repository with exercises and examples in both TypeScript and Scala. The curriculum covers ~20 hours of content following the Pareto principle (80% of essential FP concepts).

## Common Commands

### TypeScript

```bash
# Run a TypeScript file
npx ts-node src/path/to/file.ts

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

### Scala (fpinscala-second-edition)

```bash
# From src/fpinscala-second-edition/
scala-cli compile .
scala-cli console .
scala-cli run .
scala-cli run . --main-class fpinscala.answers.gettingstarted.printAbs

# Run tests
scala-cli test .
scala-cli test . -- 'fpinscala.exercises.gettingstarted.*'
scala-cli test . -- 'fpinscala.exercises.gettingstarted.GettingStartedSuite.MyProgram.factorial'
```

## Learning Path Structure

The main curriculum in `src/01-fundamentals/01-exercises/` is organized in 5 progressive levels:

| Level | Lessons | Topics |
|-------|---------|--------|
| 1. Fundamentals | 01-04 | Pure functions, immutability, higher-order functions, composition |
| 2. Error Handling | 05-07 | Option/Either, recursion/folds, functors |
| 3. Abstractions | 08-11 | Monads, applicative, traverse/sequence, state monad |
| 4. Advanced | 12-14 | Lazy evaluation, stack safety (trampolining), parser combinators |
| 5. Practical | 15-19 | Property-based testing, functional architecture, monoids, parallelism |

Special topics: `02-race-conditions/` covers concurrency (mutex, semaphores, deadlocks, CAP theorem, circuit breakers).

## Repository Structure

```
src/
├── 01-fundamentals/01-exercises/  # Main learning path (27 folders)
├── 02-billing-patterns/           # Money VO, idempotency, DDD, ACID, double-entry
├── 03-clean-architecture-fp/      # Domain(pure) → Application → Infrastructure(impure)
├── 04-functional-sandwich/        # Pure core + impure shell pattern
├── 05-pure-functions-essence/     # "Buy Coffee" example from FP in Scala
├── 06-referential-transparency/   # Substitution principle
├── 07-parser-primitives/          # 4 parser combinator primitives
├── 08-billing-example/            # Production-ready payment system (Stripe-style)
└── fpinscala-second-edition/      # Book exercises (14 chapters, Scala 3)
```

## File Naming Conventions

Within lesson folders:
- `lesson.ts` / `lesson.scala` - Core educational content
- `*-masterclass.ts` - Deep dives on specific topics (20-60 KB)
- `*-exercise.ts` - Practice problems
- `my-*.ts` - Student implementations

## fpinscala-second-edition

Companion code for "Functional Programming in Scala, 2nd Edition":
- `src/main/scala/fpinscala/exercises/` - Exercise stubs with `???`
- `src/main/scala/fpinscala/answers/` - Complete solutions
- `answerkey/<chapter>/NN.hint.md` and `NN.answer.md` - Hints and explanations

Chapters: gettingstarted, datastructures, errorhandling, laziness, state, parallelism, testing, parsing, monoids, monads, applicative, iomonad, localeffects, streamingio

## Key Libraries

- **fp-ts** - TypeScript FP library for Option, Either, Task, pipe
- **immer** - Immutable state updates
- **immutable** - Immutable collections

## Code Style

TypeScript uses ESLint + Prettier:
- Single quotes, semicolons, 2-space tabs
- `prefer-const`, `no-var` enforced
- `@typescript-eslint/no-explicit-any` as warning (permissive for learning)
