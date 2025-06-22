import apiClient from '../lib/apiClient.js';

class MenuService {
  // Obtener menú público por slug
  async getPublicMenu(slug) {
    const response = await apiClient.get(`/public/menu/${slug}`);
    return response.data.data;
  }

  // Crear o reanudar sesión de mesa
  async createOrResumeSession(restauranteSlug, mesaNumero) {
    const response = await apiClient.post('/sessions', { restauranteSlug, mesaNumero });
    return response.data.data.sesion;
  }

  // Actualizar sesión con información del cliente
  async updateSession(sesionId, sessionData) {
    const response = await apiClient.put(`/sessions/${sesionId}`, sessionData);
    return response.data.data.sesion;
  }

  // Obtener información de sesión por token
  async getSession(sessionToken) {
    const response = await apiClient.get(`/sessions/${sessionToken}`);
    return response.data.data.sesion;
  }

  // Obtener carrito
  async getCart(sesionId) {
    const response = await apiClient.get(`/cart/${sesionId}`);
    return response.data.data;
  }

  // Agregar producto al carrito
  async addToCart(sesionId, productoId, cantidad) {
    const response = await apiClient.post(`/cart/${sesionId}/add`, { productoId, cantidad });
    return response.data.data;
  }

  // Actualizar item del carrito
  async updateCartItem(sesionId, itemId, cantidad) {
    const response = await apiClient.put(`/cart/${sesionId}/item/${itemId}`, { cantidad });
    return response.data.data;
  }

  // Eliminar item del carrito
  async removeFromCart(sessionToken, itemId) {
    const response = await apiClient.delete(`/cart/${sessionToken}/item/${itemId}`);
    return response.data.data;
  }

  // Vaciar carrito
  async clearCart(sessionToken) {
    const response = await apiClient.delete(`/cart/${sessionToken}/clear`);
    return response.data.data;
  }

  // Confirmar pedido
  async confirmOrder(sesionId, orderDetails) {
    const response = await apiClient.post(`/cart/${sesionId}/confirm`, orderDetails);
    return response.data.data;
  }

  // Actualizar carrito de sesión (para sincronización con estado local)
  async updateSessionCart(sessionToken, cartItems) {
    // Esta función maneja la sincronización del carrito con el backend
    // Por ahora, podemos usar clearCart y luego agregar items uno por uno
    await this.clearCart(sessionToken);
    
    for (const item of cartItems) {
      await this.addToCart(sessionToken, item.productoId, item.cantidad);
    }
    
    return { success: true, cartItems };
  }

  // Cerrar sesión
  async closeSession(sessionToken) {
    const response = await apiClient.post(`/sessions/${sessionToken}/close`);
    return response.data.data;
  }

  async getOrder(orderId) {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data.data;
  }

  async getOrderStatus(orderId) {
    const response = await apiClient.get(`/public/orden/${orderId}`);
    return response.data.data;
  }

  async callWaiter(orderId) {
    const response = await apiClient.post(`/orders/${orderId}/call`);
    return response.data;
  }
}

export default new MenuService(); 