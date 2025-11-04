# 🧩 Fragments

> Un juego narrativo interactivo donde tus decisiones diarias construyen tu realidad.

## 📖 Descripción

**Fragments** es una experiencia narrativa que simula un día completo en tu vida, desde las 5 AM hasta la 1 AM. Cada decisión que tomas afecta tres aspectos fundamentales de tu existencia:

- ⚡ **Energía**: Tu vitalidad física y mental
- 💙 **Ánimo**: Tu estado emocional y bienestar
- 🌀 **Caos**: El nivel de desorden e imprevisibilidad en tu vida

Al final del día, la combinación única de tus decisiones determina uno de **33 finales posibles**, cada uno con su propia reflexión sobre cómo viviste ese día.

## ✨ Características

### 🎮 Jugabilidad
- **33 situaciones únicas** que pueden ocurrir durante el día
- **Sistema de dependencias inteligente** que hace cada partida diferente
- **10-15 situaciones por partida** generadas dinámicamente
- **33 finales distintos** basados en tus estadísticas acumuladas
- **Decisiones binarias** con consecuencias reales

### 🎨 Interfaz
- **Diseño minimalista y elegante** con animaciones suaves
- **Tema claro/oscuro** con persistencia entre sesiones
- **Barras de estadísticas animadas** que muestran tu progreso
- **Indicadores flotantes** que revelan el impacto de cada decisión
- **Barra de progreso** que muestra tu avance en el día
- **Responsive design** optimizado para móvil y escritorio

### 🔊 Experiencia
- **Efectos de sonido procedurales** (Web Audio API)
- **Animaciones fluidas** con transiciones fade
- **Iconos contextuales** (🌅 mañana, 🌇 tarde, 🌙 noche)
- **Feedback visual inmediato** en cada interacción

## 🚀 Instalación

### Opción 1: Clonar el repositorio
```bash
git clone https://github.com/yerlinson10/Fragments.git
cd Fragments
```

### Opción 2: Descarga directa
1. Descarga el código como ZIP
2. Extrae los archivos en tu directorio local
3. Abre `index.html` en tu navegador

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- No requiere instalación de dependencias
- No requiere servidor (funciona con `file://`)

## 📁 Estructura del Proyecto

```
Fragments/
│
├── index.html          # Estructura principal del juego
├── styles.css          # Estilos y sistema de temas
├── app.js              # Lógica del juego y estado
│
├── data/
│   ├── situations.json # 33 situaciones del día
│   └── endings.json    # 33 finales posibles
│
└── README.md          # Este archivo
```

## 🎯 Cómo Jugar

1. **Inicia el juego**: Abre `index.html` en tu navegador
2. **Lee la situación**: Cada escenario presenta un dilema cotidiano
3. **Elige tu acción**: Selecciona entre dos opciones (A o B)
4. **Observa las consecuencias**: Tus estadísticas cambian según tu elección
5. **Completa el día**: Atraviesa 10-15 situaciones hasta el final
6. **Descubre tu final**: Obtén uno de 33 finales basados en tus stats

### Consejos
- 🎲 **No hay respuestas correctas o incorrectas**: Cada decisión es válida
- 📊 **Balancea tus estadísticas**: Los extremos pueden llevar a finales intensos
- 🔄 **Rejogar es parte de la experiencia**: Cada partida es única
- 🎭 **Explora diferentes caminos**: 33 finales esperan ser descubiertos

## 🛠️ Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Variables CSS, animaciones, flexbox/grid
- **JavaScript (ES6+)**: Lógica del juego, fetch API, localStorage
- **JSON**: Almacenamiento de datos de situaciones y finales
- **Web Audio API**: Generación procedural de sonidos
- **LocalStorage**: Persistencia del tema seleccionado

### Sin dependencias externas
- ✅ Vanilla JavaScript puro
- ✅ Sin frameworks ni librerías
- ✅ Sin build tools necesarios
- ✅ Sin servidor backend requerido

## 🎨 Sistema de Temas

El juego incluye dos temas visuales:

### 🌙 Tema Oscuro
- Fondo negro suave (#0a0a0a)
- Ideal para jugar de noche
- Reduce fatiga visual

### ☀️ Tema Claro
- Fondo blanco luminoso (#ffffff)
- Perfecto para el día
- Mayor contraste

**Cambio de tema**: Click en el botón 🌙/☀️ en la esquina superior derecha

## 📊 Sistema de Estadísticas

### Rango de valores
- Cada stat puede variar entre **-15 y +15** (teórico)
- Rango típico en partida: **-7 a +7**
- Efectos por decisión: **-2 a +2** (común)

### Interpretación
```
⚡ Energía
  > +5: Lleno de energía
  > 0 a +4: Energía moderada
  > -4 a 0: Cansancio ligero
  > < -5: Agotamiento

💙 Ánimo
  > +5: Muy feliz
  > 0 a +4: Contento
  > -4 a 0: Melancólico
  > < -5: Deprimido

🌀 Caos
  > +5: Vida descontrolada
  > 0 a +4: Desorden moderado
  > -4 a 0: Algo de control
  > < -5: Vida estructurada
```

## 🎭 Finales

El juego incluye 33 finales únicos ordenados de específico a genérico:

### Finales Positivos
- **Armonioso**: Balance perfecto en todo
- **Eufórico**: Pura felicidad y energía
- **Inspirado**: Creatividad desbordante
- **Valiente**: Enfrentaste tus miedos
- **Conexión Genuina**: Encontraste significado

### Finales Negativos
- **Autodestructivo**: Te saboteaste conscientemente
- **Agotado**: Sin energía para continuar
- **Sobrecargado**: Demasiada presión
- **Invisible**: Nadie te vio realmente
- **Rompimiento**: Algo se quebró hoy

### Finales Complejos
- **Rebelde**: Caos intencional y liberador
- **Hedonista**: Placer sin límites
- **Superviviente**: Apenas lo lograste
- **Nostálgico**: Viviendo en el pasado
- **Promedio**: Un día más, nada especial

*[Ver lista completa en `data/endings.json`]*

## 🔧 Personalización

### Añadir nuevas situaciones
Edita `data/situations.json`:
```json
{
  "id": "tu_evento",
  "text": "Descripción de la situación...",
  "time": "morning|afternoon|night",
  "earliest_hour": 8,
  "latest_hour": 10,
  "requires_one_of": ["evento_previo"],
  "choices": [
    {
      "text": "Opción A",
      "effects": { "energia": 1, "animo": -1, "caos": 2 }
    },
    {
      "text": "Opción B",
      "effects": { "energia": -2, "animo": 2, "caos": 0 }
    }
  ]
}
```

### Añadir nuevos finales
Edita `data/endings.json`:
```json
{
  "id": "tu_final",
  "conditions": {
    "energia_min": 5,
    "animo_max": -3,
    "caos_min": 4
  },
  "message": "Reflexión sobre este tipo de día..."
}
```

### Modificar estilos
Edita las variables CSS en `styles.css`:
```css
:root {
  --bg-primary: #ffffff;
  --accent: #6366f1;
  --energia: #10b981;
  --animo: #3b82f6;
  --caos: #ef4444;
}
```

## 🐛 Solución de Problemas

### El juego solo muestra 2 situaciones
- ✅ **Solucionado**: Sistema de dependencias corregido en v1.1
- Asegúrate de tener la última versión del código

### Los finales no son alcanzables
- ✅ **Solucionado**: Umbrales rebalanceados en v1.2
- Ahora todos los 33 finales son matemáticamente posibles

### El tema no se guarda
- Verifica que tu navegador permita localStorage
- Comprueba que JavaScript esté habilitado

### Los sonidos no funcionan
- Algunos navegadores bloquean audio hasta interacción del usuario
- Click en cualquier botón para activar el audio

## 📈 Roadmap

### Versión Actual: 1.2
- ✅ Sistema de generación de día funcional
- ✅ 33 situaciones únicas
- ✅ 33 finales balanceados
- ✅ Sistema de temas (claro/oscuro)
- ✅ Feedback visual completo
- ✅ Efectos de sonido

### Futuras Mejoras
- 🔄 Sistema de achievements/logros
- 📊 Historial de partidas jugadas
- 💾 Sistema de guardado de progreso
- 🎨 Ilustraciones minimalistas
- 🌍 Modo campaña (múltiples días)
- 🤝 Sistema de relaciones con personajes
- 📱 PWA (Progressive Web App)
- 🌐 Traducción a otros idiomas

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Áreas de contribución
- 📝 Nuevas situaciones y finales
- 🎨 Mejoras visuales y animaciones
- 🐛 Reportes de bugs
- 📖 Documentación y traducciones
- ♿ Mejoras de accesibilidad

## 📜 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

**Yerlinson** - [GitHub](https://github.com/yerlinson10)

## 🙏 Agradecimientos

- Inspirado en juegos narrativos como *Reigns* y *Choice of Games*
- Diseño minimalista influenciado por *Nier: Automata* y *Papers, Please*
- Gracias a la comunidad de desarrollo indie por la inspiración

---

## 📞 Contacto

¿Preguntas, sugerencias o bugs? 
- 📧 Abre un issue en GitHub

---

**¿Te gustó el juego? ⭐ Dale una estrella al repositorio!**

*Cada día es una colección de fragmentos. ¿Cómo ensamblarás el tuyo?*
