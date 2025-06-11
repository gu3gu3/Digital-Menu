const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class SessionsService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add admin auth token
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Sessions API Request failed:', error);
      throw error;
    }
  }

  // Get all active sessions for the restaurant
  async getActiveSessions() {
    return this.makeRequest('/sessions/restaurant/all');
  }

  // Get session statistics
  async getSessionStats() {
    return this.makeRequest('/sessions/restaurant/stats');
  }

  // Get session by token (for admin viewing)
  async getSession(sessionToken) {
    return this.makeRequest(`/sessions/${sessionToken}`);
  }

  // Close a session (admin action)
  async closeSession(sessionToken, notas = '') {
    return this.makeRequest(`/sessions/${sessionToken}/close`, {
      method: 'POST',
      body: JSON.stringify({ notas }),
    });
  }

  // Get sessions by mesa
  async getSessionsByMesa(mesaId) {
    return this.makeRequest(`/sessions/mesa/${mesaId}`);
  }

  // Get session history
  async getSessionHistory(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.estado) queryParams.append('estado', filters.estado);
    if (filters.mesaId) queryParams.append('mesaId', filters.mesaId);
    if (filters.fecha) queryParams.append('fecha', filters.fecha);

    const query = queryParams.toString();
    const endpoint = query ? `/sessions/history?${query}` : '/sessions/history';
    
    return this.makeRequest(endpoint);
  }
}

export default new SessionsService(); 