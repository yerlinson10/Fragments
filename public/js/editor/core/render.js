/**
 * RENDER MODULE - Renderizado de todas las secciones del editor
 * Centraliza la lógica de actualización de UI
 */

import { currentStory } from './state.js';
import { closeAllModals } from '../utils/ui.js';
import { renderStats } from '../crud/stats.js';
import { renderFlags } from '../crud/flags.js';
import { renderCharacters } from '../crud/characters.js';
import { renderItems } from '../crud/items.js';
import { renderEvents } from '../crud/events.js';
import { renderEndings } from '../crud/endings.js';
import { renderAchievements } from '../crud/achievements.js';

/**
 * Re-renderizar todas las secciones del editor
 */
export function renderAll() {
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
  updateConfigFields();
  
  console.log('✅ renderAll() completado');
}

/**
 * Actualizar campos de configuración
 */
function updateConfigFields() {
  if (!currentStory || !currentStory.config) {
    console.warn('⚠️ currentStory.config no existe');
    return;
  }
  
  console.log('  → Actualizando campos de configuración...');
  
  const storyIdInput = document.getElementById('storyId');
  if (storyIdInput) storyIdInput.value = currentStory.config.story.id || '';
  
  // Actualizar título en múltiples lugares
  const titleValue = currentStory.config.story.title || 'Nueva Historia';
  const titleInput = document.getElementById('storyTitleInput');
  const titleHeader = document.querySelector('.story-info h1');
  
  if (titleInput) titleInput.value = titleValue;
  if (titleHeader) titleHeader.textContent = titleValue;
  
  // Actualizar otros campos de configuración
  const fields = [
    'storyVersion',
    'storySubtitle',
    'storyDescription',
    'storyAuthor',
    'storyDays',
    'startingDay',
    'startingTime',
    'saveSlots',
    'initialMoney',
    'defaultEndingTitle',
    'defaultEndingMessage'
  ];
  
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    
    switch (id) {
      case 'storyVersion':
        el.value = currentStory.config.story.version || '1.0.0';
        break;
      case 'storySubtitle':
        el.value = currentStory.config.story.subtitle || '';
        break;
      case 'storyDescription':
        el.value = currentStory.config.story.description || '';
        break;
      case 'storyAuthor':
        el.value = currentStory.config.story.author || '';
        break;
      case 'storyDays':
        el.value = currentStory.config.story.max_days || 1;
        break;
      case 'startingDay':
        el.value = currentStory.config.story.starting_day || 1;
        break;
      case 'startingTime':
        el.value = currentStory.config.story.starting_time || 'morning';
        break;
      case 'saveSlots':
        el.value = currentStory.config.settings?.save_slots || 3;
        break;
      case 'initialMoney':
        el.value = currentStory.config.inventory?.money || 0;
        break;
      case 'defaultEndingTitle':
        el.value = currentStory.endings?.default_ending?.title || '';
        break;
      case 'defaultEndingMessage':
        el.value = currentStory.endings?.default_ending?.content?.message || '';
        break;
    }
  });
  
  // Actualizar checkboxes
  const checkboxes = {
    autoSave: currentStory.config.settings?.auto_save !== false,
    enableSound: currentStory.config.settings?.enable_sound !== false,
    showCharacters: currentStory.config.settings?.show_characters === true,
    showInventory: currentStory.config.settings?.show_inventory === true,
    inventoryEnabled: currentStory.config.inventory?.enabled === true
  };
  
  Object.entries(checkboxes).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.checked = value;
  });
}
