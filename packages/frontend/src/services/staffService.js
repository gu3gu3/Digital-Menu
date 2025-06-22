import apiClient from '../lib/apiClient.js';

const staffService = {
  // Get all meseros
  getMeseros: async (params = {}) => {
    const response = await apiClient.get('/staff/meseros', { params });
    return response.data;
  },

  // Get single mesero
  getMesero: async (id) => {
    const response = await apiClient.get(`/staff/meseros/${id}`);
    return response.data;
  },

  // Create new mesero
  createMesero: async (meseroData) => {
    const response = await apiClient.post('/staff/meseros', meseroData);
    return response.data;
  },

  // Update mesero
  updateMesero: async (id, meseroData) => {
    const response = await apiClient.put(`/staff/meseros/${id}`, meseroData);
    return response.data;
  },

  // Delete mesero
  deleteMesero: async (id) => {
    const response = await apiClient.delete(`/staff/meseros/${id}`);
    return response.data;
  },

  // Get staff statistics
  getStaffStats: async (params = {}) => {
    const response = await apiClient.get('/staff/stats', { params });
    return response.data;
  }
};

export default staffService; 