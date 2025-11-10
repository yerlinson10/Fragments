/**
 * STORY EDITOR - Editor visual de historias
 */

// ============================================
// SISTEMA AUTOMÁTICO DE ICONOS LUCIDE
// ============================================
// Inicializar iconos existentes y configurar auto-detección para nuevos elementos
(function initLucideAutoRefresh() {
  if (!window.lucide) {
    console.warn('⚠️ Lucide no está disponible');
    return;
  }
  
  // Inicializar iconos existentes al cargar
  lucide.createIcons();
  console.log('✅ Lucide Icons inicializados');
  
  // Debounce para evitar múltiples llamadas simultáneas
  let refreshTimeout = null;
  const refreshIcons = () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      lucide.createIcons();
      refreshTimeout = null;
    }, 10); // 10ms de debounce
  };
  
  // MutationObserver para detectar nuevos elementos con iconos
  const observer = new MutationObserver((mutations) => {
    let needsRefresh = false;
    
    for (const mutation of mutations) {
      // Verificar nodos agregados
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Es un elemento
          // Verificar si el nodo o sus hijos tienen iconos Lucide
          if (node.hasAttribute?.('data-lucide') || 
              node.querySelector?.('[data-lucide]')) {
            needsRefresh = true;
            break;
          }
        }
      }
      if (needsRefresh) break;
    }
    
    if (needsRefresh) {
      refreshIcons();
    }
  });
  
  // Observar cambios en el body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('👁️ MutationObserver activo para auto-refresh de iconos Lucide');
})();

// ============================================
// EVENTO GLOBAL PARA CERRAR MODALES CON ESC Y ATAJOS DE TECLADO
// ============================================
document.addEventListener('keydown', (e) => {
  // ESC: Cerrar modales
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    modals.forEach(modal => {
      modal.classList.add('hidden');
    });
  }
  
  // Ctrl+S: Guardar (prevenir guardado del navegador)
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveStory();
  }
  
  // Ctrl+Z: Undo
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  
  // Ctrl+Y o Ctrl+Shift+Z: Redo
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
    e.preventDefault();
    redo();
  }
  
  // Ctrl+N: Nuevo evento (solo en sección de eventos)
  if (e.ctrlKey && e.key === 'n') {
    const activeSection = document.querySelector('.editor-section.active');
    if (activeSection && activeSection.id === 'events-section') {
      e.preventDefault();
      addEvent();
    }
  }
});

// ============================================
// SISTEMA DE UNDO/REDO
// ============================================
const history = {
  past: [],
  present: null,
  future: [],
  maxSize: 50 // Máximo 50 estados en el historial
};

function saveToHistory() {
  // Guardar el estado actual en el pasado
  if (history.present) {
    history.past.push(JSON.parse(JSON.stringify(history.present)));
    
    // Limitar el tamaño del historial
    if (history.past.length > history.maxSize) {
      history.past.shift();
    }
  }
  
  // El presente ahora es el estado actual
  history.present = JSON.parse(JSON.stringify(currentStory));
  
  // Limpiar el futuro (ya no podemos hacer redo)
  history.future = [];
  
  updateHistoryButtons();
}

function undo() {
  if (history.past.length === 0) {
    showToast('No hay más acciones para deshacer', 'warning');
    return;
  }
  
  console.log('⏪ UNDO - Estado antes:', {
    past: history.past.length,
    future: history.future.length,
    present: history.present
  });
  
  // Mover el presente al futuro
  if (history.present) {
    history.future.push(JSON.parse(JSON.stringify(history.present)));
  }
  
  // Restaurar el último estado del pasado
  history.present = history.past.pop();
  currentStory = JSON.parse(JSON.stringify(history.present));
  
  console.log('⏪ UNDO - Estado después:', {
    past: history.past.length,
    future: history.future.length,
    currentStory: currentStory
  });
  
  // Re-renderizar todo
  renderAll();
  markDirty();
  updateHistoryButtons();
  showToast('Acción deshecha', 'success');
}

function redo() {
  if (history.future.length === 0) {
    showToast('No hay más acciones para rehacer', 'warning');
    return;
  }
  
  console.log('⏩ REDO - Estado antes:', {
    past: history.past.length,
    future: history.future.length,
    present: history.present
  });
  
  // Mover el presente al pasado
  if (history.present) {
    history.past.push(JSON.parse(JSON.stringify(history.present)));
  }
  
  // Restaurar el primer estado del futuro
  history.present = history.future.pop();
  currentStory = JSON.parse(JSON.stringify(history.present));
  
  console.log('⏩ REDO - Estado después:', {
    past: history.past.length,
    future: history.future.length,
    currentStory: currentStory
  });
  
  // Re-renderizar todo
  renderAll();
  markDirty();
  updateHistoryButtons();
  showToast('Acción rehecha', 'success');
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  
  if (undoBtn) {
    undoBtn.disabled = history.past.length === 0;
    undoBtn.title = history.past.length > 0 
      ? `Deshacer (Ctrl+Z) - ${history.past.length} acciones disponibles`
      : 'No hay acciones para deshacer';
  }
  
  if (redoBtn) {
    redoBtn.disabled = history.future.length === 0;
    redoBtn.title = history.future.length > 0
      ? `Rehacer (Ctrl+Y) - ${history.future.length} acciones disponibles`
      : 'No hay acciones para rehacer';
  }
}

// Función para re-renderizar todas las secciones
function renderAll() {
  console.log('🔄 Iniciando renderAll() completo...');
  console.log('📦 Estado actual:', currentStory);
  
  // Cerrar TODOS los modales abiertos antes de re-renderizar
  closeAllModals();
  
  // Actualizar todas las secciones del editor
  console.log('  → Renderizando Stats...');
  renderStats();
  console.log('  → Renderizando Flags...');
  renderFlags();
  console.log('  → Renderizando Characters...');
  renderCharacters();
  console.log('  → Renderizando Items...');
  renderItems();
  console.log('  → Renderizando Events...');
  renderEvents();
  console.log('  → Renderizando Endings...');
  renderEndings();
  console.log('  → Renderizando Achievements...');
  renderAchievements();
  
  // Actualizar información general (config)
  if (currentStory && currentStory.config) {
    console.log('  → Actualizando campos de configuración...');
    const storyIdInput = document.getElementById('storyId');
    if (storyIdInput) storyIdInput.value = currentStory.config.story_id || '';
    
    // Actualizar título en múltiples lugares
    const titleValue = currentStory.config.title || 'Nueva Historia';
    const titleInput = document.getElementById('storyTitleInput');
    const titleHeader = document.querySelector('.story-info h1');
    
    if (titleInput) titleInput.value = titleValue;
    if (titleHeader) titleHeader.textContent = titleValue;
    
    // Actualizar otros campos de configuración
    const fields = [
      { id: 'storySubtitle', value: currentStory.config.subtitle || '' },
      { id: 'storyDescription', value: currentStory.config.description || '' },
      { id: 'storyVersion', value: currentStory.config.version || '1.0.0' },
      { id: 'storyAuthor', value: currentStory.config.author || '' },
      { id: 'storyDays', value: currentStory.config.max_days || 1 },
      { id: 'startingDay', value: currentStory.config.starting_day || 1 },
      { id: 'startingTime', value: currentStory.config.starting_time || 'morning' },
      { id: 'saveSlots', value: currentStory.config.save_slots || 3 }
    ];
    
    fields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element) element.value = field.value;
    });
    
    // Checkboxes
    const autoSaveEl = document.getElementById('autoSave');
    if (autoSaveEl) autoSaveEl.checked = currentStory.config.auto_save !== false;
    
    const enableSoundEl = document.getElementById('enableSound');
    if (enableSoundEl) enableSoundEl.checked = currentStory.config.enable_sound !== false;
    
    const showCharactersEl = document.getElementById('showCharacters');
    if (showCharactersEl) showCharactersEl.checked = currentStory.config.show_characters || false;
    
    const showInventoryEl = document.getElementById('showInventory');
    if (showInventoryEl) showInventoryEl.checked = currentStory.config.show_inventory || false;
    
    // Inventario
    const inventoryEnabledEl = document.getElementById('inventoryEnabled');
    if (inventoryEnabledEl) inventoryEnabledEl.checked = currentStory.config.inventory?.enabled || false;
    
    const initialMoneyEl = document.getElementById('initialMoney');
    if (initialMoneyEl) initialMoneyEl.value = currentStory.config.inventory?.initial_money || 0;
    
    // Final por defecto
    const defaultEndingTitleEl = document.getElementById('defaultEndingTitle');
    if (defaultEndingTitleEl) defaultEndingTitleEl.value = currentStory.endings.default?.title || '';
    
    const defaultEndingMessageEl = document.getElementById('defaultEndingMessage');
    if (defaultEndingMessageEl) defaultEndingMessageEl.value = currentStory.endings.default?.message || '';
  }
  
  // Actualizar filtros de día
  console.log('  → Actualizando filtros...');
  updateDayFilter();
  
  console.log('✅ Vista actualizada completamente con undo/redo');
}

// ============================================
// UTILIDADES DE COLAPSABLES
// ============================================
function toggleCollapsible(headerId) {
  const header = document.getElementById(headerId);
  const content = header.nextElementSibling;
  const isActive = header.classList.contains('active');
  
  if (isActive) {
    header.classList.remove('active');
    content.classList.remove('active');
  } else {
    header.classList.add('active');
    content.classList.add('active');
  }
}

// ============================================
// UTILIDADES DE MODAL (reemplazo de alert/prompt/confirm)
// ============================================

// Mostrar confirmación (reemplazo de confirm)
function showConfirm(message, title = 'Confirmar') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    
    const yesBtn = document.getElementById('confirmModalYes');
    const noBtn = document.getElementById('confirmModalNo');
    
    const handleYes = () => {
      cleanup();
      resolve(true);
    };
    
    const handleNo = () => {
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      modal.classList.add('hidden');
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
    };
    
    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
    
    modal.classList.remove('hidden');

  });
}

// Mostrar input (reemplazo de prompt)
function showInput(label, title = 'Ingresa el valor', defaultValue = '', hint = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('inputModal');
    document.getElementById('inputModalTitle').textContent = title;
    document.getElementById('inputModalLabel').textContent = label;
    document.getElementById('inputModalHint').textContent = hint;
    
    const input = document.getElementById('inputModalInput');
    input.value = defaultValue;
    
    const submitBtn = document.getElementById('inputModalSubmit');
    const cancelBtn = document.getElementById('inputModalCancel');
    
    const handleSubmit = () => {
      const value = input.value.trim();
      cleanup();
      resolve(value || null);
    };
    
    const handleCancel = () => {
      cleanup();
      resolve(null);
    };
    
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    
    const cleanup = () => {
      modal.classList.add('hidden');
      submitBtn.removeEventListener('click', handleSubmit);
      cancelBtn.removeEventListener('click', handleCancel);
      input.removeEventListener('keypress', handleEnter);
    };
    
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);
    input.addEventListener('keypress', handleEnter);
    
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);

  });
}

// Mostrar selector (reemplazo de prompt con opciones)
function showSelect(label, options, title = 'Selecciona una opción', defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('selectModal');
    document.getElementById('selectModalTitle').textContent = title;
    document.getElementById('selectModalLabel').textContent = label;
    
    const select = document.getElementById('selectModalSelect');
    select.innerHTML = options.map(opt => 
      `<option value="${opt.value}" ${opt.value === defaultValue ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
    
    const submitBtn = document.getElementById('selectModalSubmit');
    const cancelBtn = document.getElementById('selectModalCancel');
    
    const handleSubmit = () => {
      const value = select.value;
      cleanup();
      resolve(value);
    };
    
    const handleCancel = () => {
      cleanup();
      resolve(null);
    };
    
    const cleanup = () => {
      modal.classList.add('hidden');
      submitBtn.removeEventListener('click', handleSubmit);
      cancelBtn.removeEventListener('click', handleCancel);
    };
    
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);
    
    modal.classList.remove('hidden');

  });
}

// Mostrar formulario complejo
function showForm(fields, title = 'Formulario', submitText = 'Guardar') {
  return new Promise((resolve) => {
    const modal = document.getElementById('formModal');
    document.getElementById('formModalTitle').textContent = title;
    
    const content = document.getElementById('formModalContent');
    content.innerHTML = fields.map(field => {
      if (field.type === 'text' || field.type === 'number') {
        return `
          <div class="form-group ${field.fullWidth ? 'full-width' : ''}">
            <label>${field.label}</label>
            <input 
              type="${field.type}" 
              id="formField_${field.id}" 
              value="${field.value || ''}"
              placeholder="${field.placeholder || ''}"
              ${field.min !== undefined ? `min="${field.min}"` : ''}
              ${field.max !== undefined ? `max="${field.max}"` : ''}
            />
            ${field.hint ? `<small>${field.hint}</small>` : ''}
          </div>
        `;
      } else if (field.type === 'textarea') {
        return `
          <div class="form-group ${field.fullWidth ? 'full-width' : ''}">
            <label>${field.label}</label>
            <textarea 
              id="formField_${field.id}" 
              rows="${field.rows || 3}"
              placeholder="${field.placeholder || ''}"
            >${field.value || ''}</textarea>
            ${field.hint ? `<small>${field.hint}</small>` : ''}
          </div>
        `;
      } else if (field.type === 'select') {
        return `
          <div class="form-group ${field.fullWidth ? 'full-width' : ''}">
            <label>${field.label}</label>
            <select id="formField_${field.id}">
              ${field.options.map(opt => 
                `<option value="${opt.value}" ${opt.value === field.value ? 'selected' : ''}>${opt.label}</option>`
              ).join('')}
            </select>
            ${field.hint ? `<small>${field.hint}</small>` : ''}
          </div>
        `;
      } else if (field.type === 'checkbox') {
        return `
          <div class="form-group ${field.fullWidth ? 'full-width' : ''}">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                id="formField_${field.id}"
                ${field.value ? 'checked' : ''}
              />
              ${field.label}
            </label>
            ${field.hint ? `<small>${field.hint}</small>` : ''}
          </div>
        `;
      }
    }).join('');
    
    const submitBtn = document.getElementById('formModalSubmit');
    const cancelBtn = document.getElementById('formModalCancel');
    
    submitBtn.textContent = submitText;
    
    const handleSubmit = () => {
      const values = {};
      fields.forEach(field => {
        const el = document.getElementById(`formField_${field.id}`);
        if (field.type === 'checkbox') {
          values[field.id] = el.checked;
        } else if (field.type === 'number') {
          values[field.id] = parseFloat(el.value) || 0;
        } else {
          values[field.id] = el.value;
        }
      });
      cleanup();
      resolve(values);
    };
    
    const handleCancel = () => {
      cleanup();
      resolve(null);
    };
    
    const cleanup = () => {
      modal.classList.add('hidden');
      submitBtn.removeEventListener('click', handleSubmit);
      cancelBtn.removeEventListener('click', handleCancel);
    };
    
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);
    
    modal.classList.remove('hidden');

  });
}

// ============================================
// ESTADO DEL EDITOR
// ============================================

// Estado del editor
let currentStory = {
  config: {
    story: {
      id: '',
      version: '1.0.0',
      title: '',
      subtitle: '',
      description: '',
      author: '',
      days: 1,
      starting_day: 1,
      starting_time: 'morning'
    },
    stats: {},
    flags: {},
    characters: {},
    inventory: {
      enabled: false,
      money: 0,
      items: {}
    },
    settings: {
      save_slots: 3,
      auto_save: true,
      enable_sound: true,
      show_characters: false,
      show_inventory: false
    },
    achievements: {}
  },
  story: {
    events: []
  },
  endings: {
    endings: [],
    default_ending: {
      title: 'Un nuevo comienzo',
      content: {
        message: 'Tu historia termina aquí...'
      }
    }
  }
};

let isDirty = false;
let currentEventEdit = null;

// Tema y Lucide Icons
function initTheme() {
  const savedTheme = localStorage.getItem('fragmentsTheme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeToggle').innerHTML = '<i data-lucide="sun"></i>';
  }
  
  // Inicializar Lucide Icons con retry
  initLucideIcons();
}

function initLucideIcons() {
  if (window.lucide && window.lucide.createIcons) {
    lucide.createIcons();
  } else {
    setTimeout(initLucideIcons, 100);
  }
}

document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  document.getElementById('themeToggle').innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  localStorage.setItem('fragmentsTheme', isDark ? 'dark' : 'light');
  
  // Re-inicializar iconos después de cambiar el HTML
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Toggle keyboard shortcuts panel
document.getElementById('keyboardShortcutsBtn').addEventListener('click', () => {
  const panel = document.getElementById('keyboardShortcuts');
  panel.classList.toggle('hidden');
});

// Navegación entre secciones
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const section = item.dataset.section;
    
    // Update menu
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
  });
});

// Volver al selector
document.getElementById('backBtn').addEventListener('click', async () => {
  if (isDirty) {
    const confirmed = await showConfirm(
      'Hay cambios sin guardar. ¿Deseas salir?',
      'Cambios sin guardar'
    );
    if (!confirmed) return;
  }
  window.location.href = 'story-selector.html';
});

// Event listeners para botones de cancelar de modales
document.getElementById('statModalCancel').addEventListener('click', () => closeModal('statModal'));
document.getElementById('flagModalCancel').addEventListener('click', () => closeModal('flagModal'));
document.getElementById('characterModalCancel').addEventListener('click', () => closeModal('characterModal'));
document.getElementById('itemModalCancel').addEventListener('click', () => closeModal('itemModal'));
document.getElementById('endingModalCancel').addEventListener('click', () => closeModal('endingModal'));
document.getElementById('achievementModalCancel').addEventListener('click', () => closeModal('achievementModal'));

// Event listener para cambio de tipo de flag
document.getElementById('flagType').addEventListener('change', (e) => {
  const type = e.target.value;
  const valueInput = document.getElementById('flagValue');
  const valueLabel = document.getElementById('flagValueLabel');
  
  switch(type) {
    case 'boolean':
      valueLabel.textContent = 'Valor inicial (true/false)';
      valueInput.type = 'checkbox';
      valueInput.checked = false;
      break;
    case 'number':
      valueLabel.textContent = 'Valor inicial (número)';
      valueInput.type = 'number';
      valueInput.value = '0';
      break;
    case 'string':
      valueLabel.textContent = 'Valor inicial (texto)';
      valueInput.type = 'text';
      valueInput.value = '';
      break;
  }
});

// Cargar historia existente
async function loadExistingStory(storyId) {
  try {
    const [configRes, storyRes, endingsRes] = await Promise.all([
      fetch(`stories/${storyId}/config.json`),
      fetch(`stories/${storyId}/story.json`),
      fetch(`stories/${storyId}/endings.json`)
    ]);

    // Validar que todas las respuestas sean exitosas
    if (!configRes.ok || !storyRes.ok || !endingsRes.ok) {
      const errors = [];
      if (!configRes.ok) errors.push(`config.json (${configRes.status})`);
      if (!storyRes.ok) errors.push(`story.json (${storyRes.status})`);
      if (!endingsRes.ok) errors.push(`endings.json (${endingsRes.status})`);
      throw new Error(`Error cargando archivos: ${errors.join(', ')}`);
    }

    currentStory.config = await configRes.json();
    currentStory.story = await storyRes.json();
    currentStory.endings = await endingsRes.json();
    
    // Validar estructura básica
    if (!currentStory.config.story || !currentStory.config.stats) {
      throw new Error('Archivo config.json con estructura inválida');
    }
    
    if (!currentStory.story.events || !Array.isArray(currentStory.story.events)) {
      throw new Error('Archivo story.json con estructura inválida');
    }
    
    if (!currentStory.endings.endings || !Array.isArray(currentStory.endings.endings)) {
      throw new Error('Archivo endings.json con estructura inválida');
    }
    
    // Normalizar: convertir 'situation' a 'text' si existe (backward compatibility)
    if (currentStory.story.events) {
      currentStory.story.events.forEach(event => {
        if (event.situation && !event.text) {
          event.text = event.situation;
          delete event.situation;
        }
      });
    }
    
    updateUI();
    showToast('Historia cargada correctamente', 'success');
  } catch (error) {
    console.error('Error cargando historia:', error);
    showToast(`Error cargando historia: ${error.message}`, 'error');
  }
}

// Actualizar UI con datos actuales
function updateUI() {
  // Config
  document.getElementById('storyId').value = currentStory.config.story.id || '';
  document.getElementById('storyVersion').value = currentStory.config.story.version || '1.0.0';
  document.getElementById('storyTitleInput').value = currentStory.config.story.title || '';
  document.getElementById('storySubtitle').value = currentStory.config.story.subtitle || '';
  document.getElementById('storyDescription').value = currentStory.config.story.description || '';
  document.getElementById('storyAuthor').value = currentStory.config.story.author || '';
  document.getElementById('storyDays').value = currentStory.config.story.max_days || currentStory.config.story.days || 1;
  document.getElementById('startingDay').value = currentStory.config.story.starting_day || 1;
  document.getElementById('startingTime').value = currentStory.config.story.starting_time || 'morning';
  document.getElementById('saveSlots').value = currentStory.config.settings.save_slots || 3;
  document.getElementById('autoSave').checked = currentStory.config.settings.auto_save !== false;
  document.getElementById('enableSound').checked = currentStory.config.settings.enable_sound !== false;
  document.getElementById('showCharacters').checked = currentStory.config.settings.show_characters === true;
  document.getElementById('showInventory').checked = currentStory.config.settings.show_inventory === true;
  
  // Inventory
  document.getElementById('inventoryEnabled').checked = currentStory.config.inventory.enabled === true;
  document.getElementById('initialMoney').value = currentStory.config.inventory.money || 0;
  
  // Default ending
  document.getElementById('defaultEndingTitle').value = currentStory.endings.default_ending.title || '';
  document.getElementById('defaultEndingMessage').value = currentStory.endings.default_ending.content.message || '';
  
  // Update title
  document.getElementById('storyTitle').textContent = currentStory.config.story.title || 'Nueva Historia';
  
  // Render lists
  renderStats();
  renderFlags();
  renderCharacters();
  renderItems();
  renderEvents();
  renderEndings();
  renderAchievements();
  
  // Update day filter
  updateDayFilter();
  
  // Inicializar historial con el estado cargado
  history.present = JSON.parse(JSON.stringify(currentStory));
  history.past = [];
  history.future = [];
  updateHistoryButtons();
}

// Stats
function renderStats() {
  const container = document.getElementById('statsList');
  const stats = currentStory.config.stats;
  
  if (Object.keys(stats).length === 0) {
    container.innerHTML = '';
    document.getElementById('statsEmpty').style.display = 'block';
    return;
  }
  
  document.getElementById('statsEmpty').style.display = 'none';
  
  container.innerHTML = Object.entries(stats).map(([key, stat]) => `
    <div class="item-card">
      <div class="item-header">
        <div class="item-title">${stat.icon || '<i data-lucide="bar-chart-2"></i>'} ${stat.name || key}</div>
        <div class="item-actions">
          <button class="btn-secondary" onclick="editStat('${key}')"><i data-lucide="pencil"></i> Editar</button>
          <button class="btn-danger" onclick="deleteStat('${key}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="item-content">
        <div class="form-group">
          <label>Min: ${stat.min || 0}</label>
        </div>
        <div class="form-group">
          <label>Max: ${stat.max || 100}</label>
        </div>
        <div class="form-group">
          <label>Inicial: ${stat.start || 50}</label>
        </div>
      </div>
    </div>
  `).join('');

}

window.addStat = function() {
  openModal('statModal');
  document.getElementById('statModalTitle').textContent = 'Agregar Estadística';
  document.getElementById('statKey').value = '';
  document.getElementById('statKey').disabled = false;
  document.getElementById('statName').value = '';
  document.getElementById('statIcon').value = '📊';
  document.getElementById('statMin').value = '0';
  document.getElementById('statMax').value = '100';
  document.getElementById('statStart').value = '50';
  
  const saveBtn = document.getElementById('statModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const key = document.getElementById('statKey').value.trim();
    const name = document.getElementById('statName').value.trim();
    const icon = document.getElementById('statIcon').value.trim();
    const min = parseInt(document.getElementById('statMin').value);
    const max = parseInt(document.getElementById('statMax').value);
    const start = parseInt(document.getElementById('statStart').value);
    
    if (!key) {
      showToast('El ID es obligatorio', 'error');
      return;
    }
    
    if (currentStory.config.stats[key]) {
      showToast('Ya existe una estadística con ese ID', 'error');
      return;
    }
    
    saveToHistory(); // Guardar antes de agregar
    
    currentStory.config.stats[key] = {
      name: name || key,
      icon: icon || '📊',
      min,
      max,
      start
    };
    
    markDirty();
    renderStats();
    closeModal('statModal');
    showToast('Estadística agregada', 'success');
  };
};

window.editStat = function(key) {
  const stat = currentStory.config.stats[key];
  
  openModal('statModal');
  document.getElementById('statModalTitle').textContent = `Editar: ${key}`;
  document.getElementById('statKey').value = key;
  document.getElementById('statKey').disabled = true;
  document.getElementById('statName').value = stat.name;
  document.getElementById('statIcon').value = stat.icon;
  document.getElementById('statMin').value = stat.min;
  document.getElementById('statMax').value = stat.max;
  document.getElementById('statStart').value = stat.start;
  
  const saveBtn = document.getElementById('statModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const name = document.getElementById('statName').value.trim();
    const icon = document.getElementById('statIcon').value.trim();
    const min = parseInt(document.getElementById('statMin').value);
    const max = parseInt(document.getElementById('statMax').value);
    const start = parseInt(document.getElementById('statStart').value);
    
    saveToHistory(); // Guardar antes de editar
    
    currentStory.config.stats[key] = {
      name,
      icon,
      min,
      max,
      start
    };
    
    markDirty();
    renderStats();
    closeModal('statModal');
    showToast('Estadística actualizada', 'success');
  };
};

window.deleteStat = async function(key) {
  const confirmed = await showConfirm(
    `¿Estás seguro de eliminar la stat "${key}"? Esta acción no se puede deshacer.`,
    'Eliminar Stat'
  );
  
  if (!confirmed) return;
  
  saveToHistory(); // Guardar antes de eliminar
  
  delete currentStory.config.stats[key];
  markDirty();
  renderStats();
  showToast('Stat eliminada', 'success');
};

// Flags
function renderFlags() {
  const container = document.getElementById('flagsList');
  const flags = currentStory.config.flags;
  
  if (Object.keys(flags).length === 0) {
    container.innerHTML = '';
    document.getElementById('flagsEmpty').style.display = 'block';
    return;
  }
  
  document.getElementById('flagsEmpty').style.display = 'none';
  
  container.innerHTML = Object.entries(flags).map(([key, value]) => `
    <div class="item-card">
      <div class="item-header">
        <div class="item-title"><i data-lucide="flag"></i> ${key}</div>
        <div class="item-actions">
          <button class="btn-secondary" onclick="editFlag('${key}')"><i data-lucide="pencil"></i> Editar</button>
          <button class="btn-danger" onclick="deleteFlag('${key}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="item-content">
        <div class="form-group">
          <label>Valor inicial: <strong>${JSON.stringify(value)}</strong></label>
        </div>
        <div class="form-group">
          <label>Tipo: ${typeof value}</label>
        </div>
      </div>
    </div>
  `).join('');

}

window.addFlag = function() {
  openModal('flagModal');
  document.getElementById('flagModalTitle').textContent = 'Agregar Variable';
  document.getElementById('flagKey').value = '';
  document.getElementById('flagKey').disabled = false;
  document.getElementById('flagType').value = 'boolean';
  document.getElementById('flagValue').type = 'checkbox';
  document.getElementById('flagValue').checked = false;
  document.getElementById('flagValueLabel').textContent = 'Valor inicial (true/false)';
  
  const saveBtn = document.getElementById('flagModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const key = document.getElementById('flagKey').value.trim();
    const type = document.getElementById('flagType').value;
    const valueInput = document.getElementById('flagValue');
    
    if (!key) {
      showToast('El ID es obligatorio', 'error');
      return;
    }
    
    if (currentStory.config.flags.hasOwnProperty(key)) {
      showToast('Ya existe una variable con ese ID', 'error');
      return;
    }
    
    saveToHistory(); // Guardar antes de agregar
    
    let value;
    if (type === 'boolean') {
      value = valueInput.checked;
    } else if (type === 'number') {
      value = parseFloat(valueInput.value) || 0;
    } else {
      value = valueInput.value;
    }
    
    currentStory.config.flags[key] = value;
    markDirty();
    renderFlags();
    closeModal('flagModal');
    showToast('Variable agregada', 'success');
  };
};

window.editFlag = function(key) {
  const currentValue = currentStory.config.flags[key];
  const type = typeof currentValue;
  
  openModal('flagModal');
  document.getElementById('flagModalTitle').textContent = `Editar: ${key}`;
  document.getElementById('flagKey').value = key;
  document.getElementById('flagKey').disabled = true;
  
  const valueInput = document.getElementById('flagValue');
  const valueLabel = document.getElementById('flagValueLabel');
  const typeSelect = document.getElementById('flagType');
  
  if (type === 'boolean') {
    typeSelect.value = 'boolean';
    valueLabel.textContent = 'Valor (true/false)';
    valueInput.type = 'checkbox';
    valueInput.checked = currentValue;
  } else if (type === 'number') {
    typeSelect.value = 'number';
    valueLabel.textContent = 'Valor (número)';
    valueInput.type = 'number';
    valueInput.value = currentValue;
  } else {
    typeSelect.value = 'string';
    valueLabel.textContent = 'Valor (texto)';
    valueInput.type = 'text';
    valueInput.value = currentValue;
  }
  
  const saveBtn = document.getElementById('flagModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const type = typeSelect.value;
    
    saveToHistory(); // Guardar antes de editar
    
    let value;
    if (type === 'boolean') {
      value = valueInput.checked;
    } else if (type === 'number') {
      value = parseFloat(valueInput.value) || 0;
    } else {
      value = valueInput.value;
    }
    
    currentStory.config.flags[key] = value;
    markDirty();
    renderFlags();
    closeModal('flagModal');
    showToast('Variable actualizada', 'success');
  };
};

window.deleteFlag = async function(key) {
  const confirmed = await showConfirm(
    `¿Estás seguro de eliminar la flag "${key}"?`,
    'Eliminar Flag'
  );
  
  if (!confirmed) return;
  
  saveToHistory(); // Guardar antes de eliminar
  
  delete currentStory.config.flags[key];
  markDirty();
  renderFlags();
  showToast('Flag eliminada', 'success');
};

// Characters
function renderCharacters() {
  const container = document.getElementById('charactersList');
  const characters = currentStory.config.characters;
  
  if (Object.keys(characters).length === 0) {
    container.innerHTML = '';
    document.getElementById('charactersEmpty').style.display = 'block';
    return;
  }
  
  document.getElementById('charactersEmpty').style.display = 'none';
  
  container.innerHTML = Object.entries(characters).map(([key, char]) => `
    <div class="item-card">
      <div class="item-header">
        <div class="item-title">${char.icon || '<i data-lucide="user"></i>'} ${char.name || key}</div>
        <div class="item-actions">
          <button class="btn-secondary" onclick="editCharacter('${key}')"><i data-lucide="pencil"></i> Editar</button>
          <button class="btn-danger" onclick="deleteCharacter('${key}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="item-content">
        <div class="form-group">
          <label>Relación inicial: ${char.relationship || 0}</label>
        </div>
        <div class="form-group">
          <label>Conocido: ${char.met ? 'Sí' : 'No'}</label>
        </div>
      </div>
    </div>
  `).join('');

}

window.addCharacter = function() {
  openModal('characterModal');
  document.getElementById('characterModalTitle').textContent = 'Agregar Personaje';
  document.getElementById('characterKey').value = '';
  document.getElementById('characterKey').disabled = false;
  document.getElementById('characterName').value = '';
  document.getElementById('characterIcon').value = '👤';
  document.getElementById('characterRelationship').value = '0';
  document.getElementById('characterMet').checked = false;
  
  const saveBtn = document.getElementById('characterModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const key = document.getElementById('characterKey').value.trim();
    const name = document.getElementById('characterName').value.trim();
    const icon = document.getElementById('characterIcon').value.trim();
    const relationship = parseInt(document.getElementById('characterRelationship').value);
    const met = document.getElementById('characterMet').checked;
    
    if (!key) {
      showToast('El ID es obligatorio', 'error');
      return;
    }
    
    if (currentStory.config.characters[key]) {
      showToast('Ya existe un personaje con ese ID', 'error');
      return;
    }
    
    saveToHistory(); // Guardar antes de agregar
    
    currentStory.config.characters[key] = {
      name: name || key,
      icon: icon || '👤',
      relationship,
      met
    };
    
    markDirty();
    renderCharacters();
    closeModal('characterModal');
    showToast('Personaje agregado', 'success');
  };
};

window.editCharacter = function(key) {
  const char = currentStory.config.characters[key];
  
  openModal('characterModal');
  document.getElementById('characterModalTitle').textContent = `Editar: ${key}`;
  document.getElementById('characterKey').value = key;
  document.getElementById('characterKey').disabled = true;
  document.getElementById('characterName').value = char.name;
  document.getElementById('characterIcon').value = char.icon;
  document.getElementById('characterRelationship').value = char.relationship;
  document.getElementById('characterMet').checked = char.met;
  
  const saveBtn = document.getElementById('characterModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const name = document.getElementById('characterName').value.trim();
    const icon = document.getElementById('characterIcon').value.trim();
    const relationship = parseInt(document.getElementById('characterRelationship').value);
    const met = document.getElementById('characterMet').checked;
    
    saveToHistory(); // Guardar antes de editar
    
    currentStory.config.characters[key] = {
      name,
      icon,
      relationship,
      met
    };
    
    markDirty();
    renderCharacters();
    closeModal('characterModal');
    showToast('Personaje actualizado', 'success');
  };
};

window.deleteCharacter = async function(key) {
  const confirmed = await showConfirm(
    `¿Estás seguro de eliminar el personaje "${key}"?`,
    'Eliminar Personaje'
  );
  
  if (!confirmed) return;
  
  saveToHistory(); // Guardar antes de eliminar
  
  delete currentStory.config.characters[key];
  markDirty();
  renderCharacters();
  showToast('Personaje eliminado', 'success');
};

// Items
function renderItems() {
  const container = document.getElementById('itemsList');
  const items = currentStory.config.inventory.items || {};
  
  if (Object.keys(items).length === 0) {
    container.innerHTML = '<div class="empty-message"><p>No hay items definidos</p></div>';
    return;
  }
  
  container.innerHTML = Object.entries(items).map(([key, item]) => `
    <div class="item-card">
      <div class="item-header">
        <div class="item-title">${item.icon || '<i data-lucide="package"></i>'} ${item.name || key}</div>
        <div class="item-actions">
          <button class="btn-secondary" onclick="editItem('${key}')"><i data-lucide="pencil"></i> Editar</button>
          <button class="btn-danger" onclick="deleteItem('${key}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="item-content">
        <div class="form-group">
          <label>${item.description || 'Sin descripción'}</label>
        </div>
      </div>
    </div>
  `).join('');

}

window.addItem = function() {
  openModal('itemModal');
  document.getElementById('itemModalTitle').textContent = 'Agregar Objeto';
  document.getElementById('itemKey').value = '';
  document.getElementById('itemKey').disabled = false;
  document.getElementById('itemName').value = '';
  document.getElementById('itemIcon').value = '📦';
  document.getElementById('itemDescription').value = '';
  
  const saveBtn = document.getElementById('itemModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const key = document.getElementById('itemKey').value.trim();
    const name = document.getElementById('itemName').value.trim();
    const icon = document.getElementById('itemIcon').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    
    if (!key) {
      showToast('El ID es obligatorio', 'error');
      return;
    }
    
    if (!currentStory.config.inventory.items) {
      currentStory.config.inventory.items = {};
    }
    
    if (currentStory.config.inventory.items[key]) {
      showToast('Ya existe un objeto con ese ID', 'error');
      return;
    }
    
    saveToHistory(); // Guardar antes de agregar
    
    currentStory.config.inventory.items[key] = {
      name: name || key,
      icon: icon || '📦',
      description: description || ''
    };
    
    markDirty();
    renderItems();
    closeModal('itemModal');
    showToast('Objeto agregado', 'success');
  };
};

window.editItem = function(key) {
  const item = currentStory.config.inventory.items[key];
  
  openModal('itemModal');
  document.getElementById('itemModalTitle').textContent = `Editar: ${key}`;
  document.getElementById('itemKey').value = key;
  document.getElementById('itemKey').disabled = true;
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemIcon').value = item.icon;
  document.getElementById('itemDescription').value = item.description || '';
  
  const saveBtn = document.getElementById('itemModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const name = document.getElementById('itemName').value.trim();
    const icon = document.getElementById('itemIcon').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    
    saveToHistory(); // Guardar antes de editar
    
    currentStory.config.inventory.items[key] = {
      name: name || key,
      icon: icon || '📦',
      description: description || ''
    };
    
    markDirty();
    renderItems();
    closeModal('itemModal');
    showToast('Objeto actualizado', 'success');
  };
};

window.deleteItem = async function(key) {
  const confirmed = await showConfirm(
    `¿Estás seguro de eliminar el item "${key}"?`,
    'Eliminar Item'
  );
  
  if (!confirmed) return;
  
  saveToHistory(); // Guardar antes de eliminar
  
  delete currentStory.config.inventory.items[key];
  markDirty();
  renderItems();
  showToast('Item eliminado', 'success');
};

// Events
let eventsFilter = 'all';
let eventsSearchQuery = '';
let dayFilterValue = 'all';

function renderEvents() {
  const container = document.getElementById('eventsList');
  let events = currentStory.story.events || [];
  
  // Guardar índices originales antes de filtrar
  const eventsWithOriginalIndex = events.map((event, originalIndex) => ({ event, originalIndex }));
  let filteredEvents = eventsWithOriginalIndex;
  
  // Apply filters
  if (eventsFilter !== 'all') {
    filteredEvents = filteredEvents.filter(e => e.event.type === eventsFilter);
  }
  
  if (dayFilterValue !== 'all') {
    filteredEvents = filteredEvents.filter(e => e.event.day === parseInt(dayFilterValue));
  }
  
  if (eventsSearchQuery) {
    const query = eventsSearchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(e => 
      e.event.id.toLowerCase().includes(query) ||
      (e.event.text && e.event.text.toLowerCase().includes(query))
    );
  }
  
  if (filteredEvents.length === 0) {
    container.innerHTML = '';
    document.getElementById('eventsEmpty').style.display = 'block';
    return;
  }
  
  document.getElementById('eventsEmpty').style.display = 'none';
  
  container.innerHTML = filteredEvents.map(({ event, originalIndex }) => {
    const isFirst = originalIndex === 0;
    const isLast = originalIndex === events.length - 1;
    
    return `
    <div class="event-card" draggable="true" data-index="${originalIndex}">
      <div class="event-header">
        <div class="event-title">
          <span class="drag-handle" title="Arrastrar para reordenar">⋮⋮</span>
          ${event.id}
        </div>
        <div style="display: flex; gap: 5px; align-items: center;">
          <span class="event-type-badge ${event.type || 'optional'}">${event.type || 'optional'}</span>
          <button class="btn-icon" onclick="duplicateEvent(${originalIndex}); event.stopPropagation();" 
                  title="Duplicar evento"><i data-lucide="copy"></i></button>
          <button class="btn-icon" onclick="moveEventUp(${originalIndex}); event.stopPropagation();" 
                  ${isFirst ? 'disabled' : ''} title="Subir"><i data-lucide="arrow-up"></i></button>
          <button class="btn-icon" onclick="moveEventDown(${originalIndex}); event.stopPropagation();" 
                  ${isLast ? 'disabled' : ''} title="Bajar"><i data-lucide="arrow-down"></i></button>
        </div>
      </div>
      <div class="event-situation" onclick="editEvent(${originalIndex})">${event.text ? event.text.substring(0, 150) : ''}${event.text && event.text.length > 150 ? '...' : ''}</div>
      <div class="event-meta" onclick="editEvent(${originalIndex})">
        <span><i data-lucide="calendar"></i> Día ${event.day || 'cualquiera'}</span>
        <span><i data-lucide="shuffle"></i> ${event.choices?.length || 0} opciones</span>
        ${event.can_repeat ? '<span><i data-lucide="repeat"></i> Repetible</span>' : ''}
      </div>
      ${event.choices && event.choices.length > 0 ? `
        <div class="event-choices" onclick="editEvent(${originalIndex})">
          <div class="event-choices-title">Opciones:</div>
          ${event.choices.map((choice, i) => `
            <div class="choice-item">${i + 1}. ${choice.text.substring(0, 60)}${choice.text.length > 60 ? '...' : ''}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  }).join('');
  
  // Inicializar drag and drop
  initDragAndDrop();

}

// ============================================
// DRAG AND DROP PARA REORDENAR EVENTOS
// ============================================
function initDragAndDrop() {
  const eventCards = document.querySelectorAll('.event-card');
  let draggedElement = null;
  let draggedIndex = null;
  
  eventCards.forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      draggedElement = card;
      draggedIndex = parseInt(card.dataset.index);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', card.innerHTML);
    });
    
    card.addEventListener('dragend', (e) => {
      card.classList.remove('dragging');
      
      // Remover todos los indicadores de drop
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (draggedElement !== card) {
        card.classList.add('drag-over');
      }
    });
    
    card.addEventListener('dragleave', (e) => {
      card.classList.remove('drag-over');
    });
    
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      card.classList.remove('drag-over');
      
      if (draggedElement !== card) {
        const targetIndex = parseInt(card.dataset.index);
        
        // Reordenar en el array
        if (draggedIndex !== null && targetIndex !== null) {
          saveToHistory(); // Guardar antes de mover
          
          const [movedEvent] = currentStory.story.events.splice(draggedIndex, 1);
          currentStory.story.events.splice(targetIndex, 0, movedEvent);
          
          markDirty();
          renderEvents();
          showToast('Evento reordenado', 'success');
        }
      }
    });
  });
}

function updateDayFilter() {
  const select = document.getElementById('dayFilter');
  const days = currentStory.config.story.max_days || currentStory.config.story.days || 1;
  
  let options = '<option value="all">Todos los días</option>';
  for (let i = 1; i <= days; i++) {
    options += `<option value="${i}">Día ${i}</option>`;
  }
  
  select.innerHTML = options;
}

document.getElementById('eventsSearch').addEventListener('input', (e) => {
  eventsSearchQuery = e.target.value;
  renderEvents();
});

document.getElementById('eventsFilter').addEventListener('change', (e) => {
  eventsFilter = e.target.value;
  renderEvents();
});

document.getElementById('dayFilter').addEventListener('change', (e) => {
  dayFilterValue = e.target.value;
  renderEvents();
});

window.addEvent = function() {
  saveToHistory(); // Guardar antes de agregar
  
  const event = {
    id: `evento_${Date.now()}`,
    type: 'optional',
    day: 1,
    text: '',
    choices: [
      { text: 'Opción 1', effects: {} },
      { text: 'Opción 2', effects: {} }
    ],
    can_repeat: false,
    conditions: {}
  };
  
  currentStory.story.events.push(event);
  markDirty();
  renderEvents();
  editEvent(currentStory.story.events.length - 1);
};

window.editEvent = function(index) {
  const event = currentStory.story.events[index];
  currentEventEdit = index;
  
  // Create detailed modal for event editing
  const modal = document.getElementById('eventModal');
  const content = document.getElementById('eventModalContent');
  
  content.innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>ID del Evento *</label>
        <input type="text" id="eventId" value="${event.id}" required />
      </div>
      
      <div class="form-group">
        <label>Tipo</label>
        <select id="eventType">
          <option value="optional" ${event.type === 'optional' ? 'selected' : ''}>Opcional</option>
          <option value="mandatory" ${event.type === 'mandatory' ? 'selected' : ''}>Obligatorio</option>
          <option value="random" ${event.type === 'random' ? 'selected' : ''}>Aleatorio</option>
          <option value="forced" ${event.type === 'forced' ? 'selected' : ''}>Forzado</option>
        </select>
      </div>
      
      <div class="form-group" id="probabilityGroup" style="${event.type === 'random' ? '' : 'display:none'}">
        <label>Probabilidad (0-1)</label>
        <input type="number" id="eventProbability" min="0" max="1" step="0.1" value="${event.probability || 0.5}" placeholder="0.5 = 50%" />
        <small>0 = 0%, 1 = 100%</small>
      </div>
      
      <div class="form-group">
        <label>Día (0 = cualquiera)</label>
        <input type="number" id="eventDay" min="0" value="${event.day || 0}" />
      </div>
      
      <div class="form-group">
        <label>Momento del día</label>
        <select id="eventTime">
          <option value="" ${!event.time ? 'selected' : ''}>Cualquier momento</option>
          <option value="morning" ${event.time === 'morning' ? 'selected' : ''}>Mañana</option>
          <option value="afternoon" ${event.time === 'afternoon' ? 'selected' : ''}>Tarde</option>
          <option value="evening" ${event.time === 'evening' ? 'selected' : ''}>Noche</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Hora más temprana (0-23)</label>
        <input type="number" id="eventEarliestHour" min="0" max="23" value="${event.earliest_hour !== undefined ? event.earliest_hour : ''}" placeholder="Ej: 8" />
      </div>
      
      <div class="form-group">
        <label>Hora más tardía (0-23)</label>
        <input type="number" id="eventLatestHour" min="0" max="23" value="${event.latest_hour !== undefined ? event.latest_hour : ''}" placeholder="Ej: 22" />
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="eventCanRepeat" ${event.can_repeat ? 'checked' : ''} />
          Puede repetirse
        </label>
      </div>
      
      <div class="form-group full-width">
        <label>Situación / Texto del Evento *</label>
        <textarea id="eventSituation" rows="4" required>${event.text || ''}</textarea>
      </div>
      
      <div class="form-group full-width">
        <div class="collapsible-header" id="event-conditions-header" onclick="toggleCollapsible('event-conditions-header')">
          <h4><i data-lucide="clock"></i> Condiciones para que aparezca este evento</h4>
          <span class="collapsible-icon">►</span>
        </div>
        <div class="collapsible-content">
          <div class="conditions-builder">
            <div class="condition-section">
              <h4><i data-lucide="bar-chart-3"></i> Estadísticas</h4>
              <div id="eventStatsConditions"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addEventStatCondition()">+ Agregar condición</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="flag"></i> Variables</h4>
              <div id="eventFlagsConditions"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addEventFlagCondition()">+ Agregar condición</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="users"></i> Personajes</h4>
              <div id="eventCharactersConditions"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addEventCharacterCondition()">+ Agregar condición</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="calendar"></i> Rango de Días</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div>
                  <label>Día mínimo</label>
                  <input type="number" id="eventDayMin" min="0" value="${event.conditions?.day_min || ''}" placeholder="Desde día..." />
                </div>
                <div>
                  <label>Día máximo</label>
                  <input type="number" id="eventDayMax" min="0" value="${event.conditions?.day_max || ''}" placeholder="Hasta día..." />
                </div>
              </div>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="check-square"></i> Eventos Completados Requeridos</h4>
              <div id="eventCompletedEventsConditions"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addCompletedEventCondition()">+ Agregar evento</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="target"></i> Decisiones Previas</h4>
              <div id="eventPreviousChoicesConditions"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addPreviousChoiceCondition()">+ Agregar decisión</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="coins"></i> Inventario</h4>
              <div>
                <label>Dinero mínimo requerido</label>
                <input type="number" id="eventMoneyMin" value="${event.conditions?.inventory?.money_min || ''}" placeholder="Ej: 100" />
              </div>
              <div style="margin-top: 0.5rem;">
                <label>Items requeridos</label>
                <div id="eventRequiredItems"></div>
                <button type="button" class="btn-secondary btn-small" onclick="addRequiredItem()">+ Agregar item</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-group full-width">
        <h4><i data-lucide="message-circle"></i> Opciones</h4>
        <div id="eventChoicesList"></div>
        <button class="btn-add" onclick="addChoiceToEvent()" type="button">+ Agregar Opción</button>
      </div>
    </div>
    
    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
      <button class="btn-primary" onclick="saveEvent()"><i data-lucide="save"></i> Guardar Evento</button>
      <button class="btn-danger" onclick="deleteEvent()"><i data-lucide="trash-2"></i> Eliminar Evento</button>
      <button class="btn-secondary" onclick="closeModal('eventModal')">Cancelar</button>
    </div>
  `;
  
  // Load event conditions
  loadEventConditions(event.conditions || {});
  
  // Render choices
  renderEventChoices(event.choices);
  
  modal.classList.remove('hidden');

  
  // Toggle probability field visibility
  const typeSelect = document.getElementById('eventType');
  const probabilityGroup = document.getElementById('probabilityGroup');
  typeSelect.addEventListener('change', () => {
    probabilityGroup.style.display = typeSelect.value === 'random' ? '' : 'none';
  });
};

// Event conditions and choices helpers
let eventConditionsData = { stats: {}, flags: {}, characters: {} };
let eventChoicesData = [];

function clearEventConditions() {
  eventConditionsData = { stats: {}, flags: {}, characters: {}, completed_events: [], previous_choices: {}, inventory: {} };
  document.getElementById('eventStatsConditions').innerHTML = '';
  document.getElementById('eventFlagsConditions').innerHTML = '';
  document.getElementById('eventCharactersConditions').innerHTML = '';
  document.getElementById('eventCompletedEventsConditions').innerHTML = '';
  document.getElementById('eventPreviousChoicesConditions').innerHTML = '';
  document.getElementById('eventRequiredItems').innerHTML = '';
}

function loadEventConditions(conditions) {
  clearEventConditions();
  
  // Load stats - Soportar ambos formatos
  if (conditions.stats) {
    Object.entries(conditions.stats).forEach(([key, value]) => {
      // Formato engine: { "honor_min": 50, "honor_max": 100 }
      if (key.endsWith('_min')) {
        const stat = key.replace('_min', '');
        addEventStatCondition(stat, 'min', value);
      } else if (key.endsWith('_max')) {
        const stat = key.replace('_max', '');
        addEventStatCondition(stat, 'max', value);
      }
      // Formato editor antiguo: { "honor": { min: 50, max: 100 } }
      else if (typeof value === 'object') {
        if (value.min !== undefined) addEventStatCondition(key, 'min', value.min);
        if (value.max !== undefined) addEventStatCondition(key, 'max', value.max);
      }
    });
  }
  
  if (conditions.flags) {
    Object.entries(conditions.flags).forEach(([flag, value]) => {
      addEventFlagCondition(flag, value);
    });
  }
  
  if (conditions.characters) {
    Object.entries(conditions.characters).forEach(([char, values]) => {
      if (values.relationship_min !== undefined) addEventCharacterCondition(char, 'relationship_min', values.relationship_min);
      if (values.relationship_max !== undefined) addEventCharacterCondition(char, 'relationship_max', values.relationship_max);
      if (values.met !== undefined) addEventCharacterCondition(char, 'met', values.met);
    });
  }
  
  // Load completed_events
  if (conditions.completed_events) {
    conditions.completed_events.forEach(eventId => {
      addCompletedEventCondition(eventId);
    });
  }
  
  // Load previous_choices
  if (conditions.previous_choices) {
    Object.entries(conditions.previous_choices).forEach(([eventId, choiceIndex]) => {
      addPreviousChoiceCondition(eventId, choiceIndex);
    });
  }
  
  // Load inventory conditions
  if (conditions.inventory) {
    if (conditions.inventory.has_items) {
      conditions.inventory.has_items.forEach(item => {
        addRequiredItem(item);
      });
    }
  }
}

function getEventConditions() {
  const conditions = {};
  
  // Stats - Convertir al formato del engine
  if (Object.keys(eventConditionsData.stats).length > 0) {
    conditions.stats = {};
    Object.entries(eventConditionsData.stats).forEach(([stat, values]) => {
      // Formato engine: { "honor_min": 50, "honor_max": 100 }
      if (values.min !== undefined) {
        conditions.stats[`${stat}_min`] = values.min;
      }
      if (values.max !== undefined) {
        conditions.stats[`${stat}_max`] = values.max;
      }
    });
  }
  
  if (Object.keys(eventConditionsData.flags).length > 0) {
    conditions.flags = eventConditionsData.flags;
  }
  
  if (Object.keys(eventConditionsData.characters).length > 0) {
    conditions.characters = {};
    Object.entries(eventConditionsData.characters).forEach(([char, values]) => {
      conditions.characters[char] = values;
    });
  }
  
  // day_min y day_max
  const dayMin = parseInt(document.getElementById('eventDayMin')?.value);
  const dayMax = parseInt(document.getElementById('eventDayMax')?.value);
  if (dayMin) conditions.day_min = dayMin;
  if (dayMax) conditions.day_max = dayMax;
  
  // completed_events
  if (eventConditionsData.completed_events && eventConditionsData.completed_events.length > 0) {
    conditions.completed_events = eventConditionsData.completed_events;
  }
  
  // previous_choices
  if (eventConditionsData.previous_choices && Object.keys(eventConditionsData.previous_choices).length > 0) {
    conditions.previous_choices = eventConditionsData.previous_choices;
  }
  
  // inventory
  const moneyMin = parseInt(document.getElementById('eventMoneyMin')?.value);
  if (moneyMin || (eventConditionsData.inventory?.has_items && eventConditionsData.inventory.has_items.length > 0)) {
    conditions.inventory = {};
    if (moneyMin) conditions.inventory.money_min = moneyMin;
    if (eventConditionsData.inventory?.has_items && eventConditionsData.inventory.has_items.length > 0) {
      conditions.inventory.has_items = eventConditionsData.inventory.has_items;
    }
  }
  
  return conditions;
}

window.addEventStatCondition = function(statKey = '', type = 'min', value = 0) {
  const container = document.getElementById('eventStatsConditions');
  const id = `event-stat-${Date.now()}-${Math.random()}`;
  const availableStats = Object.keys(currentStory.config.stats);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="stat-select">
      <option value="">Selecciona...</option>
      ${availableStats.map(s => `<option value="${s}" ${s === statKey ? 'selected' : ''}>${currentStory.config.stats[s].name}</option>`).join('')}
    </select>
    <select class="stat-type">
      <option value="min" ${type === 'min' ? 'selected' : ''}>Mínimo</option>
      <option value="max" ${type === 'max' ? 'selected' : ''}>Máximo</option>
    </select>
    <input type="number" class="stat-value" value="${value}" />
    <button class="btn-danger" onclick="removeEventStatCondition('${id}')" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const stat = div.querySelector('.stat-select').value;
    const condType = div.querySelector('.stat-type').value;
    const val = parseInt(div.querySelector('.stat-value').value) || 0;
    if (stat) {
      if (!eventConditionsData.stats[stat]) eventConditionsData.stats[stat] = {};
      eventConditionsData.stats[stat][condType] = val;
    }
  };
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  update();
};

window.removeEventStatCondition = function(id) {
  const div = document.getElementById(id);
  const stat = div.querySelector('.stat-select').value;
  const type = div.querySelector('.stat-type').value;
  if (eventConditionsData.stats[stat]) {
    delete eventConditionsData.stats[stat][type];
    if (Object.keys(eventConditionsData.stats[stat]).length === 0) delete eventConditionsData.stats[stat];
  }
  div.remove();
};

window.addEventFlagCondition = function(flagKey = '', value = true) {
  const container = document.getElementById('eventFlagsConditions');
  const id = `event-flag-${Date.now()}-${Math.random()}`;
  const availableFlags = Object.keys(currentStory.config.flags);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="flag-select">
      <option value="">Selecciona...</option>
      ${availableFlags.map(f => `<option value="${f}" ${f === flagKey ? 'selected' : ''}>${f}</option>`).join('')}
    </select>
    <input type="text" class="flag-value" value="${value}" placeholder="Valor" />
    <button class="btn-danger" onclick="removeEventFlagCondition('${id}')" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const flag = div.querySelector('.flag-select').value;
    let val = div.querySelector('.flag-value').value;
    if (flag) {
      const currentType = typeof currentStory.config.flags[flag];
      if (currentType === 'boolean') val = val === 'true' || val === true;
      else if (currentType === 'number') val = parseFloat(val) || 0;
      eventConditionsData.flags[flag] = val;
    }
  };
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  update();
};

window.removeEventFlagCondition = function(id) {
  const div = document.getElementById(id);
  const flag = div.querySelector('.flag-select').value;
  if (flag) delete eventConditionsData.flags[flag];
  div.remove();
};

window.addEventCharacterCondition = function(charKey = '', type = 'relationship_min', value = 0) {
  const container = document.getElementById('eventCharactersConditions');
  const id = `event-char-${Date.now()}-${Math.random()}`;
  const availableChars = Object.keys(currentStory.config.characters);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="char-select">
      <option value="">Selecciona...</option>
      ${availableChars.map(c => `<option value="${c}" ${c === charKey ? 'selected' : ''}>${currentStory.config.characters[c].name}</option>`).join('')}
    </select>
    <select class="char-type">
      <option value="relationship_min" ${type === 'relationship_min' ? 'selected' : ''}>Relación mín</option>
      <option value="relationship_max" ${type === 'relationship_max' ? 'selected' : ''}>Relación máx</option>
      <option value="met" ${type === 'met' ? 'selected' : ''}>Conocido</option>
    </select>
    <input type="text" class="char-value" value="${value}" />
    <button class="btn-danger" onclick="removeEventCharacterCondition('${id}')" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const char = div.querySelector('.char-select').value;
    const condType = div.querySelector('.char-type').value;
    let val = div.querySelector('.char-value').value;
    if (char) {
      if (condType === 'met') val = val === 'true' || val === true;
      else val = parseInt(val) || 0;
      if (!eventConditionsData.characters[char]) eventConditionsData.characters[char] = {};
      eventConditionsData.characters[char][condType] = val;
    }
  };
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  update();
};

window.removeEventCharacterCondition = function(id) {
  const div = document.getElementById(id);
  const char = div.querySelector('.char-select').value;
  const type = div.querySelector('.char-type').value;
  if (eventConditionsData.characters[char]) {
    delete eventConditionsData.characters[char][type];
    if (Object.keys(eventConditionsData.characters[char]).length === 0) delete eventConditionsData.characters[char];
  }
  div.remove();
};

// Completed Events Condition
window.addCompletedEventCondition = function(eventId = '') {
  const container = document.getElementById('eventCompletedEventsConditions');
  const id = `completed-event-${Date.now()}`;
  const availableEvents = currentStory.story.events.map(e => e.id);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="event-select">
      <option value="">Selecciona evento...</option>
      ${availableEvents.map(e => `<option value="${e}" ${e === eventId ? 'selected' : ''}>${e}</option>`).join('')}
    </select>
    <button class="btn-danger" onclick="removeCompletedEventCondition('${id}')" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const event = div.querySelector('.event-select').value;
    if (event) {
      if (!eventConditionsData.completed_events) eventConditionsData.completed_events = [];
      if (!eventConditionsData.completed_events.includes(event)) {
        eventConditionsData.completed_events.push(event);
      }
    }
  };
  div.querySelector('select').addEventListener('change', update);
  update();
};

window.removeCompletedEventCondition = function(id) {
  const div = document.getElementById(id);
  const event = div.querySelector('.event-select').value;
  if (eventConditionsData.completed_events && event) {
    const index = eventConditionsData.completed_events.indexOf(event);
    if (index > -1) eventConditionsData.completed_events.splice(index, 1);
  }
  div.remove();
};

// Previous Choices Condition
window.addPreviousChoiceCondition = function(eventId = '', choiceIndex = 0) {
  const container = document.getElementById('eventPreviousChoicesConditions');
  const id = `previous-choice-${Date.now()}`;
  const availableEvents = currentStory.story.events.filter(e => e.choices && e.choices.length > 0);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="event-select">
      <option value="">Selecciona evento...</option>
      ${availableEvents.map(e => `<option value="${e.id}" ${e.id === eventId ? 'selected' : ''}>${e.id}</option>`).join('')}
    </select>
    <input type="number" class="choice-index" value="${choiceIndex}" min="0" placeholder="Índice opción (0, 1, 2...)" />
    <button class="btn-danger" onclick="removePreviousChoiceCondition('${id}')" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const event = div.querySelector('.event-select').value;
    const index = parseInt(div.querySelector('.choice-index').value) || 0;
    if (event) {
      if (!eventConditionsData.previous_choices) eventConditionsData.previous_choices = {};
      eventConditionsData.previous_choices[event] = index;
    }
  };
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  update();
};

window.removePreviousChoiceCondition = function(id) {
  const div = document.getElementById(id);
  const event = div.querySelector('.event-select').value;
  if (eventConditionsData.previous_choices && event) {
    delete eventConditionsData.previous_choices[event];
  }
  div.remove();
};

// Required Items Condition
window.addRequiredItem = function(itemName = '') {
  const container = document.getElementById('eventRequiredItems');
  const id = `required-item-${Date.now()}`;
  const availableItems = Object.keys(currentStory.config.inventory?.items || {});
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  
  if (availableItems.length > 0) {
    div.innerHTML = `
      <select class="item-select">
        <option value="">Selecciona item...</option>
        ${availableItems.map(i => `<option value="${i}" ${i === itemName ? 'selected' : ''}>${i}</option>`).join('')}
      </select>
      <button class="btn-danger" onclick="removeRequiredItem('${id}')" type="button"><i data-lucide="trash-2"></i></button>
    `;
  } else {
    div.innerHTML = `
      <input type="text" class="item-input" value="${itemName}" placeholder="Nombre del item" />
      <button class="btn-danger" onclick="removeRequiredItem('${id}')" type="button"><i data-lucide="trash-2"></i></button>
    `;
  }
  
  container.appendChild(div);

  
  const update = () => {
    const item = div.querySelector('.item-select')?.value || div.querySelector('.item-input')?.value;
    if (item) {
      if (!eventConditionsData.inventory) eventConditionsData.inventory = {};
      if (!eventConditionsData.inventory.has_items) eventConditionsData.inventory.has_items = [];
      if (!eventConditionsData.inventory.has_items.includes(item)) {
        eventConditionsData.inventory.has_items.push(item);
      }
    }
  };
  
  const input = div.querySelector('.item-select') || div.querySelector('.item-input');
  input.addEventListener('change', update);
  update();
};

window.removeRequiredItem = function(id) {
  const div = document.getElementById(id);
  const item = div.querySelector('.item-select')?.value || div.querySelector('.item-input')?.value;
  if (eventConditionsData.inventory?.has_items && item) {
    const index = eventConditionsData.inventory.has_items.indexOf(item);
    if (index > -1) eventConditionsData.inventory.has_items.splice(index, 1);
  }
  div.remove();
};

// Render choices with visual effects builder
function renderEventChoices(choices) {
  const container = document.getElementById('eventChoicesList');
  eventChoicesData = JSON.parse(JSON.stringify(choices)); // Deep copy
  
  container.innerHTML = choices.map((choice, i) => `
    <div class="item-card" style="margin-bottom: 1rem;">
      <div class="item-header">
        <div class="item-title">Opción ${i + 1}</div>
        <button class="btn-danger" onclick="removeChoice(${i})" type="button"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="form-group full-width">
        <label>Texto de la opción</label>
        <input type="text" class="choice-text" data-index="${i}" value="${choice.text}" />
      </div>
      <div class="form-group full-width">
        <div class="collapsible-header" id="choice-${i}-effects-header" onclick="toggleCollapsible('choice-${i}-effects-header')">
          <label><i data-lucide="zap"></i> Efectos de esta opción</label>
          <span class="collapsible-icon">►</span>
        </div>
        <div class="collapsible-content">
          <div class="conditions-builder" style="margin-top: 0.5rem;">
            <div class="condition-section">
              <h4><i data-lucide="bar-chart-2"></i> Cambios en Stats</h4>
              <div id="choice-${i}-stats"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addChoiceStatEffect(${i})">+ Agregar efecto</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="flag"></i> Cambios en Flags</h4>
              <div id="choice-${i}-flags"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addChoiceFlagEffect(${i})">+ Agregar efecto</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="package"></i> Dar/Quitar Items</h4>
              <div id="choice-${i}-items"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addChoiceItemEffect(${i})">+ Agregar efecto</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="users"></i> Cambios en Relaciones</h4>
              <div id="choice-${i}-characters"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addChoiceCharacterEffect(${i})">+ Agregar efecto</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="play"></i> Triggers Especiales</h4>
              <label class="checkbox-label">
                <input type="checkbox" class="trigger-ending" data-index="${i}" ${choice.effects?.trigger_ending ? 'checked' : ''} />
                Terminar juego (trigger_ending)
              </label>
              <label class="checkbox-label">
                <input type="checkbox" class="trigger-next-day" data-index="${i}" ${choice.effects?.trigger_next_day ? 'checked' : ''} />
                Avanzar al siguiente día (trigger_next_day)
              </label>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="unlock"></i> Control de Eventos</h4>
              <div id="choice-${i}-unlock-events"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addUnlockEvent(${i})">+ Desbloquear evento</button>
              <div id="choice-${i}-lock-events" style="margin-top: 0.5rem;"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addLockEvent(${i})">+ Bloquear evento</button>
            </div>
            
            <div class="condition-section">
              <h4><i data-lucide="trophy"></i> Logros</h4>
              <div id="choice-${i}-achievement"></div>
              <button type="button" class="btn-secondary btn-small" onclick="addAchievementUnlock(${i})">+ Desbloquear logro</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  // Load existing effects
  choices.forEach((choice, i) => {
    if (choice.effects.stats) {
      Object.entries(choice.effects.stats).forEach(([stat, value]) => {
        addChoiceStatEffect(i, stat, value);
      });
    }
    if (choice.effects.flags) {
      Object.entries(choice.effects.flags).forEach(([flag, value]) => {
        addChoiceFlagEffect(i, flag, value);
      });
    }
    if (choice.effects.inventory) {
      if (choice.effects.inventory.add) {
        choice.effects.inventory.add.forEach(item => addChoiceItemEffect(i, item, 'add'));
      }
      if (choice.effects.inventory.remove) {
        choice.effects.inventory.remove.forEach(item => addChoiceItemEffect(i, item, 'remove'));
      }
    }
    if (choice.effects.characters) {
      Object.entries(choice.effects.characters).forEach(([char, value]) => {
        addChoiceCharacterEffect(i, char, value);
      });
    }
    if (choice.effects.unlock_events) {
      choice.effects.unlock_events.forEach(eventId => addUnlockEvent(i, eventId));
    }
    if (choice.effects.lock_events) {
      choice.effects.lock_events.forEach(eventId => addLockEvent(i, eventId));
    }
    if (choice.effects.unlocks?.achievement) {
      addAchievementUnlock(i, choice.effects.unlocks.achievement);
    }
  });
  
  // Update text on input
  container.querySelectorAll('.choice-text').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.index);
      eventChoicesData[idx].text = input.value;
    });
  });
  
  // Update triggers
  container.querySelectorAll('.trigger-ending').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const idx = parseInt(checkbox.dataset.index);
      eventChoicesData[idx].effects.trigger_ending = checkbox.checked;
      if (!checkbox.checked) delete eventChoicesData[idx].effects.trigger_ending;
    });
  });
  
  container.querySelectorAll('.trigger-next-day').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const idx = parseInt(checkbox.dataset.index);
      eventChoicesData[idx].effects.trigger_next_day = checkbox.checked;
      if (!checkbox.checked) delete eventChoicesData[idx].effects.trigger_next_day;
    });
  });

}

window.addChoiceStatEffect = function(choiceIndex, statKey = '', value = 0) {
  const container = document.getElementById(`choice-${choiceIndex}-stats`);
  const id = `choice-${choiceIndex}-stat-${Date.now()}`;
  const availableStats = Object.keys(currentStory.config.stats);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="stat-select">
      <option value="">Selecciona...</option>
      ${availableStats.map(s => `<option value="${s}" ${s === statKey ? 'selected' : ''}>${currentStory.config.stats[s].name}</option>`).join('')}
    </select>
    <input type="number" class="stat-value" value="${value}" placeholder="Cambio (+/-)" />
    <button class="btn-danger" onclick="removeChoiceStatEffect('${id}', ${choiceIndex})" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const stat = div.querySelector('.stat-select').value;
    const val = parseInt(div.querySelector('.stat-value').value) || 0;
    if (stat) {
      if (!eventChoicesData[choiceIndex].effects.stats) eventChoicesData[choiceIndex].effects.stats = {};
      eventChoicesData[choiceIndex].effects.stats[stat] = val;
    }
  };
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  update();
};

window.removeChoiceStatEffect = function(id, choiceIndex) {
  const div = document.getElementById(id);
  const stat = div.querySelector('.stat-select').value;
  if (eventChoicesData[choiceIndex].effects.stats && stat) {
    delete eventChoicesData[choiceIndex].effects.stats[stat];
  }
  div.remove();
};

window.addChoiceFlagEffect = function(choiceIndex, flagKey = '', value = true) {
  const container = document.getElementById(`choice-${choiceIndex}-flags`);
  const id = `choice-${choiceIndex}-flag-${Date.now()}`;
  const availableFlags = Object.keys(currentStory.config.flags);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="flag-select">
      <option value="">Selecciona...</option>
      ${availableFlags.map(f => `<option value="${f}" ${f === flagKey ? 'selected' : ''}>${f}</option>`).join('')}
    </select>
    <input type="text" class="flag-value" value="${value}" placeholder="Nuevo valor" />
    <button class="btn-danger" onclick="removeChoiceFlagEffect('${id}', ${choiceIndex})" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const flag = div.querySelector('.flag-select').value;
    let val = div.querySelector('.flag-value').value;
    if (flag) {
      const currentType = typeof currentStory.config.flags[flag];
      if (currentType === 'boolean') val = val === 'true' || val === true;
      else if (currentType === 'number') val = parseFloat(val) || 0;
      if (!eventChoicesData[choiceIndex].effects.flags) eventChoicesData[choiceIndex].effects.flags = {};
      eventChoicesData[choiceIndex].effects.flags[flag] = val;
    }
  };
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  update();
};

window.removeChoiceFlagEffect = function(id, choiceIndex) {
  const div = document.getElementById(id);
  const flag = div.querySelector('.flag-select').value;
  if (eventChoicesData[choiceIndex].effects.flags && flag) {
    delete eventChoicesData[choiceIndex].effects.flags[flag];
  }
  div.remove();
};

window.addChoiceItemEffect = function(choiceIndex, itemKey = '', action = 'add') {
  const container = document.getElementById(`choice-${choiceIndex}-items`);
  const id = `choice-${choiceIndex}-item-${Date.now()}`;
  const availableItems = Object.keys(currentStory.config.inventory.items || {});
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="item-select">
      <option value="">Selecciona...</option>
      ${availableItems.map(item => `<option value="${item}" ${item === itemKey ? 'selected' : ''}>${currentStory.config.inventory.items[item].name}</option>`).join('')}
    </select>
    <select class="item-action">
      <option value="add" ${action === 'add' ? 'selected' : ''}>Dar</option>
      <option value="remove" ${action === 'remove' ? 'selected' : ''}>Quitar</option>
    </select>
    <button class="btn-danger" onclick="removeChoiceItemEffect('${id}', ${choiceIndex})" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const item = div.querySelector('.item-select').value;
    const act = div.querySelector('.item-action').value;
    if (item) {
      if (!eventChoicesData[choiceIndex].effects.inventory) eventChoicesData[choiceIndex].effects.inventory = {};
      if (!eventChoicesData[choiceIndex].effects.inventory[act]) eventChoicesData[choiceIndex].effects.inventory[act] = [];
      if (!eventChoicesData[choiceIndex].effects.inventory[act].includes(item)) {
        eventChoicesData[choiceIndex].effects.inventory[act].push(item);
      }
    }
  };
  div.querySelectorAll('select').forEach(el => el.addEventListener('change', update));
  update();
};

window.removeChoiceItemEffect = function(id, choiceIndex) {
  const div = document.getElementById(id);
  const item = div.querySelector('.item-select').value;
  const action = div.querySelector('.item-action').value;
  if (eventChoicesData[choiceIndex].effects.inventory && eventChoicesData[choiceIndex].effects.inventory[action]) {
    const idx = eventChoicesData[choiceIndex].effects.inventory[action].indexOf(item);
    if (idx > -1) eventChoicesData[choiceIndex].effects.inventory[action].splice(idx, 1);
  }
  div.remove();
};

window.addChoiceCharacterEffect = function(choiceIndex, charKey = '', value = 0) {
  const container = document.getElementById(`choice-${choiceIndex}-characters`);
  const id = `choice-${choiceIndex}-char-${Date.now()}`;
  const availableChars = Object.keys(currentStory.config.characters);
  
  // Si value es un objeto {relationship: X, met: Y}, extraer los valores
  let relationshipValue = 0;
  let metValue = false;
  
  if (typeof value === 'object' && value !== null) {
    relationshipValue = value.relationship || 0;
    metValue = value.met !== undefined ? value.met : false;
  } else {
    // Formato antiguo: solo un número
    relationshipValue = value || 0;
  }
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.style.display = 'grid';
  div.style.gridTemplateColumns = '1fr 120px 80px 40px';
  div.style.gap = '0.5rem';
  div.style.alignItems = 'center';
  div.innerHTML = `
    <select class="char-select">
      <option value="">Selecciona...</option>
      ${availableChars.map(c => `<option value="${c}" ${c === charKey ? 'selected' : ''}>${currentStory.config.characters[c].name}</option>`).join('')}
    </select>
    <input type="number" class="char-relationship" value="${relationshipValue}" placeholder="Relación (+/-)" title="Cambio en relación" />
    <label style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.9rem;">
      <input type="checkbox" class="char-met" ${metValue ? 'checked' : ''} />
      <span>Conocer</span>
    </label>
    <button class="btn-danger" onclick="removeChoiceCharacterEffect('${id}', ${choiceIndex})" type="button" title="Eliminar"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const char = div.querySelector('.char-select').value;
    const relationship = parseInt(div.querySelector('.char-relationship').value) || 0;
    const met = div.querySelector('.char-met').checked;
    
    if (char) {
      if (!eventChoicesData[choiceIndex].effects.characters) {
        eventChoicesData[choiceIndex].effects.characters = {};
      }
      
      // Crear objeto con relationship y met (si está marcado)
      const charEffect = { relationship };
      if (met) {
        charEffect.met = true;
      }
      
      eventChoicesData[choiceIndex].effects.characters[char] = charEffect;
    }
  };
  
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('input', update));
  update();
};

window.removeChoiceCharacterEffect = function(id, choiceIndex) {
  const div = document.getElementById(id);
  const char = div.querySelector('.char-select').value;
  if (eventChoicesData[choiceIndex].effects.characters && char) {
    delete eventChoicesData[choiceIndex].effects.characters[char];
  }
  div.remove();
};

// Unlock Events
window.addUnlockEvent = function(choiceIndex, eventId = '') {
  const container = document.getElementById(`choice-${choiceIndex}-unlock-events`);
  const id = `choice-${choiceIndex}-unlock-${Date.now()}`;
  const availableEvents = currentStory.story.events.map(e => e.id);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="event-select">
      <option value="">Selecciona evento...</option>
      ${availableEvents.map(e => `<option value="${e}" ${e === eventId ? 'selected' : ''}>${e}</option>`).join('')}
    </select>
    <button class="btn-danger" onclick="removeUnlockEvent('${id}', ${choiceIndex})" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const event = div.querySelector('.event-select').value;
    if (event) {
      if (!eventChoicesData[choiceIndex].effects.unlock_events) {
        eventChoicesData[choiceIndex].effects.unlock_events = [];
      }
      const index = eventChoicesData[choiceIndex].effects.unlock_events.indexOf(event);
      if (index === -1) {
        eventChoicesData[choiceIndex].effects.unlock_events.push(event);
      }
    }
  };
  div.querySelector('select').addEventListener('change', update);
  update();
};

window.removeUnlockEvent = function(id, choiceIndex) {
  const div = document.getElementById(id);
  const event = div.querySelector('.event-select').value;
  if (eventChoicesData[choiceIndex].effects.unlock_events && event) {
    const index = eventChoicesData[choiceIndex].effects.unlock_events.indexOf(event);
    if (index > -1) {
      eventChoicesData[choiceIndex].effects.unlock_events.splice(index, 1);
    }
  }
  div.remove();
};

// Lock Events
window.addLockEvent = function(choiceIndex, eventId = '') {
  const container = document.getElementById(`choice-${choiceIndex}-lock-events`);
  const id = `choice-${choiceIndex}-lock-${Date.now()}`;
  const availableEvents = currentStory.story.events.map(e => e.id);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="event-select">
      <option value="">Selecciona evento...</option>
      ${availableEvents.map(e => `<option value="${e}" ${e === eventId ? 'selected' : ''}>${e}</option>`).join('')}
    </select>
    <button class="btn-danger" onclick="removeLockEvent('${id}', ${choiceIndex})" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const event = div.querySelector('.event-select').value;
    if (event) {
      if (!eventChoicesData[choiceIndex].effects.lock_events) {
        eventChoicesData[choiceIndex].effects.lock_events = [];
      }
      const index = eventChoicesData[choiceIndex].effects.lock_events.indexOf(event);
      if (index === -1) {
        eventChoicesData[choiceIndex].effects.lock_events.push(event);
      }
    }
  };
  div.querySelector('select').addEventListener('change', update);
  update();
};

window.removeLockEvent = function(id, choiceIndex) {
  const div = document.getElementById(id);
  const event = div.querySelector('.event-select').value;
  if (eventChoicesData[choiceIndex].effects.lock_events && event) {
    const index = eventChoicesData[choiceIndex].effects.lock_events.indexOf(event);
    if (index > -1) {
      eventChoicesData[choiceIndex].effects.lock_events.splice(index, 1);
    }
  }
  div.remove();
};

// Achievement Unlock
window.addAchievementUnlock = function(choiceIndex, achievementKey = '') {
  const container = document.getElementById(`choice-${choiceIndex}-achievement`);
  const id = `choice-${choiceIndex}-ach-${Date.now()}`;
  const availableAchievements = Object.keys(currentStory.config.achievements || {});
  
  if (availableAchievements.length === 0) {
    showToast('No hay logros configurados', 'warning');
    return;
  }
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="achievement-select">
      <option value="">Selecciona logro...</option>
      ${availableAchievements.map(a => `<option value="${a}" ${a === achievementKey ? 'selected' : ''}>${currentStory.config.achievements[a].name}</option>`).join('')}
    </select>
    <button class="btn-danger" onclick="removeAchievementUnlock('${id}', ${choiceIndex})" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const achievement = div.querySelector('.achievement-select').value;
    if (achievement) {
      if (!eventChoicesData[choiceIndex].effects.unlocks) {
        eventChoicesData[choiceIndex].effects.unlocks = {};
      }
      eventChoicesData[choiceIndex].effects.unlocks.achievement = achievement;
    }
  };
  div.querySelector('select').addEventListener('change', update);
  update();
};

window.removeAchievementUnlock = function(id, choiceIndex) {
  const div = document.getElementById(id);
  if (eventChoicesData[choiceIndex].effects.unlocks) {
    delete eventChoicesData[choiceIndex].effects.unlocks.achievement;
    if (Object.keys(eventChoicesData[choiceIndex].effects.unlocks).length === 0) {
      delete eventChoicesData[choiceIndex].effects.unlocks;
    }
  }
  div.remove();
};

window.removeChoice = async function(index) {
  if (currentEventEdit === null) return;
  
  const event = currentStory.story.events[currentEventEdit];
  if (event.choices.length <= 1) {
    showToast('Debe haber al menos una opción', 'error');
    return;
  }
  
  const confirmed = await showConfirm(
    '¿Eliminar esta opción?',
    'Eliminar Opción'
  );
  
  if (!confirmed) return;
  
  event.choices.splice(index, 1);
  eventChoicesData.splice(index, 1);
  renderEventChoices(event.choices);
  showToast('Opción eliminada', 'success');
};

window.addChoiceToEvent = function() {
  if (currentEventEdit === null) return;
  
  const event = currentStory.story.events[currentEventEdit];
  event.choices.push({
    text: `Nueva opción ${event.choices.length + 1}`,
    effects: {}
  });
  
  renderEventChoices(event.choices);
};

window.saveEvent = function() {
  if (currentEventEdit === null) return;
  
  saveToHistory(); // Guardar antes de modificar
  
  const event = currentStory.story.events[currentEventEdit];
  
  // Update basic fields
  event.id = document.getElementById('eventId').value;
  event.type = document.getElementById('eventType').value;
  event.day = parseInt(document.getElementById('eventDay').value) || 0;
  event.can_repeat = document.getElementById('eventCanRepeat').checked;
  event.text = document.getElementById('eventSituation').value;
  
  // Probability for random events
  if (event.type === 'random') {
    const probability = parseFloat(document.getElementById('eventProbability').value);
    if (probability) {
      event.probability = probability;
    }
  } else {
    delete event.probability;
  }
  
  // Update time fields
  const time = document.getElementById('eventTime').value;
  if (time) {
    event.time = time;
  } else {
    delete event.time;
  }
  
  const earliestHour = document.getElementById('eventEarliestHour').value;
  if (earliestHour !== '') {
    event.earliest_hour = parseInt(earliestHour);
  } else {
    delete event.earliest_hour;
  }
  
  const latestHour = document.getElementById('eventLatestHour').value;
  if (latestHour !== '') {
    event.latest_hour = parseInt(latestHour);
  } else {
    delete event.latest_hour;
  }
  
  // Update conditions from visual builder
  event.conditions = getEventConditions();
  
  // Update choices from visual builder
  event.choices = eventChoicesData;
  
  markDirty();
  renderEvents();
  closeModal('eventModal');
  showToast('Evento guardado', 'success');
};

window.deleteEvent = async function() {
  if (currentEventEdit === null) return;
  
  const confirmed = await showConfirm(
    '¿Estás seguro de eliminar este evento?',
    'Eliminar Evento'
  );
  
  if (!confirmed) return;
  
  saveToHistory(); // Guardar antes de eliminar
  
  currentStory.story.events.splice(currentEventEdit, 1);
  currentEventEdit = null;
  
  markDirty();
  renderEvents();
  closeModal('eventModal');
  showToast('Evento eliminado', 'success');
};

window.moveEventUp = function(index) {
  if (index === 0) return; // Ya está en la primera posición
  
  saveToHistory(); // Guardar antes de mover
  
  const events = currentStory.story.events;
  [events[index - 1], events[index]] = [events[index], events[index - 1]];
  
  markDirty();
  renderEvents();
  showToast('Evento movido hacia arriba', 'success');
};

window.moveEventDown = function(index) {
  const events = currentStory.story.events;
  if (index === events.length - 1) return; // Ya está en la última posición
  
  saveToHistory(); // Guardar antes de mover
  
  [events[index], events[index + 1]] = [events[index + 1], events[index]];
  
  markDirty();
  renderEvents();
  showToast('Evento movido hacia abajo', 'success');
};

window.duplicateEvent = function(index) {
  saveToHistory(); // Guardar antes de duplicar
  const original = currentStory.story.events[index];
  
  // Deep copy del evento original
  const duplicate = JSON.parse(JSON.stringify(original));
  
  // Generar nuevo ID único con timestamp
  const timestamp = Date.now();
  duplicate.id = `${original.id}_copia_${timestamp}`;
  
  // Insertar el duplicado justo después del original
  currentStory.story.events.splice(index + 1, 0, duplicate);
  
  markDirty();
  renderEvents();
  showToast(`Evento duplicado: ${duplicate.id}`, 'success');
  
  // Hacer scroll al evento duplicado y resaltarlo
  setTimeout(() => {
    const cards = document.querySelectorAll('.event-card');
    if (cards[index + 1]) {
      cards[index + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
      cards[index + 1].style.animation = 'highlight 1s ease';
    }
  }, 100);
};

// Endings
function renderEndings() {
  const container = document.getElementById('endingsList');
  const endings = currentStory.endings.endings || [];
  
  if (endings.length === 0) {
    container.innerHTML = '';
    document.getElementById('endingsEmpty').style.display = 'block';
    return;
  }
  
  document.getElementById('endingsEmpty').style.display = 'none';
  
  container.innerHTML = endings.map((ending, index) => `
    <div class="item-card">
      <div class="item-header">
        <div class="item-title"><i data-lucide="flag-triangle-right"></i> ${ending.id}</div>
        <div class="item-actions">
          <button class="btn-secondary" onclick="editEnding(${index})"><i data-lucide="pencil"></i>  Editar</button>
          <button class="btn-danger" onclick="deleteEnding(${index})"><i data-lucide="trash-2"></i>  Eliminar</button>
        </div>
      </div>
      <div class="item-content">
        <div class="form-group">
          <label>Título: <strong>${ending.title}</strong></label>
        </div>
        <div class="form-group">
          <label>Prioridad: ${ending.priority || 999}</label>
        </div>
        <div class="form-group full-width">
          <label>${ending.content.message.substring(0, 100)}...</label>
        </div>
      </div>
    </div>
  `).join('');

}

// Helper functions para condiciones de endings
let endingConditionsData = { stats: {}, flags: {}, characters: {}, completed_events: [], previous_choices: {}, inventory: {} };

function clearEndingConditions() {
  endingConditionsData = { stats: {}, flags: {}, characters: {}, completed_events: [], previous_choices: {}, inventory: {} };
  document.getElementById('endingStatsConditions').innerHTML = '';
  document.getElementById('endingFlagsConditions').innerHTML = '';
  document.getElementById('endingCharactersConditions').innerHTML = '';
  document.getElementById('endingCompletedEventsConditions').innerHTML = '';
  document.getElementById('endingPreviousChoicesConditions').innerHTML = '';
  document.getElementById('endingRequiredItems').innerHTML = '';
}

function loadEndingConditions(conditions) {
  clearEndingConditions();
  
  // Load stats - Soportar ambos formatos
  if (conditions.stats) {
    Object.entries(conditions.stats).forEach(([key, value]) => {
      // Formato engine: { "honor_min": 50, "honor_max": 100 }
      if (key.endsWith('_min')) {
        const stat = key.replace('_min', '');
        addEndingStatCondition(stat, 'min', value);
      } else if (key.endsWith('_max')) {
        const stat = key.replace('_max', '');
        addEndingStatCondition(stat, 'max', value);
      } 
      // Formato editor antiguo: { "honor": { min: 50, max: 100 } }
      else if (typeof value === 'object') {
        if (value.min !== undefined) {
          addEndingStatCondition(key, 'min', value.min);
        }
        if (value.max !== undefined) {
          addEndingStatCondition(key, 'max', value.max);
        }
      }
    });
  }
  
  // Load flags
  if (conditions.flags) {
    Object.entries(conditions.flags).forEach(([flag, value]) => {
      addEndingFlagCondition(flag, value);
    });
  }
  
  // Load characters
  if (conditions.characters) {
    Object.entries(conditions.characters).forEach(([char, values]) => {
      if (values.relationship_min !== undefined) {
        addEndingCharacterCondition(char, 'relationship_min', values.relationship_min);
      }
      if (values.relationship_max !== undefined) {
        addEndingCharacterCondition(char, 'relationship_max', values.relationship_max);
      }
      if (values.met !== undefined) {
        addEndingCharacterCondition(char, 'met', values.met);
      }
    });
  }
  
  // Load day range
  if (conditions.day_min) {
    document.getElementById('endingDayMin').value = conditions.day_min;
  }
  if (conditions.day_max) {
    document.getElementById('endingDayMax').value = conditions.day_max;
  }
  
  // Load completed_events
  if (conditions.completed_events) {
    conditions.completed_events.forEach(eventId => {
      addEndingCompletedEvent(eventId);
    });
  }
  
  // Load previous_choices
  if (conditions.previous_choices) {
    Object.entries(conditions.previous_choices).forEach(([eventId, choiceIndex]) => {
      addEndingPreviousChoice(eventId, choiceIndex);
    });
  }
  
  // Load inventory
  if (conditions.inventory) {
    if (conditions.inventory.money_min) {
      document.getElementById('endingMoneyMin').value = conditions.inventory.money_min;
    }
    if (conditions.inventory.has_items) {
      conditions.inventory.has_items.forEach(item => {
        addEndingRequiredItem(item);
      });
    }
  }
}

function getEndingConditions() {
  const conditions = {};
  
  // Stats - Convertir al formato del engine
  if (Object.keys(endingConditionsData.stats).length > 0) {
    conditions.stats = {};
    Object.entries(endingConditionsData.stats).forEach(([stat, values]) => {
      // Formato engine: { "honor_min": 50, "honor_max": 100 }
      if (values.min !== undefined) {
        conditions.stats[`${stat}_min`] = values.min;
      }
      if (values.max !== undefined) {
        conditions.stats[`${stat}_max`] = values.max;
      }
    });
  }
  
  // Flags
  if (Object.keys(endingConditionsData.flags).length > 0) {
    conditions.flags = endingConditionsData.flags;
  }
  
  // Characters
  if (Object.keys(endingConditionsData.characters).length > 0) {
    conditions.characters = {};
    Object.entries(endingConditionsData.characters).forEach(([char, values]) => {
      conditions.characters[char] = values;
    });
  }
  
  // day_min y day_max
  const dayMin = parseInt(document.getElementById('endingDayMin')?.value);
  const dayMax = parseInt(document.getElementById('endingDayMax')?.value);
  if (dayMin) conditions.day_min = dayMin;
  if (dayMax) conditions.day_max = dayMax;
  
  // completed_events
  if (endingConditionsData.completed_events && endingConditionsData.completed_events.length > 0) {
    conditions.completed_events = endingConditionsData.completed_events;
  }
  
  // previous_choices
  if (endingConditionsData.previous_choices && Object.keys(endingConditionsData.previous_choices).length > 0) {
    conditions.previous_choices = endingConditionsData.previous_choices;
  }
  
  // inventory
  const moneyMin = parseInt(document.getElementById('endingMoneyMin')?.value);
  if (moneyMin || (endingConditionsData.inventory?.has_items && endingConditionsData.inventory.has_items.length > 0)) {
    conditions.inventory = {};
    if (moneyMin) conditions.inventory.money_min = moneyMin;
    if (endingConditionsData.inventory?.has_items && endingConditionsData.inventory.has_items.length > 0) {
      conditions.inventory.has_items = endingConditionsData.inventory.has_items;
    }
  }
  
  return conditions;
}

window.addEndingStatCondition = function(statKey = '', type = 'min', value = 0) {
  const container = document.getElementById('endingStatsConditions');
  const id = `stat-${Date.now()}-${Math.random()}`;
  
  const availableStats = Object.keys(currentStory.config.stats);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="stat-select" data-id="${id}">
      <option value="">Selecciona una stat...</option>
      ${availableStats.map(s => `<option value="${s}" ${s === statKey ? 'selected' : ''}>${currentStory.config.stats[s].name}</option>`).join('')}
    </select>
    <select class="stat-type" data-id="${id}">
      <option value="min" ${type === 'min' ? 'selected' : ''}>Mínimo</option>
      <option value="max" ${type === 'max' ? 'selected' : ''}>Máximo</option>
    </select>
    <input type="number" class="stat-value" data-id="${id}" value="${value}" placeholder="Valor" />
    <button class="btn-danger" onclick="removeEndingStatCondition('${id}')"><i data-lucide="trash-2"></i></button>
  `;
  
  container.appendChild(div);

  
  // Update data
  const updateData = () => {
    const stat = div.querySelector('.stat-select').value;
    const condType = div.querySelector('.stat-type').value;
    const val = parseInt(div.querySelector('.stat-value').value) || 0;
    
    if (stat) {
      if (!endingConditionsData.stats[stat]) {
        endingConditionsData.stats[stat] = {};
      }
      endingConditionsData.stats[stat][condType] = val;
    }
  };
  
  div.querySelectorAll('select, input').forEach(el => {
    el.addEventListener('change', updateData);
    el.addEventListener('input', updateData);
  });
  
  updateData();
};

window.removeEndingStatCondition = function(id) {
  const div = document.getElementById(id);
  const stat = div.querySelector('.stat-select').value;
  const type = div.querySelector('.stat-type').value;
  
  if (endingConditionsData.stats[stat]) {
    delete endingConditionsData.stats[stat][type];
    if (Object.keys(endingConditionsData.stats[stat]).length === 0) {
      delete endingConditionsData.stats[stat];
    }
  }
  
  div.remove();
};

window.addEndingFlagCondition = function(flagKey = '', value = true) {
  const container = document.getElementById('endingFlagsConditions');
  const id = `flag-${Date.now()}-${Math.random()}`;
  
  const availableFlags = Object.keys(currentStory.config.flags);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  
  const flagType = flagKey && typeof currentStory.config.flags[flagKey];
  
  div.innerHTML = `
    <select class="flag-select" data-id="${id}">
      <option value="">Selecciona una variable...</option>
      ${availableFlags.map(f => `<option value="${f}" ${f === flagKey ? 'selected' : ''}>${f}</option>`).join('')}
    </select>
    <input type="text" class="flag-value" data-id="${id}" value="${value}" placeholder="Valor esperado" />
    <button class="btn-danger" onclick="removeEndingFlagCondition('${id}')"><i data-lucide="trash-2"></i></button>
  `;
  
  container.appendChild(div);

  
  // Update data
  const updateData = () => {
    const flag = div.querySelector('.flag-select').value;
    let val = div.querySelector('.flag-value').value;
    
    if (flag) {
      // Convert value based on type
      const currentType = typeof currentStory.config.flags[flag];
      if (currentType === 'boolean') {
        val = val === 'true' || val === true;
      } else if (currentType === 'number') {
        val = parseFloat(val) || 0;
      }
      
      endingConditionsData.flags[flag] = val;
    }
  };
  
  div.querySelectorAll('select, input').forEach(el => {
    el.addEventListener('change', updateData);
    el.addEventListener('input', updateData);
  });
  
  updateData();
};

window.removeEndingFlagCondition = function(id) {
  const div = document.getElementById(id);
  const flag = div.querySelector('.flag-select').value;
  
  if (flag && endingConditionsData.flags[flag] !== undefined) {
    delete endingConditionsData.flags[flag];
  }
  
  div.remove();
};

window.addEndingCharacterCondition = function(charKey = '', type = 'relationship_min', value = 0) {
  const container = document.getElementById('endingCharactersConditions');
  const id = `char-${Date.now()}-${Math.random()}`;
  
  const availableChars = Object.keys(currentStory.config.characters);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="char-select" data-id="${id}">
      <option value="">Selecciona un personaje...</option>
      ${availableChars.map(c => `<option value="${c}" ${c === charKey ? 'selected' : ''}>${currentStory.config.characters[c].name}</option>`).join('')}
    </select>
    <select class="char-type" data-id="${id}">
      <option value="relationship_min" ${type === 'relationship_min' ? 'selected' : ''}>Relación mínima</option>
      <option value="relationship_max" ${type === 'relationship_max' ? 'selected' : ''}>Relación máxima</option>
      <option value="met" ${type === 'met' ? 'selected' : ''}>Conocido</option>
    </select>
    <input type="text" class="char-value" data-id="${id}" value="${value}" placeholder="Valor" />
    <button class="btn-danger" onclick="removeEndingCharacterCondition('${id}')"><i data-lucide="trash-2"></i></button>
  `;
  
  container.appendChild(div);

  
  // Update data
  const updateData = () => {
    const char = div.querySelector('.char-select').value;
    const condType = div.querySelector('.char-type').value;
    let val = div.querySelector('.char-value').value;
    
    if (char) {
      if (condType === 'met') {
        val = val === 'true' || val === true;
      } else {
        val = parseInt(val) || 0;
      }
      
      if (!endingConditionsData.characters[char]) {
        endingConditionsData.characters[char] = {};
      }
      endingConditionsData.characters[char][condType] = val;
    }
  };
  
  div.querySelectorAll('select, input').forEach(el => {
    el.addEventListener('change', updateData);
    el.addEventListener('input', updateData);
  });
  
  updateData();
};

window.removeEndingCharacterCondition = function(id) {
  const div = document.getElementById(id);
  const char = div.querySelector('.char-select').value;
  const type = div.querySelector('.char-type').value;
  
  if (endingConditionsData.characters[char]) {
    delete endingConditionsData.characters[char][type];
    if (Object.keys(endingConditionsData.characters[char]).length === 0) {
      delete endingConditionsData.characters[char];
    }
  }
  
  div.remove();
};

// Completed Events for Endings
window.addEndingCompletedEvent = function(eventId = '') {
  const container = document.getElementById('endingCompletedEventsConditions');
  const id = `ending-completed-${Date.now()}`;
  const availableEvents = currentStory.story.events.map(e => e.id);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="event-select">
      <option value="">Selecciona evento...</option>
      ${availableEvents.map(e => `<option value="${e}" ${e === eventId ? 'selected' : ''}>${e}</option>`).join('')}
    </select>
    <button class="btn-danger" onclick="removeEndingCompletedEvent('${id}')" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const event = div.querySelector('.event-select').value;
    if (event) {
      if (!endingConditionsData.completed_events) endingConditionsData.completed_events = [];
      if (!endingConditionsData.completed_events.includes(event)) {
        endingConditionsData.completed_events.push(event);
      }
    }
  };
  div.querySelector('select').addEventListener('change', update);
  update();
};

window.removeEndingCompletedEvent = function(id) {
  const div = document.getElementById(id);
  const event = div.querySelector('.event-select').value;
  if (endingConditionsData.completed_events && event) {
    const index = endingConditionsData.completed_events.indexOf(event);
    if (index > -1) endingConditionsData.completed_events.splice(index, 1);
  }
  div.remove();
};

// Previous Choices for Endings
window.addEndingPreviousChoice = function(eventId = '', choiceIndex = 0) {
  const container = document.getElementById('endingPreviousChoicesConditions');
  const id = `ending-prev-choice-${Date.now()}`;
  const availableEvents = currentStory.story.events.filter(e => e.choices && e.choices.length > 0);
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  div.innerHTML = `
    <select class="event-select">
      <option value="">Selecciona evento...</option>
      ${availableEvents.map(e => `<option value="${e.id}" ${e.id === eventId ? 'selected' : ''}>${e.id}</option>`).join('')}
    </select>
    <input type="number" class="choice-index" value="${choiceIndex}" min="0" placeholder="Índice (0, 1, 2...)" />
    <button class="btn-danger" onclick="removeEndingPreviousChoice('${id}')" type="button"><i data-lucide="trash-2"></i></button>
  `;
  container.appendChild(div);

  
  const update = () => {
    const event = div.querySelector('.event-select').value;
    const index = parseInt(div.querySelector('.choice-index').value) || 0;
    if (event) {
      if (!endingConditionsData.previous_choices) endingConditionsData.previous_choices = {};
      endingConditionsData.previous_choices[event] = index;
    }
  };
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', update));
  update();
};

window.removeEndingPreviousChoice = function(id) {
  const div = document.getElementById(id);
  const event = div.querySelector('.event-select').value;
  if (endingConditionsData.previous_choices && event) {
    delete endingConditionsData.previous_choices[event];
  }
  div.remove();
};

// Required Items for Endings
window.addEndingRequiredItem = function(itemName = '') {
  const container = document.getElementById('endingRequiredItems');
  const id = `ending-item-${Date.now()}`;
  const availableItems = Object.keys(currentStory.config.inventory?.items || {});
  
  const div = document.createElement('div');
  div.className = 'condition-item';
  div.id = id;
  
  if (availableItems.length > 0) {
    div.innerHTML = `
      <select class="item-select">
        <option value="">Selecciona item...</option>
        ${availableItems.map(i => `<option value="${i}" ${i === itemName ? 'selected' : ''}>${i}</option>`).join('')}
      </select>
      <button class="btn-danger" onclick="removeEndingRequiredItem('${id}')" type="button"><i data-lucide="trash-2"></i></button>
    `;
  } else {
    div.innerHTML = `
      <input type="text" class="item-input" value="${itemName}" placeholder="Nombre del item" />
      <button class="btn-danger" onclick="removeEndingRequiredItem('${id}')" type="button"><i data-lucide="trash-2"></i></button>
    `;
  }
  
  container.appendChild(div);

  
  const update = () => {
    const item = div.querySelector('.item-select')?.value || div.querySelector('.item-input')?.value;
    if (item) {
      if (!endingConditionsData.inventory) endingConditionsData.inventory = {};
      if (!endingConditionsData.inventory.has_items) endingConditionsData.inventory.has_items = [];
      if (!endingConditionsData.inventory.has_items.includes(item)) {
        endingConditionsData.inventory.has_items.push(item);
      }
    }
  };
  
  const input = div.querySelector('.item-select') || div.querySelector('.item-input');
  input.addEventListener('change', update);
  update();
};

window.removeEndingRequiredItem = function(id) {
  const div = document.getElementById(id);
  const item = div.querySelector('.item-select')?.value || div.querySelector('.item-input')?.value;
  if (endingConditionsData.inventory?.has_items && item) {
    const index = endingConditionsData.inventory.has_items.indexOf(item);
    if (index > -1) endingConditionsData.inventory.has_items.splice(index, 1);
  }
  div.remove();
};

window.addEnding = function() {
  clearEndingConditions();
  
  openModal('endingModal');
  document.getElementById('endingModalTitle').textContent = 'Agregar Final';
  document.getElementById('endingId').value = '';
  document.getElementById('endingId').disabled = false;
  document.getElementById('endingTitle').value = '';
  document.getElementById('endingMessage').value = '';
  document.getElementById('endingPriority').value = '100';
  
  const saveBtn = document.getElementById('endingModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const id = document.getElementById('endingId').value.trim();
    const title = document.getElementById('endingTitle').value.trim();
    const message = document.getElementById('endingMessage').value.trim();
    const priority = parseInt(document.getElementById('endingPriority').value);
    
    if (!id) {
      showToast('El ID es obligatorio', 'error');
      return;
    }
    
    saveToHistory(); // Guardar antes de agregar
    
    const conditions = getEndingConditions();
    
    currentStory.endings.endings.push({
      id,
      title: title || id,
      priority,
      conditions,
      content: {
        message: message || ''
      }
    });
    
    markDirty();
    renderEndings();
    closeModal('endingModal');
    showToast('Final agregado', 'success');
  };
};

window.editEnding = function(index) {
  const ending = currentStory.endings.endings[index];
  
  openModal('endingModal');
  document.getElementById('endingModalTitle').textContent = `Editar: ${ending.id}`;
  document.getElementById('endingId').value = ending.id;
  document.getElementById('endingId').disabled = true;
  document.getElementById('endingTitle').value = ending.title;
  document.getElementById('endingMessage').value = ending.content.message;
  document.getElementById('endingPriority').value = ending.priority || 100;
  
  // Load conditions
  loadEndingConditions(ending.conditions || {});
  
  const saveBtn = document.getElementById('endingModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const title = document.getElementById('endingTitle').value.trim();
    const message = document.getElementById('endingMessage').value.trim();
    const priority = parseInt(document.getElementById('endingPriority').value);
    
    saveToHistory(); // Guardar antes de editar
    
    const conditions = getEndingConditions();
    
    currentStory.endings.endings[index] = {
      ...ending,
      title,
      priority,
      conditions,
      content: {
        message
      }
    };
    
    markDirty();
    renderEndings();
    closeModal('endingModal');
    showToast('Final actualizado', 'success');
  };
};

window.deleteEnding = async function(index) {
  const confirmed = await showConfirm(
    '¿Estás seguro de eliminar este final?',
    'Eliminar Final'
  );
  
  if (!confirmed) return;
  
  saveToHistory(); // Guardar antes de eliminar
  
  currentStory.endings.endings.splice(index, 1);
  markDirty();
  renderEndings();
  showToast('Final eliminado', 'success');
};

// Achievements
function renderAchievements() {
  const container = document.getElementById('achievementsList');
  const achievements = currentStory.config.achievements || {};
  
  if (Object.keys(achievements).length === 0) {
    container.innerHTML = '';
    document.getElementById('achievementsEmpty').style.display = 'block';
    return;
  }
  
  document.getElementById('achievementsEmpty').style.display = 'none';
  
  container.innerHTML = Object.entries(achievements).map(([key, ach]) => `
    <div class="item-card">
      <div class="item-header">
        <div class="item-title">${ach.icon || '<i data-lucide="trophy"></i>'} ${ach.name || key}</div>
        <div class="item-actions">
          <button class="btn-secondary" onclick="editAchievement('${key}')"><i data-lucide="pencil"></i> Editar</button>
          <button class="btn-danger" onclick="deleteAchievement('${key}')"><i data-lucide="trash-2"></i> Eliminar</button>
        </div>
      </div>
      <div class="item-content">
        <div class="form-group full-width">
          <label>${ach.description || 'Sin descripción'}</label>
        </div>
      </div>
    </div>
  `).join('');

}

window.addAchievement = function() {
  openModal('achievementModal');
  document.getElementById('achievementModalTitle').textContent = 'Agregar Logro';
  document.getElementById('achievementKey').value = '';
  document.getElementById('achievementKey').disabled = false;
  document.getElementById('achievementName').value = '';
  document.getElementById('achievementIcon').value = '🏆';
  document.getElementById('achievementDescription').value = '';
  
  const saveBtn = document.getElementById('achievementModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const key = document.getElementById('achievementKey').value.trim();
    const name = document.getElementById('achievementName').value.trim();
    const icon = document.getElementById('achievementIcon').value.trim();
    const description = document.getElementById('achievementDescription').value.trim();
    
    if (!key) {
      showToast('El ID es obligatorio', 'error');
      return;
    }
    
    if (currentStory.config.achievements[key]) {
      showToast('Ya existe un logro con ese ID', 'error');
      return;
    }
    
    saveToHistory(); // Guardar antes de agregar
    
    currentStory.config.achievements[key] = {
      name: name || key,
      icon: icon || '🏆',
      description: description || ''
    };
    
    markDirty();
    renderAchievements();
    closeModal('achievementModal');
    showToast('Logro agregado', 'success');
  };
};

window.editAchievement = function(key) {
  const ach = currentStory.config.achievements[key];
  
  openModal('achievementModal');
  document.getElementById('achievementModalTitle').textContent = `Editar: ${key}`;
  document.getElementById('achievementKey').value = key;
  document.getElementById('achievementKey').disabled = true;
  document.getElementById('achievementName').value = ach.name;
  document.getElementById('achievementIcon').value = ach.icon || '🏆';
  document.getElementById('achievementDescription').value = ach.description || '';
  
  const saveBtn = document.getElementById('achievementModalSave');
  const newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);
  
  newSave.onclick = () => {
    const name = document.getElementById('achievementName').value.trim();
    const icon = document.getElementById('achievementIcon').value.trim();
    const description = document.getElementById('achievementDescription').value.trim();
    
    saveToHistory(); // Guardar antes de editar
    
    currentStory.config.achievements[key] = {
      name,
      icon,
      description
    };
    
    markDirty();
    renderAchievements();
    closeModal('achievementModal');
    showToast('Logro actualizado', 'success');
  };
};

window.deleteAchievement = async function(key) {
  const confirmed = await showConfirm(
    `¿Eliminar el logro "${key}"?`,
    'Eliminar Logro'
  );
  
  if (!confirmed) return;
  
  saveToHistory(); // Guardar antes de eliminar
  
  delete currentStory.config.achievements[key];
  markDirty();
  renderAchievements();
  showToast('Logro eliminado', 'success');
};

// ============================================
// FLOWCHART - VISUALIZACIÓN DE FLUJO
// ============================================

// Variables globales del flowchart
let flowchartData = {
  nodes: [],
  edges: [],
  unreachableNodes: new Set(),
  analysis: {}
};

let flowchartState = {
  zoom: 1,
  dayFilter: 'all',
  typeFilter: 'all',
  showUnreachable: true,
  selectedNode: null
};

/**
 * ========================================
 * FLOWCHART - Sistema de visualización con Mermaid.js
 * ========================================
 */

// Variable global para el control de zoom
let panZoomInstance = null;

/**
 * Actualizar el flowchart completo
 */
window.refreshFlowchart = async function() {
  console.log('🔄 Actualizando flowchart con Mermaid...');
  
  // Verificar si hay eventos
  if (!currentStory.story.events || currentStory.story.events.length === 0) {
    document.getElementById('mermaidFlowchart').style.display = 'none';
    document.getElementById('flowchartEmpty').style.display = 'block';
    document.getElementById('flowchartStats').innerHTML = '<p>No hay eventos para analizar.</p>';
    return;
  }
  
  document.getElementById('mermaidFlowchart').style.display = 'block';
  document.getElementById('flowchartEmpty').style.display = 'none';
  
  try {
    // Generar código Mermaid
    const mermaidCode = generateMermaidCode();
    
    // Renderizar con Mermaid
    const container = document.getElementById('mermaidFlowchart');
    container.innerHTML = `<pre class="mermaid">${mermaidCode}</pre>`;
    
    // Esperar a que Mermaid esté disponible
    if (window.mermaid) {
      await window.mermaid.run({
        querySelector: '.mermaid'
      });
      
      // Inicializar zoom y pan después del renderizado
      setTimeout(() => {
        initializeFlowchartInteractivity();
      }, 100);
    }
    
    // Actualizar estadísticas
    updateFlowchartStats();
    
    // Actualizar filtro de días
    updateFlowchartDayFilter();
    
    showToast('Flowchart actualizado', 'success');
  } catch (error) {
    console.error('Error al renderizar flowchart:', error);
    showToast('Error al generar flowchart', 'error');
  }
};

/**
 * Inicializar interactividad del flowchart
 */
function initializeFlowchartInteractivity() {
  const svg = document.querySelector('#mermaidFlowchart svg');
  
  if (!svg) {
    console.warn('No se encontró SVG del flowchart');
    return;
  }
  
  // Destruir instancia anterior si existe
  if (panZoomInstance) {
    panZoomInstance.destroy();
  }
  
  // Inicializar pan & zoom con svg-pan-zoom
  if (window.svgPanZoom) {
    panZoomInstance = svgPanZoom(svg, {
      zoomEnabled: true,
      controlIconsEnabled: false,
      fit: true,
      center: true,
      minZoom: 0.1,
      maxZoom: 10,
      zoomScaleSensitivity: 0.3,
      onZoom: function(scale) {
        document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
      }
    });
  }
  
  // Agregar click handlers a los nodos
  addNodeClickHandlers();
}

/**
 * Agregar manejadores de click a los nodos
 */
function addNodeClickHandlers() {
  const nodes = document.querySelectorAll('#mermaidFlowchart .node');
  
  nodes.forEach(node => {
    // Extraer ID del nodo desde el elemento
    const nodeId = extractNodeId(node);
    if (!nodeId) return;
    
    // Encontrar el evento correspondiente
    const event = currentStory.story.events.find(e => sanitizeId(e.id) === nodeId);
    if (!event) return;
    
    // Agregar cursor pointer
    node.style.cursor = 'pointer';
    
    // Agregar evento click
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      showEventDetails(event);
    });
    
    // Agregar tooltip
    node.setAttribute('title', `Click para ver detalles de "${event.id}"`);
  });
}

/**
 * Extraer ID del nodo desde el elemento DOM
 */
function extractNodeId(nodeElement) {
  // Intentar obtener el ID desde diferentes posibles ubicaciones
  const id = nodeElement.id || nodeElement.getAttribute('id');
  
  if (id) {
    // El ID en Mermaid suele tener formato "flowchart-{nodeId}-{number}"
    const match = id.match(/flowchart-(.+?)-\d+/);
    return match ? match[1] : id;
  }
  
  return null;
}

/**
 * Mostrar detalles del evento en un modal
 */
function showEventDetails(event) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  // Asegurar que el modal use flex para centrar el contenido
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  
  const choicesHtml = event.choices ? event.choices.map((choice, i) => `
    <div style="padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px; margin-bottom: 0.5rem;">
      <strong>Opción ${i + 1}:</strong> ${choice.text || 'Sin texto'}
      ${choice.effects ? `
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">
          ${Object.keys(choice.effects).length} efectos
        </div>
      ` : ''}
    </div>
  `).join('') : '<p>Sin opciones</p>';
  
  const conditionsHtml = event.conditions && Object.keys(event.conditions).length > 0 
    ? `<pre style="background: var(--bg-secondary); padding: 0.5rem; border-radius: 4px; overflow: auto; max-height: 200px;">${JSON.stringify(event.conditions, null, 2)}</pre>`
    : '<p>Sin condiciones</p>';
  
  modal.innerHTML = `
    <div class="modal-content large">
      <h3><i data-lucide="book-open"></i> ${event.id}</h3>
      
      <div style="display: grid; gap: 1rem;">
        <div>
          <strong>Tipo:</strong> <span style="padding: 0.25rem 0.5rem; background: var(--accent); color: white; border-radius: 4px; font-size: 0.9rem;">${event.type || 'optional'}</span>
          <strong style="margin-left: 1rem;">Día:</strong> ${event.day || 1}
        </div>
        
        <div>
          <strong>Situación:</strong>
          <p style="padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px; margin-top: 0.5rem;">${event.text || 'Sin texto'}</p>
        </div>
        
        <div>
          <strong>Opciones (${event.choices ? event.choices.length : 0}):</strong>
          <div style="margin-top: 0.5rem;">
            ${choicesHtml}
          </div>
        </div>
        
        <div>
          <strong>Condiciones:</strong>
          <div style="margin-top: 0.5rem;">
            ${conditionsHtml}
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button class="btn-primary" onclick="editEventFromFlowchart('${event.id}')"><i data-lucide="pencil"></i> Editar Evento</button>
        <button class="btn-secondary" onclick="this.closest('.modal').remove()"><i data-lucide="x"></i> Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  
  // Click fuera para cerrar
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Editar evento desde el flowchart
 */
window.editEventFromFlowchart = function(eventId) {
  // Cerrar TODOS los modales dinámicos del flowchart
  document.querySelectorAll('.modal').forEach(modal => {
    // Solo remover modales dinámicos (los que no tienen ID)
    if (!modal.id) {
      modal.remove();
    }
  });
  
  // Ir a la sección de eventos
  document.querySelector('[data-section="events"]').click();
  
  // Buscar y editar el evento
  setTimeout(() => {
    const eventIndex = currentStory.story.events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      editEvent(eventIndex);
    }
  }, 100);
};

/**
 * Controles de zoom
 */
window.zoomIn = function() {
  if (panZoomInstance) {
    panZoomInstance.zoomIn();
  }
};

window.zoomOut = function() {
  if (panZoomInstance) {
    panZoomInstance.zoomOut();
  }
};

window.resetZoom = function() {
  if (panZoomInstance) {
    panZoomInstance.resetZoom();
    panZoomInstance.center();
  }
};

window.fitToScreen = function() {
  if (panZoomInstance) {
    panZoomInstance.fit();
    panZoomInstance.center();
  }
};

/**
 * ✨ MEJORA 5: Búsqueda de eventos en el flowchart
 */
window.handleFlowchartSearch = function() {
  // Debounce para evitar renderizar en cada tecla
  clearTimeout(window.flowchartSearchTimeout);
  window.flowchartSearchTimeout = setTimeout(() => {
    refreshFlowchart();
  }, 300);
};

/**
 * ✨ MEJORA 6: Exportar código Mermaid para análisis externo
 */
window.exportFlowchartCode = function() {
  const mermaidCode = generateMermaidCode();
  
  // Crear modal para mostrar el código
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content large">
      <h3>📋 Código Mermaid del Flowchart</h3>
      <p style="color: var(--text-secondary); margin-bottom: 1rem;">
        Puedes copiar este código y usarlo en herramientas como 
        <a href="https://mermaid.live" target="_blank" style="color: var(--accent);">Mermaid Live Editor</a>
      </p>
      <textarea 
        readonly 
        style="width: 100%; height: 400px; font-family: monospace; padding: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 4px;"
        onclick="this.select()"
      >${mermaidCode}</textarea>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button class="btn-primary" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value).then(() => showToast('Código copiado', 'success'))">
          📋 Copiar al Portapapeles
        </button>
        <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

/**
 * Generar código Mermaid para el flowchart
 */
function generateMermaidCode() {
  const events = currentStory.story.events;
  
  if (!events || events.length === 0) {
    return 'graph TD\n  Start["No hay eventos"]';
  }
  
  const dayFilter = document.getElementById('flowchartDayFilter')?.value || 'all';
  const typeFilter = document.getElementById('flowchartTypeFilter')?.value || 'all';
  const showUnreachable = document.getElementById('showUnreachable')?.checked !== false;
  const showOnlyMandatory = document.getElementById('showOnlyMandatory')?.checked || false;
  const searchText = document.getElementById('flowchartSearch')?.value.toLowerCase() || '';
  
  // ✨ MEJORA 4: Filtrado avanzado
  let filteredEvents = events.filter(event => {
    // Filtro por día
    if (dayFilter !== 'all' && event.day !== parseInt(dayFilter)) return false;
    
    // Filtro por tipo
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    
    // ✨ NUEVO: Filtro solo principales (mandatory/forced)
    if (showOnlyMandatory) {
      const type = event.type || 'optional';
      if (type !== 'mandatory' && type !== 'forced') return false;
    }
    
    // ✨ NUEVO: Búsqueda por texto
    if (searchText) {
      const matchId = event.id.toLowerCase().includes(searchText);
      const matchText = event.text && event.text.toLowerCase().includes(searchText);
      if (!matchId && !matchText) return false;
    }
    
    return true;
  });
  
  // Analizar alcanzabilidad
  const reachable = analyzeReachability(events);
  
  if (!showUnreachable) {
    filteredEvents = filteredEvents.filter(event => reachable && reachable.has(event.id));
  }
  
  // Usar layout TD (Top to Down) - más natural y legible
  let mermaidCode = 'graph TD\n';
  
  // Definir estilos mejorados por tipo
  mermaidCode += '  classDef mandatory fill:#4a90e2,stroke:#2563eb,stroke-width:3px,color:#fff,font-weight:bold\n';
  mermaidCode += '  classDef optional fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff\n';
  mermaidCode += '  classDef random fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff\n';
  mermaidCode += '  classDef forced fill:#8b5cf6,stroke:#7c3aed,stroke-width:3px,color:#fff,font-weight:bold\n';
  mermaidCode += '  classDef unreachable fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff,opacity:0.6\n';
  mermaidCode += '  classDef dayLabel fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151,font-weight:bold\n';
  
  // Agrupar eventos por día
  const eventsByDay = new Map();
  const noSpecificDay = []; // Eventos sin día específico
  
  filteredEvents.forEach(event => {
    const day = event.day || 0;
    
    if (day === 0) {
      noSpecificDay.push(event);
    } else {
      if (!eventsByDay.has(day)) {
        eventsByDay.set(day, []);
      }
      eventsByDay.get(day).push(event);
    }
  });
  
  // Ordenar días
  const sortedDays = Array.from(eventsByDay.keys()).sort((a, b) => a - b);
  
  // Variables para tracking de conexiones y nodos previos
  const processedEdges = new Set(); // Mover aquí para evitar redeclaración
  let lastNodeOfPreviousDay = null;
  
  // Generar nodos organizados por día
  sortedDays.forEach((day, dayIndex) => {
    const dayEvents = eventsByDay.get(day);
    
    // Ordenar eventos del día por tipo (mandatory primero)
    const typeOrder = { mandatory: 0, forced: 1, optional: 2, random: 3 };
    dayEvents.sort((a, b) => {
      const orderA = typeOrder[a.type || 'optional'] || 999;
      const orderB = typeOrder[b.type || 'optional'] || 999;
      return orderA - orderB;
    });
    
    // Crear etiqueta de día (nodo especial)
    const dayLabelId = `day_${day}_label`;
    mermaidCode += `  ${dayLabelId}["📅 DÍA ${day}"]:::dayLabel\n`;
    
    // Conectar con el día anterior
    if (lastNodeOfPreviousDay) {
      mermaidCode += `  ${lastNodeOfPreviousDay} -.-> ${dayLabelId}\n`;
    }
    
    // Conectar etiqueta del día con el primer evento del día
    if (dayEvents.length > 0) {
      const firstEventId = sanitizeId(dayEvents[0].id);
      mermaidCode += `  ${dayLabelId} --> ${firstEventId}\n`;
    }
    
    // Crear nodos de eventos
    dayEvents.forEach((event, index) => {
      const nodeId = sanitizeId(event.id);
      
      // Crear texto del nodo más compacto y legible
      const eventType = event.type || 'optional';
      const typeEmoji = {
        mandatory: '🔵',
        optional: '🟢', 
        random: '🟡',
        forced: '🟣'
      }[eventType] || '⚪';
      
      // Texto truncado a 30 caracteres (dejamos espacio para indicadores)
      let text = event.text || 'Sin texto';
      text = text.substring(0, 30).replace(/"/g, "'").replace(/\n/g, ' ');
      if (event.text && event.text.length > 30) text += '...';
      
      // ✨ MEJORA 1: Indicadores adicionales
      const indicators = [];
      
      // Número de opciones
      if (event.choices && event.choices.length > 0) {
        indicators.push(`${event.choices.length} opciones`);
      }
      
      // Repetible
      if (event.can_repeat) {
        indicators.push('↻ Repetible');
      }
      
      // Tiene condiciones complejas
      if (event.conditions) {
        const conditionCount = Object.keys(event.conditions).length;
        if (conditionCount > 0) {
          indicators.push(`🔒 ${conditionCount} condiciones`);
        }
      }
      
      // Probabilidad para eventos random
      let probabilityText = '';
      if (eventType === 'random' && event.probability !== undefined) {
        probabilityText = ` (${Math.round(event.probability * 100)}%)`;
      }
      
      // Determinar clase CSS
      let cssClass = eventType;
      if (reachable && !reachable.has(event.id)) {
        cssClass = 'unreachable';
      }
      
      // ✨ MEJORA 2: Formato del nodo enriquecido
      const typeLabel = eventType.toUpperCase() + probabilityText;
      const indicatorsText = indicators.length > 0 ? `<br/><small>${indicators.join(' • ')}</small>` : '';
      mermaidCode += `  ${nodeId}["${typeEmoji} <b>${typeLabel}</b><br/>${text}${indicatorsText}"]:::${cssClass}\n`;
      
      // Conectar eventos del mismo día en secuencia visual
      if (index > 0) {
        const prevEventId = sanitizeId(dayEvents[index - 1].id);
        const edgeKey = `seq_${prevEventId}_${nodeId}`;
        if (!processedEdges.has(edgeKey)) {
          mermaidCode += `  ${prevEventId} -.-> ${nodeId}\n`;
          processedEdges.add(edgeKey);
        }
      }
    });
    
    // Guardar último nodo del día para conectar con el siguiente día
    if (dayEvents.length > 0) {
      lastNodeOfPreviousDay = sanitizeId(dayEvents[dayEvents.length - 1].id);
    }
  });
  
  // Agregar eventos sin día específico al final
  if (noSpecificDay.length > 0) {
    const anyDayLabelId = 'anyday_label';
    mermaidCode += `  ${anyDayLabelId}["🔀 CUALQUIER DÍA"]:::dayLabel\n`;
    
    if (lastNodeOfPreviousDay) {
      mermaidCode += `  ${lastNodeOfPreviousDay} -.-> ${anyDayLabelId}\n`;
    }
    
    noSpecificDay.forEach((event, index) => {
      const nodeId = sanitizeId(event.id);
      const eventType = event.type || 'optional';
      const typeEmoji = {
        mandatory: '🔵',
        optional: '🟢',
        random: '🟡',
        forced: '🟣'
      }[eventType] || '⚪';
      
      let text = event.text || 'Sin texto';
      text = text.substring(0, 30).replace(/"/g, "'").replace(/\n/g, ' ');
      if (event.text && event.text.length > 30) text += '...';
      
      // Indicadores adicionales (igual que arriba)
      const indicators = [];
      if (event.choices && event.choices.length > 0) {
        indicators.push(`${event.choices.length} opciones`);
      }
      if (event.can_repeat) {
        indicators.push('↻ Repetible');
      }
      if (event.conditions) {
        const conditionCount = Object.keys(event.conditions).length;
        if (conditionCount > 0) {
          indicators.push(`🔒 ${conditionCount} condiciones`);
        }
      }
      
      let probabilityText = '';
      if (eventType === 'random' && event.probability !== undefined) {
        probabilityText = ` (${Math.round(event.probability * 100)}%)`;
      }
      
      let cssClass = eventType;
      if (reachable && !reachable.has(event.id)) {
        cssClass = 'unreachable';
      }
      
      const typeLabel = eventType.toUpperCase() + probabilityText;
      const indicatorsText = indicators.length > 0 ? `<br/><small>${indicators.join(' • ')}</small>` : '';
      mermaidCode += `  ${nodeId}["${typeEmoji} <b>${typeLabel}</b><br/>${text}${indicatorsText}"]:::${cssClass}\n`;
      
      if (index === 0) {
        mermaidCode += `  ${anyDayLabelId} --> ${nodeId}\n`;
      } else {
        const prevEventId = sanitizeId(noSpecificDay[index - 1].id);
        mermaidCode += `  ${prevEventId} -.-> ${nodeId}\n`;
      }
    });
  }
  
  // Crear aristas (conexiones entre eventos por efectos)
  // Reutilizar processedEdges ya declarado arriba
  
  filteredEvents.forEach(event => {
    const fromId = sanitizeId(event.id);
    
    // 1. Conexiones por unlock_events con efectos descriptivos
    if (event.choices) {
      event.choices.forEach((choice, choiceIndex) => {
        if (choice.effects?.unlock_events) {
          choice.effects.unlock_events.forEach(targetId => {
            if (events.find(e => e.id === targetId)) {
              const toId = sanitizeId(targetId);
              const edgeKey = `${fromId}->${toId}`;
              if (!processedEdges.has(edgeKey)) {
                // ✨ MEJORA 3: Mostrar efectos en la conexión
                const effectsSummary = getEffectsSummary(choice.effects);
                const label = effectsSummary 
                  ? `Opción ${choiceIndex + 1}: ${effectsSummary}` 
                  : `Opción ${choiceIndex + 1}`;
                mermaidCode += `  ${fromId} -->|${label}| ${toId}\n`;
                processedEdges.add(edgeKey);
              }
            }
          });
        }
        
        // 2. Conexiones por lock_events (línea punteada)
        if (choice.effects?.lock_events) {
          choice.effects.lock_events.forEach(targetId => {
            if (events.find(e => e.id === targetId)) {
              const toId = sanitizeId(targetId);
              const edgeKey = `${fromId}-.->${toId}`;
              if (!processedEdges.has(edgeKey)) {
                const effectsSummary = getEffectsSummary(choice.effects);
                const label = effectsSummary 
                  ? `Bloquea: ${effectsSummary}` 
                  : 'Bloquea';
                mermaidCode += `  ${fromId} -.${label}.-> ${toId}\n`;
                processedEdges.add(edgeKey);
              }
            }
          });
        }
      });
    }
    
    // 3. Conexiones por completed_events
    events.forEach(targetEvent => {
      if (targetEvent.conditions?.completed_events) {
        if (targetEvent.conditions.completed_events.includes(event.id)) {
          const toId = sanitizeId(targetEvent.id);
          const edgeKey = `${fromId}==>${toId}`;
          if (!processedEdges.has(edgeKey)) {
            mermaidCode += `  ${fromId} ==>|⚡ Requerido| ${toId}\n`;
            processedEdges.add(edgeKey);
          }
        }
      }
    });
    
    // 4. Conexiones por previous_choices
    events.forEach(targetEvent => {
      if (targetEvent.conditions?.previous_choices) {
        if (targetEvent.conditions.previous_choices[event.id] !== undefined) {
          const choiceIndex = targetEvent.conditions.previous_choices[event.id];
          const toId = sanitizeId(targetEvent.id);
          const edgeKey = `${fromId}-->${toId}-choice`;
          if (!processedEdges.has(edgeKey)) {
            mermaidCode += `  ${fromId} -->|🎯 Si elegiste ${choiceIndex + 1}| ${toId}\n`;
            processedEdges.add(edgeKey);
          }
        }
      }
    });
  });
  
  return mermaidCode;
}

/**
 * Obtener resumen de efectos para mostrar en conexiones
 */
function getEffectsSummary(effects) {
  if (!effects) return '';
  
  const summary = [];
  
  // Stats modificadas
  if (effects.stats) {
    const statChanges = Object.entries(effects.stats)
      .map(([key, value]) => {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value} ${key}`;
      })
      .slice(0, 2); // Máximo 2 para no saturar
    if (statChanges.length > 0) {
      summary.push(...statChanges);
    }
  }
  
  // Flags importantes
  if (effects.flags) {
    const flagChanges = Object.entries(effects.flags)
      .filter(([_, value]) => typeof value === 'boolean')
      .slice(0, 1);
    if (flagChanges.length > 0) {
      summary.push(`🚩 ${flagChanges[0][0]}`);
    }
  }
  
  // Personajes
  if (effects.characters) {
    const charChanges = Object.keys(effects.characters).slice(0, 1);
    if (charChanges.length > 0) {
      summary.push(`👤 ${charChanges[0]}`);
    }
  }
  
  // Inventario
  if (effects.inventory) {
    if (effects.inventory.money) {
      const sign = effects.inventory.money > 0 ? '+' : '';
      summary.push(`${sign}${effects.inventory.money}💰`);
    }
    if (effects.inventory.items && effects.inventory.items.length > 0) {
      summary.push(`+${effects.inventory.items[0]}`);
    }
  }
  
  return summary.slice(0, 3).join(', '); // Máximo 3 efectos
}

/**
 * Sanitizar ID para Mermaid (solo alfanuméricos y guiones bajos)
 */
function sanitizeId(id) {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Analizar alcanzabilidad de eventos (simplificado)
 */
function analyzeReachability(events) {
  const reachable = new Set();
  
  // Marcar eventos mandatory como alcanzables
  events.forEach(event => {
    if (event.type === 'mandatory') {
      reachable.add(event.id);
    }
  });
  
  // Marcar eventos sin condiciones como potencialmente alcanzables
  events.forEach(event => {
    const hasConditions = event.conditions && Object.keys(event.conditions).length > 0;
    if (!hasConditions && event.type !== 'mandatory') {
      reachable.add(event.id);
    }
  });
  
  // Propagar alcanzabilidad a través de unlock_events
  let changed = true;
  let iterations = 0;
  
  while (changed && iterations < 100) {
    changed = false;
    iterations++;
    
    events.forEach(event => {
      if (reachable.has(event.id)) {
        if (event.choices) {
          event.choices.forEach(choice => {
            if (choice.effects?.unlock_events) {
              choice.effects.unlock_events.forEach(targetId => {
                if (!reachable.has(targetId)) {
                  reachable.add(targetId);
                  changed = true;
                }
              });
            }
          });
        }
      }
    });
    
    // Marcar eventos cuyas condiciones sean satisfacibles
    events.forEach(event => {
      if (!reachable.has(event.id)) {
        if (event.conditions?.completed_events) {
          const allReachable = event.conditions.completed_events.every(reqId => reachable.has(reqId));
          if (allReachable) {
            reachable.add(event.id);
            changed = true;
          }
        }
      }
    });
  }
  
  return reachable;
}

/**
 * Actualizar estadísticas del flowchart
 */
function updateFlowchartStats() {
  const events = currentStory.story.events;
  
  if (!events || events.length === 0) {
    document.getElementById('flowchartStats').innerHTML = '<p>No hay eventos para analizar.</p>';
    return;
  }
  
  const reachable = analyzeReachability(events);
  
  const stats = {
    total: events.length,
    mandatory: events.filter(e => e.type === 'mandatory').length,
    optional: events.filter(e => e.type === 'optional').length,
    random: events.filter(e => e.type === 'random').length,
    forced: events.filter(e => e.type === 'forced').length,
    reachable: reachable ? reachable.size : 0,
    unreachable: reachable ? (events.length - reachable.size) : events.length,
    withConditions: events.filter(e => e.conditions && Object.keys(e.conditions).length > 0).length,
    repeatable: events.filter(e => e.can_repeat).length
  };
  
  // ✨ MEJORA 7: Calcular camino crítico (eventos mandatory)
  const criticalPath = events.filter(e => e.type === 'mandatory').sort((a, b) => (a.day || 0) - (b.day || 0));
  const criticalPathText = criticalPath.length > 0 
    ? `${criticalPath.length} eventos (${criticalPath.map(e => `Día ${e.day}`).join(' → ')})` 
    : 'No definido';
  
  // ✨ MEJORA 8: Opciones totales
  const totalChoices = events.reduce((sum, e) => sum + (e.choices ? e.choices.length : 0), 0);
  
  document.getElementById('flowchartStats').innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
      <div class="stat-card">
        <div class="stat-label">📊 Total de Eventos</div>
        <div class="stat-value">${stats.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🔵 Mandatory</div>
        <div class="stat-value">${stats.mandatory}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🟢 Optional</div>
        <div class="stat-value">${stats.optional}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🟡 Random</div>
        <div class="stat-value">${stats.random}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🟣 Forced</div>
        <div class="stat-value">${stats.forced}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">✅ Alcanzables</div>
        <div class="stat-value">${stats.reachable}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">❌ Inalcanzables</div>
        <div class="stat-value" style="color: ${stats.unreachable > 0 ? 'var(--error)' : 'inherit'}">${stats.unreachable}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🔒 Con Condiciones</div>
        <div class="stat-value">${stats.withConditions}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">↻ Repetibles</div>
        <div class="stat-value">${stats.repeatable}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🎯 Total Opciones</div>
        <div class="stat-value">${totalChoices}</div>
      </div>
    </div>
    <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--accent);">
      <strong>⚡ Camino Crítico (Mandatory):</strong><br/>
      <span style="color: var(--text-secondary);">${criticalPathText}</span>
    </div>
  `;
}

/**
 * Exportar código Mermaid
 */
window.exportFlowchartCode = async function() {
  const mermaidCode = generateMermaidCode();
  
  // Copiar al portapapeles
  try {
    await navigator.clipboard.writeText(mermaidCode);
    showToast('Código Mermaid copiado al portapapeles', 'success');
  } catch (err) {
    // Fallback: mostrar en modal
    await showAlert(
      `Código Mermaid (copia manualmente):\n\n${mermaidCode}`,
      'Código del Flowchart'
    );
  }
};

// ============================================
// FUNCIONES OBSOLETAS DEL FLOWCHART MANUAL
// (Ya no se usan - reemplazadas por Mermaid.js)
// ============================================

/**
 * Construir el grafo de eventos (OBSOLETO)
 */
function buildFlowchartGraph() {
  flowchartData.nodes = [];
  flowchartData.edges = [];
  
  const events = currentStory.story.events;
  
  // Crear nodos para cada evento
  events.forEach((event, index) => {
    flowchartData.nodes.push({
      id: event.id,
      type: event.type || 'optional',
      day: event.day || 1,
      text: event.text ? event.text.substring(0, 50) + '...' : 'Sin texto',
      conditions: event.conditions || {},
      choices: event.choices || [],
      index: index
    });
  });
  
  // Crear aristas basadas en conexiones
  events.forEach((event, index) => {
    const eventId = event.id;
    
    // 1. Conexiones por unlock_events en choices
    if (event.choices) {
      event.choices.forEach((choice, choiceIndex) => {
        if (choice.effects?.unlock_events) {
          choice.effects.unlock_events.forEach(targetId => {
            flowchartData.edges.push({
              from: eventId,
              to: targetId,
              type: 'unlock',
              label: `Choice ${choiceIndex + 1}`,
              color: '#10b981'
            });
          });
        }
        
        // 2. Conexiones por lock_events
        if (choice.effects?.lock_events) {
          choice.effects.lock_events.forEach(targetId => {
            flowchartData.edges.push({
              from: eventId,
              to: targetId,
              type: 'lock',
              label: `Blocks`,
              color: '#ef4444',
              dashed: true
            });
          });
        }
      });
    }
    
    // 3. Conexiones por completed_events (eventos que requieren este)
    events.forEach(targetEvent => {
      if (targetEvent.conditions?.completed_events) {
        if (targetEvent.conditions.completed_events.includes(eventId)) {
          flowchartData.edges.push({
            from: eventId,
            to: targetEvent.id,
            type: 'sequence',
            label: 'Required',
            color: '#8b5cf6'
          });
        }
      }
    });
    
    // 4. Conexiones por previous_choices
    events.forEach(targetEvent => {
      if (targetEvent.conditions?.previous_choices) {
        if (targetEvent.conditions.previous_choices[eventId] !== undefined) {
          const choiceIndex = targetEvent.conditions.previous_choices[eventId];
          flowchartData.edges.push({
            from: eventId,
            to: targetEvent.id,
            type: 'choice_dependency',
            label: `Choice ${choiceIndex + 1}`,
            color: '#f59e0b'
          });
        }
      }
    });
  });
  
  console.log(`📊 Grafo construido: ${flowchartData.nodes.length} nodos, ${flowchartData.edges.length} aristas`);
}

/**
 * Analizar alcanzabilidad de eventos
 */
function analyzeReachability() {
  flowchartData.unreachableNodes = new Set();
  
  const events = currentStory.story.events;
  const reachable = new Set();
  
  // Marcar eventos mandatory como alcanzables
  events.forEach(event => {
    if (event.type === 'mandatory') {
      reachable.add(event.id);
    }
  });
  
  // Marcar eventos sin condiciones como potencialmente alcanzables
  events.forEach(event => {
    const hasConditions = event.conditions && Object.keys(event.conditions).length > 0;
    if (!hasConditions && event.type !== 'mandatory') {
      reachable.add(event.id);
    }
  });
  
  // Propagar alcanzabilidad a través de unlock_events
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    events.forEach(event => {
      if (reachable.has(event.id)) {
        // Este evento es alcanzable, marcar sus unlock_events
        if (event.choices) {
          event.choices.forEach(choice => {
            if (choice.effects?.unlock_events) {
              choice.effects.unlock_events.forEach(targetId => {
                if (!reachable.has(targetId)) {
                  reachable.add(targetId);
                  changed = true;
                }
              });
            }
          });
        }
      }
    });
    
    // Marcar eventos cuyas condiciones sean satisfacibles
    events.forEach(event => {
      if (!reachable.has(event.id)) {
        // Verificar si completed_events son todos alcanzables
        if (event.conditions?.completed_events) {
          const allReachable = event.conditions.completed_events.every(reqId => reachable.has(reqId));
          if (allReachable) {
            reachable.add(event.id);
            changed = true;
          }
        }
      }
    });
  }
  
  // Identificar inalcanzables
  events.forEach(event => {
    if (!reachable.has(event.id)) {
      flowchartData.unreachableNodes.add(event.id);
    }
  });
  
  console.log(`🎯 Análisis: ${reachable.size} alcanzables, ${flowchartData.unreachableNodes.size} inalcanzables`);
}

/**
 * Renderizar el flowchart en SVG
 */
function renderFlowchart() {
  const svg = document.getElementById('flowchartGraph');
  svg.innerHTML = '';
  
  // Aplicar filtros
  const filteredNodes = flowchartData.nodes.filter(node => {
    if (flowchartState.dayFilter !== 'all' && node.day !== parseInt(flowchartState.dayFilter)) {
      return false;
    }
    if (flowchartState.typeFilter !== 'all' && node.type !== flowchartState.typeFilter) {
      return false;
    }
    if (!flowchartState.showUnreachable && flowchartData.unreachableNodes.has(node.id)) {
      return false;
    }
    return true;
  });
  
  if (filteredNodes.length === 0) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#666">No hay eventos que mostrar con los filtros actuales</text>';
    return;
  }
  
  // Calcular posiciones (layout simple por días y tipo)
  const positions = calculateNodePositions(filteredNodes);
  
  // Dibujar aristas primero (para que queden detrás)
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  flowchartData.edges.forEach(edge => {
    if (filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to)) {
      drawEdge(svg, edge, positions);
    }
  });
  
  // Dibujar nodos
  filteredNodes.forEach(node => {
    drawNode(svg, node, positions[node.id]);
  });
}

/**
 * Calcular posiciones de nodos (layout automático simple)
 */
function calculateNodePositions(nodes) {
  const positions = {};
  const nodeWidth = 180;
  const nodeHeight = 80;
  const horizontalSpacing = 240;
  const verticalSpacing = 120;
  
  // Agrupar por día
  const byDay = {};
  nodes.forEach(node => {
    if (!byDay[node.day]) byDay[node.day] = [];
    byDay[node.day].push(node);
  });
  
  // Ordenar por tipo (mandatory primero)
  const typeOrder = { 'mandatory': 0, 'forced': 1, 'optional': 2, 'random': 3 };
  Object.values(byDay).forEach(dayNodes => {
    dayNodes.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  });
  
  // Calcular posiciones
  let currentX = 50;
  Object.keys(byDay).sort((a, b) => a - b).forEach(day => {
    const dayNodes = byDay[day];
    const totalHeight = dayNodes.length * (nodeHeight + verticalSpacing);
    let currentY = Math.max(50, (800 - totalHeight) / 2);
    
    dayNodes.forEach(node => {
      positions[node.id] = { x: currentX, y: currentY };
      currentY += nodeHeight + verticalSpacing;
    });
    
    currentX += nodeWidth + horizontalSpacing;
  });
  
  return positions;
}

/**
 * Dibujar un nodo
 */
function drawNode(svg, node, position) {
  const isUnreachable = flowchartData.unreachableNodes.has(node.id);
  const isSelected = flowchartState.selectedNode === node.id;
  
  // Color según tipo
  const colors = {
    'mandatory': '#4a90e2',
    'optional': '#10b981',
    'random': '#f59e0b',
    'forced': '#8b5cf6'
  };
  const color = isUnreachable ? '#ef4444' : colors[node.type] || '#666';
  
  // Grupo del nodo
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'flowchart-node');
  group.setAttribute('data-node-id', node.id);
  group.style.cursor = 'pointer';
  
  // Rectángulo
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', position.x);
  rect.setAttribute('y', position.y);
  rect.setAttribute('width', 180);
  rect.setAttribute('height', 80);
  rect.setAttribute('rx', 8);
  rect.setAttribute('fill', color);
  rect.setAttribute('stroke', isSelected ? '#fff' : color);
  rect.setAttribute('stroke-width', isSelected ? 4 : 2);
  rect.setAttribute('opacity', isUnreachable ? 0.5 : 0.9);
  group.appendChild(rect);
  
  // ID del evento (texto)
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', position.x + 90);
  text.setAttribute('y', position.y + 25);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', '#fff');
  text.setAttribute('font-size', '12');
  text.setAttribute('font-weight', 'bold');
  text.textContent = node.id.length > 20 ? node.id.substring(0, 17) + '...' : node.id;
  group.appendChild(text);
  
  // Tipo
  const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  typeText.setAttribute('x', position.x + 90);
  typeText.setAttribute('y', position.y + 45);
  typeText.setAttribute('text-anchor', 'middle');
  typeText.setAttribute('fill', '#fff');
  typeText.setAttribute('font-size', '10');
  typeText.textContent = `Día ${node.day} - ${node.type}`;
  group.appendChild(typeText);
  
  // Indicador de inalcanzable
  if (isUnreachable) {
    const warning = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    warning.setAttribute('x', position.x + 90);
    warning.setAttribute('y', position.y + 65);
    warning.setAttribute('text-anchor', 'middle');
    warning.setAttribute('fill', '#fff');
    warning.setAttribute('font-size', '11');
    warning.setAttribute('font-weight', 'bold');
    warning.textContent = '⚠️ Inalcanzable';
    group.appendChild(warning);
  }
  
  // Event listener para selección
  group.addEventListener('click', () => {
    flowchartState.selectedNode = node.id;
    renderFlowchart();
    showNodeDetails(node);
  });
  
  svg.appendChild(group);
}

/**
 * Dibujar una arista
 */
function drawEdge(svg, edge, positions) {
  const fromPos = positions[edge.from];
  const toPos = positions[edge.to];
  
  if (!fromPos || !toPos) return;
  
  // Calcular puntos de inicio y fin (centro derecho -> centro izquierdo)
  const x1 = fromPos.x + 180;
  const y1 = fromPos.y + 40;
  const x2 = toPos.x;
  const y2 = toPos.y + 40;
  
  // Línea
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', edge.color);
  line.setAttribute('stroke-width', 2);
  if (edge.dashed) {
    line.setAttribute('stroke-dasharray', '5,5');
  }
  line.setAttribute('marker-end', edge.type === 'lock' ? 'url(#arrowhead-lock)' : 'url(#arrowhead)');
  line.setAttribute('opacity', 0.7);
  svg.appendChild(line);
  
  // Etiqueta (opcional, en el punto medio)
  if (edge.label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', midX);
    label.setAttribute('y', midY - 5);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', edge.color);
    label.setAttribute('font-size', '10');
    label.setAttribute('font-weight', 'bold');
    label.textContent = edge.label;
    svg.appendChild(label);
  }
}

/**
 * Mostrar detalles de un nodo seleccionado
 */
function showNodeDetails(node) {
  const event = currentStory.story.events.find(e => e.id === node.id);
  if (!event) return;
  
  const details = `
    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
      <h4>📌 ${event.id}</h4>
      <p><strong>Tipo:</strong> ${event.type}</p>
      <p><strong>Día:</strong> ${event.day}</p>
      <p><strong>Texto:</strong> ${event.text ? event.text.substring(0, 100) + '...' : 'Sin texto'}</p>
      <p><strong>Opciones:</strong> ${event.choices?.length || 0}</p>
      ${flowchartData.unreachableNodes.has(event.id) ? '<p style="color: var(--danger);"><strong><i data-lucide="triangle-alert"></i> Este evento es INALCANZABLE</strong></p>' : ''}
      <button class="btn-primary btn-small" onclick="editEvent(${node.index})"><i data-lucide="pencil"></i> Editar Evento</button>
    </div>
  `;
  
  const statsDiv = document.getElementById('flowchartStats');
  statsDiv.innerHTML = details;
}

/**
 * Actualizar estadísticas del flowchart
 */
function updateFlowchartStats() {
  const total = flowchartData.nodes.length;
  const unreachable = flowchartData.unreachableNodes.size;
  const reachable = total - unreachable;
  
  const byType = {};
  flowchartData.nodes.forEach(node => {
    byType[node.type] = (byType[node.type] || 0) + 1;
  });
  
  const byDay = {};
  flowchartData.nodes.forEach(node => {
    byDay[node.day] = (byDay[node.day] || 0) + 1;
  });
  
  // Detectar loops (simplificado)
  const loops = detectLoops();
  
  const statsHTML = `
    <div class="stat-grid">
      <div class="stat-item">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Eventos</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="color: var(--success);">${reachable}</div>
        <div class="stat-label">Alcanzables</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="color: var(--danger);">${unreachable}</div>
        <div class="stat-label">Inalcanzables</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${flowchartData.edges.length}</div>
        <div class="stat-label">Conexiones</div>
      </div>
    </div>
    
    <div style="margin-top: 1rem;">
      <h4>Por Tipo:</h4>
      <ul>
        ${Object.entries(byType).map(([type, count]) => `<li><strong>${type}:</strong> ${count}</li>`).join('')}
      </ul>
    </div>
    
    <div style="margin-top: 1rem;">
      <h4>Por Día:</h4>
      <ul>
        ${Object.entries(byDay).sort((a, b) => a[0] - b[0]).map(([day, count]) => `<li><strong>Día ${day}:</strong> ${count} eventos</li>`).join('')}
      </ul>
    </div>
    
    ${loops.length > 0 ? `
      <div style="margin-top: 1rem;">
        <h4 style="color: var(--warning);">⚠️ Loops Detectados:</h4>
        <ul>
          ${loops.map(loop => `<li>${loop.join(' → ')}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    ${unreachable > 0 ? `
      <div style="margin-top: 1rem;">
        <h4 style="color: var(--danger);">❌ Eventos Inalcanzables:</h4>
        <ul>
          ${Array.from(flowchartData.unreachableNodes).map(id => `<li>${id}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;
  
  document.getElementById('flowchartStats').innerHTML = statsHTML;
  
  flowchartData.analysis = {
    total,
    reachable,
    unreachable,
    byType,
    byDay,
    loops
  };
}

/**
 * Detectar loops en el grafo (simplificado)
 */
function detectLoops() {
  const loops = [];
  const visited = new Set();
  const path = [];
  
  function dfs(nodeId) {
    if (path.includes(nodeId)) {
      // Loop detectado
      const loopStart = path.indexOf(nodeId);
      loops.push(path.slice(loopStart).concat(nodeId));
      return;
    }
    
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    path.push(nodeId);
    
    // Seguir aristas
    flowchartData.edges.forEach(edge => {
      if (edge.from === nodeId && edge.type !== 'lock') {
        dfs(edge.to);
      }
    });
    
    path.pop();
  }
  
  flowchartData.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });
  
  return loops;
}

/**
 * Aplicar filtros del flowchart
 */
window.applyFlowchartFilters = function() {
  flowchartState.dayFilter = document.getElementById('flowchartDayFilter').value;
  flowchartState.typeFilter = document.getElementById('flowchartTypeFilter').value;
  flowchartState.showUnreachable = document.getElementById('showUnreachable').checked;
  
  renderFlowchart();
};

/**
 * Aplicar zoom
 */
window.applyFlowchartZoom = function(value) {
  flowchartState.zoom = parseFloat(value);
  document.getElementById('flowchartZoomValue').textContent = Math.round(value * 100) + '%';
  
  const graph = document.getElementById('flowchartGraph');
  graph.setAttribute('transform', `scale(${value})`);
};

/**
 * Actualizar filtro de días
 */
function updateFlowchartDayFilter() {
  const select = document.getElementById('flowchartDayFilter');
  const days = currentStory.config.story.max_days || currentStory.config.story.days || 1;
  
  select.innerHTML = '<option value="all">Todos los días</option>';
  for (let i = 1; i <= days; i++) {
    select.innerHTML += `<option value="${i}">Día ${i}</option>`;
  }
}

/**
 * Exportar flowchart como imagen
 */
window.exportFlowchartImage = function() {
  const svg = document.getElementById('flowchartSvg');
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentStory.config.story.id}_flowchart.svg`;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Flowchart exportado como SVG', 'success');
};

// Sync config changes
document.getElementById('storyTitleInput').addEventListener('input', (e) => {
  currentStory.config.story.title = e.target.value;
  document.getElementById('storyTitle').textContent = e.target.value || 'Nueva Historia';
  markDirty();
});

['storyId', 'storyVersion', 'storySubtitle', 'storyDescription', 'storyAuthor'].forEach(id => {
  document.getElementById(id).addEventListener('input', (e) => {
    const field = id.replace('story', '').toLowerCase().replace('input', '');
    currentStory.config.story[field] = e.target.value;
    markDirty();
  });
});

['storyDays', 'startingDay', 'saveSlots'].forEach(id => {
  document.getElementById(id).addEventListener('input', (e) => {
    let field = id.replace('story', '').replace(/([A-Z])/g, '_$1').toLowerCase().replace('_', '');
    
    // Convertir 'days' a 'max_days' para consistencia con el formato oficial
    if (field === 'days') {
      field = 'max_days';
    } else if (field === 'startingday') {
      field = 'starting_day';
    }
    
    const target = id === 'saveSlots' ? currentStory.config.settings : currentStory.config.story;
    target[field] = parseInt(e.target.value) || 1;
    
    if (id === 'storyDays') {
      updateDayFilter();
    }
    
    markDirty();
  });
});

document.getElementById('startingTime').addEventListener('change', (e) => {
  currentStory.config.story.starting_time = e.target.value;
  markDirty();
});

['autoSave', 'enableSound', 'showCharacters', 'showInventory'].forEach(id => {
  document.getElementById(id).addEventListener('change', (e) => {
    const field = id.replace(/([A-Z])/g, '_$1').toLowerCase();
    currentStory.config.settings[field] = e.target.checked;
    markDirty();
  });
});

document.getElementById('inventoryEnabled').addEventListener('change', (e) => {
  currentStory.config.inventory.enabled = e.target.checked;
  markDirty();
});

document.getElementById('initialMoney').addEventListener('input', (e) => {
  currentStory.config.inventory.money = parseInt(e.target.value) || 0;
  markDirty();
});

document.getElementById('defaultEndingTitle').addEventListener('input', (e) => {
  currentStory.endings.default_ending.title = e.target.value;
  markDirty();
});

document.getElementById('defaultEndingMessage').addEventListener('input', (e) => {
  currentStory.endings.default_ending.content.message = e.target.value;
  markDirty();
});

// Save, Export, Import
document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!currentStory.config.story.id) {
    showToast('Debes especificar un ID para la historia', 'error');
    return;
  }
  
  try {
    const storyId = currentStory.config.story.id;
    
    // Validar que el ID sea válido para nombre de archivo
    if (!/^[a-zA-Z0-9_-]+$/.test(storyId)) {
      throw new Error('El ID de la historia solo puede contener letras, números, guiones y guiones bajos');
    }
    
    // Download files with delay to prevent browser blocking
    downloadJSON(currentStory.config, `${storyId}_config.json`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    downloadJSON(currentStory.story, `${storyId}_story.json`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    downloadJSON(currentStory.endings, `${storyId}_endings.json`);
    
    markClean();
    showToast(`3 archivos descargados. Copia a stories/${storyId}/`, 'success');
  } catch (error) {
    console.error('Error guardando:', error);
    showToast(`Error al guardar: ${error.message}`, 'error');
  }
});

document.getElementById('exportBtn').addEventListener('click', () => {
  try {
    // Validar que haya datos para exportar
    if (!currentStory.config || !currentStory.story || !currentStory.endings) {
      throw new Error('La historia no está completa. Verifica que tenga config, story y endings.');
    }
    
    const bundle = {
      config: currentStory.config,
      story: currentStory.story,
      endings: currentStory.endings
    };
    
    const filename = `${currentStory.config.story.id || 'historia'}_completa.json`;
    downloadJSON(bundle, filename);
    showToast(`Historia exportada como bundle: ${filename}`, 'success');
  } catch (error) {
    console.error('Error exportando:', error);
    showToast(`Error al exportar: ${error.message}`, 'error');
  }
});

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    // Validar tipo de archivo
    if (!file.name.endsWith('.json')) {
      throw new Error('El archivo debe ser .json');
    }
    
    const text = await file.text();
    
    // Validar que sea JSON válido
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new Error('El archivo no contiene JSON válido: ' + parseError.message);
    }
    
    // Detectar tipo de archivo e importar
    let imported = false;
    
    if (data.config && data.story && data.endings) {
      // Bundle completo
      currentStory = data;
      imported = true;
      showToast('Historia completa importada (bundle)', 'success');
    } else if (data.story && data.stats) {
      // Solo config
      currentStory.config = data;
      imported = true;
      showToast('Archivo config.json importado', 'success');
    } else if (data.events && Array.isArray(data.events)) {
      // Solo story
      currentStory.story = data;
      imported = true;
      showToast('Archivo story.json importado', 'success');
    } else if (data.endings && Array.isArray(data.endings)) {
      // Solo endings
      currentStory.endings = data;
      imported = true;
      showToast('Archivo endings.json importado', 'success');
    }
    
    if (!imported) {
      throw new Error('Formato de archivo no reconocido. Debe ser un bundle completo o un archivo config/story/endings válido.');
    }
    
    // Normalizar: convertir 'situation' a 'text' si existe (backward compatibility)
    if (currentStory.story.events) {
      currentStory.story.events.forEach(event => {
        if (event.situation && !event.text) {
          event.text = event.situation;
          delete event.situation;
        }
      });
    }
    
    updateUI();
    markDirty();
  } catch (error) {
    console.error('Error importando:', error);
    showToast('Error al importar: ' + error.message, 'error');
  }
  
  // Limpiar input para permitir reimportar el mismo archivo
  e.target.value = '';
});

// Test - Ahora usa game.html con modo test
document.getElementById('testBtn').addEventListener('click', () => {
  // Guardar historia completa en localStorage
  localStorage.setItem('testStory', JSON.stringify(currentStory));
  localStorage.setItem('testMode', 'true');
  
  // Abrir game.html con parámetro de test
  window.open('game.html?test=true', '_blank');
});

// Validate
document.getElementById('validateBtn').addEventListener('click', () => {
  const issues = validateStory();
  
  const modal = document.getElementById('validationModal');
  const results = document.getElementById('validationResults');
  
  if (issues.length === 0) {
    results.innerHTML = '<div style="color: var(--success); padding: 2rem; text-align: center;"><h2>✅ Historia válida</h2><p>No se encontraron problemas</p></div>';
  } else {
    results.innerHTML = `
      <div style="color: var(--danger); padding: 1rem;">
        <h3>⚠️ Se encontraron ${issues.length} problema(s):</h3>
        <ul style="margin-top: 1rem; padding-left: 2rem;">
          ${issues.map(issue => `<li style="margin-bottom: 0.5rem;">${issue}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  modal.classList.remove('hidden');
});

function validateStory() {
  const issues = [];
  
  // Validar config
  if (!currentStory.config.story.id) {
    issues.push('Falta el ID de la historia');
  }
  
  if (!currentStory.config.story.title) {
    issues.push('Falta el título de la historia');
  }
  
  if (Object.keys(currentStory.config.stats).length === 0) {
    issues.push('No hay stats definidas');
  }
  
  // Validar eventos
  if (currentStory.story.events.length === 0) {
    issues.push('No hay eventos definidos');
  }
  
  const eventIds = new Set();
  currentStory.story.events.forEach((event, i) => {
    if (!event.id) {
      issues.push(`Evento #${i + 1} sin ID`);
    }
    
    if (eventIds.has(event.id)) {
      issues.push(`ID duplicado: ${event.id}`);
    }
    eventIds.add(event.id);
    
    if (!event.text) {
      issues.push(`Evento "${event.id}" sin texto de situación`);
    }
    
    if (!event.choices || event.choices.length === 0) {
      issues.push(`Evento "${event.id}" sin opciones`);
    }
  });
  
  // Validar finales
  if (currentStory.endings.endings.length === 0) {
    issues.push('No hay finales definidos (al menos define 1)');
  }
  
  return issues;
}

// Utilities
function markDirty() {
  isDirty = true;
  const badge = document.getElementById('storyStatus');
  badge.textContent = 'Sin guardar';
  badge.classList.remove('saved');
}

function markClean() {
  isDirty = false;
  const badge = document.getElementById('storyStatus');
  badge.textContent = 'Guardado';
  badge.classList.add('saved');
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

window.openModal = function(modalId) {
  document.getElementById(modalId).classList.remove('hidden');

};

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  currentEventEdit = null;
};

// Función para cerrar TODOS los modales (útil para Undo/Redo)
function closeAllModals() {
  const modals = [
    'statModal',
    'flagModal',
    'characterModal',
    'itemModal',
    'eventModal',
    'endingModal',
    'achievementModal',
    'validationModal',
    'confirmModal',
    'inputModal',
    'formModal',
    'selectModal'
  ];
  
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal && !modal.classList.contains('hidden')) {
      console.log(`  → Cerrando modal: ${modalId}`);
      modal.classList.add('hidden');
    }
  });
  
  // Resetear el índice de evento en edición
  currentEventEdit = null;
}

// Init
const urlParams = new URLSearchParams(window.location.search);
const storyParam = urlParams.get('story');

if (storyParam) {
  loadExistingStory(storyParam);
} else {
  updateUI();
  // Inicializar botones de historial al cargar sin historia
  updateHistoryButtons();
}

initTheme();

// Warn before closing with unsaved changes
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});
