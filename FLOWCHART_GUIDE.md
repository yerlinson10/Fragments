# 📊 Guía de Visualización de Flujo de Historia

## 🎯 ¿Qué es el Flujo Visual?

La **Visualización de Flujo** es una herramienta del editor que te permite ver gráficamente cómo se conectan todos los eventos de tu historia. Es como un mapa de tu narrativa que muestra:

- **Nodos**: Cada evento de tu historia
- **Conexiones**: Cómo los eventos se desbloquean entre sí
- **Análisis**: Eventos inalcanzables, loops, estadísticas

---

## 🚀 Cómo Usar

### 1. Acceder al Flujo Visual

1. Abre el editor visual (`story-editor.html`)
2. Carga o crea una historia con eventos
3. Haz clic en **"📊 Flujo Visual"** en el menú lateral
4. Click en **"🔄 Actualizar"** para generar el grafo

### 2. Controles Disponibles

#### **Filtros**
- **Filtrar por día**: Muestra solo eventos de un día específico
- **Tipo de evento**: Filtra por mandatory, optional, random, forced
- **Mostrar inalcanzables**: Muestra/oculta eventos inalcanzables

#### **Zoom**
- Usa el slider para acercar/alejar
- Útil para historias con muchos eventos

#### **Exportar**
- **💾 Exportar PNG**: Descarga el grafo como imagen SVG

---

## 🎨 Leyenda de Colores

### **Nodos (Eventos)**

| Color | Tipo | Descripción |
|-------|------|-------------|
| 🔵 Azul | Mandatory | Debe aparecer sí o sí |
| 🟢 Verde | Optional | Aparece si cumple condiciones |
| 🟠 Naranja | Random | Aparece aleatoriamente |
| 🟣 Morado | Forced | Se fuerza después de trigger |
| 🔴 Rojo | Inalcanzable | **PROBLEMA:** No se puede alcanzar |

### **Conexiones (Aristas)**

| Tipo | Color | Descripción |
|------|-------|-------------|
| → Verde | Unlock | Desbloquea otro evento |
| ⇢ Roja (punteada) | Lock | Bloquea otro evento |
| → Morada | Sequence | Requiere evento completado |
| → Naranja | Choice Dependency | Depende de elección específica |

---

## 📈 Panel de Análisis

El panel de análisis te muestra estadísticas importantes:

### **Métricas Principales**

- **Total Eventos**: Cantidad total de eventos en la historia
- **Alcanzables**: Eventos que el jugador puede experimentar
- **Inalcanzables**: ⚠️ Eventos que NUNCA se mostrarán (problema de diseño)
- **Conexiones**: Número de relaciones entre eventos

### **Desglose por Tipo**

Muestra cuántos eventos de cada tipo tienes:
```
- mandatory: 5
- optional: 12
- random: 3
- forced: 2
```

### **Desglose por Día**

Muestra la distribución de eventos por día:
```
- Día 1: 8 eventos
- Día 2: 10 eventos
- Día 3: 4 eventos
```

### **Loops Detectados** ⚠️

Si hay loops (ciclos) en tu historia, aparecerán aquí:
```
⚠️ Loops Detectados:
- evento_1 → evento_2 → evento_3 → evento_1
```

**¿Es malo un loop?**
- Depende del diseño. Algunos loops son intencionales (eventos repetibles)
- Loops no intencionales pueden causar que el jugador quede atrapado

### **Eventos Inalcanzables** ❌

Lista de eventos que nunca se mostrarán:
```
❌ Eventos Inalcanzables:
- evento_secreto_imposible
- camino_bloqueado_sin_unlock
```

**¿Por qué es inalcanzable?**
- No tiene forma de desbloquearse
- Requiere condiciones imposibles
- Está bloqueado por otro evento sin forma de desbloquearlo

---

## 🔍 Tipos de Conexiones Detectadas

El sistema analiza automáticamente 4 tipos de conexiones:

### **1. Unlock Events (Verde)**

```json
{
  "choices": [
    {
      "text": "Abrir la puerta",
      "effects": {
        "unlock_events": ["evento_dentro_casa"]
      }
    }
  ]
}
```

**Visualización**: Flecha verde desde el evento actual → evento desbloqueado

### **2. Lock Events (Roja punteada)**

```json
{
  "choices": [
    {
      "text": "Ignorar la llamada",
      "effects": {
        "lock_events": ["evento_reconciliacion"]
      }
    }
  ]
}
```

**Visualización**: Flecha roja punteada desde el evento actual → evento bloqueado

### **3. Completed Events (Morada)**

```json
{
  "id": "evento_final_jefe",
  "conditions": {
    "completed_events": ["evento_reunion", "evento_proyecto"]
  }
}
```

**Visualización**: Flecha morada desde evento requerido → evento dependiente

### **4. Previous Choices (Naranja)**

```json
{
  "id": "evento_consecuencia",
  "conditions": {
    "previous_choices": {
      "evento_decision": 0  // Requiere haber elegido la opción 0
    }
  }
}
```

**Visualización**: Flecha naranja desde evento con decisión → evento dependiente

---

## 🎯 Casos de Uso

### **Caso 1: Detectar Eventos Inalcanzables**

**Problema**: Creaste un evento secreto pero no funciona.

**Solución**:
1. Abre Flujo Visual
2. Si el evento está en rojo, es inalcanzable
3. Revisa el panel de análisis para ver por qué
4. Opciones:
   - Agregar un `unlock_events` desde otro evento
   - Cambiar las condiciones a algo alcanzable
   - Convertirlo en `mandatory` si debe aparecer siempre

**Ejemplo**:
```
❌ Evento: "secreto_cofre"
Problema: Requiere completed_events: ["evento_llave"]
pero "evento_llave" nunca se desbloquea.

Solución: Agregar unlock_events: ["evento_llave"] 
en algún evento anterior.
```

### **Caso 2: Verificar Secuencias Narrativas**

**Problema**: Quieres asegurar que ciertos eventos ocurran en orden.

**Solución**:
1. Abre Flujo Visual
2. Verifica que haya flechas moradas (sequence) entre los eventos
3. Si no hay conexiones, agrégalas:
   ```json
   {
     "id": "evento_3",
     "conditions": {
       "completed_events": ["evento_1", "evento_2"]
     }
   }
   ```

### **Caso 3: Balancear Días**

**Problema**: No sabes si tienes suficientes eventos por día.

**Solución**:
1. Abre Flujo Visual
2. Revisa "Desglose por Día" en el análisis
3. Usa el filtro "Filtrar por día" para ver cada día
4. Idealmente: 5-10 eventos por día

### **Caso 4: Detectar Loops No Deseados**

**Problema**: Jugadores quedan atrapados en ciclos.

**Solución**:
1. Abre Flujo Visual
2. Si aparece "⚠️ Loops Detectados", revísalos
3. Verifica si el loop es intencional
4. Si no lo es, rompe el ciclo:
   - Agrega `lock_events` después de completar
   - Usa `one_time: true` en eventos repetibles
   - Cambia condiciones para avanzar

---

## 🛠️ Mejores Prácticas

### **1. Actualizar Frecuentemente**

- Actualiza el flowchart después de crear/editar eventos
- Te ayuda a detectar problemas temprano

### **2. Revisar Inalcanzables**

- Un evento inalcanzable = contenido perdido
- Idealmente: 0 eventos inalcanzables
- Si son intencionales (contenido secreto extremo), márcalo en los comentarios

### **3. Diseñar Flujos Claros**

- Evita demasiadas dependencias cruzadas
- Mantén caminos narrativos lógicos
- Usa el grafo para visualizar "ramificaciones" vs "linealidad"

### **4. Documentar Eventos Complejos**

- Si un evento tiene muchas conexiones entrantes/salientes, documéntalo
- Usa nombres descriptivos de IDs (`despertar_dia1` mejor que `evt_1`)

### **5. Probar Todos los Caminos**

- El grafo te muestra todos los caminos posibles
- Usa el modo test para verificar cada rama

---

## 📊 Interpretando el Grafo

### **Grafo Lineal (Historia Secuencial)**

```
[Evento 1] → [Evento 2] → [Evento 3] → [Evento 4]
```

**Características**:
- Todos los eventos en línea recta
- Pocas o ninguna ramificación
- Fácil de seguir

**Bueno para**: Historias cortas, tutoriales, narrativas lineales

### **Grafo Ramificado (Historia con Opciones)**

```
                ┌→ [Rama A] → [Final A]
[Inicio] → [Decisión] ─┤
                └→ [Rama B] → [Final B]
```

**Características**:
- Eventos se dividen en caminos
- Múltiples finales posibles
- Mayor rejugabilidad

**Bueno para**: Historias con decisiones importantes, múltiples finales

### **Grafo Densamente Conectado (Historia Compleja)**

```
[E1] ⇄ [E2] → [E3]
 ↓      ↓      ↓
[E4] ← [E5] → [E6]
```

**Características**:
- Muchas conexiones cruzadas
- Eventos interdependientes
- Alta complejidad

**Bueno para**: Historias largas con muchos sistemas interrelacionados

**⚠️ Cuidado**: Más complejo = más difícil de mantener

---

## 🐛 Troubleshooting

### Problema: "No hay eventos para visualizar"

**Solución**:
- Ve a la sección **📖 Eventos**
- Crea al menos un evento
- Regresa a **📊 Flujo Visual** y actualiza

### Problema: "Todos mis eventos están en rojo"

**Solución**:
- Significa que ningún evento es alcanzable
- Asegúrate de tener al menos un evento `mandatory`
- O eventos sin condiciones (alcanzables por defecto)

### Problema: "No veo conexiones entre eventos"

**Solución**:
- Las conexiones solo aparecen si:
  - Usas `unlock_events` o `lock_events`
  - Usas `completed_events` en conditions
  - Usas `previous_choices` en conditions
- Si no usas estas features, no habrá flechas

### Problema: "El grafo se ve desordenado"

**Solución**:
- Usa el filtro "Filtrar por día" para simplificar
- Usa el zoom para acercar/alejar
- El layout automático puede no ser perfecto para historias muy complejas

### Problema: "Hay un loop pero es intencional"

**Solución**:
- Los loops no son necesariamente malos
- Si es intencional (eventos repetibles), ignóralo
- Si causa problemas, agrega condiciones de salida

---

## 💡 Tips Avanzados

### **1. Exportar para Documentación**

- Usa "💾 Exportar PNG" para incluir el grafo en documentación
- Útil para presentar tu historia a otros
- Ayuda a game designers externos a entender el flujo

### **2. Usar Colores para Priorizar**

- 🔵 Mandatory (azul): Usa para eventos cruciales de la trama principal
- 🟢 Optional (verde): Usa para contenido secundario/exploratorio
- 🟠 Random (naranja): Usa para variedad/rejugabilidad
- 🟣 Forced (morado): Usa para eventos gatillados por decisiones específicas

### **3. Diseñar "Cuellos de Botella"**

- Usa el grafo para identificar puntos donde todos los caminos convergen
- Útil para asegurar que todos los jugadores vean ciertos eventos clave

**Ejemplo**:
```
[Rama A] ↘
          [Evento Crucial] → [Continuar historia]
[Rama B] ↗
```

### **4. Detectar "Contenido Huérfano"**

- Eventos sin conexiones entrantes (excepto mandatory)
- Pueden ser contenido perdido o mal configurado
- El grafo los muestra aislados

---

## 📚 Ejemplos Prácticos

### **Ejemplo 1: Historia Simple (3 Días)**

```
Día 1:
[despertar] → [desayuno] → [trabajo] → [dormir_dia1]
                              ↓
                        unlock: [evento_promocion]

Día 2:
[despertar_dia2] → [evento_promocion] → [celebracion]

Día 3:
[despertar_dia3] → [reunion_jefe] → [final]
```

**Análisis**:
- 8 eventos, todos alcanzables
- Flujo lineal con un unlock
- Fácil de seguir y testear

### **Ejemplo 2: Historia con Ramificación**

```
[inicio] → [decision_cafe]
              ├→ [tomar_cafe] → unlock: [energia_boost]
              └→ [no_tomar] → lock: [energia_boost]

[tarde] (requiere: completed_events: [decision_cafe])
   ├→ [trabajar_bien] (si energia_boost alcanzable)
   └→ [trabajar_cansado] (si energia_boost bloqueado)
```

**Análisis**:
- Decisión temprana afecta opciones posteriores
- Uso de unlock/lock para control de flujo
- 2 caminos distintos

### **Ejemplo 3: Historia Compleja (Evento Secreto)**

```
[inicio] → [explorar]
             ├→ [opcion_A] → unlock: [pista_1]
             └→ [opcion_B] → unlock: [pista_2]

[evento_secreto]
  Conditions:
    - completed_events: [pista_1, pista_2]
    - stats: { curiosidad_min: 50 }

Status: ⚠️ Posiblemente inalcanzable
Razón: Requiere AMBAS pistas, pero solo puedes elegir una opción
```

**Solución**:
```json
// Permitir ambas pistas:
{
  "id": "explorar",
  "choices": [
    {
      "text": "Ir a la izquierda",
      "effects": {
        "unlock_events": ["pista_1", "opcional_pista_2"]
      }
    }
  ]
}
```

---

## 🎓 Conclusión

La **Visualización de Flujo** es una herramienta poderosa para:

✅ Entender tu historia visualmente  
✅ Detectar eventos inalcanzables  
✅ Verificar conexiones y dependencias  
✅ Balancear contenido por día  
✅ Encontrar loops y problemas de diseño  
✅ Documentar tu historia para otros  

**Recomendación**: Usa el flowchart después de cada sesión de edición importante. Te ahorrará horas de debugging y asegurará que tu historia fluya correctamente.

---

**¿Necesitas ayuda?** Consulta la documentación principal en `STORY_CREATION_GUIDE.md` o abre un issue en GitHub.

¡Disfruta creando historias complejas y bien estructuradas! 📊✨
