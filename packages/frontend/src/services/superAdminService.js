import adminApi from '../lib/adminApi';

// ==================== AUTENTICACIÓN ====================

export const superAdminAuth = {
  // Login
  async login(credentials) {
    try {
      const response = await adminApi.post('/super-admin/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('superAdminToken', token);
        localStorage.setItem('superAdminUser', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Logout
  async logout() {
    try {
      await adminApi.post('/super-admin/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminUser');
    }
  },

  // Obtener perfil actual
  async getProfile() {
    try {
      const response = await adminApi.get('/super-admin/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Verificar si está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('superAdminToken');
    const user = localStorage.getItem('superAdminUser');
    return !!(token && user);
  },

  // Obtener usuario actual
  getCurrentUser() {
    const user = localStorage.getItem('superAdminUser');
    return user ? JSON.parse(user) : null;
  }
};

// ==================== GESTIÓN DE SUSCRIPCIONES ====================

const API_URL = '/super-admin/subscriptions';

export const subscriptionsService = {
  // Obtener todas las suscripciones con filtros
  async getSubscriptions(params = {}) {
    try {
      const response = await adminApi.get(API_URL, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener estadísticas de suscripciones
  async getStats() {
    try {
      const response = await adminApi.get('/super-admin/subscriptions/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener detalles de una suscripción específica
  async getSubscription(id) {
    try {
      const response = await adminApi.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Actualizar suscripción
  async updateSubscription(id, data) {
    try {
      const response = await adminApi.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Procesar pago manual
  async processPayment(id, paymentData) {
    try {
      const response = await adminApi.post(`${API_URL}/${id}/process-payment`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Enviar notificaciones masivas
  async sendNotifications(notificationData) {
    try {
      const response = await adminApi.post('/super-admin/subscriptions/send-notifications', notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener suscripciones próximas a vencer
  async getExpiringSubscriptions(days = 7) {
    try {
      const response = await adminApi.get(API_URL, {
        params: { vencenEn: days }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Buscar suscripciones
  async searchSubscriptions(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      const response = await adminApi.get(API_URL, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener planes disponibles
  async getPlans() {
    try {
      const response = await adminApi.get(`${API_URL}/plans`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Renovar suscripción por X meses
  async renewSubscription(id, renewalData) {
    try {
      const response = await adminApi.post(`${API_URL}/${id}/renew`, renewalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Sincronizar planes de restaurantes con suscripciones
  async syncRestaurantPlans() {
    try {
      const response = await adminApi.post('/super-admin/subscriptions/sync-restaurant-plans');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // ==================== GESTIÓN DE PLANES ====================

  // Obtener todos los planes para administración
  async getAllPlans() {
    try {
      const response = await adminApi.get('/super-admin/subscriptions/plans/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear nuevo plan
  async createPlan(planData) {
    try {
      const response = await adminApi.post('/super-admin/subscriptions/plans', planData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Actualizar plan existente
  async updatePlan(id, planData) {
    try {
      const response = await adminApi.put(`/super-admin/subscriptions/plans/${id}`, planData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Eliminar plan
  async deletePlan(id) {
    try {
      const response = await adminApi.delete(`/super-admin/subscriptions/plans/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Activar/Desactivar plan
  async togglePlan(id) {
    try {
      const response = await adminApi.post(`/super-admin/subscriptions/plans/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener estadísticas de uso de un plan
  async getPlanUsage(id) {
    try {
      const response = await adminApi.get(`/super-admin/subscriptions/plans/${id}/usage`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }
};

// ==================== UTILIDADES ====================

export const superAdminUtils = {
  // Formatear fecha
  formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Formatear moneda
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Obtener color del estado
  getStatusColor(status) {
    const colors = {
      ACTIVA: 'green',
      VENCIDA: 'orange',
      SUSPENDIDA: 'red',
      CANCELADA: 'gray',
      BLOQUEADA: 'red'
    };
    return colors[status] || 'gray';
  },

  // Obtener texto del estado
  getStatusText(status) {
    const texts = {
      ACTIVA: 'Activa',
      VENCIDA: 'Vencida',
      SUSPENDIDA: 'Suspendida',
      CANCELADA: 'Cancelada',
      BLOQUEADA: 'Bloqueada'
    };
    return texts[status] || status;
  },

  // Calcular días hasta vencimiento
  getDaysUntilExpiration(expirationDate) {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  // Verificar si está próximo a vencer
  isExpiringSoon(expirationDate, days = 7) {
    const daysUntil = this.getDaysUntilExpiration(expirationDate);
    return daysUntil <= days && daysUntil >= 0;
  },

  // Verificar si está vencido
  isExpired(expirationDate) {
    return this.getDaysUntilExpiration(expirationDate) < 0;
  }
};

// ==================== SERVICIO PRINCIPAL ====================

export const superAdminService = {
  // Auth methods
  login: superAdminAuth.login.bind(superAdminAuth),
  logout: superAdminAuth.logout.bind(superAdminAuth),
  getProfile: superAdminAuth.getProfile.bind(superAdminAuth),
  isAuthenticated: superAdminAuth.isAuthenticated.bind(superAdminAuth),
  getCurrentUser: superAdminAuth.getCurrentUser.bind(superAdminAuth),

  // Subscriptions methods
  getSubscriptions: subscriptionsService.getSubscriptions.bind(subscriptionsService),
  getStats: subscriptionsService.getStats.bind(subscriptionsService),
  getSubscription: subscriptionsService.getSubscription.bind(subscriptionsService),
  updateSubscription: subscriptionsService.updateSubscription.bind(subscriptionsService),
  processPayment: subscriptionsService.processPayment.bind(subscriptionsService),
  sendNotifications: subscriptionsService.sendNotifications.bind(subscriptionsService),
  getExpiringSubscriptions: subscriptionsService.getExpiringSubscriptions.bind(subscriptionsService),
  searchSubscriptions: subscriptionsService.searchSubscriptions.bind(subscriptionsService),
  getPlans: subscriptionsService.getPlans.bind(subscriptionsService),
  renewSubscription: subscriptionsService.renewSubscription.bind(subscriptionsService),
  syncRestaurantPlans: subscriptionsService.syncRestaurantPlans.bind(subscriptionsService),
  getAllPlans: subscriptionsService.getAllPlans.bind(subscriptionsService),
  createPlan: subscriptionsService.createPlan.bind(subscriptionsService),
  updatePlan: subscriptionsService.updatePlan.bind(subscriptionsService),
  deletePlan: subscriptionsService.deletePlan.bind(subscriptionsService),
  togglePlan: subscriptionsService.togglePlan.bind(subscriptionsService),
  getPlanUsage: subscriptionsService.getPlanUsage.bind(subscriptionsService),

  // Utility methods
  formatDate: superAdminUtils.formatDate.bind(superAdminUtils),
  formatCurrency: superAdminUtils.formatCurrency.bind(superAdminUtils),
  getStatusColor: superAdminUtils.getStatusColor.bind(superAdminUtils),
  getStatusText: superAdminUtils.getStatusText.bind(superAdminUtils),
  getDaysUntilExpiration: superAdminUtils.getDaysUntilExpiration.bind(superAdminUtils),
  isExpiringSoon: superAdminUtils.isExpiringSoon.bind(superAdminUtils),
  isExpired: superAdminUtils.isExpired.bind(superAdminUtils)
};

export default {
  auth: superAdminAuth,
  subscriptions: subscriptionsService,
  utils: superAdminUtils,
  superAdminService
}; 