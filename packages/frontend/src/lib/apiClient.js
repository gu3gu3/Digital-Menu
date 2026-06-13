import axios from 'axios';

// Cliente API universal para todos los tipos de usuario
// Maneja automáticamente tokens de Super Admin, Admin y Staff
const apiClient = axios.create({
  baseURL: '/api',
});

// Interceptor de request: Añade automáticamente el token de autorización
apiClient.interceptors.request.use(
  (config) => {
    let token = null;
    const path = window.location.pathname;

    // Asignación estricta del token según el área de la aplicación
    // Esto previene el cruce de sesiones (ej. que un Mesero use el token del Admin)
    if (path.startsWith('/super-admin')) {
      token = localStorage.getItem('superAdminToken');
    } else if (path.startsWith('/admin')) {
      token = localStorage.getItem('adminToken');
    } else if (path.startsWith('/staff')) {
      token = localStorage.getItem('staffToken');
    } else if (path.startsWith('/partner')) {
      token = localStorage.getItem('partnerToken');
    } else if (path.startsWith('/sponsor')) {
      token = localStorage.getItem('sponsor_token');
    } else {
      // Fallback para rutas que no están explícitamente en subpaneles (como el public menu)
      token = localStorage.getItem('adminToken') || 
              localStorage.getItem('staffToken') || 
              localStorage.getItem('superAdminToken') ||
              localStorage.getItem('partnerToken') ||
              localStorage.getItem('sponsor_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response: Maneja errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar todos los tokens y usuarios en caso de desautorización
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminUser');
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffUser');
      localStorage.removeItem('sponsor_token');
      localStorage.removeItem('sponsor_user');
      // Los componentes manejarán la redirección según el contexto
    }
    return Promise.reject(error);
  }
);

export default apiClient; 