import axios from 'axios';

// Cliente API universal para todos los tipos de usuario
// Maneja automáticamente tokens de Super Admin, Admin y Staff
const apiClient = axios.create({
  baseURL: '/api',
});

// Interceptor de request: Añade automáticamente el token de autorización
apiClient.interceptors.request.use(
  (config) => {
    // Buscar token en orden de prioridad: SuperAdmin > Admin > Staff
    let token = localStorage.getItem('superAdminToken');
    
    if (!token) {
      token = localStorage.getItem('adminToken');
    }

    if (!token) {
      token = localStorage.getItem('staffToken');
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
      // Los componentes manejarán la redirección según el contexto
    }
    return Promise.reject(error);
  }
);

export default apiClient; 