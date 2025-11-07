/**
 * HISTORY MODULE - Sistema de Undo/Redo
 * Gestiona el historial de cambios del editor
 */

import { currentStory, setCurrentStory, markDirty } from './state.js';
import { renderAll } from './render.js';
import { showToast } from '../utils/ui.js';

// Historial de cambios
const history = {
  past: [],
  present: null,
  future: [],
  maxSize: 50 // Máximo 50 estados en el historial
};

/**
 * Guardar estado actual en el historial
 */
export function saveToHistory() {
  // Guardar el estado actual en el pasado
  if (history.present) {
    history.past.push(structuredClone(history.present));
    
    // Limitar el tamaño del historial
    if (history.past.length > history.maxSize) {
      history.past.shift();
    }
  }
  
  // El presente ahora es el estado actual
  history.present = structuredClone(currentStory);
  
  // Limpiar el futuro (ya no podemos hacer redo)
  history.future = [];
  
  updateHistoryButtons();
}

/**
 * Deshacer último cambio
 */
export function undo() {
  if (history.past.length === 0) {
    showToast('No hay más acciones para deshacer', 'warning');
    return;
  }
  
  console.log('⏪ UNDO - Estado antes:', {
    past: history.past.length,
    future: history.future.length
  });
  
  // Mover el presente al futuro
  if (history.present) {
    history.future.push(structuredClone(history.present));
  }
  
  // Restaurar el último estado del pasado
  history.present = history.past.pop();
  setCurrentStory(structuredClone(history.present));
  
  console.log('⏪ UNDO - Estado después:', {
    past: history.past.length,
    future: history.future.length
  });
  
  // Re-renderizar todo
  renderAll();
  markDirty();
  updateHistoryButtons();
  showToast('Acción deshecha', 'success');
}

/**
 * Rehacer último cambio
 */
export function redo() {
  if (history.future.length === 0) {
    showToast('No hay más acciones para rehacer', 'warning');
    return;
  }
  
  console.log('⏩ REDO - Estado antes:', {
    past: history.past.length,
    future: history.future.length
  });
  
  // Mover el presente al pasado
  if (history.present) {
    history.past.push(structuredClone(history.present));
  }
  
  // Restaurar el primer estado del futuro
  history.present = history.future.pop();
  setCurrentStory(structuredClone(history.present));
  
  console.log('⏩ REDO - Estado después:', {
    past: history.past.length,
    future: history.future.length
  });
  
  // Re-renderizar todo
  renderAll();
  markDirty();
  updateHistoryButtons();
  showToast('Acción rehecha', 'success');
}

/**
 * Actualizar estado de botones Undo/Redo
 */
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

/**
 * Limpiar historial
 */
export function clearHistory() {
  history.past = [];
  history.present = null;
  history.future = [];
  updateHistoryButtons();
}

/**
 * Obtener estadísticas del historial
 */
export function getHistoryStats() {
  return {
    pastCount: history.past.length,
    futureCount: history.future.length,
    maxSize: history.maxSize
  };
}
