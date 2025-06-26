/**
 * Configuración de prompts para el Generador de Menús con IA
 * Permite personalizar los prompts según diferentes tipos de menús
 */

const AI_PROMPTS = {
  // Prompt principal para extracción de menús desde imagen
  MENU_EXTRACTION: {
    text: `Analiza esta imagen de menú y extrae toda la información en formato JSON. 

Estructura requerida:
{
  "categorias": [
    {
      "nombre": "Nombre de la categoría",
      "descripcion": "Descripción de la categoría (opcional)",
      "orden": 1,
      "productos": [
        {
          "nombre": "Nombre del producto",
          "descripcion": "Descripción del producto",
          "precio": 0.00,
          "disponible": true,
          "orden": 1
        }
      ]
    }
  ]
}

Reglas importantes:
- Extrae TODOS los productos y categorías visibles
- Si no hay descripción, usa una descripción genérica pero atractiva
- Los precios deben ser números decimales (usa punto decimal, no coma)
- Mantén el orden visual de las categorías y productos
- Si no hay categorías claras, agrupa por tipo de comida (Entradas, Platos Principales, Postres, Bebidas)
- Para precios en formato "$X,XX" convierte a formato decimal X.XX
- Si hay varios precios por producto (tamaños), crea productos separados
- Responde SOLO con JSON válido, sin texto adicional
- Si encuentras texto borroso o ilegible, omite ese elemento`,
    
    model: "gpt-4o",
    maxTokens: 4000
  },

  // Prompt para generar descripciones mejoradas
  DESCRIPTION_ENHANCEMENT: {
    systemMessage: "Eres un experto en gastronomía y marketing culinario. Generas descripciones atractivas y apetitosas para productos de menú que sean concisas pero persuasivas.",
    
    userMessage: `Mejora las descripciones de este menú. Para cada producto sin descripción o con descripción genérica, genera una descripción atractiva de máximo 120 caracteres que:

- Sea apetitosa y persuasiva
- Destaque ingredientes principales
- Use palabras sensoriales (crujiente, jugoso, aromático, etc.)
- Sea apropiada para el tipo de restaurante
- Mantenga un tono profesional pero atractivo

Menú actual:
{MENU_DATA}

Responde con el mismo formato JSON pero con descripciones mejoradas. Mantén las descripciones existentes que ya sean buenas.`,
    
    model: "gpt-4",
    maxTokens: 3000
  },

  // Prompts especializados por tipo de menú
  SPECIALIZED_PROMPTS: {
    // Para menús de comida rápida
    FAST_FOOD: {
      additionalInstructions: `
- Enfócate en combos y promociones
- Identifica tamaños (pequeño, mediano, grande)
- Busca ingredientes específicos en hamburguesas
- Categoriza bebidas por tipo y tamaño`,
    },

    // Para menús de restaurante formal
    FINE_DINING: {
      additionalInstructions: `
- Presta atención a técnicas culinarias mencionadas
- Identifica ingredientes premium (trufa, caviar, etc.)
- Busca maridajes de vinos sugeridos
- Categoriza por tiempos de comida (aperitivos, primeros, segundos, postres)`,
    },

    // Para menús de pizzería
    PIZZA: {
      additionalInstructions: `
- Identifica tamaños de pizza claramente
- Separa ingredientes/toppings
- Categoriza por tipo (clásicas, especiales, veganas, etc.)
- Incluye opciones de masa si están disponibles`,
    },

    // Para menús de cafetería/panadería
    CAFE_BAKERY: {
      additionalInstructions: `
- Diferencia entre bebidas calientes y frías
- Categoriza pasteles y panes por tipo
- Identifica opciones veganas/sin gluten si están marcadas
- Separa desayunos, almuerzos y meriendas`,
    },

    // Para menús de bar/cantina
    BAR: {
      additionalInstructions: `
- Categoriza bebidas alcohólicas por tipo (cervezas, vinos, cócteles, licores)
- Identifica botanas/tapas/aperitivos
- Busca promociones de happy hour
- Incluye graduación alcohólica si está visible`,
    }
  },

  // Prompts para casos especiales
  SPECIAL_CASES: {
    // Para menús con múltiples idiomas
    MULTILINGUAL: `Si el menú tiene múltiples idiomas, prioriza el español. Si no hay español, usa el idioma más legible y añade una nota sobre el idioma original.`,
    
    // Para menús con imágenes de productos
    WITH_IMAGES: `Si hay imágenes de productos, úsalas para inferir ingredientes y estilo de preparación, pero no inventes información que no esté en el texto.`,
    
    // Para menús con precios tachados/promociones
    PROMOTIONS: `Si hay precios tachados o promociones, usa el precio final/promocional. Incluye información de la promoción en la descripción si es relevante.`,
    
    // Para menús poco legibles
    POOR_QUALITY: `Si el texto es difícil de leer, extrae solo la información que puedas leer con confianza. Es mejor omitir elementos inciertos que incluir información incorrecta.`
  }
};

/**
 * Construye el prompt final basado en el tipo de menú y casos especiales
 * @param {string} menuType - Tipo de menú (opcional)
 * @param {Array} specialCases - Casos especiales a aplicar (opcional)
 * @returns {string} Prompt construido
 */
function buildMenuExtractionPrompt(menuType = null, specialCases = []) {
  let prompt = AI_PROMPTS.MENU_EXTRACTION.text;
  
  // Agregar instrucciones especializadas si se especifica un tipo
  if (menuType && AI_PROMPTS.SPECIALIZED_PROMPTS[menuType]) {
    prompt += `\n\nInstrucciones adicionales para ${menuType}:`;
    prompt += AI_PROMPTS.SPECIALIZED_PROMPTS[menuType].additionalInstructions;
  }
  
  // Agregar casos especiales
  if (specialCases.length > 0) {
    prompt += `\n\nConsideraciones especiales:`;
    specialCases.forEach(caseType => {
      if (AI_PROMPTS.SPECIAL_CASES[caseType]) {
        prompt += `\n- ${AI_PROMPTS.SPECIAL_CASES[caseType]}`;
      }
    });
  }
  
  return prompt;
}

/**
 * Construye el prompt para mejora de descripciones
 * @param {Object} menuData - Datos del menú a mejorar
 * @returns {string} Prompt construido
 */
function buildDescriptionPrompt(menuData) {
  return AI_PROMPTS.DESCRIPTION_ENHANCEMENT.userMessage.replace(
    '{MENU_DATA}', 
    JSON.stringify(menuData, null, 2)
  );
}

module.exports = {
  AI_PROMPTS,
  buildMenuExtractionPrompt,
  buildDescriptionPrompt
}; 