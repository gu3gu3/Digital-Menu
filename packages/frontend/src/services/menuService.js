import { API_ENDPOINTS } from '../config/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo sesión')
      }
      
      return data.data.sesion
    } catch (error) {
      console.error('Error en getSession:', error)
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

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error eliminando del carrito')
      }
      
      return data.data
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

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error vaciando carrito')
      }
      
      return data.data
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
      
      return { success: true, cartItems }
    } catch (error) {
      console.error('Error en updateSessionCart:', error)
      throw error
    }
  }

  // Cerrar sesión
  async closeSession(sessionToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionToken}/close`, {
        method: 'POST'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error cerrando sesión')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en closeSession:', error)
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
        const errorData = await response.json().catch(() => ({ error: 'Error obteniendo el estado de la orden' }));
        throw new Error(errorData.error || 'Error obteniendo el estado de la orden');
    }
    const data = await response.json();
    return data.data;
  }

  async callWaiter(orderId) {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/call`, {
      method: 'POST'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error llamando al mesero' }));
        throw new Error(errorData.error || 'Error llamando al mesero');
    }
    const data = await response.json();
    return data;
  }
}

export default new MenuService() 