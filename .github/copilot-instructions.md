# Fragments Engine v2.0 - AI Agent Instructions

## 🎯 Project Overview

Fragments is a **vanilla JavaScript narrative engine** for creating interactive stories with branching paths. Zero dependencies, file-based architecture, dual-version system (v1.0 legacy, v2.0 engine).

**Core Philosophy**: Dynamic configuration over hardcoded logic. Stories are JSON-driven; the engine adapts to any stat/flag/character structure defined in `config.json`.

## 🏗️ Architecture

### Three-Component Story System
Every story requires exactly **3 JSON files**:

1. **`config.json`** - Story metadata, stats, flags, characters, inventory, achievements
2. **`story.json`** - Events (narrative situations with choices)
3. **`endings.json`** - End conditions with priority-based evaluation

### Core Components

```
game.html + main.js          → UI controller (dual-mode: normal + test)
engine/engine.js             → Core logic (~700 lines)
story-editor.html/.js        → Visual editor (~3900 lines)
story-selector.html/.js      → Story browser
stories/[name]/*.json        → Story data
```

### Data Flow

```
Story JSONs → Engine.loadStory() → Engine.initGame() → main.js (UI updates)
                                  ↓
                            gameState (single source of truth)
                                  ↓
                    Stats/Flags/Characters/Inventory
```

## 🔧 Critical Development Patterns

### Field Naming Convention (CRITICAL)
The editor and engine **must use identical field names**:

- Events use `"text"` (NOT `"situation"`) - See story-editor.js lines 1065, 1145, 2123
- Config uses `"max_days"` (NOT `"days"`) - See story-editor.js lines 3607-3625
- Use `"starting_day"` (NOT `"startingDay"`) - underscore format

**Backward compatibility**: When loading old stories, normalize fields (see story-editor.js lines 360-382, 3696-3732).

### Test Mode Integration
**DO NOT create separate test files.** Use `game.html` in test mode:

- Set `localStorage.setItem('testMode', 'true')` + `testStory` data
- Open `game.html?test=true`
- Engine detects via URL param and loads from `loadStoryFromData()` instead of `fetch()`
- Eliminates code duplication (removed `test-story.html` - see commit history)

### Event Types & Execution Order
```javascript
// engine.js processes events in this order:
1. mandatory events (must appear)
2. forced events (triggered by flags)
3. random events (probability-based)
4. optional events (condition-based)

// Event structure:
{
  id: "unique_id",           // Required
  type: "optional",          // mandatory|optional|random|forced
  day: 1,                    // Which day (1-indexed)
  text: "Situation...",      // NOT "situation"
  choices: [...],            // Array of choice objects
  conditions: {...},         // When to show
  can_repeat: false          // One-time by default
}
```

### Condition System (Nested Boolean Logic)
Conditions use `min/max` suffixes and support deep checking:

```javascript
conditions: {
  stats: { energia_min: 5, animo_max: 3 },
  flags: { has_dog: true, karma: 10 },  // Exact match or threshold
  characters: { ana: { relationship_min: 50 } },
  day_min: 2,
  completed_events: ["evento_1", "evento_2"],
  previous_choices: { "evento_10": 0 },  // Choice index chosen
  inventory: { 
    money_min: 100, 
    has_items: ["key", "map"] 
  }
}
```

### Effects System (State Mutations)
```javascript
effects: {
  stats: { energia: -2, animo: 3 },           // Delta values
  flags: { helped_friend: true, karma: 10 },  // Set or increment
  characters: { ana: { relationship: 15 } },  // Delta relationship
  inventory: { 
    money: -50,                              // Delta
    items: ["gift"]                          // Add items
  },
  unlock_events: ["secret_event"],           // Make available
  lock_events: ["blocked_path"],             // Remove from pool
  trigger_next_day: true,                    // Force day transition
  unlocks: { achievement: "helper" }         // Grant achievement
}
```

## 📝 Editor Integration

### Story Editor State Management
- `currentStory` object holds all data (config + story + endings)
- Mark dirty on edits: `markDirty()` (line 3828)
- Auto-save to server: uses `fetch('/api/stories')` - **backend required**
- Local mode: Import/Export JSON only

### Validation Rules (story-editor.js:3780)
```javascript
validateStory() checks:
- Story ID and title exist
- At least 1 stat defined
- Events have: id, text, choices
- No duplicate event IDs
- At least 1 ending defined
```

### Critical Editor Functions
- `addEvent()` (line 1060) - Creates new events with `text` field
- `saveEvent()` (line 2123) - Reads from `#eventSituation` textarea
- `loadExistingStory()` (line 360) - Normalizes old `situation` → `text`
- `importFile()` (line 3696) - Applies same normalization

## 🎮 Game Flow

### Initialization Sequence
```javascript
1. main.js init()
2. Check URL param ?test=true or localStorage.selectedStory
3. engine.loadStory() or engine.loadStoryFromData()
4. engine.initGame() → creates fresh gameState
5. Attempt loadFromLocalStorage(0) for auto-save
6. showContinuePrompt() OR startNewGame()
```

### Day Transition Logic
- Check `trigger_next_day` effect
- Increment `gameState.current_day`
- Reset `current_event_index = 0`
- Call `getAvailableEvents()` for new day's event pool

### Ending Evaluation (engine.js)
```javascript
checkEnding() {
  // Sort endings by priority (higher = evaluated first)
  // Return first ending where checkConditions() === true
  // If no match and max_days reached, use fallback ending
}
```

## 🚨 Common Pitfalls

1. **Field Name Mismatch**: Always use `text` not `situation`, `max_days` not `days`
2. **Missing Backward Compat**: When changing field names, add normalization loops
3. **Test File Duplication**: Never create separate `test-*.html` files - use `?test=true` mode
4. **Direct gameState Mutations**: Use engine methods, not direct assignment (breaks reactivity)
5. **Hardcoded Stats**: Don't assume stat names - iterate `config.stats` dynamically
6. **LocalStorage Keys**: Use consistent prefixes (e.g., `fragments_save_0`, `fragments_autosave`)

## 🔍 Debugging Workflows

### Test Story in Editor
1. Click "🧪 Probar Historia" button (story-editor.js:3748)
2. Opens `game.html?test=true` with `localStorage.testStory`
3. Check browser console (F12) for engine logs: `✅ Historia cargada:` or `❌ Error...`

### Validate Story Structure
1. Click "✔️ Validar Historia" in editor
2. Reviews event IDs, required fields, ending definitions
3. Shows modal with issue list (see `validateStory()` implementation)

### Check Conditions at Runtime
```javascript
// In browser console:
engine.gameState           // Current state
engine.checkConditions(event.conditions)  // Test specific conditions
engine.getAvailableEvents()              // See current event pool
```

## 📂 File References

- **Engine core**: `engine/engine.js` (lines 1-705)
- **UI controller**: `main.js` (lines 1-732)
- **Editor logic**: `story-editor.js` (lines 1-3893)
- **Example story**: `stories/fragments_original/*.json`
- **Full documentation**: `STORY_CREATION_GUIDE.md` (3957 lines)

## 🎨 Styling Conventions

- CSS uses custom properties (`--accent`, `--bg-primary`, etc.)
- Dark theme: `body.dark-theme` class toggles all colors
- Responsive: Mobile-first with `@media (min-width: 768px)`
- No CSS frameworks - vanilla CSS with Grid/Flexbox

## 🔄 Recent Major Changes

- **2024-11**: Unified test system - removed `test-story.html`, now uses `game.html?test=true`
- **2024-11**: Field name standardization - `situation` → `text`, `days` → `max_days`
- **2024-11**: Added `loadStoryFromData()` method for in-memory story loading
- **2024-10**: Flowchart visualization system added (see `FLOWCHART_*.md` docs)

## 💡 When Modifying Code

1. **Changing field names**: Update ALL locations (editor + engine) + add backward compat
2. **Adding features**: Update config schema + engine logic + editor UI + validation
3. **UI changes**: Test both light/dark themes, mobile + desktop
4. **Story format**: Document in `STORY_CREATION_GUIDE.md` with examples
5. **Breaking changes**: Add migration logic in `loadExistingStory()` and `importFile()`

## 📚 Key Documentation Files

- `README.md` - User-facing overview
- `STORY_CREATION_GUIDE.md` - Complete story authoring reference
- `SELECTOR_EDITOR_GUIDE.md` - Editor usage guide
- `FLOWCHART_*.md` - Visual story flow documentation

---

**Remember**: Stories are JSON, engine is dynamic. Never hardcode stat/flag names. Always test in both normal and test modes.
