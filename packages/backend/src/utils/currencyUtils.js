/**
 * Utilidades para el manejo de monedas en el sistema
 * Soporta todas las monedas de Centroamérica y USD
 */

// Configuración de monedas soportadas
const CURRENCY_CONFIG = {
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
const getAllCurrencies = () => {
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
const getCurrencyConfig = (currencyCode) => {
  return CURRENCY_CONFIG[currencyCode] || null;
};

/**
 * Formatea un monto según la moneda especificada
 * @param {number|string} amount - Monto a formatear
 * @param {string} currencyCode - Código de la moneda
 * @returns {string} Monto formateado con símbolo de moneda
 */
const formatCurrency = (amount, currencyCode = 'USD') => {
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
const formatCurrencyIntl = (amount, currencyCode = 'USD') => {
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
const isValidCurrency = (currencyCode) => {
  return Object.hasOwnProperty.call(CURRENCY_CONFIG, currencyCode);
};

/**
 * Obtiene el símbolo de una moneda
 * @param {string} currencyCode - Código de la moneda
 * @returns {string} Símbolo de la moneda o '$' por defecto
 */
const getCurrencySymbol = (currencyCode = 'USD') => {
  const config = getCurrencyConfig(currencyCode);
  return config ? config.symbol : '$';
};

/**
 * Obtiene las monedas agrupadas por región
 * @returns {Object} Monedas agrupadas por región
 */
const getCurrenciesByRegion = () => {
  return {
    'América del Norte': ['USD'],
    'Centroamérica': ['NIO', 'CRC', 'HNL', 'GTQ', 'PAB', 'SVC']
  };
};

module.exports = {
  CURRENCY_CONFIG,
  getAllCurrencies,
  getCurrencyConfig,
  formatCurrency,
  formatCurrencyIntl,
  isValidCurrency,
  getCurrencySymbol,
  getCurrenciesByRegion
}; 