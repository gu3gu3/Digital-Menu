import axios from 'axios';

const adminApi = axios.create({
  baseURL: '/api',
});

adminApi.interceptors.request.use(
  (config) => {
    // Intentar obtener el token de Super Admin primero
    let token = localStorage.getItem('superAdminToken');
    
    // Si no hay token de Super Admin, intentar con el de Admin
    if (!token) {
      token = localStorage.getItem('adminToken');
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

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar ambos tokens y usuarios en caso de desautorización
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminUser');
      // Potentially redirect to login, or let the component handle it.
      // window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi; 