/**
 * TEST MAIN - Controlador para probar historias en desarrollo
 */

const engine = new FragmentsEngine();
let currentEvent = null;
let currentEventIndex = 0;
let availableEvents = [];
let totalEventsInDay = 0;
let completedEventsInDay = 0;

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
  result: document.getElementById('result'),
  restart: document.getElementById('restart'),
  actionButtons: document.getElementById('actionButtons'),
  themeToggle: document.getElementById('themeToggle')
};

// Tema
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
});

// Cargar historia temporal
async function init() {
  initTheme();
  
  const tempStory = localStorage.getItem('tempStory');
  
  if (!tempStory) {
    elements.situation.textContent = 'Error: No hay historia para probar';
    return;
  }
  
  try {
    const storyData = JSON.parse(tempStory);
    
    // Inyectar la historia en el engine manualmente
    engine.config = storyData.config;
    engine.story = storyData.story;
    engine.endings = storyData.endings;
    engine.currentStoryPath = 'test';
    
    console.log('✅ Historia de prueba cargada');
    
    // Validar
    engine.validateStory();
    
    // Iniciar juego
    startNewGame();
  } catch (error) {
    console.error('Error cargando historia de prueba:', error);
    elements.situation.textContent = 'Error al cargar historia: ' + error.message;
  }
}

// Iniciar nuevo juego
function startNewGame() {
  engine.initGame();
  updateUI();
  generateDay();
  showNextEvent();
}

// Generar día
function generateDay() {
  availableEvents = engine.getAvailableEvents();
  currentEventIndex = 0;
  totalEventsInDay = availableEvents.length;
  completedEventsInDay = 0;

  console.log(`📅 Día ${engine.gameState.current_day} generado: ${availableEvents.length} eventos`);
  
  updateProgress();
  
  if (availableEvents.length === 0) {
    checkForDayEnd();
  }
}

// Actualizar UI completa
function updateUI() {
  elements.dayCounter.textContent = `Día ${engine.gameState.current_day}`;
  elements.title.textContent = engine.config.story.title + ' [TEST]';
  elements.subtitle.textContent = engine.config.story.subtitle || '';
  
  updateStatsDisplay();
  
  if (engine.config.settings.show_characters) {
    updateCharactersDisplay();
  }
  
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
    const percentage = ((value - statConfig.min) / (statConfig.max - statConfig.min)) * 100;
    
    const statEl = document.createElement('div');
    statEl.className = 'stat-item';
    statEl.innerHTML = `
      <div class="stat-header">
        <span class="stat-icon">${statConfig.icon}</span>
        <span class="stat-name">${statConfig.name}</span>
        <span class="stat-value">${value}</span>
      </div>
      <div class="stat-bar">
        <div class="stat-fill stat-${key}" style="width: ${percentage}%"></div>
      </div>
    `;
    
    elements.statsContainer.appendChild(statEl);
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
    
    const charEl = document.createElement('div');
    charEl.className = 'character-item';
    
    const rel = char.relationship || 0;
    const percentage = ((rel + 100) / 200) * 100;
    
    charEl.innerHTML = `
      <div class="char-header">
        <span>${char.icon} ${char.name}</span>
        <span class="char-value">${rel > 0 ? '+' : ''}${rel}</span>
      </div>
      <div class="char-bar">
        <div class="char-fill" style="width: ${percentage}%"></div>
      </div>
    `;
    
    elements.charactersContainer.appendChild(charEl);
  }
}

// Actualizar inventario
function updateInventoryDisplay() {
  elements.moneyDisplay.textContent = `💰 $${engine.gameState.inventory.money}`;
  
  elements.inventoryItems.innerHTML = '';
  
  if (engine.gameState.inventory.items.length === 0) {
    elements.inventoryItems.innerHTML = '<small style="opacity:.5">Vacío</small>';
  } else {
    engine.gameState.inventory.items.forEach(itemKey => {
      const itemConfig = engine.config.inventory.items[itemKey];
      if (!itemConfig) return;
      
      const itemEl = document.createElement('div');
      itemEl.className = 'inventory-item';
      itemEl.textContent = `${itemConfig.icon} ${itemConfig.name}`;
      itemEl.title = itemConfig.description || '';
      elements.inventoryItems.appendChild(itemEl);
    });
  }

  elements.inventoryContainer.classList.remove('hidden');
}

// Actualizar progreso
function updateProgress() {
  const currentEventNumber = completedEventsInDay + 1;
  const progress = (currentEventNumber / Math.max(1, totalEventsInDay)) * 100;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressText.textContent = `Evento ${currentEventNumber}/${totalEventsInDay}`;
}

// Mostrar siguiente evento
function showNextEvent() {
  if (availableEvents.length === 0) {
    checkForDayEnd();
    return;
  }
  
  if (currentEventIndex >= availableEvents.length) {
    checkForDayEnd();
    return;
  }

  currentEvent = availableEvents[currentEventIndex];

  elements.situation.classList.add('fade-out');

  setTimeout(() => {
    elements.situation.innerHTML = `
      <small>[${currentEvent.type}] ${currentEvent.id}</small><br><br>
      ${currentEvent.situation}
    `;
    
    elements.situation.classList.remove('fade-out');
    elements.situation.classList.add('fade-in');
    
    elements.choicesContainer.innerHTML = currentEvent.choices.map((choice, index) => `
      <button class="choice-btn" onclick="makeChoice(${index})">
        ${choice.text}
      </button>
    `).join('');
    
    updateProgress();
  }, 300);
}

// Hacer elección
function makeChoice(choiceIndex) {
  const effects = engine.makeChoice(currentEvent, choiceIndex);
  
  completedEventsInDay++;
  
  updateUI();
  updateProgress();
  
  if (effects.trigger_ending) {
    setTimeout(() => showEnding(), 500);
    return;
  }

  if (effects.next_day) {
    setTimeout(() => showDayTransition(), 500);
    return;
  }

  currentEventIndex++;
  
  setTimeout(() => {
    showNextEvent();
  }, 300);
}

// Verificar fin de día
function checkForDayEnd() {
  const endDayEvent = engine.story.events.find(e => 
    e.id.startsWith('fin_dia') && 
    e.day === engine.gameState.current_day &&
    engine.meetsConditions(e.conditions)
  );

  if (endDayEvent) {
    currentEvent = endDayEvent;
    showNextEvent();
  } else {
    engine.gameState.current_day++;
    showDayTransition();
  }
}

// Transición entre días
function showDayTransition() {
  const previousDay = engine.gameState.current_day - 1;
  
  elements.situation.innerHTML = `
    <strong>🌙 Fin del Día ${previousDay}</strong><br><br>
    Preparando Día ${engine.gameState.current_day}...<br><br>
    <small>[Modo Test]</small>
  `;

  elements.choicesContainer.innerHTML = '';

  setTimeout(() => {
    updateUI();
    generateDay();
    
    if (availableEvents.length > 0) {
      showNextEvent();
    } else {
      showEnding();
    }
  }, 2000);
}

// Mostrar final
function showEnding() {
  const ending = engine.getEnding();

  elements.situation.innerHTML = `
    <strong>📖 Fin de la Historia [TEST]</strong><br><br>
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
    resultHTML += `
      <div class="epilogue">
        <strong>Epílogo:</strong>
        ${ending.content.epilogue.map(p => `<p>${p}</p>`).join('')}
      </div>
    `;
  }

  elements.result.innerHTML = resultHTML;
  elements.result.classList.remove('hidden');
  elements.actionButtons.classList.remove('hidden');
  
  const resultSection = document.getElementById('resultSection');
  if (resultSection) {
    resultSection.classList.remove('hidden');
  }

  console.log('🎭 Final obtenido:', ending.id);
  console.log('📊 Stats finales:', engine.gameState.stats);
}

// Reiniciar
elements.restart.onclick = () => {
  elements.result.classList.add('hidden');
  elements.actionButtons.classList.add('hidden');
  
  const resultSection = document.getElementById('resultSection');
  if (resultSection) {
    resultSection.classList.add('hidden');
  }
  
  startNewGame();
};

// Iniciar
window.addEventListener('DOMContentLoaded', init);
