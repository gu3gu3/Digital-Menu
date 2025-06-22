import apiRequest from './api';

const staffService = {
  // Get all meseros
  getMeseros: async (params = {}) => {
    const token = localStorage.getItem('adminToken');
    const queryString = new URLSearchParams(params).toString();
    const path = queryString ? `/staff/meseros?${queryString}` : '/staff/meseros';
    return apiRequest(path, 'GET', null, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // Get single mesero
  getMesero: async (id) => {
    const token = localStorage.getItem('adminToken');
    return apiRequest(`/staff/meseros/${id}`, 'GET', null, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // Create new mesero
  createMesero: async (meseroData) => {
    const token = localStorage.getItem('adminToken');
    return apiRequest('/staff/meseros', 'POST', meseroData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // Update mesero
  updateMesero: async (id, meseroData) => {
    const token = localStorage.getItem('adminToken');
    return apiRequest(`/staff/meseros/${id}`, 'PUT', meseroData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // Delete mesero
  deleteMesero: async (id) => {
    const token = localStorage.getItem('adminToken');
    return apiRequest(`/staff/meseros/${id}`, 'DELETE', null, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // Get staff statistics
  getStaffStats: async (params = {}) => {
    const token = localStorage.getItem('adminToken');
    const queryString = new URLSearchParams(params).toString();
    const path = queryString ? `/staff/stats?${queryString}` : '/staff/stats';
    return apiRequest(path, 'GET', null, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
};

export default staffService; 