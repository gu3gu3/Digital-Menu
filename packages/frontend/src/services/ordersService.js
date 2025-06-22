import apiClient from '../lib/apiClient';

class OrdersService {
  // Get all orders for the restaurant
  async getOrders(filters = {}) {
    const response = await apiClient.get('/orders', { params: filters });
    return response.data;
  }

  // Get a specific order by ID
  async getOrder(orderId) {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  }

  // Update order status
  async updateOrderStatus(orderId, status, notas = '') {
    const response = await apiClient.put(`/orders/${orderId}/status`, { status, notas });
    return response.data;
  }

  // Assign mesero to order (admin)
  async assignMeseroToOrder(orderId, meseroId) {
    const response = await apiClient.put(`/orders/${orderId}/assign`, { meseroId });
    return response.data;
  }

  // Take order (mesero only)
  async takeOrder(orderId) {
    const response = await apiClient.put(`/orders/${orderId}/take`, {});
    return response.data;
  }

  // Get order statistics
  async getOrderStats(period = 'today') {
    const response = await apiClient.get('/orders/stats', { params: { period } });
    return response.data;
  }

  // Get orders by mesa
  async getOrdersByMesa(mesaId) {
    const response = await apiClient.get(`/orders/mesa/${mesaId}`);
    return response.data;
  }

  // Get recent orders
  async getRecentOrders(limit = 10) {
    const response = await apiClient.get('/orders/recent', { params: { limit } });
    return response.data;
  }

  // Get orders by status
  async getOrdersByStatus(status) {
    const response = await apiClient.get(`/orders/status/${status}`);
    return response.data;
  }

  // Get orders by date range
  async getOrdersByDateRange(startDate, endDate) {
    const response = await apiClient.get('/orders/date-range', { params: { start: startDate, end: endDate } });
    return response.data;
  }

  // Delete order (admin only)
  async deleteOrder(orderId) {
    const response = await apiClient.delete(`/orders/${orderId}`);
    return response.data;
  }

  // Export orders to CSV
  async exportOrders(filters = {}) {
    const response = await apiClient.get('/orders/export', { 
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  // Get order totals by period
  async getOrderTotals(period = 'today') {
    const response = await apiClient.get(`/orders/totals`, { params: { period } });
    return response.data;
  }
}

export default new OrdersService(); 