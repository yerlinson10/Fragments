/**
 * FRAGMENTS MAIN - Controlador de UI
 * Conecta el engine con la interfaz de usuario
 */

const engine = new FragmentsEngine();
let currentEvent = null;
let currentEventIndex = 0;
let availableEvents = [];

// Referencias DOM
const elements = {
  title: document.getElementById('gameTitle'),
  subtitle: document.getElementById('gameSubtitle'),
  dayCounter: document.getElementById('dayCounter'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  statsContainer: document.getElementById('statsContainer'),
  charactersContainer: document.getElementById('charactersContainer'),
  inventoryContainer: document.getElementById('inventoryContainer'),
  inventoryItems: document.getElementById('inventoryItems'),
  moneyDisplay: document.getElementById('moneyDisplay'),
  situation: document.getElementById('situation'),
  choicesContainer: document.getElementById('choicesContainer'),
  statChange: document.getElementById('statChange'),
  result: document.getElementById('result'),
  restart: document.getElementById('restart'),
  continueBtn: document.getElementById('continueBtn'),
  actionButtons: document.getElementById('actionButtons'),
  themeToggle: document.getElementById('themeToggle'),
  menuBtn: document.getElementById('menuBtn'),
  saveMenu: document.getElementById('saveMenu'),
  achievementNotif: document.getElementById('achievementNotif'),
  achievementTitle: document.getElementById('achievementTitle'),
  achievementDesc: document.getElementById('achievementDesc')
};

// Sistema de tema
function initTheme() {
  const savedTheme = localStorage.getItem('fragmentsTheme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    elements.themeToggle.textContent = '☀️';
  }
}

elements.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  elements.themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('fragmentsTheme', isDark ? 'dark' : 'light');
  playSound('click');
});

// Sistema de sonido
function playSound(type) {
  if (!engine.config?.settings?.enable_sound) return;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch(type) {
    case 'click':
      oscillator.frequency.value = 400;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
      break;
    case 'complete':
      oscillator.frequency.value = 600;
      gainNode.gain.value = 0.15;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        gain2.gain.value = 0.15;
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.15);
      }, 100);
      break;
    case 'positive':
      oscillator.frequency.value = 500;
      gainNode.gain.value = 0.08;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
      break;
    case 'negative':
      oscillator.frequency.value = 200;
      gainNode.gain.value = 0.08;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
      break;
    case 'achievement':
      oscillator.type = 'triangle';
      oscillator.frequency.value = 700;
      gainNode.gain.value = 0.12;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
  }
}

// Inicializar juego
async function init() {
  initTheme();
  
  // Verificar si estamos en modo test (URL param o localStorage)
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get('test') === 'true' || localStorage.getItem('testMode') === 'true';
  
  if (testMode) {
    // Modo test: cargar desde localStorage
    const testStory = localStorage.getItem('testStory');
    if (!testStory) {
      elements.situation.innerHTML = `
        <strong>❌ Error</strong><br><br>
        No hay historia de prueba disponible.<br><br>
        <button class="btn-primary" onclick="window.location.href='story-editor.html'">
          ⬅️ Volver al Editor
        </button>
      `;
      return;
    }
    
    try {
      const storyData = JSON.parse(testStory);
      const result = engine.loadStoryFromData(storyData);
      
      if (!result.success) {
        throw new Error(result.error || 'No se pudo cargar la historia de prueba');
      }
      
      // Limpiar el flag de test
      localStorage.removeItem('testMode');
      
      // Agregar indicador visual de modo test
      elements.title.innerHTML = `${engine.config.story.title} <small style="color: #f39c12; font-size: 0.6em;">🧪 PRUEBA</small>`;
      elements.subtitle.textContent = engine.config.story.subtitle || '';
      
      startNewGame();
      
    } catch (error) {
      console.error('Error en modo test:', error);
      elements.situation.innerHTML = `
        <strong>❌ Error al cargar historia de prueba</strong><br><br>
        ${error.message}<br><br>
        <button class="btn-primary" onclick="window.location.href='story-editor.html'">
          ⬅️ Volver al Editor
        </button>
      `;
      return;
    }
  } else {
    // Modo normal: cargar desde carpeta stories
    const selectedStory = localStorage.getItem('selectedStory') || 'fragments_original';
    
    // Limpiar selección
    localStorage.removeItem('selectedStory');
    
    // Cargar historia
    const result = await engine.loadStory(`stories/${selectedStory}`);
    
    if (!result.success) {
      elements.situation.innerHTML = `
        <strong>❌ Error cargando historia</strong><br><br>
        ${result.error || `No se pudo cargar "${selectedStory}"`}<br><br>
        Verifica que existan los archivos en la carpeta stories/${selectedStory}/<br><br>
        <button class="btn-primary" onclick="window.location.href='story-selector.html'">
          ⬅️ Volver al Selector
        </button>
      `;
      return;
    }

    // Actualizar UI con info de la historia
    elements.title.textContent = engine.config.story.title;
    elements.subtitle.textContent = engine.config.story.subtitle || '';

    // Intentar cargar auto-save
    if (engine.loadFromLocalStorage(0)) {
      showContinuePrompt();
    } else {
      startNewGame();
    }
  }
}

// Mostrar prompt de continuar
function showContinuePrompt() {
  elements.situation.innerHTML = `
    <strong>¡Bienvenido de vuelta!</strong><br>
    Se encontró un juego guardado automáticamente.<br><br>
    <small>Día ${engine.gameState.current_day} | ${engine.gameState.completed_events.length} eventos completados</small>
  `;

  elements.choicesContainer.innerHTML = `
    <button class="choice-btn" id="continueGame">▶️ Continuar partida</button>
    <button class="choice-btn" id="newGame">🆕 Nuevo juego</button>
  `;

  document.getElementById('continueGame').onclick = () => {
    playSound('click');
    continueGame();
  };

  document.getElementById('newGame').onclick = () => {
    playSound('click');
    if (confirm('¿Estás seguro? Se perderá el progreso actual.')) {
      startNewGame();
    }
  };
}

// Iniciar nuevo juego
function startNewGame() {
  engine.initGame();
  updateUI();
  generateDay();
  showNextEvent();
}

// Continuar juego guardado
function continueGame() {
  updateUI();
  generateDay();
  showNextEvent();
}

// Generar día (obtener eventos disponibles)
function generateDay() {
  availableEvents = engine.getAvailableEvents();
  currentEventIndex = 0;

  console.log(`📅 Día ${engine.gameState.current_day} generado: ${availableEvents.length} eventos`);
  
  updateProgress();
  
  // Si no hay eventos disponibles, avanzar automáticamente
  if (availableEvents.length === 0) {
    console.log('⚠️ No hay eventos disponibles, verificando fin de día...');
    checkForDayEnd();
  }
}

// Actualizar UI completa
function updateUI() {
  // Día actual
  elements.dayCounter.textContent = `Día ${engine.gameState.current_day}`;

  // Stats dinámicas
  updateStatsDisplay();

  // Characters
  if (engine.config.settings.show_characters) {
    updateCharactersDisplay();
  }

  // Inventory
  if (engine.config.settings.show_inventory && engine.config.inventory?.enabled) {
    updateInventoryDisplay();
  }
}

// Actualizar stats
function updateStatsDisplay() {
  elements.statsContainer.innerHTML = '';
  elements.statsContainer.classList.remove('hidden');

  for (const [key, statConfig] of Object.entries(engine.config.stats)) {
    const value = engine.gameState.stats[key];
    const percent = ((value - statConfig.min) / (statConfig.max - statConfig.min)) * 100;

    const statDiv = document.createElement('div');
    statDiv.className = 'stat-item';
    statDiv.innerHTML = `
      <div class="stat-header">
        <span class="stat-icon">${statConfig.icon}</span>
        <span class="stat-name">${statConfig.name}</span>
        <span class="stat-value">${value}</span>
      </div>
      <div class="stat-bar">
        <div class="stat-fill" style="width: ${percent}%; background: ${statConfig.color}"></div>
      </div>
    `;

    elements.statsContainer.appendChild(statDiv);
  }
}

// Actualizar personajes
function updateCharactersDisplay() {
  if (!engine.config.characters || Object.keys(engine.config.characters).length === 0) {
    elements.charactersContainer.classList.add('hidden');
    return;
  }

  elements.charactersContainer.classList.remove('hidden');
  elements.charactersContainer.innerHTML = '<h3>👥 Relaciones</h3>';

  for (const [key, char] of Object.entries(engine.gameState.characters)) {
    if (!char.met) continue;

    const relPercent = ((char.relationship + 100) / 200) * 100;
    let relStatus = '😐';
    if (char.relationship > 50) relStatus = '😊';
    else if (char.relationship > 20) relStatus = '🙂';
    else if (char.relationship < -50) relStatus = '😠';
    else if (char.relationship < -20) relStatus = '😒';

    const charDiv = document.createElement('div');
    charDiv.className = 'character-item';
    charDiv.innerHTML = `
      <div class="char-header">
        <span>${relStatus} ${char.name}</span>
        <span class="char-value">${char.relationship}</span>
      </div>
      <div class="char-bar">
        <div class="char-fill" style="width: ${relPercent}%"></div>
      </div>
    `;

    elements.charactersContainer.appendChild(charDiv);
  }
}

// Actualizar inventario
function updateInventoryDisplay() {
  elements.moneyDisplay.textContent = `💰 $${engine.gameState.inventory.money}`;
  
  elements.inventoryItems.innerHTML = '';
  
  if (engine.gameState.inventory.items.length === 0) {
    elements.inventoryItems.innerHTML = '<small style="opacity:0.6">Vacío</small>';
  } else {
    engine.gameState.inventory.items.forEach(item => {
      const itemSpan = document.createElement('span');
      itemSpan.className = 'inventory-item';
      itemSpan.textContent = item.replace(/_/g, ' ');
      elements.inventoryItems.appendChild(itemSpan);
    });
  }

  elements.inventoryContainer.classList.remove('hidden');
}

// Actualizar progreso
function updateProgress() {
  const progress = (currentEventIndex / Math.max(1, availableEvents.length)) * 100;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressText.textContent = `Evento ${currentEventIndex}/${availableEvents.length}`;
}

// Mostrar siguiente evento
function showNextEvent() {
  // Si no hay eventos, verificar fin de día
  if (availableEvents.length === 0) {
    console.log('⚠️ No hay eventos en la lista, verificando fin de día...');
    checkForDayEnd();
    return;
  }
  
  if (currentEventIndex >= availableEvents.length) {
    checkForDayEnd();
    return;
  }

  currentEvent = availableEvents[currentEventIndex];

  // Fade out
  elements.situation.classList.add('fade-out');

  setTimeout(() => {
    // Contexto temporal
    let contextIcon = '';
    if (currentEvent.time === 'morning') contextIcon = '🌅';
    else if (currentEvent.time === 'afternoon') contextIcon = '🌇';
    else if (currentEvent.time === 'night') contextIcon = '🌙';

    elements.situation.innerHTML = `
      <small style="opacity:.6">
        ${contextIcon} ${currentEvent.time} 
        ${currentEvent.earliest_hour ? `| ${currentEvent.earliest_hour}:00` : ''}
      </small><br><br>
      ${currentEvent.text}
    `;

    // Crear botones de elección
    elements.choicesContainer.innerHTML = '';
    currentEvent.choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.onclick = () => makeChoice(index);
      elements.choicesContainer.appendChild(btn);
    });

    // Fade in
    elements.situation.classList.remove('fade-out');
    elements.situation.classList.add('fade-in');

    updateProgress();
  }, 300);
}

// Hacer elección
function makeChoice(choiceIndex) {
  playSound('click');

  // Aplicar efectos
  const effects = engine.makeChoice(currentEvent, choiceIndex);

  // Mostrar cambios
  showStatChanges(effects);

  // Auto-save
  engine.autoSave();

  // Verificar achievements
  checkAchievements(effects);

  // Verificar triggers especiales
  if (effects.trigger_ending) {
    showEnding();
    return;
  }

  if (effects.next_day) {
    showDayTransition();
    return;
  }

  // Siguiente evento
  setTimeout(() => {
    updateUI();
    
    // 🔧 CORRECCIÓN: Regenerar eventos para reflejar nuevas condiciones
    // Después de cada elección, pueden desbloquearse nuevos eventos (mandatory u optional)
    // por flags, completed_events, characters, etc.
    const oldEventIds = availableEvents.map(e => e.id).join(',');
    availableEvents = engine.getAvailableEvents();
    const newEventIds = availableEvents.map(e => e.id).join(',');
    
    // Si los eventos cambiaron (diferentes IDs), reiniciar índice
    if (oldEventIds !== newEventIds) {
      console.log('🔄 Lista de eventos actualizada');
      console.log('   Antes:', oldEventIds.split(',').slice(0, 3).join(', '), '...');
      console.log('   Ahora:', newEventIds.split(',').slice(0, 3).join(', '), '...');
      currentEventIndex = 0;
    } else {
      currentEventIndex++;
    }
    
    showNextEvent();
  }, 800);
}

// Mostrar cambios de stats
function showStatChanges(effects) {
  const changes = [];

  if (effects.stats) {
    for (const [key, data] of Object.entries(effects.stats)) {
      const statConfig = engine.config.stats[key];
      if (data.change !== 0) {
        const sign = data.change > 0 ? '+' : '';
        changes.push(`${statConfig.icon} ${sign}${data.change}`);
      }
    }
  }

  if (effects.inventory?.money) {
    const sign = effects.inventory.money.change > 0 ? '+' : '';
    changes.push(`💰 ${sign}$${effects.inventory.money.change}`);
  }

  if (changes.length > 0) {
    elements.statChange.textContent = changes.join('  ');
    elements.statChange.classList.add('show');

    // Sonido
    const totalEffect = Object.values(effects.stats || {})
      .reduce((sum, data) => sum + data.change, 0);
    
    if (totalEffect > 0) playSound('positive');
    else if (totalEffect < 0) playSound('negative');

    setTimeout(() => {
      elements.statChange.classList.remove('show');
    }, 1500);
  }
}

// Verificar logros
function checkAchievements(effects) {
  if (effects.achievements && effects.achievements.length > 0) {
    effects.achievements.forEach(achKey => {
      const ach = engine.gameState.achievements[achKey];
      showAchievementNotification(ach);
    });
  }

  // Logros automáticos
  if (engine.gameState.current_day === 2 && !engine.gameState.achievements.first_day_complete?.unlocked) {
    engine.gameState.achievements.first_day_complete.unlocked = true;
    showAchievementNotification(engine.gameState.achievements.first_day_complete);
  }
}

// Mostrar notificación de logro
function showAchievementNotification(achievement) {
  playSound('achievement');

  elements.achievementTitle.textContent = `${achievement.icon} ${achievement.name}`;
  elements.achievementDesc.textContent = achievement.description;
  elements.achievementNotif.classList.remove('hidden');
  elements.achievementNotif.classList.add('show');

  setTimeout(() => {
    elements.achievementNotif.classList.remove('show');
    setTimeout(() => {
      elements.achievementNotif.classList.add('hidden');
    }, 500);
  }, 3000);
}

// Verificar fin de día
function checkForDayEnd() {
  // Buscar evento de fin de día
  const endDayEvent = engine.story.events.find(e => 
    e.id.startsWith('fin_dia') && 
    e.day === engine.gameState.current_day &&
    engine.meetsConditions(e.conditions)
  );

  if (endDayEvent) {
    currentEvent = endDayEvent;
    currentEventIndex++;
    availableEvents.push(endDayEvent);
    showNextEvent();
  } else {
    // Si no hay evento de fin, terminar directamente
    if (engine.gameState.current_day >= engine.config.story.max_days) {
      showEnding();
    } else {
      showDayTransition();
    }
  }
}

// Transición entre días
function showDayTransition() {
  const previousDay = engine.gameState.current_day - 1;
  
  elements.situation.innerHTML = `
    <strong>🌙 Fin del Día ${previousDay}</strong><br><br>
    El día termina. Tus decisiones quedan registradas.<br>
    Mañana será otro día lleno de nuevas elecciones.<br><br>
    <small>Preparando Día ${engine.gameState.current_day}...</small>
  `;

  elements.choicesContainer.innerHTML = '';

  setTimeout(() => {
    generateDay();
    // Solo mostrar siguiente evento si hay eventos disponibles
    if (availableEvents.length > 0) {
      showNextEvent();
    } else {
      // Si no hay eventos, saltar directamente al siguiente chequeo
      console.log('⚠️ No hay eventos para este día, avanzando...');
      checkForDayEnd();
    }
  }, 2000);
}

// Mostrar final
function showEnding() {
  playSound('complete');

  const ending = engine.getEnding();

  elements.situation.innerHTML = `
    <strong>📖 Fin de la Historia</strong><br><br>
    <small style="opacity:.7; margin-top:1rem; display:block">
      ${Object.entries(engine.gameState.stats)
        .map(([key, value]) => `${engine.config.stats[key].icon} ${value}`)
        .join(' | ')}
    </small>
  `;

  elements.choicesContainer.innerHTML = '';

  let resultHTML = `
    <strong>${ending.title}</strong><br><br>
    ${ending.content.message}
  `;

  if (ending.content.epilogue) {
    resultHTML += '<br><br><div class="epilogue">';
    ending.content.epilogue.forEach(line => {
      resultHTML += `<p>${line}</p>`;
    });
    resultHTML += '</div>';
  }

  elements.result.innerHTML = resultHTML;
  elements.result.classList.remove('hidden');
  elements.actionButtons.classList.remove('hidden');
  
  // Mostrar la sección de resultado
  const resultSection = document.getElementById('resultSection');
  if (resultSection) {
    resultSection.classList.remove('hidden');
  }

  // Ocultar stats
  setTimeout(() => {
    elements.statsContainer.classList.add('hidden');
    elements.charactersContainer.classList.add('hidden');
    elements.inventoryContainer.classList.add('hidden');
  }, 500);

  console.log('🎭 Final obtenido:', ending.id);
  console.log('📊 Stats finales:', engine.gameState.stats);
  console.log('📝 Eventos completados:', engine.gameState.completed_events.length);
}

// Reiniciar
elements.restart.onclick = () => {
  playSound('click');
  
  if (confirm('¿Comenzar una nueva historia? Se perderá el progreso actual.')) {
    elements.result.classList.add('hidden');
    elements.actionButtons.classList.add('hidden');
    elements.statsContainer.classList.remove('hidden');
    
    // Ocultar la sección de resultado
    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
      resultSection.classList.add('hidden');
    }
    
    startNewGame();
  }
};

// Menú de guardado
elements.menuBtn.onclick = () => {
  elements.saveMenu.classList.toggle('hidden');
  updateSaveSlotsList();
};

// Volver al selector
document.getElementById('selectorBtn').onclick = () => {
  if (confirm('¿Volver al selector de historias? Se guardará automáticamente.')) {
    engine.autoSave();
    window.location.href = 'story-selector.html';
  }
};

document.getElementById('closeSaveMenu').onclick = () => {
  elements.saveMenu.classList.add('hidden');
};

document.getElementById('saveBtn').onclick = () => {
  showSlotSelector('save');
};

document.getElementById('loadBtn').onclick = () => {
  showSlotSelector('load');
};

document.getElementById('exportBtn').onclick = () => {
  engine.exportSave();
  playSound('complete');
};

document.getElementById('importBtn').onclick = () => {
  document.getElementById('importFile').click();
};

document.getElementById('importFile').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    await engine.importSave(file);
    updateUI();
    generateDay();
    showNextEvent();
    elements.saveMenu.classList.add('hidden');
    playSound('complete');
    alert('✅ Partida cargada correctamente');
  } catch (error) {
    alert('❌ Error: ' + error);
  }
};

// Selector de slot
function showSlotSelector(action) {
  const slotButtons = document.getElementById('slotButtons');
  slotButtons.innerHTML = '';

  const saves = engine.listSaves();

  for (let i = 1; i <= engine.config.settings.save_slots; i++) {
    const saveData = saves.find(s => s.slot === i);
    
    const btn = document.createElement('button');
    btn.className = 'slot-btn';
    
    if (saveData) {
      btn.innerHTML = `
        <strong>Slot ${i}</strong><br>
        Día ${saveData.day} | ${new Date(saveData.saved_at).toLocaleString()}
      `;
    } else {
      btn.innerHTML = `<strong>Slot ${i}</strong><br><small>Vacío</small>`;
    }

    btn.onclick = () => {
      if (action === 'save') {
        engine.saveToLocalStorage(i);
        playSound('complete');
        alert(`💾 Guardado en Slot ${i}`);
      } else {
        if (engine.loadFromLocalStorage(i)) {
          updateUI();
          generateDay();
          showNextEvent();
          playSound('complete');
          alert(`📂 Cargado desde Slot ${i}`);
        } else {
          alert('⚠️ Slot vacío');
        }
      }
      document.getElementById('slotSelector').classList.add('hidden');
      elements.saveMenu.classList.add('hidden');
    };

    slotButtons.appendChild(btn);
  }

  document.getElementById('slotSelector').classList.remove('hidden');
}

document.getElementById('cancelSlot').onclick = () => {
  document.getElementById('slotSelector').classList.add('hidden');
};

function updateSaveSlotsList() {
  const saves = engine.listSaves();
  const list = document.getElementById('saveSlotsList');
  
  if (saves.length === 0) {
    list.innerHTML = '<small style="opacity:0.6">No hay guardados</small>';
    return;
  }

  list.innerHTML = '<h4>Guardados:</h4>';
  saves.forEach(save => {
    list.innerHTML += `
      <div class="save-slot-item">
        Slot ${save.slot}: Día ${save.day} | ${new Date(save.saved_at).toLocaleString('es')}
      </div>
    `;
  });
}

// Iniciar al cargar
window.addEventListener('DOMContentLoaded', init);
