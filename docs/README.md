# 🧩 Fragments - Motor de Historias Interactivas v2.0

> Un sistema completo para crear y jugar historias narrativas donde cada decisión importa.

**🆕 Ahora con Express.js y arquitectura modular** - URLs limpias, estructura profesional

---

## 📦 Instalación

### Requisitos
- **Node.js** >= 14.0.0 ([Descargar aquí](https://nodejs.org/))

### Instalación Rápida

```bash
# 1. Clonar o descargar el proyecto
git clone https://github.com/tu-usuario/Fragments.git
cd Fragments

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor
npm start
```

El servidor se abrirá en: **http://localhost:3000**

📖 **Guía completa**: Lee [INSTALL.md](./INSTALL.md)

---

## � Páginas Disponibles

### **Landing** - `/`
- Página de bienvenida con acceso a todas las funcionalidades
- � **Jugar**: Accede al selector de historias
- ✏️ **Crear**: Abre el editor visual

### **Selector de Historias** - `/selector`
- Explora historias disponibles
- Vista previa con detalles (stats, días, eventos)
- Jugar o editar cualquier historia

### **Juego** - `/game`
- Motor interactivo v2.0
- Sistema completo de guardado
- Múltiples slots de guardado
- Export/Import de partidas

### **Editor Visual** - `/editor` ⭐
- Interfaz completa para crear historias
- Flowchart interactivo con Mermaid.js
- Validación automática
- Sistema de tabs organizado
- 📚 **Guía**: Lee `STORY_CREATION_GUIDE.md`

---

## 🏗️ Arquitectura v2.0

### Estructura de Carpetas

```
Fragments/
├── public/              # Frontend assets
│   ├── css/            # Estilos modulares
│   ├── js/             # JavaScript del cliente
│   ├── game.html       # Juego principal
│   └── index.html      # Landing page
├── views/              # Páginas específicas
│   ├── selector.html   # Selector de historias
│   └── editor.html     # Editor visual
├── engine/             # Motor del juego
├── stories/            # Historias JSON
├── docs/               # Documentación
├── server.js           # Servidor Express.js
└── package.json        # Dependencias
```

### Características Técnicas

- ✅ **Express.js**: Routing profesional con URLs limpias
- ✅ **CSS Modular**: variables.css + common.css + específicos
- ✅ **Mermaid.js local**: Import directo desde node_modules
- ✅ **Query params preservados**: Compatibilidad total

### Opción 2: Jugar con el Nuevo Engine (v2.0)

```bash
npm start
# Abre: http://localhost:3000/game.html
```

Disfruta la historia "Fragments" mejorada con:
- 3 días de juego
- Sistema de personajes (Madre, Pablo, Ex, Jefe)
- Relaciones que evolucionan
- Posibilidad de adoptar un perro
- Múltiples caminos y consecuencias
- 10+ finales diferentes

### Opción 3: Crear Tu Propia Historia

1. Lee `STORY_CREATION_GUIDE.md`
2. Crea una carpeta en `stories/mi_historia/`
3. Define 3 archivos JSON:
   - `config.json` - Configuración
   - `story.json` - Eventos
   - `endings.json` - Finales
4. Edita `main.js` línea ~103:
   ```javascript
   await engine.loadStory('stories/mi_historia');
   ```
5. Abre `index-v2.html` y juega tu historia

---

## 📁 Estructura del Proyecto

```
Fragments/
│
├── game.html               # V2.0 - Nuevo engine
├── app.js                  # Lógica V1.0
├── main.js                 # Controlador V2.0
├── style.css               # Estilos (ambas versiones)
│
├── engine/
│   └── engine.js           # 🧠 Motor de historias V2.0
│
├── data/                   # Datos V1.0
│   ├── situations.json
│   └── endings.json
│
├── stories/                # 📚 Historias V2.0
│   └── fragments_original/
│       ├── config.json     # Configuración
│       ├── story.json      # Eventos narrativos
│       └── endings.json    # Finales posibles
│
├── README.md               # Este archivo
└── STORY_CREATION_GUIDE.md # 📖 Guía completa de creación
```

---

## ✨ Características de Fragments Engine v2.0

### 🎯 Sistema de Historias Dinámico

- **Stats Personalizables**: Define las estadísticas que necesites (energía, carisma, karma, salud, etc.)
- **Flags Custom**: Variables boolean, string o number para trackear cualquier cosa
- **Sin Hardcode**: El engine se adapta automáticamente a tu config.json

### 👥 Sistema de Personajes

- Relaciones con NPCs (-100 a +100)
- Trackeo de encuentros
- Diálogos y eventos contextuales basados en la relación

### 🎒 Sistema de Inventario

- Items coleccionables
- Sistema de dinero
- Efectos de compra/venta en eventos

### 📅 Modo Campaña Multi-Día

- Historias de 1 a N días
- Consecuencias persistentes entre días
- Transiciones narrativas

### 🎲 Eventos Especiales

| Tipo | Descripción |
|------|-------------|
| **mandatory** | Debe aparecer sí o sí |
| **optional** | Aparece si cumple condiciones |
| **random** | Aparece con X% probabilidad |
| **forced** | Se fuerza después de cierto trigger |

### 💾 Sistema de Guardado Completo

- **Auto-save**: Guarda automáticamente el progreso
- **Múltiples slots**: 3 espacios de guardado manual
- **Export/Import**: Descarga y comparte tus partidas
- **Persistencia**: LocalStorage + archivos JSON

### 🏆 Sistema de Achievements

- Logros desbloqueables
- Notificaciones en tiempo real
- Tracking automático

### 🔍 Validador de Historias

Detecta automáticamente:
- ✅ IDs duplicados
- ✅ Referencias a eventos inexistentes
- ✅ Finales imposibles de alcanzar
- ✅ Errores de sintaxis en condiciones

---

## 🎨 Sistema de Condiciones Avanzado

El engine soporta condiciones complejas para eventos y finales:

```json
{
  "conditions": {
    "stats": { "energia_min": 5, "animo_max": 3 },
    "flags": { "has_dog": true, "job": "employed" },
    "characters": { "ana": { "relationship_min": 50 } },
    "day_min": 2,
    "completed_events": ["evento_1"],
    "previous_choices": { "evento_10": 0 },
    "inventory": { "money_min": 100, "has_items": ["llave"] }
  }
}
```

---

## ⚡ Sistema de Efectos

Cada decisión puede afectar múltiples aspectos:

```json
{
  "effects": {
    "stats": { "energia": -2, "animo": 3 },
    "flags": { "helped_friend": true, "karma": 10 },
    "characters": { "ana": { "relationship": 15 } },
    "inventory": { "money": -50, "items": ["regalo"] },
    "unlock_events": ["evento_secreto"],
    "lock_events": ["camino_bloqueado"],
    "trigger_next_day": true,
    "unlocks": { "achievement": "helper" }
  }
}
```

---

## 🎓 Ejemplos de Uso

### Historia Romántica
```json
{
  "stats": {
    "carisma": { ... },
    "confianza": { ... }
  },
  "characters": {
    "amor_interes": { ... }
  }
}
```

### Historia de Supervivencia
```json
{
  "stats": {
    "salud": { ... },
    "hambre": { ... },
    "sed": { ... }
  },
  "inventory": {
    "enabled": true,
    "items": ["agua", "comida_enlatada"]
  }
}
```

### Historia de Misterio
```json
{
  "flags": {
    "pista_1_encontrada": false,
    "sospechoso_principal": null,
    "caso_resuelto": false
  }
}
```

---

## 🛠️ Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Variables CSS, animaciones, responsive
- **JavaScript (ES6+)**: Clases, async/await, módulos
- **JSON**: Almacenamiento de datos
- **Web Audio API**: Efectos de sonido
- **LocalStorage**: Persistencia de guardados
- **FileReader API**: Import/Export de archivos

### Sin dependencias externas
- ✅ Vanilla JavaScript puro
- ✅ Sin frameworks ni librerías
- ✅ Sin build tools necesarios
- ✅ Funciona offline con file://

---

## 📊 Comparación de Versiones

| Característica | V1.0 Original | V2.0 Engine |
|----------------|---------------|-------------|
| **Historia fija** | ✅ Fragments | ✅ Fragments mejorado |
| **Crear historias custom** | ❌ | ✅ |
| **Stats dinámicas** | ❌ 3 fijas | ✅ Ilimitadas |
| **Flags/Variables** | ❌ | ✅ |
| **Personajes** | ❌ | ✅ |
| **Inventario** | ❌ | ✅ |
| **Multi-día** | ❌ 1 día | ✅ N días |
| **Guardado** | ❌ Solo tema | ✅ Completo |
| **Achievements** | ❌ | ✅ |
| **Eventos random** | ❌ | ✅ |
| **Validador** | ❌ | ✅ |
| **Dificultad** | Plug & Play | Requiere JSON |

---

## 📚 Documentación

- **[STORY_CREATION_GUIDE.md](STORY_CREATION_GUIDE.md)** - Guía completa para crear historias
  - Estructura de archivos
  - Sintaxis de JSON
  - Sistema de condiciones
  - Sistema de efectos
  - Ejemplos paso a paso
  - Mejores prácticas
  - Troubleshooting

---

## 🎯 Casos de Uso

### Para Jugadores
- Disfruta "Fragments" original o mejorado
- Importa historias creadas por la comunidad
- Comparte tus partidas

### Para Creadores
- Escribe tu propia historia narrativa
- Crea juegos de decisiones sin programar
- Experimenta con diferentes mecánicas

### Para Educadores
- Enseña programación mediante JSON
- Crea historias educativas interactivas
- Storytelling dinámico

### Para Desarrolladores
- Estudia el código fuente
- Extiende el engine
- Crea herramientas visuales

---

## 🤝 Contribuir

### Áreas de Contribución

1. **Nuevas historias** para `stories/`
2. **Mejoras al engine** (nuevas features)
3. **Editor visual** de historias (proyecto futuro)
4. **Traducciones** de la documentación
5. **Themes CSS** adicionales
6. **Optimizaciones** de rendimiento

### Proceso

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add: amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 🗺️ Roadmap

### ✅ Versión 2.0 (Actual)
- [x] Engine completo funcional
- [x] Sistema de guardado
- [x] Validador de historias
- [x] Documentación completa
- [x] Historia de ejemplo (Fragments v2)

### 🔄 Versión 2.1 (Próxima)
- [ ] Editor visual de historias (drag & drop)
- [ ] Marketplace de historias comunitarias
- [ ] Modo "New Game+" con bonus
- [ ] Sistema de logros global (cross-story)
- [ ] Soporte para multimedia (imágenes, audio)

### 🔮 Versión 3.0 (Futuro)
- [ ] Multijugador asíncrono (decisiones compartidas)
- [ ] Backend opcional para leaderboards
- [ ] PWA completa (installable)
- [ ] Generación de historias con IA
- [ ] Sistema de mods y plugins

---

## 📜 Licencia

Este proyecto es de código abierto bajo la licencia **MIT**.

Puedes:
- ✅ Usar el engine para proyectos personales o comerciales
- ✅ Modificar el código fuente
- ✅ Distribuir tus historias
- ✅ Crear herramientas derivadas

Condiciones:
- 📝 Mantener el aviso de copyright
- 📝 Incluir copia de la licencia MIT

---

## 👤 Autor

**Yerlinson Lora**
- GitHub: [@yerlinson10](https://github.com/yerlinson10)

---

## 🙏 Agradecimientos

- Inspirado en **Twine**, **ChoiceScript** e **Ink**
- Diseño influenciado por juegos narrativos indie
- Gracias a la comunidad de desarrollo de historias interactivas

---

## 📞 Soporte

### Tengo un problema con V1.0
- Verifica `game.html` y `app.js`
- Consulta el README original

### Tengo un problema con V2.0
1. Verifica la **consola del navegador** (F12)
2. Lee `STORY_CREATION_GUIDE.md`
3. Revisa `stories/fragments_original/` como ejemplo
4. Abre un issue en GitHub

### Quiero crear una historia
1. Lee `STORY_CREATION_GUIDE.md` de inicio a fin
2. Estudia `stories/fragments_original/`
3. Crea tus 3 archivos JSON
4. Testea y usa el validador

---

## 🌟 Showcase

¿Creaste una historia con Fragments Engine? ¡Compártela!

Próximamente: galería de historias comunitarias.

---

**¿Te gustó el proyecto? ⭐ Dale una estrella al repositorio!**

*Cada día es una colección de fragmentos. ¿Cómo ensamblarás el tuyo?*

---

## 📈 Estadísticas

- **Versión Engine**: 2.0.0
- **Líneas de código**: ~3000+
- **Archivos JSON de ejemplo**: 3
- **Eventos de ejemplo**: 20+
- **Finales de ejemplo**: 10+
- **Sistemas implementados**: 12
- **Sin dependencias externas**: 100%

---

<div align="center">

**[🚀 Jugar V2.0](game.html)** | **[📖 Guía de Creación](STORY_CREATION_GUIDE.md)**

</div>
