/**
 * STATS CRUD - Gestión de estadísticas
 * TODO: Migrar funciones desde story-editor.js
 */

import { currentStory, markDirty } from '../core/state.js';
import { saveToHistory } from '../core/history.js';

export function renderStats() {
  const container = document.getElementById('statsList');
  const emptyMsg = document.getElementById('statsEmpty');
  
  if (!currentStory.config.stats || Object.keys(currentStory.config.stats).length === 0) {
    if (container) container.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }
  
  if (container) container.style.display = 'flex';
  if (emptyMsg) emptyMsg.style.display = 'none';
  
  // TODO: Implementar renderizado completo
  console.log('Stats rendered (stub)');
}

export function addStat() {
  // TODO: Implementar
  console.log('addStat() - stub');
}

export function editStat(key) {
  // TODO: Implementar
  console.log('editStat() - stub', key);
}

export function deleteStat(key) {
  // TODO: Implementar
  console.log('deleteStat() - stub', key);
}
