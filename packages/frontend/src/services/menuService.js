import API_BASE_URL from '../config/api'

class MenuService {
  // Obtener menú público por slug
  async getPublicMenu(slug) {
    const response = await fetch(`${API_BASE_URL}/api/public/menu/${slug}`);
    if (!response.ok) throw new Error('Error obteniendo menú');
    const data = await response.json();
    return data.data;
  }

  // Crear o reanudar sesión de mesa
  async createOrResumeSession(restauranteSlug, mesaNumero) {
    const response = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restauranteSlug, mesaNumero }),
    });
    if (!response.ok) throw new Error('Error creando sesión');
    const data = await response.json();
    return data.data.sesion;
  }

  // Actualizar sesión con información del cliente
  async updateSession(sesionId, sessionData) {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sesionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    if (!response.ok) throw new Error('Error actualizando sesión');
    const data = await response.json();
    return data.data.sesion;
  }

  // Obtener información de sesión por token
  async getSession(sessionToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionToken}`)
      if (!response.ok) {
        throw new Error('La sesión no fue encontrada o es inválida.');
      }
      return await response.json()
    } catch (error) {
      console.error("Error al obtener la sesión:", error);
      throw error
    }
  }

  // Obtener carrito
  async getCart(sesionId) {
    const response = await fetch(`${API_BASE_URL}/api/cart/${sesionId}`);
    if (!response.ok) throw new Error('Error obteniendo carrito');
    const data = await response.json();
    return data.data;
  }

  // Agregar producto al carrito
  async addToCart(sesionId, productoId, cantidad) {
    const response = await fetch(`${API_BASE_URL}/api/cart/${sesionId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId, cantidad }),
    });
    if (!response.ok) throw new Error('Error agregando al carrito');
    const data = await response.json();
    return data.data;
  }

  // Actualizar item del carrito
  async updateCartItem(sesionId, itemId, cantidad) {
    const response = await fetch(`${API_BASE_URL}/api/cart/${sesionId}/item/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad }),
    });
    if (!response.ok) throw new Error('Error actualizando ítem');
    const data = await response.json();
    return data.data;
  }

  // Eliminar item del carrito
  async removeFromCart(sessionToken, itemId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${sessionToken}/item/${itemId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Error eliminando item del carrito');
      return await response.json()
    } catch (error) {
      console.error('Error en removeFromCart:', error)
      throw error
    }
  }

  // Vaciar carrito
  async clearCart(sessionToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${sessionToken}/clear`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Error vaciando el carrito');
      return await response.json()
    } catch (error) {
      console.error('Error en clearCart:', error)
      throw error
    }
  }

  // Confirmar pedido
  async confirmOrder(sesionId, orderDetails) {
    const response = await fetch(`${API_BASE_URL}/api/cart/${sesionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderDetails),
    });
    if (!response.ok) throw new Error('Error confirmando la orden');
    const data = await response.json();
    return data.data;
  }

  // Actualizar carrito de sesión (para sincronización con estado local)
  async updateSessionCart(sessionToken, cartItems) {
    try {
      // Esta función maneja la sincronización del carrito con el backend
      // Por ahora, podemos usar clearCart y luego agregar items uno por uno
      await this.clearCart(sessionToken)
      
      for (const item of cartItems) {
        await this.addToCart(sessionToken, item.productoId, item.cantidad)
      }
      
      return await this.getCart(sessionToken)
    } catch (error) {
      console.error('Error al actualizar el carrito de la sesión:', error)
      throw error
    }
  }

  // Cerrar sesión
  async closeSession(sessionToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionToken}/close`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Error al cerrar la sesión');
      return await response.json()
    } catch (error) {
      console.error('Error al cerrar la sesión:', error)
      throw error
    }
  }

  async getOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
    if (!response.ok) throw new Error('Error obteniendo la orden');
    const data = await response.json();
    return data.data;
  }

  async getOrderStatus(orderId) {
    const response = await fetch(`${API_BASE_URL}/api/public/orden/${orderId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obteniendo estado de la orden');
    }
    const data = await response.json();
    return data.data;
  }

  async callWaiter(orderId) {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/call`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Error al llamar al mesero');
    const data = await response.json();
    return data;
  }
}

export default new MenuService() 