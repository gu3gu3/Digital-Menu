import api from './api';

const staffService = {
  // Get all meseros
  getMeseros: async (params = {}) => {
    const response = await api.get('/staff/meseros', { params });
    return response;
  },

  // Get single mesero
  getMesero: async (id) => {
    const response = await api.get(`/staff/meseros/${id}`);
    return response;
  },

  // Create new mesero
  createMesero: async (meseroData) => {
    const response = await api.post('/staff/meseros', meseroData);
    return response;
  },

  // Update mesero
  updateMesero: async (id, meseroData) => {
    const response = await api.put(`/staff/meseros/${id}`, meseroData);
    return response;
  },

  // Delete mesero
  deleteMesero: async (id) => {
    const response = await api.delete(`/staff/meseros/${id}`);
    return response;
  },

  // Get staff statistics
  getStaffStats: async (params = {}) => {
    const response = await api.get('/staff/stats', { params });
    return response;
  }
};

export default staffService; 