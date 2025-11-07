/**
 * STORY VALIDATOR - Validación con JSON Schema usando AJV
 * Valida la estructura de historias contra esquemas estrictos
 */

import Ajv from '/node_modules/ajv/dist/ajv.js';
import addFormats from '/node_modules/ajv-formats/dist/index.js';

// Inicializar AJV
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false // Permitir propiedades adicionales no definidas en schema
});

// Agregar formatos adicionales (email, date, uri, etc.)
addFormats(ajv);

// Cargar esquemas
let configSchema, storySchema, endingsSchema;

/**
 * Cargar esquemas JSON desde el servidor
 */
async function loadSchemas() {
  try {
    const [configRes, storyRes, endingsRes] = await Promise.all([
      fetch('/stories/schemas/config.schema.json'),
      fetch('/stories/schemas/story.schema.json'),
      fetch('/stories/schemas/endings.schema.json')
    ]);

    if (!configRes.ok || !storyRes.ok || !endingsRes.ok) {
      console.warn('⚠️ No se pudieron cargar los esquemas de validación');
      return false;
    }

    configSchema = await configRes.json();
    storySchema = await storyRes.json();
    endingsSchema = await endingsRes.json();

    console.log('✅ Esquemas JSON cargados correctamente');
    return true;
  } catch (error) {
    console.warn('⚠️ Error cargando esquemas:', error);
    return false;
  }
}

/**
 * Validar archivo config.json
 */
export function validateConfig(config) {
  if (!configSchema) {
    return {
      valid: false,
      errors: ['Esquema de validación no cargado. Ejecuta loadSchemas() primero.']
    };
  }

  const validate = ajv.compile(configSchema);
  const valid = validate(config);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors.map(err => formatAjvError(err))
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validar archivo story.json
 */
export function validateStory(story) {
  if (!storySchema) {
    return {
      valid: false,
      errors: ['Esquema de validación no cargado. Ejecuta loadSchemas() primero.']
    };
  }

  const validate = ajv.compile(storySchema);
  const valid = validate(story);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors.map(err => formatAjvError(err))
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validar archivo endings.json
 */
export function validateEndings(endings) {
  if (!endingsSchema) {
    return {
      valid: false,
      errors: ['Esquema de validación no cargado. Ejecuta loadSchemas() primero.']
    };
  }

  const validate = ajv.compile(endingsSchema);
  const valid = validate(endings);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors.map(err => formatAjvError(err))
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validar historia completa (bundle)
 */
export function validateFullStory(storyData) {
  const results = {
    valid: true,
    config: { valid: true, errors: [] },
    story: { valid: true, errors: [] },
    endings: { valid: true, errors: [] }
  };

  if (storyData.config) {
    results.config = validateConfig(storyData.config);
    if (!results.config.valid) results.valid = false;
  }

  if (storyData.story) {
    results.story = validateStory(storyData.story);
    if (!results.story.valid) results.valid = false;
  }

  if (storyData.endings) {
    results.endings = validateEndings(storyData.endings);
    if (!results.endings.valid) results.valid = false;
  }

  return results;
}

/**
 * Formatear errores de AJV para que sean legibles
 */
function formatAjvError(error) {
  const path = error.instancePath || 'root';
  const keyword = error.keyword;
  
  switch (keyword) {
    case 'required':
      return `${path}: Falta la propiedad requerida "${error.params.missingProperty}"`;
    case 'type':
      return `${path}: Debe ser de tipo ${error.params.type}, recibido ${typeof error.data}`;
    case 'enum':
      return `${path}: Debe ser uno de: ${error.params.allowedValues.join(', ')}`;
    case 'pattern':
      return `${path}: No cumple con el patrón requerido (${error.params.pattern})`;
    case 'minLength':
      return `${path}: Debe tener al menos ${error.params.limit} caracteres`;
    case 'maxLength':
      return `${path}: Debe tener máximo ${error.params.limit} caracteres`;
    case 'minimum':
      return `${path}: Debe ser mayor o igual a ${error.params.limit}`;
    case 'maximum':
      return `${path}: Debe ser menor o igual a ${error.params.limit}`;
    case 'minItems':
      return `${path}: Debe tener al menos ${error.params.limit} elementos`;
    case 'minProperties':
      return `${path}: Debe tener al menos ${error.params.limit} propiedades`;
    default:
      return `${path}: ${error.message}`;
  }
}

/**
 * Obtener resumen de validación en HTML
 */
export function getValidationSummaryHTML(results) {
  let html = '<div style="font-family: monospace; padding: 1rem;">';
  
  const sections = [
    { name: 'Config', result: results.config },
    { name: 'Story', result: results.story },
    { name: 'Endings', result: results.endings }
  ];

  sections.forEach(section => {
    if (section.result.valid) {
      html += `<div style="color: var(--success); margin-bottom: 1rem;">
        ✅ <strong>${section.name}</strong>: Válido
      </div>`;
    } else {
      html += `<div style="color: var(--danger); margin-bottom: 1rem;">
        ❌ <strong>${section.name}</strong>: ${section.result.errors.length} error(es)
        <ul style="margin-left: 2rem; margin-top: 0.5rem;">
          ${section.result.errors.map(err => `<li>${err}</li>`).join('')}
        </ul>
      </div>`;
    }
  });

  html += '</div>';
  return html;
}

// Auto-cargar esquemas al importar el módulo
loadSchemas();

export { loadSchemas };
