const { prisma } = require('../config/database');

/**
 * Convierte un texto a un slug URL-friendly
 * @param {string} text - Texto a convertir
 * @returns {string} - Slug generado
 */
const textToSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales latinos
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[^a-z0-9]+/g, '-')
    // Remover guiones al inicio y final
    .replace(/^-+|-+$/g, '')
    // Remover guiones dobles
    .replace(/-+/g, '-');
};

/**
 * Genera un slug único para un restaurante
 * @param {string} nombre - Nombre del restaurante
 * @returns {Promise<string>} - Slug único
 */
const generateUniqueSlug = async (nombre) => {
  let baseSlug = textToSlug(nombre);
  
  // Si el slug está vacío, usar un valor por defecto
  if (!baseSlug) {
    baseSlug = 'restaurante';
  }
  
  let slug = baseSlug;
  let counter = 1;
  
  // Verificar si el slug ya existe y generar variaciones si es necesario
  while (await slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

/**
 * Verifica si un slug ya existe en la base de datos
 * @param {string} slug - Slug a verificar
 * @returns {Promise<boolean>} - True si existe, false si no
 */
const slugExists = async (slug) => {
  const existing = await prisma.restaurante.findUnique({
    where: { slug }
  });
  return !!existing;
};

/**
 * Valida que un slug tenga el formato correcto
 * @param {string} slug - Slug a validar
 * @returns {boolean} - True si es válido, false si no
 */
const validateSlug = (slug) => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50;
};

module.exports = {
  textToSlug,
  generateUniqueSlug,
  slugExists,
  validateSlug
}; 