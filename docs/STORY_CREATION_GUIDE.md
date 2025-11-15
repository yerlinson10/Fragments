# 📚 Fragments Engine v2.0 - Guía Completa de Creación de Historias

> **Versión:** 2.0.0  
> **Última actualización:** 4 de noviembre de 2025  
> **Nivel:** Principiante a Avanzado

---

## 📖 Índice

### 🎯 Fundamentos
1. [Introducción y Conceptos Básicos](#introducción-y-conceptos-básicos)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Flujo de Ejecución del Engine](#flujo-de-ejecución-del-engine)

### ⚙️ Configuración (config.json)
4. [Config.json - Estructura General](#configjson---estructura-general)
5. [Stats (Estadísticas)](#stats-estadísticas)
6. [Flags (Variables de Estado)](#flags-variables-de-estado)
7. [Characters (Personajes)](#characters-personajes)
8. [Inventory (Inventario)](#inventory-inventario)
9. [Settings (Configuración)](#settings-configuración)
10. [Achievements (Logros)](#achievements-logros)

### 📖 Eventos (story.json)
11. [Story.json - Estructura de Eventos](#storyjson---estructura-de-eventos)
12. [Tipos de Eventos](#tipos-de-eventos)
13. [Sistema de Condiciones](#sistema-de-condiciones)
14. [Sistema de Efectos](#sistema-de-efectos)
15. [Choices (Decisiones)](#choices-decisiones)

### 🏁 Finales (endings.json)
16. [Endings.json - Sistema de Finales](#endingsjson---sistema-de-finales)
17. [Prioridades y Evaluación](#prioridades-y-evaluación)

### 💡 Guías Avanzadas
18. [Patrones de Diseño Narrativo](#patrones-de-diseño-narrativo)
19. [Balance y Game Design](#balance-y-game-design)
20. [Mejores Prácticas](#mejores-prácticas)
21. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)
22. [Validación y Debug](#validación-y-debug)

### 🚀 Ejemplos Prácticos
23. [Ejemplo 1: Historia Simple](#ejemplo-1-historia-simple)
24. [Ejemplo 2: Historia Compleja Multi-Día](#ejemplo-2-historia-compleja-multi-día)
25. [Ejemplo 3: Historia con Ramificaciones](#ejemplo-3-historia-con-ramificaciones)

---

## 🎯 Introducción y Conceptos Básicos

### ¿Qué es Fragments Engine?

**Fragments Engine** es un motor de historias interactivas basado en JavaScript que permite crear narrativas no lineales con:

- ✅ **Stats dinámicas personalizables** (energía, carisma, karma, salud mental, etc.)
- ✅ **Sistema de flags** (variables boolean, string y number)
- ✅ **Relaciones con NPCs** (sistema de afinidad -100 a +100)
- ✅ **Inventario** (items y dinero)
- ✅ **Sistema multi-día** (campañas de varios días con consecuencias persistentes)
- ✅ **Eventos condicionales** (mandatory, optional, random, forced)
- ✅ **Guardado completo** (LocalStorage + Export/Import JSON)
- ✅ **Achievements** (sistema de logros)
- ✅ **Validación automática** (detecta errores en la historia)

### Conceptos Clave

#### 🎮 Estado del Juego (Game State)

El motor mantiene un **estado global** que incluye:

```javascript
gameState = {
  current_day: 1,              // Día actual
  stats: { ... },               // Estadísticas del jugador
  flags: { ... },               // Variables de estado
  characters: { ... },          // Estado de personajes
  inventory: { ... },           // Items y dinero
  completed_events: [],         // Eventos completados
  choices_history: []           // Historial de decisiones
}
```

#### 📖 Evento (Event)

Un **evento** es una situación narrativa donde el jugador debe tomar una decisión:

```
┌─────────────────────────────────┐
│ EVENTO: "Llamada de tu madre"  │
│                                 │
│ "Tu madre te llama justo       │
│  cuando vas a una reunión..."  │
│                                 │
│ Opción A: Responder            │
│ Opción B: Ignorar              │
└─────────────────────────────────┘
         ↓
   Efectos aplicados
   (stats, flags, etc.)
```

#### 🔀 Flujo de Decisiones

```
Inicio → Evento 1 → Decisión → Efectos → Evento 2 → ... → Final
                        ↓
                   Cambia el gameState
                        ↓
              Afecta qué eventos aparecen después
```

---

---

## 📁 Estructura de Archivos

### Anatomía de una Historia

Cada historia vive en su propia carpeta dentro de `stories/`:

```
stories/
└── mi_historia/           ← Nombre único de tu historia
    ├── config.json        ← Configuración (stats, flags, personajes)
    ├── story.json         ← Eventos y decisiones
    └── endings.json       ← Finales posibles
```

### ¿Por qué 3 archivos separados?

| Archivo | Propósito | Cuándo editar |
|---------|-----------|---------------|
| `config.json` | Define las **reglas del juego** | Al inicio (stats, personajes) |
| `story.json` | Contiene la **narrativa** | Todo el tiempo (eventos, diálogos) |
| `endings.json` | Define los **finales** | Después de crear eventos |

**💡 TIP:** Crea primero `config.json`, luego `story.json`, y finalmente `endings.json`.

---

## 🔄 Flujo de Ejecución del Engine

Entender cómo funciona el motor te ayudará a diseñar mejor tu historia.

### 1️⃣ Carga de Historia

```javascript
await engine.loadStory('stories/mi_historia');
```

**Lo que hace el engine:**
1. Carga `config.json`, `story.json`, `endings.json`
2. Valida la historia (busca errores)
3. Muestra advertencias en consola si hay problemas

**⚠️ ADVERTENCIA:** Si hay errores de sintaxis JSON, la historia no cargará. Usa [jsonlint.com](https://jsonlint.com) para validar.

### 2️⃣ Inicialización del Juego

```javascript
engine.initGame();
```

**Lo que hace el engine:**
1. Crea el `gameState` inicial
2. Establece stats en sus valores `start`
3. Crea flags con valores por defecto
4. Inicializa personajes (todos con `met: false`)
5. Crea inventario vacío con dinero inicial

### 3️⃣ Ciclo de Eventos

```
┌──────────────────────────────────────────┐
│ 1. getAvailableEvents()                  │
│    - Filtra eventos por día              │
│    - Verifica condiciones                │
│    - Ordena por prioridad                │
└──────────────┬───────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│ 2. Mostrar evento al jugador             │
│    - Texto narrativo                     │
│    - Opciones disponibles                │
└──────────────┬───────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│ 3. makeChoice(event, choiceIndex)        │
│    - Aplica efectos                      │
│    - Marca evento como completado        │
│    - Actualiza gameState                 │
└──────────────┬───────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│ 4. Regenerar lista de eventos            │
│    (las condiciones han cambiado)        │
└──────────────┬───────────────────────────┘
               ↓
         Repetir desde 1
```

**💡 TIP:** Los eventos se **regeneran** después de cada decisión. Esto significa que tus efectos **afectan inmediatamente** qué eventos aparecen después.

### 4️⃣ Final del Juego

Cuando un evento tiene `trigger_ending: true`:

```javascript
const ending = engine.getEnding();
```

El engine:
1. Evalúa todos los finales en orden de `priority` (menor = más específico)
2. Devuelve el primer final que cumple condiciones
3. Si ninguno cumple, devuelve `default_ending`

---

## ⚙️ Config.json - Estructura General

El archivo `config.json` es el **corazón de tu historia**. Define todas las mecánicas del juego.

### Anatomía Completa

```json
{
  "story": {
    "id": "mi_historia_unica",           // ⚠️ ÚNICO, sin espacios
    "title": "El Título de mi Historia",
    "subtitle": "Un subtítulo épico",    // Opcional
    "description": "Una breve descripción de la historia",
    "version": "1.0.0",                  // Versionado semántico
    "author": "Tu Nombre",
    "max_days": 3,                       // Número total de días
    "starting_time": "morning",          // morning|afternoon|night
    "starting_day": 1                    // Día inicial (normalmente 1)
  },
  
  "stats": { /* Ver sección Stats */ },
  "flags": { /* Ver sección Flags */ },
  "characters": { /* Ver sección Characters */ },
  "inventory": { /* Ver sección Inventory */ },
  "settings": { /* Ver sección Settings */ },
  "achievements": { /* Ver sección Achievements */ }
}
```

### Campo `story` (Metadatos)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | ✅ Sí | Identificador único (sin espacios ni caracteres especiales) |
| `title` | string | ✅ Sí | Título mostrado al jugador |
| `subtitle` | string | ❌ No | Subtítulo opcional |
| `description` | string | ❌ No | Descripción breve (para menú de historias) |
| `version` | string | ✅ Sí | Versión de la historia (ej: "1.0.0") |
| `author` | string | ❌ No | Tu nombre o pseudónimo |
| `max_days` | number | ✅ Sí | Número máximo de días de la campaña |
| `starting_time` | string | ❌ No | Hora inicial: `"morning"`, `"afternoon"`, `"night"` (default: `"morning"`) |
| `starting_day` | number | ❌ No | Día inicial (default: 1) |

**💡 TIP:** El `id` debe ser único si planeas tener múltiples historias. Se usa para identificar guardados en LocalStorage.

**⚠️ ADVERTENCIA:** No cambies el `id` después de lanzar tu historia, o los jugadores perderán sus guardados.

### Ejemplo Completo

```json
{
  "story": {
    "id": "fragments_original",
    "title": "Fragments: Tres Días de Decisiones",
    "subtitle": "Cada elección construye tu realidad",
    "description": "Una historia sobre las pequeñas decisiones que definen quiénes somos.",
    "version": "1.0.0",
    "author": "Fragments Team",
    "max_days": 3,
    "starting_time": "morning",
    "starting_day": 1
  }
}
```

---

## 📊 Stats (Estadísticas)

Las **stats** son valores numéricos que representan atributos del personaje. Son **completamente personalizables**.

### Estructura de una Stat

```json
"stats": {
  "nombre_stat": {
    "name": "Nombre Mostrado",
    "icon": "🎯",
    "min": -10,
    "max": 10,
    "start": 0,
    "color": "#3b82f6",
    "description": "Descripción opcional"
  }
}
```

### Campos de cada Stat

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `name` | string | ✅ Sí | Nombre mostrado en la UI |
| `icon` | string | ✅ Sí | Emoji o símbolo (1 carácter) |
| `min` | number | ✅ Sí | Valor mínimo posible |
| `max` | number | ✅ Sí | Valor máximo posible |
| `start` | number | ✅ Sí | Valor inicial al comenzar el juego |
| `color` | string | ❌ No | Color en formato hexadecimal (#RRGGBB) |
| `description` | string | ❌ No | Tooltip explicativo (mostrado al pasar el mouse) |

### Ejemplos de Stats Comunes

#### Historia de Supervivencia

```json
"stats": {
  "salud": {
    "name": "Salud",
    "icon": "❤️",
    "min": 0,
    "max": 100,
    "start": 100,
    "color": "#ef4444",
    "description": "Tu estado de salud física"
  },
  "hambre": {
    "name": "Hambre",
    "icon": "🍖",
    "min": 0,
    "max": 100,
    "start": 50,
    "color": "#f59e0b",
    "description": "Nivel de hambre (más alto = más hambre)"
  },
  "cordura": {
    "name": "Cordura",
    "icon": "🧠",
    "min": 0,
    "max": 100,
    "start": 75,
    "color": "#8b5cf6",
    "description": "Tu salud mental"
  }
}
```

#### Historia Social/Romance

```json
"stats": {
  "carisma": {
    "name": "Carisma",
    "icon": "✨",
    "min": 0,
    "max": 100,
    "start": 50,
    "color": "#f59e0b"
  },
  "confianza": {
    "name": "Confianza",
    "icon": "🛡️",
    "min": 0,
    "max": 100,
    "start": 60,
    "color": "#10b981"
  },
  "reputacion": {
    "name": "Reputación",
    "icon": "⭐",
    "min": -50,
    "max": 50,
    "start": 0,
    "color": "#3b82f6"
  }
}
```

#### Historia Realista (Fragments Original)

```json
"stats": {
  "energia": {
    "name": "Energía",
    "icon": "⚡",
    "min": -15,
    "max": 15,
    "start": 0,
    "color": "#10b981",
    "description": "Tu vitalidad física y mental"
  },
  "animo": {
    "name": "Ánimo",
    "icon": "😊",
    "min": -15,
    "max": 15,
    "start": 0,
    "color": "#f59e0b",
    "description": "Tu estado emocional"
  },
  "caos": {
    "name": "Caos",
    "icon": "🌀",
    "min": -15,
    "max": 15,
    "start": 0,
    "color": "#ef4444",
    "description": "Desorden en tu vida"
  }
}
```

### Consejos de Diseño

**✅ HACER:**

1. **Usar rangos simétricos**: `-10 a +10` o `0 a 100` son fáciles de balancear
2. **Nombres claros**: "Energía" es mejor que "E" o "Stat1"
3. **Íconos relevantes**: Usa emojis que representen visualmente la stat
4. **3-5 stats máximo**: Demasiadas stats confunden al jugador
5. **Colores diferenciados**: Cada stat debe ser visualmente distinta

**❌ EVITAR:**

1. **Rangos asimétricos raros**: Evita cosas como `-73 a 42`
2. **Demasiadas stats**: Más de 7 stats es abrumador
3. **Nombres ambiguos**: "Valor" o "Puntos" no dicen nada
4. **Valores iniciales extremos**: No empieces en `min` o `max`

### ⚙️ Cómo Funcionan las Stats

#### Cambio de Valores

Las stats cambian mediante **efectos** en las decisiones:

```json
"effects": {
  "stats": {
    "energia": 2,    // +2 energía
    "animo": -1      // -1 ánimo
  }
}
```

El engine automáticamente:
- ✅ Suma/resta el valor
- ✅ Aplica límites `min` y `max`
- ✅ Actualiza la UI

#### Condiciones basadas en Stats

Puedes hacer que eventos aparezcan solo si una stat cumple condiciones:

```json
"conditions": {
  "stats": {
    "energia_min": 5,     // Requiere energía >= 5
    "energia_max": 10,    // Requiere energía <= 10
    "animo_min": 0        // Requiere ánimo >= 0
  }
}
```

#### Finales basados en Stats

Los finales pueden depender de los valores finales:

```json
"conditions": {
  "stats": {
    "energia_min": 10,    // "Final Energético" requiere mucha energía
    "animo_min": 5
  }
}
```

### Ejemplo Completo: RPG Clásico

```json
"stats": {
  "vida": {
    "name": "Vida",
    "icon": "❤️",
    "min": 0,
    "max": 100,
    "start": 100,
    "color": "#ef4444",
    "description": "Puntos de vida"
  },
  "mana": {
    "name": "Maná",
    "icon": "💙",
    "min": 0,
    "max": 100,
    "start": 50,
    "color": "#3b82f6",
    "description": "Energía mágica"
  },
  "experiencia": {
    "name": "XP",
    "icon": "⭐",
    "min": 0,
    "max": 1000,
    "start": 0,
    "color": "#fbbf24",
    "description": "Puntos de experiencia"
  },
  "oro": {
    "name": "Oro",
    "icon": "💰",
    "min": 0,
    "max": 99999,
    "start": 100,
    "color": "#f59e0b",
    "description": "Monedas de oro"
  }
}
```

**💡 TIP:** Para historias de **un solo día**, stats con rangos `-15 a +15` funcionan bien. Para **campañas largas**, considera rangos `0 a 100`.

**⚠️ ADVERTENCIA:** Si una stat llega a `min` o `max`, se **queda ahí**. No hay "overflow". Planifica tus efectos para que sea posible alcanzar los finales.

---

## 🚩 Flags (Variables de Estado)

Las **flags** son variables personalizadas para trackear el estado del juego. Son el **cerebro de tu narrativa ramificada**.

### ¿Qué son las Flags?

Las flags pueden ser:
- **Boolean** (true/false): Para decisiones binarias
- **String** (texto): Para estados complejos
- **Number** (números): Para contar ocurrencias

### Estructura

```json
"flags": {
  "tutorial_completed": false,           // Boolean
  "relationship_status": "single",       // String
  "coffee_count": 0,                     // Number
  "has_dog": false,                      // Boolean
  "ending_type": "neutral",              // String
  "times_helped_pablo": 0                // Number
}
```

### Tipos de Flags

#### 1️⃣ Flags Boolean (true/false)

**Uso:** Decisiones importantes que abren/cierran caminos

```json
"flags": {
  "tutorial_completed": false,
  "adopted_street_dog": false,
  "ignored_ex": false,
  "unlocked_secret_ending": false,
  "met_mysterious_stranger": false
}
```

**Ejemplo en evento:**
```json
"conditions": {
  "flags": {
    "tutorial_completed": true,    // Solo si completó tutorial
    "has_dog": false               // Solo si NO tiene perro
  }
}
```

#### 2️⃣ Flags String (texto)

**Uso:** Estados con múltiples opciones

```json
"flags": {
  "relationship_status": "single",    // "single", "dating", "married", "complicated"
  "work_performance": "good",         // "poor", "good", "excellent"
  "alignment": "neutral",             // "good", "neutral", "evil"
  "faction": "none"                   // "rebels", "empire", "neutral", "none"
}
```

**Ejemplo en evento:**
```json
"conditions": {
  "flags": {
    "relationship_status": "dating",    // Solo si está saliendo con alguien
    "work_performance": "excellent"     // Solo si tiene excelente desempeño
  }
}
```

**Ejemplo de cambio:**
```json
"effects": {
  "flags": {
    "relationship_status": "married"    // Cambia de "dating" a "married"
  }
}
```

#### 3️⃣ Flags Number (contadores)

**Uso:** Contar ocurrencias, acumular puntos

```json
"flags": {
  "coffee_count": 0,                  // Cuántos cafés tomaste
  "times_helped_pablo": 0,            // Cuántas veces ayudaste a Pablo
  "days_without_gym": 0,              // Días sin ir al gym
  "karma_points": 0                   // Puntos de karma acumulados
}
```

**⚙️ Comportamiento especial:** Si tanto el flag actual como el efecto son **números**, se **suman**.

```json
// Flag inicial: coffee_count = 2

"effects": {
  "flags": {
    "coffee_count": 1    // Suma +1
  }
}

// Resultado: coffee_count = 3
```

**Ejemplo en condicional:**
```json
"conditions": {
  "flags": {
    "coffee_count": 5    // Exactamente 5 cafés (usa = no >=)
  }
}
```

**⚠️ ADVERTENCIA:** Las condiciones de flags numéricas usan **igualdad exacta**, no rangos. Si quieres rangos, usa stats.

### Casos de Uso Comunes

#### Trackear Decisiones Importantes

```json
"flags": {
  "saved_the_cat": false,
  "betrayed_friend": false,
  "chose_love_over_duty": false,
  "revealed_secret": false
}
```

#### Sistema de Relaciones

```json
"flags": {
  "ana_knows_secret": false,
  "pablo_is_angry": false,
  "made_promise_to_mother": false,
  "ex_blocked": false
}
```

#### Progresión de Misiones

```json
"flags": {
  "quest_find_dog_started": false,
  "quest_find_dog_completed": false,
  "quest_reconcile_ex_available": false,
  "quest_get_promotion_failed": false
}
```

#### Contadores de Comportamiento

```json
"flags": {
  "good_deeds_count": 0,
  "bad_deeds_count": 0,
  "lies_told": 0,
  "times_chose_work_over_life": 0
}
```

### Diferencia entre Stats y Flags

| Característica | Stats | Flags |
|----------------|-------|-------|
| **Tipo** | Solo números | Boolean, String, Number |
| **Rango** | Tiene min/max | Sin límites |
| **UI** | Siempre visible (barras) | Ocultas (a menos que `show_flags: true`) |
| **Uso** | Atributos del personaje | Estado del mundo/decisiones |
| **Ejemplo** | Energía, Salud, Carisma | has_dog, relationship_status |

### Consejos de Diseño

**✅ HACER:**

1. **Nombres descriptivos**: `"tutorial_completed"` es mejor que `"tc"`
2. **Snake_case**: Usa guiones bajos: `"has_dog"`, no `"hasDog"` o `"hasdog"`
3. **Valores iniciales claros**: `false`, `"none"`, `0` son buenos defaults
4. **Documentar significado**: Usa comentarios en tu JSON
5. **Agrupar lógicamente**: Agrupa flags relacionadas

**❌ EVITAR:**

1. **Flags sin uso**: No crees flags "por si acaso"
2. **Nombres ambiguos**: `"flag1"`, `"temp"`, `"x"` no dicen nada
3. **Demasiadas flags**: Más de 20 flags es difícil de mantener
4. **Duplicar stats**: Si es un atributo numérico con límites, usa stats

### Ejemplo Completo: RPG Fantasy

```json
"flags": {
  // Progreso de historia
  "chapter": 1,
  "prologue_completed": false,
  
  // Decisiones clave
  "chose_warrior_path": false,
  "chose_mage_path": false,
  "saved_village": false,
  "killed_dragon": false,
  
  // Relaciones
  "princess_romance": false,
  "thief_ally": false,
  "wizard_mentor_dead": false,
  
  // Inventory especial
  "has_legendary_sword": false,
  "has_magic_amulet": false,
  
  // Reputación
  "hero_status": "unknown",      // "unknown", "hero", "villain", "legend"
  "kingdom_alignment": "neutral", // "loyal", "neutral", "rebel"
  
  // Contadores
  "monsters_killed": 0,
  "people_saved": 0,
  "lies_told": 0
}
```

### Debugging Flags

Para ver las flags durante el juego, activa el modo debug:

```json
"settings": {
  "show_flags": true    // Muestra flags en la UI
}
```

**💡 TIP:** Usa flags para **decisiones cualitativas** (¿adoptaste el perro?) y stats para **atributos cuantitativos** (¿cuánta energía tienes?).

**⚠️ ADVERTENCIA:** Las flags **no se validan automáticamente**. Si referencias un flag que no existe en `config.json`, el engine lo creará como `undefined` y puede causar bugs.

---

## 👥 Characters (Personajes)

Los **characters** representan NPCs (personajes no jugadores) con los que puedes tener relaciones dinámicas.

### Estructura de un Personaje

```json
"characters": {
  "nombre_clave": {
    "name": "Nombre Completo",
    "relationship": 0,
    "met": false,
    "description": "Descripción del personaje",
    "role": "amigo|enemigo|romance|mentor|neutro",
    "avatar": "🧑"
  }
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `name` | string | ✅ Sí | Nombre mostrado del personaje |
| `relationship` | number | ✅ Sí | Nivel de relación (-100 a +100) |
| `met` | boolean | ✅ Sí | ¿El jugador ya conoció al personaje? |
| `description` | string | ❌ No | Descripción o rol del personaje |
| `role` | string | ❌ No | Tipo de relación (opcional, solo informativo) |
| `avatar` | string | ❌ No | Emoji o inicial del personaje |

### Sistema de Relaciones

El campo `relationship` va de **-100 (enemigo)** a **+100 (mejor amigo/amor)**:

```
-100 ←────────── 0 ──────────→ +100
Odio         Neutral        Amor
```

**Escalas recomendadas:**

| Rango | Nivel de Relación |
|-------|-------------------|
| -100 a -70 | Enemigo mortal |
| -69 a -40 | No te tolera |
| -39 a -10 | Relación tensa |
| -9 a +9 | Neutral/Desconocido |
| +10 a +39 | Conocidos amistosos |
| +40 a +69 | Buenos amigos |
| +70 a +100 | Mejores amigos / Romance |

### Ejemplos de Personajes

#### Historia de Oficina

```json
"characters": {
  "jefe": {
    "name": "Sr. Martínez",
    "relationship": 0,
    "met": true,
    "description": "Tu jefe directo, estricto pero justo",
    "role": "autoridad",
    "avatar": "👔"
  },
  "pablo": {
    "name": "Pablo García",
    "relationship": 0,
    "met": false,
    "description": "Compañero de trabajo, siempre pide favores",
    "role": "colega",
    "avatar": "👨"
  },
  "ana": {
    "name": "Ana López",
    "relationship": 0,
    "met": false,
    "description": "La programadora del equipo",
    "role": "aliada",
    "avatar": "👩‍💻"
  }
}
```

#### Historia de Romance

```json
"characters": {
  "alex": {
    "name": "Alex Rivera",
    "relationship": 0,
    "met": false,
    "description": "Alguien que conociste en la cafetería",
    "role": "romance",
    "avatar": "❤️"
  },
  "ex": {
    "name": "Tu Ex",
    "relationship": -20,
    "met": true,
    "description": "Tu relación pasada",
    "role": "complicado",
    "avatar": "💔"
  },
  "amiga": {
    "name": "María",
    "relationship": 50,
    "met": true,
    "description": "Tu mejor amiga desde siempre",
    "role": "amiga",
    "avatar": "👯"
  }
}
```

#### Historia de Aventura/RPG

```json
"characters": {
  "mago": {
    "name": "Eldrin el Sabio",
    "relationship": 0,
    "met": false,
    "description": "Mago misterioso del bosque",
    "role": "mentor",
    "avatar": "🧙"
  },
  "ladron": {
    "name": "Raven",
    "relationship": 0,
    "met": false,
    "description": "Ladrón con corazón de oro",
    "role": "aliado",
    "avatar": "🗡️"
  },
  "dragon": {
    "name": "Ignis",
    "relationship": -100,
    "met": false,
    "description": "El dragón que aterroriza el reino",
    "role": "enemigo",
    "avatar": "🐉"
  }
}
```

### Cómo Usar Personajes

#### 1️⃣ Conocer al Personaje

Usa el campo `met` para trackear si el jugador ya conoció al personaje:

```json
// En el primer evento donde aparece el personaje
"effects": {
  "characters": {
    "pablo": {
      "met": true,
      "relationship": 5    // +5 por primera impresión
    }
  }
}
```

#### 2️⃣ Cambiar la Relación

Las relaciones cambian mediante efectos:

```json
"effects": {
  "characters": {
    "pablo": {
      "relationship": 10    // +10 relación (se suma al actual)
    }
  }
}
```

**⚠️ IMPORTANTE:** Los valores se **suman** al relationship actual y se limitan automáticamente a -100/+100.

```javascript
// Ejemplo:
// pablo.relationship actual: 40
// Efecto: relationship: 15
// Resultado: pablo.relationship = 55 (40 + 15)
```

#### 3️⃣ Condicionar Eventos

Puedes hacer que eventos aparezcan basándose en relaciones:

```json
"conditions": {
  "characters": {
    "pablo": {
      "met": true,                  // Ya conociste a Pablo
      "relationship_min": 50        // Relación >= 50
    }
  }
}
```

**Condiciones disponibles:**
- `met`: true/false (¿conoces al personaje?)
- `relationship_min`: número (relación mínima requerida)
- `relationship_max`: número (relación máxima permitida)

#### 4️⃣ Finales basados en Relaciones

```json
// En endings.json
{
  "id": "ending_romance_pablo",
  "priority": 1,
  "title": "Final Romántico con Pablo",
  "conditions": {
    "characters": {
      "pablo": {
        "met": true,
        "relationship_min": 70    // Requiere muy buena relación
      }
    }
  }
}
```

### Ejemplo Completo de Progresión

```json
// config.json
"characters": {
  "ana": {
    "name": "Ana",
    "relationship": 0,
    "met": false,
    "description": "Compañera de trabajo"
  }
}

// story.json - Evento 1: Conocer a Ana
{
  "id": "meet_ana",
  "text": "Una mujer se acerca: 'Hola, soy Ana'",
  "choices": [
    {
      "text": "Sonreír y presentarte",
      "effects": {
        "characters": {
          "ana": {
            "met": true,
            "relationship": 10
          }
        }
      }
    },
    {
      "text": "Ser frío",
      "effects": {
        "characters": {
          "ana": {
            "met": true,
            "relationship": -5
          }
        }
      }
    }
  ]
}

// Evento 2: Solo aparece si ya conociste a Ana
{
  "id": "ana_pide_favor",
  "text": "Ana te pide ayuda con un proyecto",
  "conditions": {
    "characters": {
      "ana": {
        "met": true    // Solo si ya la conoces
      }
    }
  },
  "choices": [
    {
      "text": "Ayudarla",
      "effects": {
        "characters": {
          "ana": {
            "relationship": 15
          }
        }
      }
    }
  ]
}

// Evento 3: Solo si tienes buena relación
{
  "id": "ana_date",
  "text": "Ana te invita a salir",
  "conditions": {
    "characters": {
      "ana": {
        "relationship_min": 40    // Solo si tienes +40
      }
    }
  }
}
```

### Consejos de Diseño

**✅ HACER:**

1. **Nombres únicos**: Usa claves únicas (`"pablo"`, no `"personaje1"`)
2. **Valores iniciales realistas**: La mayoría empieza en `0` (neutral) y `met: false`
3. **Cambios graduales**: +5 a +15 por evento, no +50
4. **Balance**: Demasiados personajes (>8) es confuso
5. **Roles claros**: El jugador debe entender quién es cada personaje

**❌ EVITAR:**

1. **Personajes sin propósito**: No crees NPCs que no afectan la historia
2. **Cambios extremos**: Saltar de -50 a +50 en una decisión rompe inmersión
3. **Relaciones sin lógica**: Si ignoras a alguien, su relationship no debería subir
4. **Demasiados personajes**: Más de 10 personajes es difícil de seguir

### Diferencia con Flags

| Característica | Characters | Flags |
|----------------|------------|-------|
| **Propósito** | Relaciones con NPCs | Estado del mundo |
| **Campos** | name, relationship, met | Solo valor |
| **Escala** | -100 a +100 | Cualquier valor |
| **UI** | Se puede mostrar lista de personajes | Generalmente oculto |
| **Ejemplo** | ana.relationship: 50 | has_dog: true |

**💡 TIP:** Usa characters para **personas** y flags para **cosas**. "¿Ana me quiere?" → character. "¿Tengo perro?" → flag.

**⚠️ ADVERTENCIA:** Si referencias un personaje en `conditions` o `effects` que no existe en `config.json`, causará error. Siempre declara personajes en config primero.

---

## 🎒 Inventory (Inventario)

El sistema de **inventory** permite al jugador recolectar items y manejar dinero.

### Estructura

```json
"inventory": {
  "enabled": true,
  "items": [],
  "money": 100,
  "max_items": 10
}
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `enabled` | boolean | Activa/desactiva el sistema de inventario |
| `items` | array | Lista de items iniciales (normalmente vacío: `[]`) |
| `money` | number | Dinero inicial del jugador |
| `max_items` | number | Máximo número de items que puede cargar |

### Cómo Usar el Inventario

#### Añadir Items

```json
"effects": {
  "inventory": {
    "items": ["llave_dorada", "mapa_tesoro"]    // Añade estos items
  }
}
```

#### Remover Items

```json
"effects": {
  "inventory": {
    "remove_items": ["llave_dorada"]    // Remueve este item
  }
}
```

#### Añadir/Quitar Dinero

```json
"effects": {
  "inventory": {
    "money": -50    // Gasta $50 (número negativo)
  }
}

// O ganar dinero:
"effects": {
  "inventory": {
    "money": 100    // Gana $100 (número positivo)
  }
}
```

#### Condiciones de Inventario

```json
"conditions": {
  "inventory": {
    "money_min": 100,                       // Requiere al menos $100
    "has_items": ["llave", "antorcha"]      // Requiere tener ambos items
  }
}
```

### Ejemplo Completo: Tienda

```json
// Evento: Tienda
{
  "id": "tienda_espadas",
  "text": "El herrero te muestra una espada legendaria. Cuesta $500.",
  "conditions": {
    "inventory": {
      "money_min": 500    // Solo aparece si tienes suficiente dinero
    }
  },
  "choices": [
    {
      "text": "Comprar la espada",
      "effects": {
        "inventory": {
          "money": -500,
          "items": ["espada_legendaria"]
        }
      }
    },
    {
      "text": "No comprar"
    }
  ]
}
```

**💡 TIP:** Para historias sin sistema de inventory, establece `"enabled": false`.

---

## ⚙️ Settings (Configuración)

Los **settings** controlan características globales del juego.

### Estructura Completa

```json
"settings": {
  "allow_save": true,
  "allow_restart": true,
  "show_stats": true,
  "show_flags": false,
  "show_characters": true,
  "show_inventory": true,
  "enable_sound": true,
  "auto_save": true,
  "save_slots": 3,
  "enable_achievements": true
}
```

### Campos Detallados

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `allow_save` | boolean | `true` | Permite guardar/cargar partidas |
| `allow_restart` | boolean | `true` | Permite reiniciar la historia |
| `show_stats` | boolean | `true` | Muestra barras de stats en UI |
| `show_flags` | boolean | `false` | **DEBUG:** Muestra flags en UI |
| `show_characters` | boolean | `true` | Muestra lista de personajes |
| `show_inventory` | boolean | `true` | Muestra inventario en UI |
| `enable_sound` | boolean | `true` | Habilita efectos de sonido (WIP) |
| `auto_save` | boolean | `true` | Auto-guarda después de cada decisión |
| `save_slots` | number | `3` | Número de slots de guardado |
| `enable_achievements` | boolean | `true` | Activa sistema de logros |

### Configuraciones Recomendadas

#### Historia Normal (Con Guardado)

```json
"settings": {
  "allow_save": true,
  "auto_save": true,
  "save_slots": 3,
  "show_stats": true,
  "show_flags": false,
  "enable_achievements": true
}
```

#### Historia Roguelike (Sin Guardado)

```json
"settings": {
  "allow_save": false,        // No se puede guardar
  "allow_restart": true,      // Pero sí reiniciar
  "auto_save": false,
  "show_stats": true
}
```

#### Modo Debug (Para Desarrollo)

```json
"settings": {
  "show_flags": true,         // ✅ Ver flags en tiempo real
  "show_stats": true,
  "show_characters": true,
  "show_inventory": true
}
```

**⚠️ ADVERTENCIA:** `show_flags: true` muestra **todas** las flags en pantalla. Solo úsalo para debug, no en producción.

---

## 🏆 Achievements (Logros)

Los **achievements** son logros desbloqueables que premian al jugador por completar objetivos.

### Estructura

```json
"achievements": {
  "achievement_id": {
    "name": "Nombre del Logro",
    "description": "Cómo desbloquear este logro",
    "icon": "🏆",
    "unlocked": false,
    "hidden": false
  }
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `name` | string | ✅ Sí | Nombre del logro |
| `description` | string | ✅ Sí | Descripción de cómo desbloquearlo |
| `icon` | string | ❌ No | Emoji del logro |
| `unlocked` | boolean | ✅ Sí | Estado inicial (siempre `false`) |
| `hidden` | boolean | ❌ No | Si es `true`, el logro no se muestra hasta desbloquearlo |

### Ejemplos de Achievements

```json
"achievements": {
  "first_ending": {
    "name": "El Final",
    "description": "Completa la historia por primera vez",
    "icon": "🏁",
    "unlocked": false
  },
  "dog_lover": {
    "name": "Amante de los Perros",
    "description": "Adopta al perro callejero",
    "icon": "🐕",
    "unlocked": false
  },
  "workaholic": {
    "name": "Adicto al Trabajo",
    "description": "Acepta todas las horas extra",
    "icon": "💼",
    "unlocked": false
  },
  "heartbreaker": {
    "name": "Rompecorazones",
    "description": "Rechaza a tu ex definitivamente",
    "icon": "💔",
    "unlocked": false
  },
  "secret_path": {
    "name": "???",
    "description": "Desbloquea el camino secreto",
    "icon": "❓",
    "unlocked": false,
    "hidden": true    // No se muestra hasta desbloquearlo
  }
}
```

### Cómo Desbloquear Achievements

En los efectos de una decisión:

```json
"effects": {
  "unlocks": {
    "achievement": "dog_lover"    // Desbloquea este logro
  }
}
```

### Ejemplo Completo

```json
// config.json
"achievements": {
  "perfect_day": {
    "name": "Día Perfecto",
    "description": "Termina el día con todas las stats en positivo",
    "icon": "✨",
    "unlocked": false
  }
}

// story.json - Evento final
{
  "id": "fin_dia_1",
  "text": "El día termina...",
  "choices": [{
    "text": "Ver resultado",
    "effects": {
      "trigger_ending": true,
      "unlocks": {
        "achievement": "perfect_day"    // Se desbloquea aquí
      }
    }
  }]
}
```

### Tipos de Achievements Comunes

1. **Progreso:** "Completa el día 1", "Termina la historia"
2. **Exploración:** "Descubre el evento secreto"
3. **Decisiones:** "Ayuda a todos los personajes"
4. **Colección:** "Consigue todos los items"
5. **Desafío:** "Termina con energía máxima"
6. **Secretos:** "Desbloquea el final oculto"

**💡 TIP:** Los achievements con `hidden: true` son perfectos para sorpresas y finales secretos.

**⚠️ ADVERTENCIA:** Si `enable_achievements: false` en settings, los logros no se trackearán.

---

## 📖 Story.json - Estructura de Eventos

El archivo `story.json` contiene **todos los eventos** de tu historia. Es el núcleo narrativo del juego.

### Estructura General

```json
{
  "events": [
    { /* Evento 1 */ },
    { /* Evento 2 */ },
    { /* Evento 3 */ }
  ]
}
```

### Anatomía Completa de un Evento

```json
{
  "id": "evento_unico",
  "day": 1,
  "time": "morning",
  "earliest_hour": 6,
  "latest_hour": 9,
  "type": "mandatory",
  "can_repeat": false,
  "probability": 1.0,
  
  "text": "Texto narrativo del evento...",
  
  "conditions": {
    /* Condiciones para que aparezca */
  },
  
  "choices": [
    {
      "text": "Opción A",
      "effects": {
        /* Efectos de esta opción */
      },
      "leads_to": "next_event_id"
    },
    {
      "text": "Opción B",
      "effects": { /* ... */ }
    }
  ]
}
```

### Campos de un Evento

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `id` | string | ✅ Sí | Identificador único del evento |
| `day` | number | ✅ Sí | Día en que ocurre (1, 2, 3...) |
| `time` | string | ❌ No | Momento del día: `"morning"`, `"afternoon"`, `"night"` |
| `earliest_hour` | number | ❌ No | Hora más temprana (0-23) |
| `latest_hour` | number | ❌ No | Hora más tardía (0-23) |
| `type` | string | ✅ Sí | Tipo de evento (ver siguiente sección) |
| `can_repeat` | boolean | ❌ No | ¿Puede ocurrir múltiples veces? (default: `false`) |
| `probability` | number | ❌ No | Probabilidad de aparecer (0.0-1.0) solo para eventos `random` |
| `text` | string | ✅ Sí | Texto narrativo mostrado al jugador |
| `conditions` | object | ❌ No | Condiciones para que aparezca el evento |
| `choices` | array | ✅ Sí | Array de opciones disponibles para el jugador |

---

## 🎯 Tipos de Eventos

El campo `type` determina **cuándo y cómo** aparece un evento.

### 1️⃣ Mandatory (Obligatorio)

**Uso:** Eventos críticos que **DEBEN** ocurrir (tutorial, inicio de día, fin de día)

```json
{
  "id": "tutorial_start",
  "day": 1,
  "type": "mandatory",
  "can_repeat": false,
  "text": "Bienvenido al juego..."
}
```

**Características:**
- ✅ **Siempre aparece** si cumple condiciones
- ✅ Tiene **máxima prioridad** (aparece primero)
- ✅ Típicamente usado para narrativa principal
- ⚠️ Si un mandatory nunca aparece, el juego puede quedarse atascado

**Cuándo usar:**
- Tutorial del juego
- Inicio/fin de cada día
- Eventos de trama principal que no pueden saltarse

### 2️⃣ Optional (Opcional)

**Uso:** Eventos secundarios que enriquecen la historia

```json
{
  "id": "cafe_dilema",
  "day": 1,
  "type": "optional",
  "text": "Ves una cafetería..."
}
```

**Características:**
- ✅ Aparece **si cumple condiciones**
- ✅ Puede no aparecer nunca
- ✅ **Prioridad media**
- ✅ La mayoría de eventos son de este tipo

**Cuándo usar:**
- Eventos secundarios
- Decisiones que afectan stats/relationships
- Contenido opcional que enriquece la experiencia

### 3️⃣ Random (Aleatorio)

**Uso:** Eventos que tienen **chance de aparecer**

```json
{
  "id": "mensaje_ex",
  "day": 1,
  "type": "random",
  "probability": 0.5,    // 50% de chance
  "text": "Tu ex te envía un mensaje..."
}
```

**Características:**
- ✅ Aparece **aleatoriamente** según `probability`
- ✅ Añade **rejugabilidad** (cada partida es diferente)
- ✅ **Baja prioridad**
- ⚠️ Puede nunca aparecer

**Cuándo usar:**
- Encuentros inesperados
- Eventos sorpresa
- Contenido variable entre partidas

### 4️⃣ Forced (Forzado)

**Uso:** Eventos que se **activan** después de una decisión específica

```json
{
  "id": "veterinario_urgencia",
  "day": 2,
  "type": "forced",
  "conditions": {
    "flags": {
      "has_dog": true
    }
  },
  "text": "Tu perro está enfermo..."
}
```

**Características:**
- ✅ Se fuerza **después de cumplir condiciones**
- ✅ **Alta prioridad** (después de mandatory)
- ✅ Usado para **consecuencias directas**

**Cuándo usar:**
- Consecuencias inmediatas de decisiones
- Eventos que "deben" ocurrir por lógica narrativa
- Follow-ups de eventos previos

### Orden de Prioridad

El engine ordena eventos así:

```
1. mandatory (prioridad 0) ← Aparece primero
2. forced    (prioridad 1)
3. optional  (prioridad 2)
4. random    (prioridad 3) ← Aparece último
```

Si hay múltiples eventos disponibles del mismo tipo, el orden es **no determinista** (puede variar).

---

## 🔁 Campo can_repeat (Eventos Repetibles)

El campo `can_repeat` controla si un evento puede ocurrir **más de una vez**.

### can_repeat: false (Default)

**Comportamiento:** El evento ocurre **una sola vez**. Después de completarlo, **nunca vuelve a aparecer**.

```json
{
  "id": "adoptar_perro",
  "type": "optional",
  "can_repeat": false,    // Solo puedes adoptar una vez
  "text": "Ves un perro callejero..."
}
```

**Uso recomendado:** La mayoría de eventos deben ser `can_repeat: false`.

### can_repeat: true

**Comportamiento:** El evento puede ocurrir **múltiples veces**.

```json
{
  "id": "paseo_perro",
  "type": "optional",
  "can_repeat": true,     // Puedes pasear al perro cada día
  "conditions": {
    "flags": {
      "has_dog": true     // Solo si tienes perro
    }
  },
  "text": "Tu perro quiere salir..."
}
```

### ⚠️ PELIGRO: Bucles Infinitos

**NUNCA hagas esto:**

```json
{
  "id": "evento_malo",
  "can_repeat": true,
  "conditions": {},        // ❌ Sin condiciones restrictivas
  "text": "Este evento se repetirá infinitamente"
}
```

**Problema:** El evento **siempre cumple condiciones**, así que aparecerá infinitamente creando un bucle.

### ✅ Cómo Usar can_repeat Correctamente

**REGLA DE ORO:** Si usas `can_repeat: true`, **DEBES** tener condiciones restrictivas que puedan **cambiar**.

#### ✅ CORRECTO: Condiciones con Flags

```json
{
  "id": "paseo_perro",
  "can_repeat": true,
  "conditions": {
    "flags": {
      "has_dog": true    // ✅ Flag que puede ser true/false
    }
  }
}
```

**Por qué funciona:** Si el jugador pierde el perro (`has_dog: false`), el evento deja de aparecer.

#### ❌ INCORRECTO: Solo completed_events

```json
{
  "id": "evento_malo",
  "can_repeat": true,
  "conditions": {
    "completed_events": ["otro_evento"]    // ❌ NO previene repetición
  }
}
```

**Problema:** `completed_events` verifica **otros eventos**, no previene que **este mismo** se repita.

#### ❌ INCORRECTO: Sin Condiciones

```json
{
  "id": "evento_malo",
  "can_repeat": true,
  "conditions": {}    // ❌ Bucle infinito garantizado
}
```

### Validación Automática

El engine **detecta** eventos con riesgo de bucle infinito:

```
🔴 BUCLE INFINITO: Evento "llamada_madre" tiene can_repeat=true sin condiciones restrictivas
```

**Solución:** Cambia `can_repeat: false` o añade condiciones restrictivas con flags/characters/stats.

---

## 📝 Campo text (Texto Narrativo)

El campo `text` es lo que el jugador **lee** cuando aparece el evento.

### Estructura

```json
"text": "Tu texto narrativo aquí. Puede ser largo y descriptivo."
```

### Buenas Prácticas

**✅ HACER:**

```json
"text": "Tu alarma suena insistente. 6:00 AM. Anoche te quedaste viendo 'solo un episodio más' hasta las 2:00. Tu cuerpo ruega por cinco minutos extra."
```

- ✅ **Descriptivo** y **evocativo**
- ✅ Establece **contexto** y **estado emocional**
- ✅ Da **razones** para las decisiones
- ✅ Usa **detalles específicos** (6:00 AM, 2:00 AM)

**❌ EVITAR:**

```json
"text": "Suena tu alarma. ¿Qué haces?"
```

- ❌ Demasiado genérico
- ❌ Sin contexto emocional
- ❌ No da razones para elegir

### Longitud Recomendada

- **Corto (1-2 líneas):** Eventos menores, transiciones
- **Medio (3-5 líneas):** Eventos normales (recomendado)
- **Largo (6+ líneas):** Eventos dramáticos, clímax

### Soporte de Formato

El texto soporta:
- ✅ **Saltos de línea:** `\n` (aunque mejor usar texto simple)
- ✅ **Comillas:** `\"` escapadas
- ✅ **Emojis:** Directamente en el texto

```json
"text": "Tu madre llama ☎️. Dice: \"Solo quería escuchar tu voz.\""
```

---

---

## 🔍 Sistema de Condiciones

Las **condiciones** determinan **cuándo aparece un evento** o **qué final se obtiene**. Son evaluadas por el engine antes de mostrar un evento.

### Concepto Fundamental

```
SI (todas las condiciones se cumplen) → El evento aparece
SI NO → El evento NO aparece
```

**⚠️ IMPORTANTE:** Todas las condiciones usan **lógica AND** (deben cumplirse **TODAS** simultáneamente).

### Estructura General

```json
"conditions": {
  "day": 2,
  "day_min": 1,
  "day_max": 3,
  "stats": { /* ... */ },
  "flags": { /* ... */ },
  "characters": { /* ... */ },
  "completed_events": [ /* ... */ ],
  "previous_choices": { /* ... */ },
  "inventory": { /* ... */ }
}
```

---

## 📊 Condiciones de Stats

Verifican si las **estadísticas** del jugador están en cierto rango.

### Sintaxis

```json
"conditions": {
  "stats": {
    "nombre_stat_min": valor,    // Stat >= valor
    "nombre_stat_max": valor     // Stat <= valor
  }
}
```

### Ejemplos

#### Rango Específico

```json
"conditions": {
  "stats": {
    "energia_min": 5,     // Requiere energía >= 5
    "energia_max": 10     // Y energía <= 10
  }
}
// Solo aparece si energía está entre 5 y 10
```

#### Solo Mínimo

```json
"conditions": {
  "stats": {
    "animo_min": 0    // Requiere ánimo >= 0 (positivo)
  }
}
```

#### Solo Máximo

```json
"conditions": {
  "stats": {
    "caos_max": -5    // Requiere caos <= -5 (muy ordenado)
  }
}
```

#### Múltiples Stats

```json
"conditions": {
  "stats": {
    "energia_min": 5,
    "animo_min": 3,
    "caos_max": 0
  }
}
// Requiere: energía >=5 Y ánimo >=3 Y caos <=0
```

### Casos de Uso

**Eventos para jugadores con alta energía:**
```json
{
  "id": "gym_hardcore",
  "conditions": {
    "stats": { "energia_min": 10 }
  },
  "text": "Te sientes lleno de energía, perfecto para un entrenamiento intenso."
}
```

**Eventos para jugadores exhaustos:**
```json
{
  "id": "colapso",
  "conditions": {
    "stats": { "energia_max": -10 }
  },
  "text": "Estás al borde del colapso..."
}
```

---

## 🚩 Condiciones de Flags

Verifican el **valor exacto** de flags (boolean, string o number).

### Sintaxis

```json
"conditions": {
  "flags": {
    "nombre_flag": valor_exacto
  }
}
```

### Ejemplos

#### Flags Boolean

```json
"conditions": {
  "flags": {
    "tutorial_completed": true,    // Solo si completó el tutorial
    "has_dog": false               // Solo si NO tiene perro
  }
}
```

#### Flags String

```json
"conditions": {
  "flags": {
    "relationship_status": "dating",    // Solo si está saliendo
    "work_performance": "excellent"      // Solo con desempeño excelente
  }
}
```

#### Flags Number

```json
"conditions": {
  "flags": {
    "coffee_count": 3    // Solo si tomó exactamente 3 cafés
  }
}
```

**⚠️ ADVERTENCIA:** Las condiciones de flags numéricas usan **igualdad exacta** (=), no rangos (>= o <=). 

Si quieres rangos, usa **stats** en vez de flags.

### Casos de Uso

**Evento solo para solteros:**
```json
{
  "id": "dating_app",
  "conditions": {
    "flags": {
      "relationship_status": "single"
    }
  },
  "text": "Abres la app de citas..."
}
```

**Evento solo después de adoptar perro:**
```json
{
  "id": "paseo_perro",
  "conditions": {
    "flags": {
      "has_dog": true
    }
  },
  "text": "Tu perro te mira con ojos suplicantes..."
}
```

---

## 👥 Condiciones de Characters

Verifican el **estado de relaciones** con NPCs.

### Sintaxis

```json
"conditions": {
  "characters": {
    "nombre_personaje": {
      "met": true/false,
      "relationship_min": valor,
      "relationship_max": valor
    }
  }
}
```

### Campos Disponibles

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `met` | boolean | ¿El jugador ya conoció al personaje? |
| `relationship_min` | number | Relación mínima requerida (>=) |
| `relationship_max` | number | Relación máxima permitida (<=) |

### Ejemplos

#### Solo si conociste al personaje

```json
"conditions": {
  "characters": {
    "pablo": {
      "met": true
    }
  }
}
```

#### Buena relación

```json
"conditions": {
  "characters": {
    "ana": {
      "relationship_min": 50    // Relación >= 50 (buenos amigos)
    }
  }
}
```

#### Relación específica (rango)

```json
"conditions": {
  "characters": {
    "jefe": {
      "relationship_min": -20,    // Entre -20 y 10
      "relationship_max": 10       // (relación tensa pero no enemigos)
    }
  }
}
```

#### Múltiples personajes

```json
"conditions": {
  "characters": {
    "ana": {
      "met": true,
      "relationship_min": 30
    },
    "pablo": {
      "met": true,
      "relationship_min": 20
    }
  }
}
// Requiere haber conocido a ambos Y tener buena relación con ambos
```

### Casos de Uso

**Evento romántico:**
```json
{
  "id": "date_ana",
  "conditions": {
    "characters": {
      "ana": {
        "relationship_min": 70    // Relación muy alta
      }
    }
  },
  "text": "Ana te invita a cenar..."
}
```

**Evento de conflicto:**
```json
{
  "id": "confrontacion_jefe",
  "conditions": {
    "characters": {
      "jefe": {
        "relationship_max": -30    // Relación muy mala
      }
    }
  },
  "text": "Tu jefe te llama a su oficina con cara de enojo..."
}
```

---

## 📅 Condiciones de Día

Verifican en qué **día** está el jugador.

### Sintaxis

```json
"conditions": {
  "day": número,           // Exactamente este día
  "day_min": número,       // Día mínimo (>=)
  "day_max": número        // Día máximo (<=)
}
```

### Ejemplos

#### Día exacto

```json
"conditions": {
  "day": 2    // Solo en día 2
}
```

#### Desde cierto día en adelante

```json
"conditions": {
  "day_min": 3    // Día 3 o posterior
}
```

#### Hasta cierto día

```json
"conditions": {
  "day_max": 2    // Solo días 1 y 2
}
```

#### Rango de días

```json
"conditions": {
  "day_min": 2,
  "day_max": 5    // Entre día 2 y día 5
}
```

### Casos de Uso

**Evento que solo aparece en día 1:**
```json
{
  "id": "tutorial",
  "day": 1,
  "conditions": {
    "day": 1
  }
}
```

**Evento de consecuencias (día siguiente):**
```json
{
  "id": "resaca",
  "conditions": {
    "day_min": 2,    // Día 2 o posterior
    "flags": {
      "bebio_mucho": true
    }
  },
  "text": "Despiertas con dolor de cabeza..."
}
```

**💡 TIP:** El campo `day` en la raíz del evento también filtra por día, pero `conditions.day` te da más control.

---

## ✅ Condiciones de Eventos Completados

Verifican si el jugador ya **completó** ciertos eventos.

### Sintaxis

```json
"conditions": {
  "completed_events": ["evento_id_1", "evento_id_2"]
}
```

**Lógica:** Requiere que **TODOS** los eventos listados hayan sido completados.

### Ejemplos

#### Un evento previo

```json
"conditions": {
  "completed_events": ["tutorial_start"]
}
// Solo aparece después de completar el tutorial
```

#### Múltiples eventos previos

```json
"conditions": {
  "completed_events": ["alarma_day1", "ducha_day1", "cafe_dilema"]
}
// Solo aparece después de completar los 3 eventos
```

### Casos de Uso

**Secuencia narrativa:**
```json
// Evento 1
{
  "id": "conocer_ana",
  "text": "Conoces a Ana..."
}

// Evento 2 (solo después del 1)
{
  "id": "ana_pide_favor",
  "conditions": {
    "completed_events": ["conocer_ana"]
  },
  "text": "Ana te pide un favor..."
}

// Evento 3 (solo después del 1 y 2)
{
  "id": "ana_agradece",
  "conditions": {
    "completed_events": ["conocer_ana", "ana_pide_favor"]
  },
  "text": "Ana te agradece..."
}
```

**⚠️ IMPORTANTE:** `completed_events` solo verifica **otros eventos**, NO previene que el evento actual se repita si tiene `can_repeat: true`.

---

## 🎯 Condiciones de Decisiones Previas

Verifican **qué opción eligió** el jugador en un evento anterior.

### Sintaxis

```json
"conditions": {
  "previous_choices": {
    "evento_id": índice_de_opción
  }
}
```

**Nota:** Los índices empiezan en 0 (primera opción = 0, segunda = 1, etc.)

### Ejemplos

#### Verificar una decisión

```json
"conditions": {
  "previous_choices": {
    "cafe_dilema": 0    // Eligió la opción A (índice 0)
  }
}
```

#### Verificar múltiples decisiones

```json
"conditions": {
  "previous_choices": {
    "evento_1": 0,    // Eligió opción A en evento_1
    "evento_2": 1     // Eligió opción B en evento_2
  }
}
```

### Ejemplo Completo

```json
// Evento 1: Decisión importante
{
  "id": "ayudar_pablo",
  "text": "Pablo pide ayuda. ¿Qué haces?",
  "choices": [
    {
      "text": "Ayudarlo",          // Índice 0
      "effects": { /* ... */ }
    },
    {
      "text": "Rechazarlo",        // Índice 1
      "effects": { /* ... */ }
    }
  ]
}

// Evento 2: Solo si ayudaste (eligió índice 0)
{
  "id": "pablo_agradece",
  "conditions": {
    "previous_choices": {
      "ayudar_pablo": 0    // Solo si eligió "Ayudarlo"
    }
  },
  "text": "Pablo te agradece profundamente..."
}

// Evento 3: Solo si rechazaste (eligió índice 1)
{
  "id": "pablo_resentido",
  "conditions": {
    "previous_choices": {
      "ayudar_pablo": 1    // Solo si eligió "Rechazarlo"
    }
  },
  "text": "Pablo te evita en la oficina..."
}
```

### Casos de Uso

**Ramificaciones narrativas:**
- Diferentes eventos basados en decisiones morales
- Consecuencias a largo plazo de elecciones tempranas
- Finales diferentes basados en el camino elegido

---

## � Condiciones de Inventario

Verifican **items** y **dinero** del jugador.

### Sintaxis

```json
"conditions": {
  "inventory": {
    "money_min": número,
    "money_max": número,
    "has_items": ["item1", "item2"]
  }
}
```

### Ejemplos

#### Dinero mínimo

```json
"conditions": {
  "inventory": {
    "money_min": 100    // Requiere al menos $100
  }
}
```

#### Poseer items

```json
"conditions": {
  "inventory": {
    "has_items": ["llave_dorada", "mapa"]    // Requiere ambos items
  }
}
```

#### Combinado

```json
"conditions": {
  "inventory": {
    "money_min": 500,
    "has_items": ["espada"]
  }
}
// Requiere $500+ Y tener la espada
```

### Casos de Uso

**Tienda (solo con dinero):**
```json
{
  "id": "comprar_espada",
  "conditions": {
    "inventory": {
      "money_min": 500
    }
  },
  "text": "Ves una espada que cuesta $500..."
}
```

**Usar item:**
```json
{
  "id": "abrir_puerta",
  "conditions": {
    "inventory": {
      "has_items": ["llave_dorada"]
    }
  },
  "text": "Usas la llave dorada para abrir la puerta..."
}
```

---

## 🔗 Combinando Condiciones

Puedes combinar **todas** las condiciones en un solo evento:

```json
"conditions": {
  "day_min": 2,
  "stats": {
    "energia_min": 5,
    "animo_min": 0
  },
  "flags": {
    "has_dog": true,
    "tutorial_completed": true
  },
  "characters": {
    "ana": {
      "met": true,
      "relationship_min": 30
    }
  },
  "completed_events": ["evento_1", "evento_2"],
  "inventory": {
    "money_min": 50
  }
}
```

**Lógica:** Todas las condiciones deben cumplirse (AND lógico).

---

## 💡 Tips para Condiciones

**✅ HACER:**

1. **Condiciones realistas:** No hagas condiciones imposibles de alcanzar
2. **Testear:** Juega tu historia para verificar que los eventos aparecen
3. **Condiciones simples:** No sobrecargues con 10+ condiciones
4. **Feedback al jugador:** Si un evento requiere alta relación, dale oportunidades de subirla

**❌ EVITAR:**

1. **Condiciones contradictorias:** `energia_min: 10` y `energia_max: 5` nunca se cumplirá
2. **Referencias incorrectas:** Verifica que los IDs de eventos/personajes existan
3. **Demasiada especificidad:** Si solo 1% de jugadores puede ver un evento, rebalancea
4. **Sin condiciones alternativas:** Deja al menos un camino para todos los tipos de jugador

---

## �🏁 Endings.json - Sistema de Finales

### Estructura

```json
{
  "endings": [
    {
      "id": "perfect_ending",
      "priority": 1,    // Menor = más específico
      "title": "Final Perfecto",
      
      "conditions": {
        // Condiciones para obtener este final
      },
      
      "content": {
        "message": "Mensaje principal del final...",
        "epilogue": [
          "Línea 1 del epílogo",
          "Línea 2 del epílogo",
          "FIN"
        ],
        "unlocks": {
          "achievement": "achievement_id",
          "new_game_plus": true
        }
      }
    }
  ],
  
  "default_ending": {
    "id": "default",
    "title": "Final Normal",
    "content": {
      "message": "Final genérico..."
    }
  }
}
```

### Prioridad

Los finales se evalúan **de menor a mayor prioridad**:
- Priority 1: Más específico (requiere condiciones exactas)
- Priority 10: Menos específico (pocas condiciones)
- Si ninguno cumple → `default_ending`

---

## 🔍 Sistema de Condiciones

Las condiciones determinan **cuándo aparece un evento** o **qué final se obtiene**.

### Condiciones de Stats

```json
"conditions": {
  "stats": {
    "energia_min": 5,      // Energía >= 5
    "energia_max": 10,     // Energía <= 10
    "animo_min": 0,
    "carisma_max": 50
  }
}
```

### Condiciones de Flags

```json
"conditions": {
  "flags": {
    "has_dog": true,
    "relationship_status": "married",
    "coffee_count": 3
  }
}
```

### Condiciones de Personajes

```json
"conditions": {
  "characters": {
    "ana": {
      "met": true,
      "relationship_min": 50,
      "relationship_max": 100
    }
  }
}
```

### Condiciones de Día

```json
"conditions": {
  "day": 2,              // Exactamente día 2
  "day_min": 2,          // Día 2 o mayor
  "day_max": 5           // Hasta día 5
}
```

### Condiciones de Eventos Completados

```json
"conditions": {
  "completed_events": ["evento_1", "evento_2"]
}
```

### Condiciones de Decisiones Previas

```json
"conditions": {
  "previous_choices": {
    "evento_10": 0    // Eligió opción A (índice 0) en evento_10
  }
}
```

### Condiciones de Inventario

```json
"conditions": {
  "inventory": {
    "money_min": 100,
    "has_items": ["llave_dorada", "mapa"]
  }
}
```

### Combinar Condiciones

Todas las condiciones usan **AND** lógico (todas deben cumplirse):

```json
"conditions": {
  "stats": { "energia_min": 5 },
  "flags": { "has_dog": true },
  "day_min": 2
}
```

---

## ⚡ Sistema de Efectos

Los **efectos** se aplican **después** de que el jugador elige una opción. Modifican el `gameState` y determinan cómo evoluciona la historia.

### Concepto Fundamental

```
Jugador elige opción → Efectos se aplican → gameState cambia → Nuevos eventos disponibles
```

### Estructura General

```json
"effects": {
  "stats": { /* ... */ },
  "flags": { /* ... */ },
  "characters": { /* ... */ },
  "inventory": { /* ... */ },
  "unlock_events": [ /* ... */ ],
  "lock_events": [ /* ... */ ],
  "trigger_next_day": true/false,
  "trigger_ending": true/false,
  "unlocks": { /* ... */ }
}
```

---

## 📊 Efectos de Stats

Modifican las **estadísticas** del jugador sumando o restando valores.

### Sintaxis

```json
"effects": {
  "stats": {
    "nombre_stat": cambio    // Número positivo o negativo
  }
}
```

### Comportamiento

```javascript
nueva_stat = stat_actual + cambio
nueva_stat = Math.max(min, Math.min(max, nueva_stat))  // Se aplican límites
```

### Ejemplos

#### Aumentar stats

```json
"effects": {
  "stats": {
    "energia": 2,     // +2 energía
    "animo": 3        // +3 ánimo
  }
}
```

#### Disminuir stats

```json
"effects": {
  "stats": {
    "energia": -3,    // -3 energía
    "caos": 2         // +2 caos
  }
}
```

#### Múltiples stats

```json
"effects": {
  "stats": {
    "energia": 1,
    "animo": 2,
    "caos": -1
  }
}
```

### Ejemplo Completo

```json
{
  "id": "ducha_day1",
  "text": "¿Ducha fría o caliente?",
  "choices": [
    {
      "text": "Ducha fría (energizante)",
      "effects": {
        "stats": {
          "energia": 3,      // +3 energía
          "animo": -1        // -1 ánimo (incómodo)
        }
      }
    },
    {
      "text": "Ducha caliente (relajante)",
      "effects": {
        "stats": {
          "energia": 0,      // Sin cambio
          "animo": 2,        // +2 ánimo
          "caos": 1          // +1 caos (llegas tarde)
        }
      }
    }
  ]
}
```

### Balance Recomendado

| Magnitud | Uso |
|----------|-----|
| ±1 | Cambio menor |
| ±2 a ±3 | Cambio normal (recomendado) |
| ±4 a ±5 | Cambio significativo |
| ±6+ | Cambio dramático (usar con moderación) |

**💡 TIP:** La mayoría de efectos deben ser ±1 a ±3. Cambios de ±10 son demasiado drásticos.

---

## 🚩 Efectos de Flags

Modifican **variables de estado** (boolean, string, number).

### Sintaxis

```json
"effects": {
  "flags": {
    "nombre_flag": nuevo_valor
  }
}
```

### Comportamiento por Tipo

#### Boolean

```json
"effects": {
  "flags": {
    "has_dog": true,              // Establece en true
    "tutorial_completed": true
  }
}
```

**Comportamiento:** **Reemplaza** el valor actual.

#### String

```json
"effects": {
  "flags": {
    "relationship_status": "dating",    // Cambia a "dating"
    "work_performance": "excellent"
  }
}
```

**Comportamiento:** **Reemplaza** el valor actual.

#### Number

```json
"effects": {
  "flags": {
    "coffee_count": 1,    // +1 al valor actual
    "karma_points": 5     // +5 al valor actual
  }
}
```

**⚙️ Comportamiento especial:** Si tanto el flag actual como el efecto son **números**, se **suman**.

```javascript
// Estado actual: coffee_count = 2
// Efecto: coffee_count: 1
// Resultado: coffee_count = 3  (2 + 1)
```

### Ejemplos Completos

#### Trackear decisión importante

```json
{
  "id": "adoptar_perro",
  "text": "Ves un perro callejero. ¿Lo adoptas?",
  "choices": [
    {
      "text": "Sí, adoptarlo",
      "effects": {
        "flags": {
          "has_dog": true,             // Ahora tienes perro
          "adopted_street_dog": true,  // Adoptaste perro callejero
          "animal_lover": true
        }
      }
    },
    {
      "text": "No, dejarlo",
      "effects": {
        "flags": {
          "rejected_dog": true    // Trackea que rechazaste
        }
      }
    }
  ]
}
```

#### Cambiar estado de relación

```json
{
  "id": "reunion_ex",
  "text": "Tu ex quiere volver. ¿Qué haces?",
  "choices": [
    {
      "text": "Darle otra oportunidad",
      "effects": {
        "flags": {
          "relationship_status": "complicated"    // Cambia de "single" a "complicated"
        }
      }
    },
    {
      "text": "Cerrar el ciclo",
      "effects": {
        "flags": {
          "relationship_status": "single",    // Permanece "single"
          "broke_up": true                    // Marca como cerrado
        }
      }
    }
  ]
}
```

#### Contador de comportamiento

```json
{
  "id": "ayudar_colega",
  "text": "Tu colega pide ayuda otra vez...",
  "choices": [
    {
      "text": "Ayudar",
      "effects": {
        "flags": {
          "times_helped_colleagues": 1    // Incrementa contador
        }
      }
    }
  ]
}
```

---

## 👥 Efectos de Characters

Modifican **relaciones** con NPCs.

### Sintaxis

```json
"effects": {
  "characters": {
    "nombre_personaje": {
      "relationship": cambio,    // Número positivo o negativo
      "met": true/false
    }
  }
}
```

### Comportamiento

```javascript
nueva_relationship = relationship_actual + cambio
nueva_relationship = Math.max(-100, Math.min(100, nueva_relationship))  // Límites -100 a +100
```

### Ejemplos

#### Mejorar relación

```json
"effects": {
  "characters": {
    "ana": {
      "relationship": 10    // +10 relación con Ana
    }
  }
}
```

#### Empeorar relación

```json
"effects": {
  "characters": {
    "jefe": {
      "relationship": -15    // -15 relación con el jefe
    }
  }
}
```

#### Conocer personaje

```json
"effects": {
  "characters": {
    "pablo": {
      "met": true,          // Primera vez que conoces a Pablo
      "relationship": 5     // Primera impresión positiva
    }
  }
}
```

### Ejemplo Completo

```json
{
  "id": "primer_encuentro_ana",
  "text": "Una mujer se acerca: 'Hola, soy Ana.' ¿Cómo respondes?",
  "choices": [
    {
      "text": "Sonreír y presentarte amablemente",
      "effects": {
        "characters": {
          "ana": {
            "met": true,
            "relationship": 15    // Muy buena primera impresión
          }
        }
      }
    },
    {
      "text": "Ser cortante y alejarte",
      "effects": {
        "characters": {
          "ana": {
            "met": true,
            "relationship": -10    // Mala primera impresión
          }
        }
      }
    },
    {
      "text": "Ignorarla completamente",
      "effects": {
        "characters": {
          "ana": {
            "met": false,        // Ni siquiera la conociste
            "relationship": 0
          }
        }
      }
    }
  ]
}
```

### Balance Recomendado

| Magnitud | Impacto en Relación |
|----------|---------------------|
| ±5 a ±10 | Cambio menor (interacción normal) |
| ±11 a ±20 | Cambio significativo (favor/insulto) |
| ±21 a ±30 | Cambio importante (salvar/traicionar) |
| ±31+ | Cambio dramático (sacrificio/betrayal mortal) |

**💡 TIP:** La mayoría de interacciones deben ser ±5 a ±15. Cambios de ±50 solo para momentos críticos de la historia.

---

## 🎒 Efectos de Inventory

Modifican **items** y **dinero** del jugador.

### Sintaxis

```json
"effects": {
  "inventory": {
    "money": cambio,                    // Positivo (ganar) o negativo (gastar)
    "items": ["item1", "item2"],        // Añadir items
    "remove_items": ["item3"]           // Remover items
  }
}
```

### Ejemplos

#### Ganar dinero

```json
"effects": {
  "inventory": {
    "money": 100    // +$100
  }
}
```

#### Gastar dinero

```json
"effects": {
  "inventory": {
    "money": -50    // -$50 (gasta $50)
  }
}
```

#### Añadir items

```json
"effects": {
  "inventory": {
    "items": ["llave_dorada", "mapa_tesoro"]
  }
}
```

#### Remover items

```json
"effects": {
  "inventory": {
    "remove_items": ["mapa_viejo"]
  }
}
```

#### Combinado (compra)

```json
"effects": {
  "inventory": {
    "money": -500,                  // Gasta $500
    "items": ["espada_legendaria"]  // Recibe espada
  }
}
```

### Ejemplo Completo: Tienda

```json
{
  "id": "tienda_items",
  "text": "El mercader te ofrece varios items.",
  "choices": [
    {
      "text": "Comprar Espada ($500)",
      "effects": {
        "inventory": {
          "money": -500,
          "items": ["espada"]
        },
        "stats": {
          "animo": 2    // Feliz por la compra
        }
      }
    },
    {
      "text": "Vender Mapa Viejo ($100)",
      "effects": {
        "inventory": {
          "money": 100,
          "remove_items": ["mapa_viejo"]
        }
      }
    },
    {
      "text": "No comprar nada"
    }
  ]
}
```

---

## 🔓 Unlock/Lock Events

Desbloquean o bloquean eventos específicos.

### unlock_events

**Propósito:** Hacer que eventos **aparezcan** después de una decisión.

```json
"effects": {
  "unlock_events": ["evento_secreto", "evento_extra"]
}
```

**Uso típico:** Ramificaciones narrativas, contenido secreto.

### lock_events

**Propósito:** **Remover** eventos completados de la lista (para que puedan volver a aparecer si tienen `can_repeat: true`).

```json
"effects": {
  "lock_events": ["evento_bloqueado"]
}
```

**Uso típico:** Raramente usado, casos especiales.

### Ejemplo Completo

```json
{
  "id": "perro_callejero",
  "text": "Ves un perro callejero. ¿Lo adoptas?",
  "choices": [
    {
      "text": "Sí, adoptarlo",
      "effects": {
        "flags": {
          "has_dog": true
        },
        "unlock_events": [
          "veterinario_urgencia",    // Ahora el veterinario puede aparecer
          "paseo_perro"              // Ahora puedes pasear al perro
        ]
      }
    },
    {
      "text": "No"
    }
  ]
}

// Más tarde, estos eventos pueden aparecer:
{
  "id": "veterinario_urgencia",
  "day": 2,
  "type": "forced",
  "conditions": {
    "flags": {
      "has_dog": true
    }
  },
  "text": "Tu perro está enfermo..."
}
```

---

## ⏭️ Triggers Especiales

### trigger_next_day

**Propósito:** Avanzar al **siguiente día**.

```json
"effects": {
  "trigger_next_day": true
}
```

**Uso típico:** Eventos de "fin de día".

```json
{
  "id": "fin_dia_1",
  "day": 1,
  "type": "mandatory",
  "text": "El día termina. Es hora de dormir.",
  "choices": [{
    "text": "Continuar al Día 2",
    "effects": {
      "trigger_next_day": true
    }
  }]
}
```

### trigger_ending

**Propósito:** Terminar el juego y mostrar el **final**.

```json
"effects": {
  "trigger_ending": true
}
```

**Uso típico:** Último evento de la historia.

```json
{
  "id": "fin_dia_3",
  "day": 3,
  "type": "mandatory",
  "text": "Tu historia llega a su fin...",
  "choices": [{
    "text": "Ver mi final",
    "effects": {
      "trigger_ending": true
    }
  }]
}
```

---

## 🏆 Unlock Achievements

Desbloquea **logros**.

### Sintaxis

```json
"effects": {
  "unlocks": {
    "achievement": "achievement_id"
  }
}
```

### Ejemplo

```json
{
  "id": "adoptar_perro",
  "text": "Adoptas al perro callejero.",
  "choices": [{
    "text": "Llevarlo a casa",
    "effects": {
      "flags": {
        "has_dog": true
      },
      "unlocks": {
        "achievement": "dog_lover"    // Desbloquea logro
      }
    }
  }]
}
```

---

## 🔗 Combinando Efectos

Puedes combinar **todos** los efectos en una sola decisión:

```json
"effects": {
  "stats": {
    "energia": -2,
    "animo": 3
  },
  "flags": {
    "helped_pablo": true,
    "good_deeds_count": 1
  },
  "characters": {
    "pablo": {
      "relationship": 15
    },
    "jefe": {
      "relationship": -5
    }
  },
  "inventory": {
    "money": -20
  },
  "unlock_events": ["pablo_agradece"],
  "unlocks": {
    "achievement": "good_samaritan"
  }
}
```

---

## 💡 Tips para Efectos

**✅ HACER:**

1. **Efectos lógicos:** Si ayudas a alguien, su relación debe subir
2. **Balance:** No des +10 energía en cada decisión
3. **Consecuencias:** Cada decisión importante debe tener efectos visibles
4. **Feedback claro:** El jugador debe entender por qué cambió algo

**❌ EVITAR:**

1. **Efectos sin lógica:** Comprar café no debería bajar tu relación con tu jefe
2. **Cambios extremos:** ±50 en una stat rompe el balance
3. **Sin efectos:** Cada decisión debe cambiar algo (aunque sea mínimo)
4. **Typos:** Verifica que los nombres de stats/flags/personajes existan

---

## 💡 Ejemplos Completos

### Ejemplo 1: Historia Simple de 1 Día

**config.json**
```json
{
  "story": {
    "id": "simple_day",
    "title": "Un Día Cualquiera",
    "max_days": 1
  },
  "stats": {
    "felicidad": {
      "name": "Felicidad",
      "icon": "😊",
      "min": 0,
      "max": 10,
      "start": 5,
      "color": "#fbbf24"
    }
  },
  "flags": {},
  "characters": {},
  "inventory": { "enabled": false },
  "settings": { "allow_save": true }
}
```

**story.json**
```json
{
  "events": [
    {
      "id": "despertar",
      "day": 1,
      "time": "morning",
      "type": "mandatory",
      "text": "Te despiertas. ¿Qué haces?",
      "choices": [
        {
          "text": "Levantarme feliz",
          "effects": { "stats": { "felicidad": 2 } }
        },
        {
          "text": "Quedarme en cama",
          "effects": { "stats": { "felicidad": -1 } }
        }
      ]
    }
  ]
}
```

**endings.json**
```json
{
  "endings": [
    {
      "id": "dia_feliz",
      "priority": 1,
      "title": "Día Feliz",
      "conditions": { "stats": { "felicidad_min": 7 } },
      "content": { "message": "Fue un gran día!" }
    }
  ],
  "default_ending": {
    "id": "normal",
    "title": "Día Normal",
    "content": { "message": "Un día más." }
  }
}
```

### Ejemplo 2: Historia con Personajes y Flags

Ver `stories/fragments_original/` como referencia completa.

---

## ✅ Mejores Prácticas

### 1. IDs Únicos y Descriptivos
```json
// ✅ Bien
"id": "despertar_dia1"
"id": "encuentro_ana_cafeteria"

// ❌ Mal
"id": "event1"
"id": "e"
```

### 2. Eventos de Transición
Siempre incluye eventos de "fin de día":

```json
{
  "id": "fin_dia_1",
  "day": 1,
  "type": "mandatory",
  "text": "El día termina...",
  "choices": [{
    "text": "Continuar",
    "effects": { "trigger_next_day": true }
  }]
}
```

### 3. Balancea tus Stats
- Define rangos realistas (ej: -15 a +15)
- Efectos moderados (-2 a +2 típico)
- Finales con umbrales alcanzables

### 4. Usa Flags para Narrativa Compleja
```json
// Trackear consecuencias
"flags": {
  "ayudo_pablo": false,
  "ignoro_ex": false,
  "adopto_perro": false
}

// Luego condiciona eventos:
"conditions": {
  "flags": {
    "ayudo_pablo": true,
    "adopto_perro": true
  }
}
```

### 5. Prioridades de Finales
```
Priority 1-3:   Finales muy específicos
Priority 4-7:   Finales moderados
Priority 8-10:  Finales genéricos
Default:        Catch-all
```

---

## 🐛 Validación y Debug

### Validación Automática

El engine valida automáticamente:
- ✅ IDs duplicados
- ✅ Referencias a eventos inexistentes
- ✅ Finales imposibles de alcanzar (básico)

Verifica la **consola del navegador** al cargar:

```
✅ Historia validada correctamente
```

O:

```
⚠️ ID duplicado: evento_1
⚠️ Evento "evento_2" requiere evento inexistente: "evento_999"
```

### Debug Manual

1. **Habilita flags visibles:**
```json
"settings": {
  "show_flags": true
}
```

2. **Verifica la consola:**
```javascript

```

3. **Exporta guardados** para inspeccionar el estado.

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Evento no aparece | Condiciones muy restrictivas | Revisa `conditions` |
| Final incorrecto | Priority muy baja | Ajusta `priority` |
| Stats no cambian | Typo en nombre de stat | Verifica `config.stats` |
| Crash al cargar | JSON inválido | Valida con jsonlint.com |

---

## 🚀 Próximos Pasos

1. **Estudia** `stories/fragments_original/` como ejemplo
2. **Crea** tu carpeta en `stories/mi_historia/`
3. **Define** tus stats y flags en `config.json`
4. **Escribe** tus eventos en `story.json`
5. **Diseña** tus finales en `endings.json`
6. **Carga** tu historia cambiando esta línea en `main.js`:

```javascript
await engine.loadStory('stories/mi_historia');
```

7. **Testea** y ajusta basándote en el validador

---

## 📞 Soporte

¿Preguntas o bugs?
- Verifica esta documentación primero
- Revisa la consola del navegador (F12)
- Inspecciona `stories/fragments_original/` como referencia
- Usa el validador automático del engine

---

## 🎨 Patrones de Diseño Narrativo

### Narrativa Lineal

**Uso:** Historia con secuencia fija de eventos.

```json
// Evento 1
{
  "id": "evento_1",
  "type": "mandatory"
}

// Evento 2 (después del 1)
{
  "id": "evento_2",
  "type": "mandatory",
  "conditions": {
    "completed_events": ["evento_1"]
  }
}

// Evento 3 (después del 2)
{
  "id": "evento_3",
  "type": "mandatory",
  "conditions": {
    "completed_events": ["evento_2"]
  }
}
```

**Pros:** Fácil de escribir, control total de la narrativa.  
**Contras:** Poca rejugabilidad, sin libertad del jugador.

### Narrativa Ramificada

**Uso:** Diferentes caminos basados en decisiones.

```json
// Decisión crucial
{
  "id": "decision_camino",
  "choices": [
    {
      "text": "Camino A",
      "effects": {
        "flags": { "path": "A" }
      }
    },
    {
      "text": "Camino B",
      "effects": {
        "flags": { "path": "B" }
      }
    }
  ]
}

// Eventos solo para camino A
{
  "id": "evento_camino_a",
  "conditions": {
    "flags": { "path": "A" }
  }
}

// Eventos solo para camino B
{
  "id": "evento_camino_b",
  "conditions": {
    "flags": { "path": "B" }
  }
}
```

**Pros:** Alta rejugabilidad, libertad del jugador.  
**Contras:** Más contenido que crear, complejidad mayor.

### Narrativa por Stats

**Uso:** Eventos que aparecen según tus atributos.

```json
// Alto carisma
{
  "id": "convencer_guardia",
  "conditions": {
    "stats": { "carisma_min": 70 }
  },
  "text": "Tu carisma te permite convencer al guardia."
}

// Bajo carisma
{
  "id": "sobornar_guardia",
  "conditions": {
    "stats": { "carisma_max": 30 }
  },
  "text": "Sin carisma, solo te queda el soborno."
}
```

**Pros:** Rejugabilidad orgánica, builds diferentes.  
**Contras:** Difícil de balancear, testing complejo.

---

## ⚖️ Balance y Game Design

### Balanceo de Stats

**Regla de oro:** Los rangos deben permitir alcanzar todos los finales en 1 playthrough con decisiones inteligentes.

```
Rango: -15 a +15 (total: 30 puntos)
Eventos típicos: 15-20 eventos por día
Cambio promedio: ±2 por evento
Cambio máximo posible: ±40 en un día

Conclusión: Es posible llegar a +15 o -15, pero requiere consistencia.
```

### Densidad de Eventos

| Tipo de Historia | Eventos por Día | Total Eventos |
|------------------|-----------------|---------------|
| Corta (1 día) | 10-15 | 10-15 |
| Media (2-3 días) | 8-12 | 24-36 |
| Larga (4+ días) | 6-10 | 30-50 |

**💡 TIP:** Es mejor tener 10 eventos profundos que 30 eventos superficiales.

### Curva de Dificultad

```
Día 1: Tutorial y establecimiento
  - Decisiones simples
  - Introducir mecánicas
  - Stats cambian poco

Día 2: Complicaciones
  - Decisiones más complejas
  - Consecuencias de día 1
  - Stats más volátiles

Día 3: Clímax y resolución
  - Decisiones críticas
  - Alto impacto en final
  - Resolver subtramas
```

---

## ✅ Mejores Prácticas (Checklist Final)

### Antes de Publicar

```
☐ Todos los eventos tienen IDs únicos
☐ No hay referencias a eventos inexistentes
☐ Todos los personajes están en config.json
☐ Todas las stats están en config.json
☐ Todas las flags importantes están inicializadas
☐ can_repeat: true solo con condiciones restrictivas
☐ Al menos 3 finales alcanzables
☐ El default_ending existe
☐ Probaste la historia completa al menos 2 veces
☐ Los mandatory del día 1 funcionan
☐ Los eventos de fin de día tienen trigger_next_day
☐ El último evento tiene trigger_ending
```

### Convenciones de Nombres

**IDs de Eventos:**
```
✅ Bien: "alarma_day1", "encuentro_ana_cafeteria", "fin_dia_1"
❌ Mal: "event1", "e", "a"
```

**Flags:**
```
✅ Bien: "has_dog", "tutorial_completed", "relationship_status"
❌ Mal: "flag1", "temp", "x"
```

**Stats:**
```
✅ Bien: "energia", "animo", "carisma"
❌ Mal: "stat1", "e", "s"
```

**Personajes:**
```
✅ Bien: "ana", "pablo", "jefe", "madre"
❌ Mal: "char1", "npc", "person"
```

---

## 🐛 Errores Comunes y Soluciones

### Error 1: "Evento no aparece"

**Síntomas:** Un evento nunca se muestra.

**Causas comunes:**
1. Condiciones demasiado restrictivas
2. Día incorrecto
3. can_repeat: false y ya se completó
4. ID de evento referenciado mal escrito

**Solución:**
```javascript
// En consola del navegador:

// Verifica si tu evento está en la lista
```

### Error 2: "Final incorrecto"

**Síntomas:** Obtienes un final que no esperabas.

**Causas comunes:**
1. Prioridades incorrectas
2. Condiciones del final deseado no se cumplen
3. Otro final con priority más baja se cumple primero

**Solución:**
```javascript
// En consola:



```

### Error 3: "Bucle infinito"

**Síntomas:** El mismo evento se repite infinitamente.

**Causa:** `can_repeat: true` sin condiciones restrictivas.

**Solución:** Cambiar a `can_repeat: false` o añadir condiciones con flags/characters.

### Error 4: "Stats no cambian"

**Síntomas:** Los efectos no modifican stats.

**Causas comunes:**
1. Typo en nombre de stat
2. Stat no existe en config.json
3. Stat ya está en min/max

**Solución:** Verificar que el nombre coincida exactamente con config.json.

### Error 5: "JSON inválido"

**Síntomas:** La historia no carga, error en consola.

**Causas comunes:**
1. Coma faltante o extra
2. Comillas sin cerrar
3. Llave/corchete sin cerrar

**Solución:** Usa [jsonlint.com](https://jsonlint.com) para validar el JSON.

---

## 🔍 Validación y Debug

### Validación Automática del Engine

El engine valida automáticamente al cargar:

```javascript
✅ Historia validada correctamente

// O muestra errores:
⚠️ ID duplicado: evento_1
⚠️ Evento "evento_2" requiere evento inexistente: "evento_999"
🔴 BUCLE INFINITO: Evento "llamada_madre" tiene can_repeat=true sin condiciones restrictivas
```

### Herramientas de Debug

#### 1. Mostrar Flags en UI

```json
"settings": {
  "show_flags": true    // Muestra todas las flags en pantalla
}
```

#### 2. Consola del Navegador

```javascript
// Ver estado completo


// Ver eventos disponibles


// Ver qué final obtendrías ahora


// Simular cambio de stat
engine.gameState.stats.energia = 10;

// Simular cambio de flag
engine.gameState.flags.has_dog = true;
```

#### 3. Exportar Guardado

Útil para inspeccionar el estado:

```javascript
engine.exportSave();
// Descarga un JSON con todo el gameState
```

### Testing Manual

**Proceso recomendado:**

1. **Playthrough completo:** Juega del inicio al fin sin saltar
2. **Path testing:** Prueba cada ramificación importante
3. **Edge cases:** Prueba con stats en min/max
4. **Speed run:** ¿Puedes completar rápido? ¿Funciona?
5. **Achievement testing:** Verifica que todos se desbloquean

---

## 🚀 Workflow de Creación

### Paso 1: Planificación (Papel y Lápiz)

```
1. Define el tema/historia
2. Lista las stats necesarias (3-5 máximo)
3. Lista los personajes principales
4. Esboza los finales (3-8 finales)
5. Outline de eventos por día
```

### Paso 2: Crear config.json

```
1. Copia la plantilla de fragments_original
2. Modifica story (id, title, max_days)
3. Define tus stats personalizadas
4. Define flags iniciales
5. Define personajes
6. Ajusta settings
```

### Paso 3: Crear endings.json

```
1. Crea los finales con prioridades
2. Define condiciones realistas
3. Escribe mensajes y epílogos
4. Crea el default_ending
```

### Paso 4: Crear story.json

```
1. Eventos mandatory del día 1 (tutorial, inicio)
2. Eventos optional del día 1
3. Evento fin_dia_1 con trigger_next_day
4. Repite para día 2, 3, etc.
5. Último evento con trigger_ending
```

### Paso 5: Testing

```
1. Carga la historia en el navegador
2. Revisa consola (F12) para errores
3. Juega completamente 2-3 veces
4. Verifica que todos los finales son alcanzables
5. Pide feedback a alguien más
```

### Paso 6: Balance

```
1. Ajusta rangos de stats si es necesario
2. Rebalancea efectos de decisiones
3. Simplifica condiciones demasiado complejas
4. Añade eventos si los días son muy cortos
```

---

## 📝 Ejemplo: Historia Minimalista Completa

Ver archivo completo en `/docs/EJEMPLO_MINIMO.md` (próximamente)

### Estructura Mínima Funcional

**config.json:** 1 stat, 1 flag, sin personajes  
**story.json:** 5 eventos (inicio, 2 decisiones, fin día, final)  
**endings.json:** 2 finales + default

Esta es la **base mínima** para una historia funcional.

---

**¡Ahora tienes todo para crear historias interactivas increíbles! 🎉**

Recursos adicionales:
- 📂 Estudia `stories/fragments_original/` como referencia
- 🔧 Usa la consola del navegador para debug
- 📊 Valida con [jsonlint.com](https://jsonlint.com)
- 🎮 ¡Juega y testea constantemente!

---

**Fragments Engine v2.0** - Created with ❤️ for interactive storytelling
