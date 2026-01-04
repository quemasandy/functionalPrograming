# 🚀 Cómo Usar Claude Code como un Pro

## Por Boris Cherny — Creador de Claude Code

> *"Mi configuración puede parecer sorprendentemente simple. Claude Code funciona genial de fábrica, así que personalmente no lo personalizo mucho."*
> — Boris Cherny

---

## 📋 Índice

1. [Permisos Inteligentes](#-tip-1-permisos-inteligentes)
2. [Integración con Herramientas Externas](#-tip-2-integración-con-herramientas-externas)
3. [Tareas de Larga Duración](#-tip-3-tareas-de-larga-duración)
4. [El Tip Más Importante](#-tip-4-el-tip-más-importante)

---

## 🔐 Tip 1: Permisos Inteligentes

### ❌ Lo que NO hacer
```bash
claude --dangerously-skip-permissions  # ¡Evita esto!
```

### ✅ Lo que SÍ hacer
Usa el comando `/permissions` para pre-autorizar comandos bash que sabes que son seguros en tu entorno.

```bash
/permissions
```

Luego guarda estos permisos en `.claude/settings.json` para compartirlos con tu equipo.

### 🧠 ¿Por qué es bueno?

| Aspecto | `--dangerously-skip-permissions` | `/permissions` selectivo |
|---------|----------------------------------|--------------------------|
| **Seguridad** | ⚠️ Permite TODO | ✅ Solo lo necesario |
| **Control** | ❌ Cero control | ✅ Control granular |
| **Equipo** | ❌ Cada quien configura | ✅ Configuración compartida |
| **Auditoría** | ❌ Imposible | ✅ Todo en settings.json |

> [!TIP]
> Los permisos guardados en `.claude/settings.json` se pueden versionar con Git y compartir con todo el equipo, asegurando una configuración consistente.

---

## 🔧 Tip 2: Integración con Herramientas Externas

Claude Code puede usar **todas tus herramientas** por ti:

| Herramienta | Qué hace Claude | Cómo se configura |
|-------------|-----------------|-------------------|
| **Slack** | Busca y publica mensajes | MCP Server |
| **BigQuery** | Ejecuta queries de analytics | CLI `bq` |
| **Sentry** | Obtiene logs de errores | Integración directa |

### Ejemplo de configuración MCP

```json
// .mcp.json (compartido con el equipo)
{
  "servers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/slack-mcp"]
    }
  }
}
```

### 🧠 ¿Por qué es bueno?

1. **Automatización real**: Claude no solo escribe código, también puede investigar, comunicar y obtener datos.

2. **Contexto completo**: Al tener acceso a Slack, Sentry y bases de datos, Claude entiende mejor el problema que estás resolviendo.

3. **Configuración compartida**: El archivo `.mcp.json` se versiona con el proyecto, así todo el equipo tiene las mismas integraciones.

> [!IMPORTANT]
> Las integraciones MCP multiplican exponencialmente la utilidad de Claude Code. Un Claude con acceso a tus herramientas reales es mucho más poderoso.

---

## ⏱️ Tip 3: Tareas de Larga Duración

Para tareas que toman mucho tiempo, Boris usa tres estrategias:

### Estrategia A: Verificación con Background Agent

```
Prompt: "Cuando termines, verifica tu trabajo ejecutando los tests"
```

Claude lanzará un agente en segundo plano para validar.

### Estrategia B: Stop Hooks

Usa un **Agent Stop Hook** para verificación determinística cuando Claude termine.

```json
// .claude/settings.json
{
  "hooks": {
    "onStop": "npm test && npm run lint"
  }
}
```

### Estrategia C: Plugin ralph-wiggum 🤡

Plugin creado por [@GeoffreyHuntley](https://twitter.com/GeoffreyHuntley) para monitorear tareas muy largas.

### 🧠 ¿Por qué es bueno?

```
┌─────────────────────────────────────────────────────────────┐
│  SIN verificación          CON verificación                 │
│  ─────────────────         ────────────────                 │
│  Claude termina    →       Claude termina                   │
│  Tú revisas        →       Tests automáticos                │
│  Encuentras bugs   →       Bugs detectados                  │
│  Vuelves a Claude  →       Claude los arregla solo          │
│  ⏱️ 30+ minutos             ⏱️ 5 minutos                      │
└─────────────────────────────────────────────────────────────┘
```

> [!TIP]
> Para tareas largas, siempre dale a Claude una forma de verificar su trabajo. Esto crea un ciclo de retroalimentación que mejora la calidad automáticamente.

---

## 🎯 Tip 4: El Tip Más Importante

> *"Probablemente lo más importante para obtener grandes resultados de Claude Code — dale a Claude una forma de verificar su trabajo."*

### El Poder del Feedback Loop

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Claude escribe código                                  │
│         │                                                │
│         ▼                                                │
│   Claude ejecuta tests  ◄────────┐                       │
│         │                        │                       │
│         ▼                        │                       │
│   ¿Pasaron?                      │                       │
│    │     │                       │                       │
│   Sí     No ──► Claude corrige ──┘                       │
│    │                                                     │
│    ▼                                                     │
│   ✅ Código de calidad                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 🧠 ¿Por qué es tan importante?

| Sin feedback loop | Con feedback loop |
|-------------------|-------------------|
| Claude adivina si funciona | Claude **sabe** si funciona |
| Tú encuentras los bugs | Claude encuentra los bugs |
| Calidad: ⭐⭐ | Calidad: ⭐⭐⭐⭐⭐ |
| Múltiples iteraciones manuales | Una iteración automática |

### Formas de dar feedback a Claude

1. **Tests unitarios**: Claude los ejecuta después de cada cambio
2. **Linter/Formatter**: Verifica estilo y errores comunes
3. **Type checker**: TypeScript/mypy detectan errores estáticos
4. **Build**: Compilar el proyecto verifica integridad
5. **E2E tests**: Verifican flujos completos

> [!CAUTION]
> Sin un feedback loop, estás usando Claude al 30-50% de su potencial. Con verificación automática, la calidad del resultado final se multiplica **2-3x**.

---

## 📝 Resumen Ejecutivo

| # | Tip | Acción |
|---|-----|--------|
| 1 | **Permisos Inteligentes** | Usa `/permissions` en vez de `--dangerously-skip-permissions` |
| 2 | **Herramientas Externas** | Configura MCP para Slack, bases de datos, etc. |
| 3 | **Tareas Largas** | Usa hooks o agentes para verificar automáticamente |
| 4 | **Feedback Loop** | 🎯 **Dale a Claude forma de verificar su trabajo** |

---

## 🔗 Fuente

Estos tips vienen directamente de **Boris Cherny** ([@bcherny](https://twitter.com/bcherny)), creador de Claude Code, publicados el 2 de enero de 2026 en Twitter/X.

> *"Espero que esto haya sido útil. ¿Cuáles son tus tips para usar Claude Code?"*

---

*¿Tienes más tips? ¡Añádelos a este documento!* 🚀