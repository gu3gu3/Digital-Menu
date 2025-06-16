import API_BASE_URL from '../config/api';

class OrdersService {
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

    // Add auth token (admin or staff)
    const adminToken = localStorage.getItem('adminToken');
    const staffToken = localStorage.getItem('staffToken');
    const token = adminToken || staffToken;
    
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
      console.error('Orders API Request failed:', error);
      throw error;
    }
  }

  // Get all orders for the restaurant
  async getOrders(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.estado) queryParams.append('estado', filters.estado);
    if (filters.mesaId) queryParams.append('mesaId', filters.mesaId);
    if (filters.fecha) queryParams.append('fecha', filters.fecha);
    if (filters.search) queryParams.append('search', filters.search);

    const query = queryParams.toString();
    const endpoint = query ? `/orders?${query}` : '/orders';
    
    return this.makeRequest(endpoint);
  }

  // Get a specific order by ID
  async getOrder(orderId) {
    return this.makeRequest(`/orders/${orderId}`);
  }

  // Update order status
  async updateOrderStatus(orderId, status, notas = '') {
    return this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notas }),
    });
  }

  // Assign mesero to order (admin)
  async assignMeseroToOrder(orderId, meseroId) {
    return this.makeRequest(`/orders/${orderId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ meseroId }),
    });
  }

  // Take order (mesero only)
  async takeOrder(orderId) {
    return this.makeRequest(`/orders/${orderId}/take`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  // Get order statistics
  async getOrderStats(period = 'today') {
    return this.makeRequest(`/orders/stats?period=${period}`);
  }

  // Get orders by mesa
  async getOrdersByMesa(mesaId) {
    return this.makeRequest(`/orders/mesa/${mesaId}`);
  }

  // Get recent orders
  async getRecentOrders(limit = 10) {
    return this.makeRequest(`/orders/recent?limit=${limit}`);
  }

  // Get orders by status
  async getOrdersByStatus(status) {
    return this.makeRequest(`/orders/status/${status}`);
  }

  // Get orders by date range
  async getOrdersByDateRange(startDate, endDate) {
    const queryParams = new URLSearchParams({
      start: startDate,
      end: endDate
    });
    return this.makeRequest(`/orders/date-range?${queryParams.toString()}`);
  }

  // Delete order (admin only)
  async deleteOrder(orderId) {
    return this.makeRequest(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // Export orders to CSV
  async exportOrders(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const endpoint = `/orders/export?${queryParams.toString()}`;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error exporting orders');
    }

    return response.blob();
  }

  // Get order totals by period
  async getOrderTotals(period = 'today') {
    return this.makeRequest(`/orders/totals?period=${period}`);
  }
}

export default new OrdersService(); 