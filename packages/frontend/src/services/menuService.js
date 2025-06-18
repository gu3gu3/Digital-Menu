import apiRequest from './api';

class MenuService {
  // Obtener menú público por slug
  async getPublicMenu(slug) {
    const data = await apiRequest(`/public/menu/${slug}`);
    return data.data;
  }

  // Crear o reanudar sesión de mesa
  async createOrResumeSession(restauranteSlug, mesaNumero) {
    const data = await apiRequest('/sessions', 'POST', { restauranteSlug, mesaNumero });
    return data.data.sesion;
  }

  // Actualizar sesión con información del cliente
  async updateSession(sesionId, sessionData) {
    const data = await apiRequest(`/sessions/${sesionId}`, 'PUT', sessionData);
    return data.data.sesion;
  }

  // Obtener información de sesión por token
  async getSession(sessionToken) {
    const data = await apiRequest(`/sessions/${sessionToken}`);
    return data.data.sesion;
  }

  // Obtener carrito
  async getCart(sesionId) {
    const data = await apiRequest(`/cart/${sesionId}`);
    return data.data;
  }

  // Agregar producto al carrito
  async addToCart(sesionId, productoId, cantidad) {
    const data = await apiRequest(`/cart/${sesionId}/add`, 'POST', { productoId, cantidad });
    return data.data;
  }

  // Actualizar item del carrito
  async updateCartItem(sesionId, itemId, cantidad) {
    const data = await apiRequest(`/cart/${sesionId}/item/${itemId}`, 'PUT', { cantidad });
    return data.data;
  }

  // Eliminar item del carrito
  async removeFromCart(sessionToken, itemId) {
    const data = await apiRequest(`/cart/${sessionToken}/item/${itemId}`, 'DELETE');
    return data.data;
  }

  // Vaciar carrito
  async clearCart(sessionToken) {
    const data = await apiRequest(`/cart/${sessionToken}/clear`, 'DELETE');
    return data.data;
  }

  // Confirmar pedido
  async confirmOrder(sesionId, orderDetails) {
    const data = await apiRequest(`/cart/${sesionId}/confirm`, 'POST', orderDetails);
    return data.data;
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
    const data = await apiRequest(`/sessions/${sessionToken}/close`, 'POST');
    return data.data;
  }

  async getOrder(orderId) {
    const data = await apiRequest(`/orders/${orderId}`);
    return data.data;
  }

  async getOrderStatus(orderId) {
    const data = await apiRequest(`/public/orden/${orderId}`);
    return data.data;
  }

  async callWaiter(orderId) {
    return apiRequest(`/orders/${orderId}/call`, 'POST');
  }
}

export default new MenuService(); 