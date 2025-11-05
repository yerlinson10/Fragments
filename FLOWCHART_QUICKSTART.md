# 🚀 Quick Start - Visualización de Flujo

## Prueba Rápida (5 minutos)

### 1. Abre el Editor
```bash
# Navega a tu carpeta de Fragments
cd /c/laragon/www/Fragments

# Abre en tu navegador
start story-editor.html
```

### 2. Carga una Historia

**Opción A: Cargar historia existente**
- Click en "📥 Importar"
- Selecciona `stories/fragments_original/config.json`

**Opción B: Crear historia de prueba**
1. Configura ID, título, etc.
2. Ve a "📖 Eventos"
3. Crea 3 eventos:

```
Evento 1: "despertar"
- Tipo: Mandatory
- Día: 1
- Choice 1: "Ir a trabajar"
  - Effects: unlock_events = ["trabajo"]

Evento 2: "trabajo"
- Tipo: Optional
- Día: 1
- Sin unlock_events

Evento 3: "descansar"
- Tipo: Optional
- Día: 1
- Conditions: completed_events = ["despertar"]
```

### 3. Visualiza el Flujo

1. Click en "📊 Flujo Visual" (menú lateral)
2. Click en "🔄 Actualizar"
3. **¡Listo!** Verás tu grafo

**Deberías ver**:
```
[despertar] --unlock--> [trabajo]
    🔵         →          🟢
                ↓
            [descansar]
                🟢
```

### 4. Interactúa

- **Hover** sobre nodos para resaltar
- **Click** en nodos para ver detalles
- **Zoom** con el slider
- **Filtrar** por día o tipo
- **Exportar** como SVG

---

## 🎯 Casos de Uso Rápidos

### Detectar Evento Inalcanzable

1. Crea un evento con condiciones imposibles:
   ```json
   {
     "id": "secreto",
     "conditions": {
       "completed_events": ["evento_que_no_existe"]
     }
   }
   ```

2. Actualiza flowchart
3. **Resultado**: Verás "secreto" en ROJO ❌
4. Panel de análisis dirá: "Eventos Inalcanzables: secreto"

### Verificar Secuencia

1. Crea 3 eventos en secuencia:
   - A unlock B
   - B unlock C
   
2. Actualiza flowchart
3. **Resultado**: Verás flechas `A → B → C`

### Encontrar Loops

1. Crea 2 eventos:
   - A unlock B
   - B unlock A
   
2. Actualiza flowchart
3. **Resultado**: Panel dirá "⚠️ Loops Detectados: A → B → A"

---

## 🎨 Interpretando Colores

**Rápido**:
- 🔵 Azul = Siempre aparece (mandatory)
- 🟢 Verde = Puede aparecer (optional)
- 🟠 Naranja = Aleatorio (random)
- 🟣 Morado = Forzado (forced)
- 🔴 Rojo = **PROBLEMA** (inalcanzable)

**Conexiones**:
- → Verde sólida = Desbloquea
- ⇢ Roja punteada = Bloquea
- → Morada = Requiere completado
- → Naranja = Requiere decisión específica

---

## ✅ Checklist Rápido

Después de crear tu historia, verifica:

- [ ] No hay nodos rojos (inalcanzables)
- [ ] Todos los eventos tienen al menos una conexión (excepto mandatory)
- [ ] No hay loops no intencionales
- [ ] Cada día tiene 3-10 eventos
- [ ] Los caminos narrativos están balanceados

---

## 📚 Más Información

- **Guía completa**: Ver `FLOWCHART_GUIDE.md`
- **Documentación técnica**: Ver `FLOWCHART_README.md`
- **Creación de historias**: Ver `STORY_CREATION_GUIDE.md`

---

## 🐛 Problemas Comunes

**"No veo el grafo"**
→ Asegúrate de tener eventos creados en "📖 Eventos"

**"Todo está en rojo"**
→ Agrega al menos un evento mandatory o sin condiciones

**"No hay conexiones"**
→ Usa `unlock_events`, `lock_events`, o `completed_events`

**"El grafo se ve mal"**
→ Usa los filtros para simplificar (filtrar por día)

---

**¡Listo para crear historias visuales! 📊✨**

**Tiempo total de setup**: ~5 minutos  
**Nivel de dificultad**: Fácil  
**Curva de aprendizaje**: Baja  
