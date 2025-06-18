import axios from 'axios';
import API_BASE_URL from '../config/api';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
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
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Potentially redirect to login, or let the component handle it.
      // window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi; 