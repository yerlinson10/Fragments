/**
 * EDITOR STATE - Estado global del editor
 * Exporta el objeto currentStory y funciones de gestión de estado
 */

// Estado global de la historia actual
export let currentStory = {
  config: {
    story: {
      id: '',
      version: '1.0.0',
      title: '',
      subtitle: '',
      description: '',
      author: '',
      max_days: 1,
      starting_day: 1,
      starting_time: 'morning'
    },
    stats: {},
    flags: {},
    characters: {},
    inventory: {
      enabled: false,
      items: [],
      money: 0,
      max_items: 10
    },
    settings: {
      allow_save: true,
      allow_restart: true,
      show_stats: true,
      show_flags: false,
      show_characters: false,
      show_inventory: false,
      enable_sound: true,
      auto_save: true,
      save_slots: 3,
      enable_achievements: true
    },
    achievements: {}
  },
  story: {
    events: []
  },
  endings: {
    endings: [],
    default_ending: {
      title: 'Final',
      content: {
        message: 'Tu historia termina aquí.'
      }
    }
  }
};

// Estado de guardado (dirty flag)
let isDirty = false;

/**
 * Marcar historia como modificada
 */
export function markDirty() {
  isDirty = true;
  const statusBadge = document.getElementById('storyStatus');
  if (statusBadge) {
    statusBadge.textContent = 'Sin guardar';
    statusBadge.classList.remove('saved');
  }
}

/**
 * Marcar historia como guardada
 */
export function markClean() {
  isDirty = false;
  const statusBadge = document.getElementById('storyStatus');
  if (statusBadge) {
    statusBadge.textContent = 'Guardado';
    statusBadge.classList.add('saved');
  }
}

/**
 * Verificar si hay cambios sin guardar
 */
export function hasDirtyChanges() {
  return isDirty;
}

/**
 * Actualizar el estado completo
 */
export function setCurrentStory(newStory) {
  currentStory = newStory;
  markDirty();
}

/**
 * Obtener el estado actual
 */
export function getCurrentStory() {
  return currentStory;
}
