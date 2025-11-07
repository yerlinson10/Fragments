/**
 * STORY EDITOR - MAIN ENTRY POINT (Modular)
 * Punto de entrada principal para el editor con arquitectura modular ES6
 */

// Core modules
import { currentStory, markDirty, markClean } from './core/state.js';
import { undo, redo, saveToHistory, clearHistory } from './core/history.js';
import { renderAll } from './core/render.js';

// Utils
import { showToast, showConfirm, showInput, showSelect, downloadJSON, closeModal } from './utils/ui.js';

// Validator
import { validateFullStory, getValidationSummaryHTML, loadSchemas } from '../validator.js';

// Exportar funciones globales para compatibilidad con HTML onclick
window.undo = undo;
window.redo = redo;
window.closeModal = closeModal;

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
  console.log('🚀 Inicializando Editor Modular...');
  
  // Cargar esquemas de validación
  await loadSchemas();
  
  // Configurar tema
  initTheme();
  
  // Configurar navegación
  initNavigation();
  
  // Configurar event listeners
  initEventListeners();
  
  // Verificar si hay una historia seleccionada
  const storyId = new URLSearchParams(window.location.search).get('story');
  if (storyId) {
    await loadExistingStory(storyId);
  } else {
    // Inicializar estado por defecto
    saveToHistory();
    renderAll();
  }
  
  console.log('✅ Editor listo');
}

// ============================================
// TEMA
// ============================================

function initTheme() {
  const savedTheme = localStorage.getItem('fragmentsTheme') || 'light';
  const themeToggle = document.getElementById('themeToggle');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeToggle) themeToggle.textContent = '☀️';
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      themeToggle.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('fragmentsTheme', isDark ? 'dark' : 'light');
    });
  }
}

// ============================================
// NAVEGACIÓN
// ============================================

function initNavigation() {
  // Menú lateral
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      
      // Actualizar menú activo
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Mostrar sección
      document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`${section}-section`)?.classList.add('active');
    });
  });
  
  // Botón de volver
  document.getElementById('backBtn')?.addEventListener('click', () => {
    if (currentStory.config.story.id) {
      window.location.href = `/selector?story=${currentStory.config.story.id}`;
    } else {
      window.location.href = '/selector';
    }
  });
}

// ============================================
// EVENT LISTENERS
// ============================================

function initEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC: Cerrar modales
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal:not(.hidden)');
      modals.forEach(modal => modal.classList.add('hidden'));
    }
    
    // Ctrl+S: Guardar
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveStory();
    }
    
    // Ctrl+Z: Undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    
    // Ctrl+Y: Redo
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      redo();
    }
  });
  
  // Botones de acción
  document.getElementById('saveBtn')?.addEventListener('click', saveStory);
  document.getElementById('exportBtn')?.addEventListener('click', exportStory);
  document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('importFile')?.click();
  });
  document.getElementById('validateBtn')?.addEventListener('click', validateStory);
  document.getElementById('testBtn')?.addEventListener('click', testStory);
  
  // Import file
  document.getElementById('importFile')?.addEventListener('change', importFile);
}

// ============================================
// CARGAR/GUARDAR/EXPORTAR
// ============================================

async function loadExistingStory(storyId) {
  try {
    const [configRes, storyRes, endingsRes] = await Promise.all([
      fetch(`/stories/${storyId}/config.json`),
      fetch(`/stories/${storyId}/story.json`),
      fetch(`/stories/${storyId}/endings.json`)
    ]);

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
    
    // Backward compatibility
    if (currentStory.story.events) {
      currentStory.story.events.forEach(event => {
        if (event.situation && !event.text) {
          event.text = event.situation;
          delete event.situation;
        }
      });
    }
    
    saveToHistory();
    renderAll();
    showToast('Historia cargada correctamente', 'success');
  } catch (error) {
    console.error('Error cargando historia:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function saveStory() {
  if (!currentStory.config.story.id) {
    showToast('Debes especificar un ID para la historia', 'error');
    return;
  }
  
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (!idRegex.test(currentStory.config.story.id)) {
    showToast('El ID solo puede contener letras, números, guiones y guiones bajos', 'error');
    return;
  }
  
  try {
    const storyId = currentStory.config.story.id;
    
    downloadJSON(currentStory.config, `${storyId}_config.json`);
    await new Promise(resolve => setTimeout(resolve, 500));
    downloadJSON(currentStory.story, `${storyId}_story.json`);
    await new Promise(resolve => setTimeout(resolve, 500));
    downloadJSON(currentStory.endings, `${storyId}_endings.json`);
    
    markClean();
    showToast('3 archivos descargados. Copia a stories/' + storyId + '/', 'success');
  } catch (error) {
    console.error('Error guardando:', error);
    showToast('Error al guardar', 'error');
  }
}

function exportStory() {
  try {
    if (!currentStory.config || !currentStory.story || !currentStory.endings) {
      throw new Error('La historia no está completa');
    }
    
    const bundle = {
      config: currentStory.config,
      story: currentStory.story,
      endings: currentStory.endings
    };
    
    const filename = `${currentStory.config.story.id || 'historia'}_completa.json`;
    downloadJSON(bundle, filename);
    showToast(`Exportado: ${filename}`, 'success');
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
}

async function importFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    if (!file.name.endsWith('.json')) {
      throw new Error('El archivo debe ser .json');
    }
    
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (data.config && data.story && data.endings) {
      Object.assign(currentStory, data);
      showToast('Bundle completo importado', 'success');
    } else if (data.story && data.stats) {
      currentStory.config = data;
      showToast('Config importado', 'success');
    } else if (data.events) {
      currentStory.story = data;
      showToast('Story importado', 'success');
    } else if (data.endings) {
      currentStory.endings = data;
      showToast('Endings importado', 'success');
    } else {
      throw new Error('Formato no reconocido');
    }
    
    saveToHistory();
    renderAll();
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
  
  e.target.value = '';
}

// ============================================
// VALIDACIÓN Y TEST
// ============================================

function validateStory() {
  const results = validateFullStory(currentStory);
  const html = getValidationSummaryHTML(results);
  
  const modal = document.getElementById('validationModal');
  const resultsDiv = document.getElementById('validationResults');
  
  if (resultsDiv) resultsDiv.innerHTML = html;
  if (modal) modal.classList.remove('hidden');
}

function testStory() {
  localStorage.setItem('testStory', JSON.stringify(currentStory));
  localStorage.setItem('testMode', 'true');
  window.open('/game?test=true', '_blank');
}

// ============================================
// INICIAR APLICACIÓN
// ============================================

init();
