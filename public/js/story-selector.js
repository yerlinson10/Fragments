/**
 * STORY SELECTOR - Gestor de selección de historias
 */

let stories = [];
let filteredStories = [];

// Tema
function initTheme() {
  const savedTheme = localStorage.getItem("fragmentsTheme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    document.getElementById("themeToggle").innerHTML =
      '<i data-lucide="sun"></i>';
  }
  // Inicializar iconos Lucide
  if (window.lucide) {
    lucide.createIcons();
  }
}

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  document.getElementById("themeToggle").innerHTML = isDark
    ? '<i data-lucide="sun"></i>'
    : '<i data-lucide="moon"></i>';
  localStorage.setItem("fragmentsTheme", isDark ? "dark" : "light");
  // Reinicializar iconos después del cambio
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Cargar historias disponibles
async function loadStories() {
  try {
    // Intentar cargar desde stories/index.json (manifest)
    const response = await fetch("stories/index.json");

    if (response.ok) {
      const manifest = await response.json();
      stories = manifest.stories || [];
    } else {
      // Si no existe manifest, buscar carpetas manualmente
      stories = await discoverStories();
    }

    // Cargar metadata de cada historia
    await Promise.all(
      stories.map(async (story) => {
        try {
          const configRes = await fetch(`stories/${story.id}/config.json`);
          if (configRes.ok) {
            const config = await configRes.json();
            Object.assign(story, {
              title: config.story.title,
              subtitle: config.story.subtitle || "",
              version: config.story.version || "1.0.0",
              author: config.story.author || "Anónimo",
              days: config.story.days || 1,
              stats: Object.keys(config.stats || {}).length,
              events: 0, // Se cargará después
              endings: 0, // Se cargará después
            });

            // Contar eventos
            const storyRes = await fetch(`stories/${story.id}/story.json`);
            if (storyRes.ok) {
              const storyData = await storyRes.json();
              story.events = storyData.events?.length || 0;
            }

            // Contar finales
            const endingsRes = await fetch(`stories/${story.id}/endings.json`);
            if (endingsRes.ok) {
              const endingsData = await endingsRes.json();
              story.endings = endingsData.endings?.length || 0;
            }
          }
        } catch (error) {
          console.error(`Error cargando metadata de ${story.id}:`, error);
        }
      })
    );

    filteredStories = [...stories];
    renderStories();
  } catch (error) {
    console.error("Error cargando historias:", error);
    renderStories();
  }
}

// Descubrir historias automáticamente
async function discoverStories() {
  const knownStories = ["fragments_original"];
  const discovered = [];

  for (const id of knownStories) {
    try {
      const response = await fetch(`stories/${id}/config.json`);
      if (response.ok) {
        discovered.push({ id });
      }
    } catch (error) {}
  }

  return discovered;
}

// Renderizar historias
function renderStories() {
  const grid = document.getElementById("storiesGrid");
  const emptyState = document.getElementById("emptyState");

  if (filteredStories.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  grid.innerHTML = filteredStories
    .map(
      (story) => `
    <div class="story-card" data-story-id="${story.id}">
      <div class="story-header">
        <h2 class="story-title">${story.title || story.id}</h2>
        <span class="story-version">v${story.version || "1.0.0"}</span>
      </div>
      
      <p class="story-subtitle">${story.subtitle || "Sin descripción"}</p>
      
      <div class="story-meta">
        <span class="story-meta-item">
          <i data-lucide="user" style="width:14px;height:14px;vertical-align:-2px"></i> ${
            story.author || "Anónimo"
          }
        </span>
        <span class="story-meta-item">
          <i data-lucide="calendar" style="width:14px;height:14px;vertical-align:-2px"></i> ${
            story.days || 1
          } día${story.days > 1 ? "s" : ""}
        </span>
      </div>
      
      <div class="story-stats">
        <div class="story-stat">
          <div class="story-stat-value">${story.stats || 0}</div>
          <div class="story-stat-label">Stats</div>
        </div>
        <div class="story-stat">
          <div class="story-stat-value">${story.events || 0}</div>
          <div class="story-stat-label">Eventos</div>
        </div>
        <div class="story-stat">
          <div class="story-stat-value">${story.endings || 0}</div>
          <div class="story-stat-label">Finales</div>
        </div>
      </div>
      
      <div class="story-actions">
        <button class="btn-play" onclick="playStory('${story.id}')">
          <i data-lucide="play"></i> Jugar
        </button>
        <button class="btn-edit" onclick="editStory('${story.id}')">
          <i data-lucide="pencil"></i> Editar
        </button>
        <button class="btn-delete" onclick="confirmDeleteStory('${
          story.id
        }', '${story.title || story.id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Reinicializar iconos después de renderizar
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Buscar historias
document.getElementById("searchInput").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();

  filteredStories = stories.filter(
    (story) =>
      (story.title || story.id).toLowerCase().includes(query) ||
      (story.subtitle || "").toLowerCase().includes(query) ||
      (story.author || "").toLowerCase().includes(query)
  );

  renderStories();
});

// Ordenar historias
document.getElementById("sortSelect").addEventListener("change", (e) => {
  const sortBy = e.target.value;

  switch (sortBy) {
    case "name":
      filteredStories.sort((a, b) =>
        (a.title || a.id).localeCompare(b.title || b.id)
      );
      break;
    case "recent":
      // Por ahora por ID (después se puede usar fecha de modificación)
      filteredStories.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case "days":
      filteredStories.sort((a, b) => (b.days || 0) - (a.days || 0));
      break;
  }

  renderStories();
});

// Jugar historia
function playStory(storyId) {
  localStorage.setItem("selectedStory", storyId);
  window.location.href = "game.html";
}

// Editar historia
function editStory(storyId) {
  window.location.href = `story-editor.html?story=${storyId}`;
}

// Crear nueva historia
document.getElementById("createStoryBtn").addEventListener("click", () => {
  window.location.href = "story-editor.html";
});

// Abrir editor
document.getElementById("editorBtn").addEventListener("click", () => {
  window.location.href = "story-editor.html";
});

// Eliminar historia
let storyToDelete = null;

function confirmDeleteStory(storyId, storyTitle) {
  storyToDelete = storyId;
  document.getElementById("deleteStoryName").textContent = storyTitle;
  document.getElementById("deleteModal").classList.remove("hidden");
}

document.getElementById("confirmDelete").addEventListener("click", async () => {
  if (!storyToDelete) return;

  // En un entorno real, esto requeriría un backend
  // Por ahora, solo removemos del manifest local
  stories = stories.filter((s) => s.id !== storyToDelete);
  filteredStories = filteredStories.filter((s) => s.id !== storyToDelete);

  // Intentar actualizar manifest
  try {
    // Nota: Esto solo funciona con un servidor backend

    alert(
      "Nota: Para eliminar permanentemente, debes eliminar la carpeta manualmente de stories/"
    );
  } catch (error) {
    console.error("Error eliminando historia:", error);
  }

  renderStories();
  document.getElementById("deleteModal").classList.add("hidden");
  storyToDelete = null;
});

document.getElementById("cancelDelete").addEventListener("click", () => {
  document.getElementById("deleteModal").classList.add("hidden");
  storyToDelete = null;
});

// Función global para crear historia desde empty state
window.openEditor = function () {
  window.location.href = "story-editor.html";
};

// Inicializar
initTheme();
loadStories();
