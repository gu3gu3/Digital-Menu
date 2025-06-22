import apiClient from '../lib/apiClient';

class SessionsService {
  // Get all active sessions for the restaurant
  async getActiveSessions() {
    const response = await apiClient.get('/sessions/restaurant/all');
    return response.data;
  }

  // Get session statistics
  async getSessionStats() {
    const response = await apiClient.get('/sessions/restaurant/stats');
    return response.data;
  }

  // Get session by token (for admin viewing)
  async getSession(sessionToken) {
    const response = await apiClient.get(`/sessions/${sessionToken}`);
    return response.data;
  }

  // Close a session (admin action)
  async closeSession(sessionToken, notas = '') {
    const response = await apiClient.post(`/sessions/${sessionToken}/close`, { notas });
    return response.data;
  }

  // Get sessions by mesa
  async getSessionsByMesa(mesaId) {
    const response = await apiClient.get(`/sessions/mesa/${mesaId}`);
    return response.data;
  }

  // Get session history
  async getSessionHistory(filters = {}) {
    const response = await apiClient.get('/sessions/history', { params: filters });
    return response.data;
  }
}

export default new SessionsService(); 