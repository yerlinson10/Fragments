let situations = [];
let endings = [];
let dayPlan = [];
let currentIndex = 0;
let stats = { energia: 0, animo: 0, caos: 0 };
let completedEvents = new Set();

// Referencias DOM
const situationEl = document.getElementById("situation");
const choiceA = document.getElementById("choiceA");
const choiceB = document.getElementById("choiceB");
const resultEl = document.getElementById("result");
const restartBtn = document.getElementById("restart");
const statsContainer = document.getElementById("statsContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const statChangeIndicator = document.getElementById("statChange");
const themeToggle = document.getElementById("themeToggle");

// Sistema de tema
function initTheme() {
  const savedTheme = localStorage.getItem('fragmentsTheme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.textContent = '☀️';
  }
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('fragmentsTheme', isDark ? 'dark' : 'light');
  playSound('click');
});

// Sistema de sonido simple (beeps del navegador)
function playSound(type) {
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
  }
}

async function loadData() {
  const [situationsRes, endingsRes] = await Promise.all([
    fetch("data/situations.json"),
    fetch("data/endings.json"),
  ]);
  situations = await situationsRes.json();
  endings = await endingsRes.json();
  generateDay();
  startGame();
}

function generateDay() {
  dayPlan = [];
  completedEvents = new Set();
  let remaining = [...situations];

  const wakeUpEvents = remaining.filter(ev => 
    ['alarma', 'llamada_madrugada', 'vecino_ruidoso', 'gato_despertador'].includes(ev.id)
  );
  
  if (wakeUpEvents.length > 0) {
    const chosenWakeUp = wakeUpEvents[Math.floor(Math.random() * wakeUpEvents.length)];
    chosenWakeUp.scheduledHour = randomInt(chosenWakeUp.earliest_hour, chosenWakeUp.latest_hour);
    dayPlan.push(chosenWakeUp);
    completedEvents.add(chosenWakeUp.id);
    
    remaining = remaining.filter(e => 
      !['alarma', 'llamada_madrugada', 'vecino_ruidoso', 'gato_despertador'].includes(e.id)
    );
  }

  while (remaining.length > 0) {
    const available = remaining.filter((ev) => {
      const reqsMet =
        !ev.requires || ev.requires.every((r) => completedEvents.has(r));
      
      const oneOfMet = 
        !ev.requires_one_of || ev.requires_one_of.some((r) => completedEvents.has(r));
      
      return reqsMet && oneOfMet;
    });

    if (available.length === 0) break;

    const chosen = available[Math.floor(Math.random() * available.length)];
    chosen.scheduledHour = randomInt(chosen.earliest_hour, chosen.latest_hour);
    dayPlan.push(chosen);
    completedEvents.add(chosen.id);
    remaining = remaining.filter((e) => e.id !== chosen.id);
  }

  dayPlan.sort((a, b) => a.scheduledHour - b.scheduledHour);
  console.log(`📅 Día generado: ${dayPlan.length} situaciones`);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startGame() {
  currentIndex = 0;
  stats = { energia: 0, animo: 0, caos: 0 };
  resultEl.classList.add("hidden");
  restartBtn.classList.add("hidden");
  statsContainer.classList.remove("hidden");
  updateStatsDisplay();
  updateProgress();
  showSituation();
}

function updateProgress() {
  const progress = (currentIndex / dayPlan.length) * 100;
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `Situación ${currentIndex}/${dayPlan.length}`;
}

function updateStatsDisplay(animated = false) {
  // Actualizar valores
  document.getElementById('energiaValue').textContent = stats.energia;
  document.getElementById('animoValue').textContent = stats.animo;
  document.getElementById('caosValue').textContent = stats.caos;
  
  // Calcular porcentajes (rango -15 a +15 → 0% a 100%)
  const energiaPercent = ((stats.energia + 15) / 30) * 100;
  const animoPercent = ((stats.animo + 15) / 30) * 100;
  const caosPercent = ((stats.caos + 15) / 30) * 100;
  
  // Animar barras
  document.getElementById('energiaBar').style.width = `${Math.max(0, Math.min(100, energiaPercent))}%`;
  document.getElementById('animoBar').style.width = `${Math.max(0, Math.min(100, animoPercent))}%`;
  document.getElementById('caosBar').style.width = `${Math.max(0, Math.min(100, caosPercent))}%`;
}

function showStatChange(effects) {
  const changes = [];
  
  if (effects.energia !== 0) {
    const sign = effects.energia > 0 ? '+' : '';
    changes.push(`⚡ ${sign}${effects.energia}`);
  }
  if (effects.animo !== 0) {
    const sign = effects.animo > 0 ? '+' : '';
    changes.push(`💙 ${sign}${effects.animo}`);
  }
  if (effects.caos !== 0) {
    const sign = effects.caos > 0 ? '+' : '';
    changes.push(`🌀 ${sign}${effects.caos}`);
  }
  
  if (changes.length > 0) {
    statChangeIndicator.textContent = changes.join('  ');
    statChangeIndicator.classList.add('show');
    
    // Sonido basado en el efecto neto
    const totalEffect = effects.energia + effects.animo - Math.abs(effects.caos);
    if (totalEffect > 0) {
      playSound('positive');
    } else if (totalEffect < 0) {
      playSound('negative');
    }
    
    setTimeout(() => {
      statChangeIndicator.classList.remove('show');
    }, 1500);
  }
}

function showSituation() {
  if (currentIndex >= dayPlan.length) return endGame();
  
  const current = dayPlan[currentIndex];
  
  // Fade out
  situationEl.classList.add('fade-out');
  
  setTimeout(() => {
    // Iconos contextuales
    let contextIcon = '';
    if (current.time === 'morning') contextIcon = '🌅';
    else if (current.time === 'afternoon') contextIcon = '🌇';
    else if (current.time === 'night') contextIcon = '🌙';
    
    situationEl.innerHTML = `
      <small style="opacity:.6">
        ${contextIcon} ${
          current.time === "morning"
            ? "Mañana"
            : current.time === "afternoon"
            ? "Tarde"
            : "Noche"
        } - ${Math.floor(current.scheduledHour)}:${String(Math.round((current.scheduledHour % 1) * 60)).padStart(2, '0')}
      </small><br>
      ${current.text}
    `;
    
    choiceA.textContent = current.choices[0].text;
    choiceB.textContent = current.choices[1].text;
    
    // Fade in
    situationEl.classList.remove('fade-out');
    situationEl.classList.add('fade-in');
    
    updateProgress();
  }, 300);
}

function choose(effects) {
  playSound('click');
  
  // Aplicar efectos
  for (const key in effects) stats[key] += effects[key];
  
  // Mostrar cambio
  showStatChange(effects);
  
  // Actualizar display
  setTimeout(() => {
    updateStatsDisplay(true);
    currentIndex++;
    showSituation();
  }, 400);
}

choiceA.onclick = () => {
  const current = dayPlan[currentIndex];
  if (current) choose(current.choices[0].effects);
};

choiceB.onclick = () => {
  const current = dayPlan[currentIndex];
  if (current) choose(current.choices[1].effects);
};

function endGame() {
  playSound('complete');
  
  situationEl.innerHTML = `
    <strong>Fin del día.</strong><br>
    <small style="opacity:.7; margin-top:1rem; display:block">
      ⚡ Energía: ${stats.energia} | 💙 Ánimo: ${stats.animo} | 🌀 Caos: ${stats.caos}
    </small>
  `;
  choiceA.textContent = "";
  choiceB.textContent = "";
  choiceA.style.display = "none";
  choiceB.style.display = "none";
  
  const ending = getEnding(stats);
  resultEl.innerHTML = `
    <strong>${ending.id}</strong><br>
    ${ending.message}
  `;
  resultEl.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
  
  // Ocultar stats container
  setTimeout(() => {
    statsContainer.classList.add("hidden");
  }, 500);
  
  console.log("📊 Stats finales:", stats);
  console.log("🎭 Final obtenido:", ending.id);
  console.log("📝 Total eventos jugados:", dayPlan.length);
}

function getEnding(stats) {
  for (const end of endings) {
    const c = end.conditions;
    if (
      (c.energia_min === undefined || stats.energia >= c.energia_min) &&
      (c.energia_max === undefined || stats.energia <= c.energia_max) &&
      (c.animo_min === undefined || stats.animo >= c.animo_min) &&
      (c.animo_max === undefined || stats.animo <= c.animo_max) &&
      (c.caos_min === undefined || stats.caos >= c.caos_min) &&
      (c.caos_max === undefined || stats.caos <= c.caos_max)
    ) {
      return end;
    }
  }
  return { id: "promedio", message: "Un día curioso, ni bueno ni malo." };
}

restartBtn.onclick = () => {
  playSound('click');
  choiceA.style.display = "block";
  choiceB.style.display = "block";
  generateDay();
  startGame();
};

// Inicializar
initTheme();
loadData();
