# 📚 Fragments Engine v2.0 - Sistema de Historias

## 🎮 Selector de Historias + Editor Visual

Este sistema incluye:

1. **Selector de Historias** - Navega y elige historias disponibles
2. **Editor Visual** - Crea y edita historias sin tocar JSON
3. **Modo Test** - Prueba historias en desarrollo

---

## 🚀 Cómo Usar

### 1. Acceder al Selector de Historias

Abre: `story-selector.html`

Desde aquí puedes:
- Ver todas las historias disponibles
- Jugar una historia
- Editar una historia existente
- Crear una nueva historia

### 2. Crear una Nueva Historia

1. Haz clic en **"✨ Crear Nueva Historia"** o **"✏️ Editor Visual"**
2. Se abrirá el editor visual
3. Completa la configuración básica:
   - ID de la historia (sin espacios, solo letras minúsculas y guiones bajos)
   - Título
   - Descripción
   - Autor
   - Número de días

### 3. Usar el Editor Visual

El editor tiene 8 secciones en el menú lateral:

#### ⚙️ Configuración
- Información básica de la historia
- Configuración del juego (guardado, sonidos, etc.)

#### 📊 Stats
- Crea estadísticas (energía, carisma, karma, etc.)
- Define valores mínimos, máximos e iniciales
- Asigna iconos

#### 🚩 Flags
- Variables booleanas, numéricas o de texto
- Controlan el flujo de la historia

#### 👥 Personajes
- Define NPCs con relaciones
- Nivel de afinidad (-100 a +100)

#### 🎒 Inventario
- Habilita/deshabilita el sistema
- Define items disponibles
- Configura dinero inicial

#### 📖 Eventos
- **El corazón de la historia**
- Crea situaciones narrativas
- Define opciones para el jugador
- Configura efectos de cada decisión

**Tipos de eventos:**
- `optional`: Aparece si cumple condiciones
- `mandatory`: Debe aparecer sí o sí
- `random`: Aparece aleatoriamente
- `forced`: Ignora otras condiciones

**Estructura de efectos:**
```json
{
  "stats": {
    "energia": 10,
    "animo": -5
  },
  "flags": {
    "cafe_tomado": true
  },
  "characters": {
    "maria": {
      "relationship": 5
    }
  },
  "inventory": {
    "money": 100,
    "items": ["llave"]
  }
}
```

#### 🏁 Finales
- Define múltiples finales basados en condiciones
- Configura prioridad (menor = más específico)
- Define final por defecto

#### 🏆 Logros
- Achievements opcionales
- Se desbloquean según acciones del jugador

### 4. Guardar la Historia

Hay 3 formas:

#### Opción 1: Exportar archivos (Recomendado)
1. Haz clic en **💾 Guardar**
2. Se descargarán 3 archivos:
   - `id_config.json`
   - `id_story.json`
   - `id_endings.json`
3. Crea una carpeta en `stories/tu_historia_id/`
4. Copia los 3 archivos renombrados como:
   - `config.json`
   - `story.json`
   - `endings.json`

#### Opción 2: Exportar bundle
1. Haz clic en **📤 Exportar**
2. Se descarga un archivo con todo
3. Útil para compartir o backup

#### Opción 3: Importar
1. Haz clic en **📥 Importar**
2. Selecciona un archivo JSON exportado
3. Se carga en el editor

### 5. Probar la Historia

1. En el editor, haz clic en **▶️ Probar**
2. Se abre una nueva pestaña en modo test
3. Juega la historia para verificar que funciona
4. Los errores aparecen en consola (F12)

### 6. Validar la Historia

1. Haz clic en **✓ Validar**
2. El sistema detecta:
   - IDs faltantes o duplicados
   - Eventos sin opciones
   - Referencias inválidas
   - Problemas de estructura

---

## 📁 Estructura de Carpetas

```
Fragments/
├── index.html              # Juego principal
├── story-selector.html     # Selector de historias
├── story-editor.html       # Editor visual
├── test-story.html         # Modo test
│
├── stories/
│   ├── index.json          # Manifest de historias
│   │
│   ├── fragments_original/ # Historia ejemplo
│   │   ├── config.json
│   │   ├── story.json
│   │   └── endings.json
│   │
│   └── tu_historia/        # Tu historia nueva
│       ├── config.json
│       ├── story.json
│       └── endings.json
│
└── engine/
    └── engine.js           # Motor del juego
```

---

## 🎯 Flujo de Trabajo Recomendado

1. **Planificación** (papel/documento)
   - Bosquejo de la trama
   - Personajes principales
   - Stats necesarias
   - Finales posibles

2. **Configuración** (editor)
   - Crea stats, personajes, flags
   - Define configuración básica

3. **Eventos** (editor)
   - Crea eventos día por día
   - Empieza por eventos obligatorios
   - Agrega eventos opcionales/aleatorios

4. **Finales** (editor)
   - Define condiciones claras
   - Ordena por prioridad

5. **Test** (modo test)
   - Juega varias veces
   - Prueba diferentes caminos
   - Verifica que todos los finales funcionen

6. **Validación** (editor)
   - Ejecuta validación
   - Corrige errores

7. **Exportar** (editor)
   - Guarda la historia final
   - Copia archivos a carpeta stories/

8. **Actualizar manifest** (manual)
   - Edita `stories/index.json`
   - Agrega tu historia:
   ```json
   {
     "stories": [
       {
         "id": "fragments_original",
         "enabled": true
       },
       {
         "id": "tu_historia",
         "enabled": true
       }
     ]
   }
   ```

---

## 💡 Consejos

### Para Eventos

- **IDs descriptivos**: `despertar_dia1`, `cafe_cocina`, `llamada_madre`
- **Situaciones claras**: Describe bien el contexto
- **2-4 opciones**: Más de 4 puede ser abrumador
- **Efectos balanceados**: No cambies mucho las stats de golpe

### Para Finales

- **Específico a genérico**: Prioridad 1 para final muy específico, 100 para genérico
- **Condiciones claras**: Usa rangos de stats, no valores exactos
- **Mensajes significativos**: Refleja las decisiones del jugador

### Para Stats

- **3-5 stats máximo**: Más de eso es difícil de balancear
- **Rangos claros**: 0-100 es estándar
- **Iconos descriptivos**: Ayudan a identificar rápido

### Para Testing

- **Juega múltiples veces**: Prueba todos los caminos
- **Verifica condiciones**: Asegúrate que eventos aparezcan cuando deben
- **Revisa consola**: F12 para ver errores de JavaScript

---

## 🔧 Limitaciones Actuales

1. **Sin servidor**: Los archivos deben copiarse manualmente a `stories/`
2. **Sin hot-reload**: Debes refrescar para ver cambios
3. **Editor básico**: Algunas funciones avanzadas requieren editar JSON

---

## 🆘 Solución de Problemas

### "Error cargando historia"
- Verifica que existan los 3 archivos JSON
- Revisa que estén en `stories/nombre_historia/`
- Comprueba que los archivos sean JSON válido

### "No hay eventos disponibles"
- Verifica que hayas creado eventos
- Revisa las condiciones de los eventos
- Comprueba que el día coincida

### "Final no se muestra"
- Verifica condiciones del final
- Revisa prioridades (menor = más específico)
- Asegúrate que haya un final por defecto

### Editor no guarda cambios
- El botón "Guardar" exporta archivos
- Debes copiarlos manualmente a `stories/`
- Usa "Exportar" para backup completo

---

## 📚 Recursos

- **Guía completa**: `STORY_CREATION_GUIDE.md`
- **Historia ejemplo**: `stories/fragments_original/`
- **Engine**: `engine/engine.js`

---

¡Disfruta creando historias interactivas! 🎮✨
