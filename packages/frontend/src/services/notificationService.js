import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const adminApi = axios.create({
  baseURL: API_URL,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const notificationService = {
  getNotifications: async (limit = 10, offset = 0) => {
    try {
      const response = await adminApi.get(`/notifications?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await adminApi.post(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await adminApi.post('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await adminApi.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  }
}; 