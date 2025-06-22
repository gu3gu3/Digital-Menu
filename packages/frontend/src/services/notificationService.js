import apiClient from '../lib/apiClient';

export const notificationService = {
  getNotifications: async (limit = 10, offset = 0) => {
    try {
      const response = await apiClient.get('/notifications', { params: { limit, offset } });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.post(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.post('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error.response?.data || { message: 'Error en el servidor' };
    }
  }
}; 