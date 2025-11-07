/**
 * UI UTILITIES - Funciones de interfaz de usuario
 * Modales, toasts, confirmaciones, etc.
 */

/**
 * Mostrar toast notification
 */
export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

/**
 * Cerrar todos los modales abiertos
 */
export function closeAllModals() {
  const modalIds = [
    'validationModal',
    'eventModal',
    'confirmModal',
    'inputModal',
    'formModal',
    'selectModal',
    'statModal',
    'flagModal',
    'characterModal',
    'itemModal',
    'endingModal',
    'achievementModal'
  ];
  
  modalIds.forEach(id => {
    const modal = document.getElementById(id);
    if (modal && !modal.classList.contains('hidden')) {
      console.log(`  → Cerrando modal: ${id}`);
      modal.classList.add('hidden');
    }
  });
}

/**
 * Cerrar un modal específico
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Mostrar confirmación
 */
export function showConfirm(message, title = 'Confirmar') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    const yesBtn = document.getElementById('confirmModalYes');
    const noBtn = document.getElementById('confirmModalNo');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
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

/**
 * Mostrar input prompt
 */
export function showInput(label, title = 'Ingresa el valor', defaultValue = '', hint = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('inputModal');
    const titleEl = document.getElementById('inputModalTitle');
    const labelEl = document.getElementById('inputModalLabel');
    const input = document.getElementById('inputModalInput');
    const hintEl = document.getElementById('inputModalHint');
    const submitBtn = document.getElementById('inputModalSubmit');
    const cancelBtn = document.getElementById('inputModalCancel');
    
    titleEl.textContent = title;
    labelEl.textContent = label;
    input.value = defaultValue;
    hintEl.textContent = hint;
    
    const handleSubmit = () => {
      cleanup();
      resolve(input.value);
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
    input.focus();
  });
}

/**
 * Mostrar select modal
 */
export function showSelect(label, options, title = 'Selecciona una opción', defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('selectModal');
    const titleEl = document.getElementById('selectModalTitle');
    const labelEl = document.getElementById('selectModalLabel');
    const select = document.getElementById('selectModalSelect');
    const submitBtn = document.getElementById('selectModalSubmit');
    const cancelBtn = document.getElementById('selectModalCancel');
    
    titleEl.textContent = title;
    labelEl.textContent = label;
    
    select.innerHTML = options.map(opt => 
      `<option value="${opt.value}"${opt.value === defaultValue ? ' selected' : ''}>${opt.text}</option>`
    ).join('');
    
    const handleSubmit = () => {
      cleanup();
      resolve(select.value);
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
    select.focus();
  });
}

/**
 * Descargar JSON
 */
export function downloadJSON(data, filename) {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error descargando JSON:', error);
    return false;
  }
}
