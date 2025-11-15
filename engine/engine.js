/**
 * FRAGMENTS ENGINE v2.0
 * Motor de historias interactivas dinámico y configurable
 *
 * Características:
 * - Stats/Flags/Characters/Inventory dinámicos
 * - Sistema de guardado con LocalStorage + Export/Import
 * - Condicionales complejas
 * - Eventos especiales (random, forced, one-time)
 * - Sistema multi-día
 * - Validación de historias
 * - Achievements
 */

class FragmentsEngine {
  constructor() {
    this.config = null;
    this.story = null;
    this.endings = null;
    this.gameState = null;
    this.currentStoryPath = null;
  }

  /**
   * Cargar una historia desde una carpeta
   */
  async loadStory(storyPath) {
    try {
      this.currentStoryPath = storyPath;

      // Cargar los 3 archivos JSON
      const [configRes, storyRes, endingsRes] = await Promise.all([
        fetch(`${storyPath}/config.json`),
        fetch(`${storyPath}/story.json`),
        fetch(`${storyPath}/endings.json`),
      ]);

      // Validar que todas las respuestas sean exitosas
      const files = ["config.json", "story.json", "endings.json"];
      [configRes, storyRes, endingsRes].forEach((res, i) => {
        if (!res.ok) {
          throw new Error(
            `No se pudo cargar ${files[i]}: ${res.status} ${res.statusText}`
          );
        }
      });

      this.config = await configRes.json();
      this.story = await storyRes.json();
      this.endings = await endingsRes.json();

      // Validar historia
      this.validateStory();

      return { success: true };
    } catch (error) {
      console.error("❌ Error cargando historia:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cargar una historia desde datos en memoria (para modo test)
   */
  loadStoryFromData(storyData) {
    try {
      this.currentStoryPath = null; // No hay ruta física

      // Validar que los datos tengan la estructura requerida
      if (!storyData || typeof storyData !== "object") {
        throw new Error("Los datos de la historia no son válidos");
      }

      if (!storyData.config || !storyData.story || !storyData.endings) {
        throw new Error("Faltan archivos requeridos: config, story o endings");
      }

      this.config = storyData.config;
      this.story = storyData.story;
      this.endings = storyData.endings;

      // Validar historia
      this.validateStory();

      return { success: true };
    } catch (error) {
      console.error("❌ Error cargando historia desde datos:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Inicializar un nuevo juego
   */
  initGame() {
    this.gameState = {
      story_id: this.config.story.id,
      current_day: this.config.story.starting_day || 1,
      current_event_index: 0,
      time_of_day: this.config.story.starting_time || "morning",

      // Stats dinámicas
      stats: {},

      // Flags dinámicas
      flags: { ...this.config.flags },

      // Characters dinámicos
      characters: {},

      // Inventory
      inventory: {
        items: [...(this.config.inventory?.initial_items || [])], // Copiar items iniciales
        money: this.config.inventory?.money || 0,
      },

      // Tracking
      completed_events: [],
      available_events: [],
      choices_history: [],

      // Achievements
      achievements: {},

      // Metadata
      created_at: new Date().toISOString(),
      last_played: new Date().toISOString(),
      playtime: 0,
    };

    // Inicializar stats
    for (const [key, statConfig] of Object.entries(this.config.stats)) {
      this.gameState.stats[key] = statConfig.start || 0;
    }

    // Inicializar characters
    for (const [key, charConfig] of Object.entries(
      this.config.characters || {}
    )) {
      this.gameState.characters[key] = {
        ...charConfig,
        relationship: charConfig.relationship || 0,
        met: charConfig.met || false,
      };
    }

    // Inicializar achievements
    for (const [key, achConfig] of Object.entries(
      this.config.achievements || {}
    )) {
      this.gameState.achievements[key] = {
        ...achConfig,
        unlocked: false,
      };
    }

    return this.gameState;
  }

  /**
   * Obtener eventos disponibles según el estado actual
   */
  getAvailableEvents() {
    const available = [];

    for (const event of this.story.events) {
      // Verificar si ya se completó y no puede repetirse
      if (
        this.gameState.completed_events.includes(event.id) &&
        !event.can_repeat
      ) {
        continue;
      }

      // Verificar condiciones
      if (!this.meetsConditions(event.conditions)) {
        continue;
      }

      // Verificar día
      if (event.day && event.day !== this.gameState.current_day) {
        continue;
      }

      // Eventos random: verificar probabilidad
      if (event.type === "random") {
        if (Math.random() > (event.probability || 0.5)) {
          continue;
        }
      }

      available.push(event);
    }

    // Ordenar por prioridad: mandatory > forced > optional > random
    available.sort((a, b) => {
      const priority = { mandatory: 0, forced: 1, optional: 2, random: 3 };
      return (priority[a.type] || 2) - (priority[b.type] || 2);
    });

    return available;
  }

  /**
   * Verificar si se cumplen las condiciones
   */
  meetsConditions(conditions) {
    if (!conditions) return true;

    // Verificar stats
    if (conditions.stats) {
      for (const [key, value] of Object.entries(conditions.stats)) {
        const statName = key.replace(/_min|_max/, "");
        const currentValue = this.gameState.stats[statName];

        if (key.endsWith("_min") && currentValue < value) return false;
        if (key.endsWith("_max") && currentValue > value) return false;
      }
    }

    // Verificar flags
    if (conditions.flags) {
      for (const [key, value] of Object.entries(conditions.flags)) {
        if (this.gameState.flags[key] !== value) return false;
      }
    }

    // Verificar characters
    if (conditions.characters) {
      for (const [charKey, charConditions] of Object.entries(
        conditions.characters
      )) {
        const char = this.gameState.characters[charKey];
        if (!char) return false;

        if (
          charConditions.met !== undefined &&
          char.met !== charConditions.met
        ) {
          return false;
        }

        if (charConditions.relationship_min !== undefined) {
          if (char.relationship < charConditions.relationship_min) return false;
        }

        if (charConditions.relationship_max !== undefined) {
          if (char.relationship > charConditions.relationship_max) return false;
        }
      }
    }

    // Verificar día
    if (
      conditions.day !== undefined &&
      this.gameState.current_day !== conditions.day
    ) {
      return false;
    }

    if (
      conditions.day_min !== undefined &&
      this.gameState.current_day < conditions.day_min
    ) {
      return false;
    }

    if (
      conditions.day_max !== undefined &&
      this.gameState.current_day > conditions.day_max
    ) {
      return false;
    }

    // Verificar eventos completados
    if (conditions.completed_events) {
      for (const eventId of conditions.completed_events) {
        if (!this.gameState.completed_events.includes(eventId)) return false;
      }
    }

    // Verificar choices previas
    if (conditions.previous_choices) {
      for (const [eventId, choiceIndex] of Object.entries(
        conditions.previous_choices
      )) {
        const choice = this.gameState.choices_history.find(
          (c) => c.event === eventId
        );
        if (!choice || choice.choice !== choiceIndex) return false;
      }
    }

    // Verificar flags requeridas
    if (conditions.has_flags) {
      for (const flagKey of conditions.has_flags) {
        if (!this.gameState.flags[flagKey]) return false;
      }
    }

    // Verificar inventory
    if (conditions.inventory) {
      if (conditions.inventory.money_min !== undefined) {
        if (this.gameState.inventory.money < conditions.inventory.money_min)
          return false;
      }

      if (conditions.inventory.has_items) {
        for (const item of conditions.inventory.has_items) {
          if (!this.gameState.inventory.items.includes(item)) return false;
        }
      }
    }

    return true;
  }

  /**
   * Aplicar efectos de una elección
   */
  applyEffects(effects) {
    if (!effects) return;

    const appliedEffects = {
      stats: {},
      flags: {},
      characters: {},
      inventory: {},
      unlocked_events: [],
      locked_events: [],
      achievements: [],
    };

    // Aplicar cambios de stats
    if (effects.stats) {
      for (const [key, value] of Object.entries(effects.stats)) {
        const oldValue = this.gameState.stats[key];
        this.gameState.stats[key] += value;

        // Aplicar límites
        const statConfig = this.config.stats[key];
        if (statConfig) {
          this.gameState.stats[key] = Math.max(
            statConfig.min,
            Math.min(statConfig.max, this.gameState.stats[key])
          );
        }

        appliedEffects.stats[key] = {
          old: oldValue,
          change: value,
          new: this.gameState.stats[key],
        };
      }
    }

    // Aplicar cambios de flags
    if (effects.flags) {
      for (const [key, value] of Object.entries(effects.flags)) {
        const oldValue = this.gameState.flags[key];

        // Si es numérico, sumar; si no, reemplazar
        if (typeof value === "number" && typeof oldValue === "number") {
          this.gameState.flags[key] = oldValue + value;
        } else {
          this.gameState.flags[key] = value;
        }

        appliedEffects.flags[key] = {
          old: oldValue,
          new: this.gameState.flags[key],
        };
      }
    }

    // Aplicar cambios de characters
    if (effects.characters) {
      for (const [charKey, charEffects] of Object.entries(effects.characters)) {
        if (!this.gameState.characters[charKey]) continue;

        const char = this.gameState.characters[charKey];
        const oldRelationship = char.relationship;

        if (charEffects.relationship !== undefined) {
          char.relationship += charEffects.relationship;
          char.relationship = Math.max(-100, Math.min(100, char.relationship));
        }

        if (charEffects.met !== undefined) {
          char.met = charEffects.met;
        }

        appliedEffects.characters[charKey] = {
          old_relationship: oldRelationship,
          new_relationship: char.relationship,
          met: char.met,
        };
      }
    }

    // Aplicar cambios de inventory
    if (effects.inventory) {
      if (effects.inventory.money !== undefined) {
        const oldMoney = this.gameState.inventory.money;
        this.gameState.inventory.money += effects.inventory.money;
        appliedEffects.inventory.money = {
          old: oldMoney,
          change: effects.inventory.money,
          new: this.gameState.inventory.money,
        };
      }

      // Agregar items - Soportar ambos formatos: 'items' y 'add'
      const itemsToAdd = effects.inventory.items || effects.inventory.add || [];
      if (itemsToAdd.length > 0) {
        for (const item of itemsToAdd) {
          if (!this.gameState.inventory.items.includes(item)) {
            this.gameState.inventory.items.push(item);
            appliedEffects.inventory.items_added =
              appliedEffects.inventory.items_added || [];
            appliedEffects.inventory.items_added.push(item);
          }
        }
      }

      // Quitar items - Soportar ambos formatos: 'remove_items' y 'remove'
      const itemsToRemove =
        effects.inventory.remove_items || effects.inventory.remove || [];
      if (itemsToRemove.length > 0) {
        for (const item of itemsToRemove) {
          const index = this.gameState.inventory.items.indexOf(item);
          if (index > -1) {
            this.gameState.inventory.items.splice(index, 1);
            appliedEffects.inventory.items_removed =
              appliedEffects.inventory.items_removed || [];
            appliedEffects.inventory.items_removed.push(item);
          }
        }
      }
    }

    // Unlock/Lock eventos
    if (effects.unlock_events) {
      appliedEffects.unlocked_events = effects.unlock_events;
    }

    if (effects.lock_events) {
      appliedEffects.locked_events = effects.lock_events;
      // Remover de completed para que no aparezcan más
      for (const eventId of effects.lock_events) {
        const index = this.gameState.completed_events.indexOf(eventId);
        if (index > -1) {
          this.gameState.completed_events.splice(index, 1);
        }
      }
    }

    // Achievements
    if (effects.unlocks && effects.unlocks.achievement) {
      const achKey = effects.unlocks.achievement;
      if (
        this.gameState.achievements[achKey] &&
        !this.gameState.achievements[achKey].unlocked
      ) {
        this.gameState.achievements[achKey].unlocked = true;
        appliedEffects.achievements.push(achKey);
      }
    }

    // Triggers especiales
    if (effects.trigger_next_day) {
      this.gameState.current_day++;
      appliedEffects.next_day = this.gameState.current_day;
    }

    if (effects.trigger_ending) {
      appliedEffects.trigger_ending = true;
    }

    return appliedEffects;
  }

  /**
   * Hacer una elección
   */
  makeChoice(event, choiceIndex) {
    const choice = event.choices[choiceIndex];

    // Guardar en historial
    this.gameState.choices_history.push({
      event: event.id,
      choice: choiceIndex,
      timestamp: new Date().toISOString(),
    });

    // Aplicar efectos
    const effects = this.applyEffects(choice.effects);

    // Marcar evento como completado
    if (!event.can_repeat) {
      this.gameState.completed_events.push(event.id);
    }

    // Actualizar timestamp
    this.gameState.last_played = new Date().toISOString();

    console.log("🎯 Elección realizada:", {
      event: event.id,
      choice: choiceIndex,
      effects,
    });

    return effects;
  }

  /**
   * Obtener el final apropiado
   */
  getEnding() {
    // Ordenar endings por prioridad (menor = más específico)
    const sortedEndings = [...this.endings.endings].sort(
      (a, b) => (a.priority || 999) - (b.priority || 999)
    );

    // Buscar el primer ending que cumple condiciones
    for (const ending of sortedEndings) {
      if (this.meetsConditions(ending.conditions)) {
        return ending;
      }
    }

    // Si ninguno cumple, devolver el default
    return this.endings.default_ending;
  }

  /**
   * Validar la historia (detectar errores)
   */
  validateStory() {
    const issues = [];

    // Verificar IDs duplicados
    const eventIds = new Set();
    for (const event of this.story.events) {
      if (eventIds.has(event.id)) {
        issues.push(`⚠️ ID duplicado: ${event.id}`);
      }
      eventIds.add(event.id);
    }

    // Verificar que las condiciones referencien eventos existentes
    for (const event of this.story.events) {
      if (event.conditions?.completed_events) {
        for (const requiredId of event.conditions.completed_events) {
          if (!eventIds.has(requiredId)) {
            issues.push(
              `⚠️ Evento "${event.id}" requiere evento inexistente: "${requiredId}"`
            );
          }
        }
      }
    }

    // Verificar que los finales sean alcanzables (básico)
    const maxStats = {};
    const minStats = {};
    for (const [key, statConfig] of Object.entries(this.config.stats)) {
      maxStats[key] = statConfig.max;
      minStats[key] = statConfig.min;
    }

    for (const ending of this.endings.endings) {
      if (ending.conditions?.stats) {
        for (const [key, value] of Object.entries(ending.conditions.stats)) {
          const statName = key.replace(/_min|_max/, "");
          if (key.endsWith("_min") && value > maxStats[statName]) {
            issues.push(
              `⚠️ Final "${ending.id}" requiere ${statName} >= ${value}, pero el máximo es ${maxStats[statName]}`
            );
          }
          if (key.endsWith("_max") && value < minStats[statName]) {
            issues.push(
              `⚠️ Final "${ending.id}" requiere ${statName} <= ${value}, pero el mínimo es ${minStats[statName]}`
            );
          }
        }
      }
    }

    // Verificar eventos con riesgo de bucle infinito
    for (const event of this.story.events) {
      if (event.can_repeat === true) {
        const conditions = event.conditions || {};
        const conditionKeys = Object.keys(conditions);

        // Verificar si tiene condiciones restrictivas
        let hasRestrictiveConditions = false;

        // Flags específicas (no vacías)
        if (conditions.flags && Object.keys(conditions.flags).length > 0) {
          hasRestrictiveConditions = true;
        }

        // Characters con condiciones
        if (
          conditions.characters &&
          Object.keys(conditions.characters).length > 0
        ) {
          hasRestrictiveConditions = true;
        }

        // Inventory
        if (
          conditions.inventory &&
          Object.keys(conditions.inventory).length > 0
        ) {
          hasRestrictiveConditions = true;
        }

        // Stats con valores específicos
        if (conditions.stats) {
          hasRestrictiveConditions = true;
        }

        // PELIGRO: Sin condiciones restrictivas
        if (!hasRestrictiveConditions && conditionKeys.length === 0) {
          issues.push(
            `🔴 BUCLE INFINITO: Evento "${event.id}" tiene can_repeat=true sin condiciones restrictivas`
          );
        }
        // ADVERTENCIA: Solo completed_events (no previene repetición del mismo evento)
        else if (
          !hasRestrictiveConditions &&
          conditionKeys.length === 1 &&
          conditions.completed_events
        ) {
          issues.push(
            `🟠 BUCLE INFINITO: Evento "${event.id}" tiene can_repeat=true pero solo verifica completed_events (no previene su propia repetición)`
          );
        }
        // ADVERTENCIA: Solo condición de día
        else if (
          !hasRestrictiveConditions &&
          conditionKeys.length === 1 &&
          conditions.day
        ) {
          issues.push(
            `🟠 BUCLE INFINITO: Evento "${event.id}" tiene can_repeat=true pero solo verifica el día (se repetirá infinitamente)`
          );
        }
      }
    }

    if (issues.length > 0) {
      console.warn("📋 Problemas detectados en la historia:");
      issues.forEach((issue) => console.warn(issue));
    } else {
    }

    return issues;
  }

  /**
   * SISTEMA DE GUARDADO
   */

  // Guardar en LocalStorage
  saveToLocalStorage(slotNumber = 1) {
    const slotKey = `fragments_save_${this.config.story.id}_slot${slotNumber}`;
    const saveData = {
      ...this.gameState,
      config_version: this.config.story.version,
      saved_at: new Date().toISOString(),
    };

    localStorage.setItem(slotKey, JSON.stringify(saveData));

    return true;
  }

  // Cargar desde LocalStorage
  loadFromLocalStorage(slotNumber = 1) {
    const slotKey = `fragments_save_${this.config.story.id}_slot${slotNumber}`;
    const savedData = localStorage.getItem(slotKey);

    if (!savedData) {
      console.warn(`⚠️ No hay guardado en slot ${slotNumber}`);
      return false;
    }

    this.gameState = JSON.parse(savedData);

    return true;
  }

  // Exportar a archivo JSON
  exportSave() {
    const saveData = {
      ...this.gameState,
      config_version: this.config.story.version,
      story_path: this.currentStoryPath,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.config.story.id}_day${this.gameState.current_day}_save.json`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  }

  // Importar desde archivo JSON
  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result);

          // Validar que sea para esta historia
          if (saveData.story_id !== this.config.story.id) {
            reject("Este guardado es de otra historia");
            return;
          }

          this.gameState = saveData;

          resolve(true);
        } catch (error) {
          reject("Error leyendo el archivo: " + error.message);
        }
      };

      reader.onerror = () => reject("Error leyendo el archivo");
      reader.readAsText(file);
    });
  }

  // Listar guardados disponibles
  listSaves() {
    const saves = [];
    for (let i = 1; i <= (this.config.settings.save_slots || 3); i++) {
      const slotKey = `fragments_save_${this.config.story.id}_slot${i}`;
      const savedData = localStorage.getItem(slotKey);

      if (savedData) {
        const data = JSON.parse(savedData);
        saves.push({
          slot: i,
          day: data.current_day,
          saved_at: data.saved_at,
          playtime: data.playtime,
        });
      }
    }
    return saves;
  }

  // Auto-save
  autoSave() {
    if (this.config.settings.auto_save) {
      this.saveToLocalStorage(0); // Slot 0 = auto-save
    }
  }
}

// Exportar para uso global
window.FragmentsEngine = FragmentsEngine;
