# Fragments Engine v2.0 - AI Agent Instructions

## 🎯 Project Overview

Fragments is a **vanilla JavaScript narrative engine** for creating interactive stories with branching paths. Modern Node.js server with Express.js for routing, clean URL structure, modular CSS architecture.

**Core Philosophy**: Dynamic configuration over hardcoded logic. Stories are JSON-driven; the engine adapts to any stat/flag/character structure defined in `config.json`.

## 🏗️ Architecture

### Project Structure (Professional Layout)

```
Fragments/
├── public/              # Frontend assets (served as static files)
│   ├── css/            # Stylesheets
│   │   ├── variables.css   # Theme variables (colors, spacing)
│   │   ├── common.css      # Reusable components (buttons, modals)
│   │   ├── game.css        # Game-specific styles
│   │   ├── selector.css    # Selector-specific styles
│   │   └── editor.css      # Editor-specific styles
│   ├── js/             # JavaScript files
│   │   ├── main.js         # Game UI controller
│   │   ├── story-selector.js
│   │   └── story-editor.js
│   ├── assets/         # Images, fonts, etc.
│   ├── game.html       # Main game page
│   └── index.html      # Landing page
├── views/              # Specific view templates
│   ├── selector.html   # Story selector page
│   └── editor.html     # Story editor page
├── src/                # Source code
│   └── engine/         # Game engine (symlinked to /engine/)
│       └── engine.js   # Core logic (~700 lines)
├── stories/            # Story data (JSON files)
│   └── [story_name]/
│       ├── config.json
│       ├── story.json
│       └── endings.json
├── docs/               # Documentation
├── node_modules/       # NPM dependencies
├── server.js           # Express.js HTTP server
└── package.json        # Project metadata

```

### Server Architecture (Express.js)

**Port**: 3000  
**Framework**: Express.js v5.x  
**File**: `server.js`

```javascript
// Clean URL routing (no .html extensions)
GET /              → public/index.html
GET /game          → public/game.html
GET /selector      → views/selector.html
GET /editor        → views/editor.html

// Static file serving
/css/*            → public/css/
/js/*             → public/js/
/engine/*         → engine/
/stories/*        → stories/
/node_modules/*   → node_modules/

// Redirects (backward compatibility with query params preservation)
/game.html        → /game (preserves ?query=params)
/story-selector.html → /selector?story=xxx
/story-editor.html   → /editor?story=xxx
```

**Critical**: Query parameters MUST be preserved in redirects for story loading to work.

### Three-Component Story System
Every story requires exactly **3 JSON files**:

1. **`config.json`** - Story metadata, stats, flags, characters, inventory, achievements
2. **`story.json`** - Events (narrative situations with choices)
3. **`endings.json`** - End conditions with priority-based evaluation

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
7. **Relative Paths in Views**: Always use absolute paths (`/css/...` NOT `./css/...`) in HTML files
8. **Query Parameters**: Preserve query params in Express redirects for story loading
9. **Mermaid.js Import**: Use `/node_modules/mermaid/...` (absolute path) not `./node_modules/...`

## 🌐 Server Development

### Starting the Server
```bash
npm start           # Start Express server on port 3000
npm run dev         # Same as start (development mode)
```

### Adding New Routes
```javascript
// In server.js
app.get('/new-route', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/new-page.html'));
});

// With query param preservation
app.get('/old-route.html', (req, res) => {
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  res.redirect('/new-route' + (queryString ? '?' + queryString : ''));
});
```

### Static Files
All static file directories are configured in `server.js`:
```javascript
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
// Add more as needed
```

## 🎨 CSS Architecture

### Modular CSS Structure
1. **variables.css** - Theme variables (colors, spacing, transitions)
   - Light/dark theme using CSS custom properties
   - `body.dark-theme` class for theme switching
   
2. **common.css** - Reusable components
   - Buttons: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-icon`
   - Modals: `.modal`, `.modal-content`, `.modal-actions`
   - Forms: `.form-group`, `input`, `textarea`, `select`
   - Toast notifications with animations
   - Theme toggle button
   - Utility classes: `.hidden`, `.fade-in`, `.fade-out`

3. **Page-specific CSS** - game.css, selector.css, editor.css
   - Import variables.css and common.css first
   - Override/extend as needed

### Import Order (CRITICAL)
```html
<link rel="stylesheet" href="/css/variables.css" />  <!-- ALWAYS FIRST -->
<link rel="stylesheet" href="/css/common.css" />     <!-- SECOND -->
<link rel="stylesheet" href="/css/page-specific.css" /> <!-- LAST -->
```

## 🚨 Common Pitfalls

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

- **2024-11 (v2.0)**: Express.js server implementation with clean URL routing
- **2024-11 (v2.0)**: Professional folder structure (public/, views/, src/, docs/)
- **2024-11 (v2.0)**: Modular CSS architecture (variables.css + common.css)
- **2024-11 (v2.0)**: Direct Mermaid.js import from node_modules (no file copying)
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
6. **New routes**: Add to `server.js` with query param preservation if needed
7. **New static folders**: Add to Express static middleware in `server.js`

## 📚 Key Documentation Files

- `README.md` - User-facing overview
- `STORY_CREATION_GUIDE.md` - Complete story authoring reference
- `SELECTOR_EDITOR_GUIDE.md` - Editor usage guide
- `FLOWCHART_*.md` - Visual story flow documentation
- `MIGRATION_STATUS.md` - v2.0 migration progress and changes

## 🔍 Debugging Workflows

### Server Issues
```bash
# Check if server is running
taskkill //F //IM node.exe   # Windows: Stop all Node processes
pkill -f "node server.js"    # Linux/Mac: Stop server

# Start server with logging
node server.js               # Watch console for 404s and errors

# Common issues:
# - 404 on page load: Check route mapping in server.js
# - 404 on assets: Verify static middleware paths
# - Query params lost: Check redirect preserves query string
```

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

- **Server**: `server.js` (Express.js routing and static files)
- **Engine core**: `engine/engine.js`
- **UI controller**: `public/js/main.js` (lines 1-732)
- **Editor logic**: `public/js/story-editor.js` (lines 1-3893)
- **Selector**: `public/js/story-selector.js`
- **Example story**: `stories/fragments_original/*.json`
- **Full documentation**: `docs/STORY_CREATION_GUIDE.md` (3957 lines)
- **CSS Variables**: `public/css/variables.css`
- **CSS Components**: `public/css/common.css`

---

**Remember**: Stories are JSON, engine is dynamic. Never hardcode stat/flag names. Always test in both normal and test modes.
 Use absolute paths (/) for imports in HTML, preserve query params in redirects.
