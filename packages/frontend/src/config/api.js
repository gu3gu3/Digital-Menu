// Define la URL base para todas las llamadas a la API.
// En desarrollo, Vite usará el proxy configurado en `vite.config.js`.
// En producción, las peticiones serán relativas al dominio actual (ej. /api/...)
// y serán gestionadas por el proxy inverso (Nginx) en Cloud Run.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  ME: `${API_BASE_URL}/api/auth/me`,

  // Restaurant endpoints
  RESTAURANT_ME: `${API_BASE_URL}/api/restaurants/me`,
  RESTAURANT_UPDATE: `${API_BASE_URL}/api/restaurants/update`,

  // Menu endpoints
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  
  // Public endpoints
  PUBLIC_MENU: (slug) => `${API_BASE_URL}/api/public/menu/${slug}`,
  PUBLIC_RESTAURANT: (slug) => `${API_BASE_URL}/api/public/restaurant/${slug}`,
  
  // Admin endpoints
  ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  TABLES: `${API_BASE_URL}/api/tables`,
  SESSIONS: `${API_BASE_URL}/api/sessions`,
  STAFF: `${API_BASE_URL}/api/staff`,

  // Health check
  HEALTH: `${API_BASE_URL}/health`
}

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  return `${API_BASE_URL}${imagePath}`
}

// Helper function for API requests with default headers
export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken')
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  }

  return fetch(url, { ...defaultOptions, ...options })
}

export default API_BASE_URL; 