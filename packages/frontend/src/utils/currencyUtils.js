/**
 * Utilidades para el manejo de monedas en el frontend
 * Sincronizado con packages/backend/src/utils/currencyUtils.js
 */

// Configuración de monedas soportadas
export const CURRENCY_CONFIG = {
  USD: {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: '$',
    country: 'Estados Unidos',
    locale: 'en-US',
    decimals: 2
  },
  NIO: {
    code: 'NIO',
    name: 'Córdoba Nicaragüense',
    symbol: 'C$',
    country: 'Nicaragua',
    locale: 'es-NI',
    decimals: 2
  },
  CRC: {
    code: 'CRC',
    name: 'Colón Costarricense',
    symbol: '₡',
    country: 'Costa Rica',
    locale: 'es-CR',
    decimals: 0 // Los colones no usan decimales típicamente
  },
  HNL: {
    code: 'HNL',
    name: 'Lempira Hondureña',
    symbol: 'L',
    country: 'Honduras',
    locale: 'es-HN',
    decimals: 2
  },
  GTQ: {
    code: 'GTQ',
    name: 'Quetzal Guatemalteco',
    symbol: 'Q',
    country: 'Guatemala',
    locale: 'es-GT',
    decimals: 2
  },
  PAB: {
    code: 'PAB',
    name: 'Balboa Panameña',
    symbol: 'B/.',
    country: 'Panamá',
    locale: 'es-PA',
    decimals: 2
  },
  SVC: {
    code: 'SVC',
    name: 'Colón Salvadoreño',
    symbol: '₡',
    country: 'El Salvador',
    locale: 'es-SV',
    decimals: 2
  }
};

/**
 * Obtiene la lista de todas las monedas soportadas
 * @returns {Array} Array de objetos con información de monedas
 */
export const getAllCurrencies = () => {
  return Object.keys(CURRENCY_CONFIG).map(code => ({
    code,
    ...CURRENCY_CONFIG[code]
  }));
};

/**
 * Obtiene la configuración de una moneda específica
 * @param {string} currencyCode - Código de la moneda (USD, NIO, etc.)
 * @returns {Object|null} Configuración de la moneda o null si no existe
 */
export const getCurrencyConfig = (currencyCode) => {
  return CURRENCY_CONFIG[currencyCode] || null;
};

/**
 * Formatea un monto según la moneda especificada
 * @param {number|string} amount - Monto a formatear
 * @param {string} currencyCode - Código de la moneda
 * @returns {string} Monto formateado con símbolo de moneda
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  const config = getCurrencyConfig(currencyCode);
  if (!config) {
    console.warn(`Moneda no soportada: ${currencyCode}, usando USD por defecto`);
    return formatCurrency(amount, 'USD');
  }

  const numericAmount = parseFloat(amount) || 0;
  
  // Para CRC (colones costarricenses) no usar decimales
  const formattedAmount = config.decimals === 0 
    ? Math.round(numericAmount).toLocaleString(config.locale)
    : numericAmount.toFixed(config.decimals);

  return `${config.symbol}${formattedAmount}`;
};

/**
 * Formatea un monto usando la API de Intl para mayor precisión
 * @param {number|string} amount - Monto a formatear
 * @param {string} currencyCode - Código de la moneda
 * @returns {string} Monto formateado usando Intl
 */
export const formatCurrencyIntl = (amount, currencyCode = 'USD') => {
  const config = getCurrencyConfig(currencyCode);
  if (!config) {
    return formatCurrencyIntl(amount, 'USD');
  }

  const numericAmount = parseFloat(amount) || 0;

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(numericAmount);
  } catch (error) {
    // Fallback al formato simple si Intl no soporta la moneda
    console.warn(`Error con Intl para ${currencyCode}, usando formato simple:`, error.message);
    return formatCurrency(amount, currencyCode);
  }
};

/**
 * Valida si un código de moneda es soportado
 * @param {string} currencyCode - Código de la moneda a validar
 * @returns {boolean} True si la moneda es soportada
 */
export const isValidCurrency = (currencyCode) => {
  return Object.hasOwnProperty.call(CURRENCY_CONFIG, currencyCode);
};

/**
 * Obtiene el símbolo de una moneda
 * @param {string} currencyCode - Código de la moneda
 * @returns {string} Símbolo de la moneda o '$' por defecto
 */
export const getCurrencySymbol = (currencyCode = 'USD') => {
  const config = getCurrencyConfig(currencyCode);
  return config ? config.symbol : '$';
};

/**
 * Obtiene las monedas agrupadas por región para interfaz de usuario
 * @returns {Object} Monedas agrupadas por región
 */
export const getCurrenciesByRegion = () => {
  return {
    'América del Norte': [
      { code: 'USD', ...CURRENCY_CONFIG.USD }
    ],
    'Centroamérica': [
      { code: 'NIO', ...CURRENCY_CONFIG.NIO },
      { code: 'CRC', ...CURRENCY_CONFIG.CRC },
      { code: 'HNL', ...CURRENCY_CONFIG.HNL },
      { code: 'GTQ', ...CURRENCY_CONFIG.GTQ },
      { code: 'PAB', ...CURRENCY_CONFIG.PAB },
      { code: 'SVC', ...CURRENCY_CONFIG.SVC }
    ]
  };
};

/**
 * Hook personalizado para utilizar formateo de moneda con la moneda del restaurante
 * @param {string} restaurantCurrency - Moneda del restaurante
 * @returns {Function} Función para formatear precios con la moneda correcta
 */
export const useCurrencyFormatter = (restaurantCurrency = 'USD') => {
  return (amount) => formatCurrency(amount, restaurantCurrency);
};

// Funciones de utilidad adicionales para casos específicos

/**
 * Formatea un precio para mostrar en el menú público
 * @param {number|string} amount - Precio a formatear
 * @param {string} currencyCode - Código de la moneda del restaurante
 * @returns {string} Precio formateado para mostrar
 */
export const formatMenuPrice = (amount, currencyCode = 'USD') => {
  return formatCurrency(amount, currencyCode);
};

/**
 * Formatea el total de una orden
 * @param {number|string} amount - Total a formatear
 * @param {string} currencyCode - Código de la moneda del restaurante
 * @returns {string} Total formateado
 */
export const formatOrderTotal = (amount, currencyCode = 'USD') => {
  return formatCurrency(amount, currencyCode);
};

/**
 * Obtiene información de moneda para mostrar en el selector
 * @param {string} currencyCode - Código de la moneda
 * @returns {Object} Información completa de la moneda para UI
 */
export const getCurrencyDisplayInfo = (currencyCode) => {
  const config = getCurrencyConfig(currencyCode);
  if (!config) return null;
  
  return {
    code: currencyCode,
    name: config.name,
    symbol: config.symbol,
    country: config.country,
    displayName: `${config.symbol} ${config.name} (${config.country})`
  };
}; 