import { API_ENDPOINTS } from '../config/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }
  return data;
};

const staffService = {
  // Get all meseros
  getMeseros: async (params = {}) => {
    const token = localStorage.getItem('adminToken');
    const baseUrl = `${API_ENDPOINTS.STAFF}/meseros`;
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  // Get single mesero
  getMesero: async (id) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_ENDPOINTS.STAFF}/meseros/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  // Create new mesero
  createMesero: async (meseroData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_ENDPOINTS.STAFF}/meseros`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(meseroData)
    });
    return handleResponse(response);
  },

  // Update mesero
  updateMesero: async (id, meseroData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_ENDPOINTS.STAFF}/meseros/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(meseroData)
    });
    return handleResponse(response);
  },

  // Delete mesero
  deleteMesero: async (id) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_ENDPOINTS.STAFF}/meseros/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  // Get staff statistics
  getStaffStats: async (params = {}) => {
    const token = localStorage.getItem('adminToken');
    const baseUrl = `${API_ENDPOINTS.STAFF}/stats`;
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  }
};

export default staffService; 