import { API_ENDPOINTS } from '../config/api'

class MenuService {
  // Obtener menú público por slug
  async getPublicMenu(slug) {
    try {
      const response = await fetch(API_ENDPOINTS.PUBLIC_MENU(slug))
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo menú')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en getPublicMenu:', error)
      throw error
    }
  }

  // Crear o reanudar sesión de mesa
  async createOrResumeSession(restauranteSlug, mesaNumero, clienteInfo = {}) {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mesaNumero,
          restauranteSlug,
          numeroPersonas: clienteInfo.numeroPersonas || 1,
          clienteNombre: clienteInfo.nombre || undefined,
          clienteTelefono: clienteInfo.telefono || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error creando sesión')
      }

      return data.data.sesion  // Mantener esto pero usar .id en el frontend
    } catch (error) {
      console.error('Error en createOrResumeSession:', error)
      throw error
    }
  }

  // Obtener información de sesión por token
  async getSession(sessionToken) {
    try {
      const response = await fetch(`/api/sessions/${sessionToken}`)
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
  async getCart(sessionToken) {
    try {
      const response = await fetch(`/api/cart/${sessionToken}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo carrito')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en getCart:', error)
      throw error
    }
  }

  // Agregar producto al carrito
  async addToCart(sessionToken, productoId, cantidad = 1, notas = '') {
    try {
      const response = await fetch(`/api/cart/${sessionToken}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productoId,
          cantidad,
          notas
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error agregando producto al carrito')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en addToCart:', error)
      throw error
    }
  }

  // Actualizar item del carrito
  async updateCartItem(sessionToken, itemId, cantidad, notas = undefined) {
    try {
      const response = await fetch(`/api/cart/${sessionToken}/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cantidad: Math.max(0, cantidad),
          ...(notas !== undefined && { notas })
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando carrito')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en updateCartItem:', error)
      throw error
    }
  }

  // Eliminar item del carrito
  async removeFromCart(sessionToken, itemId) {
    try {
      const response = await fetch(`/api/cart/${sessionToken}/item/${itemId}`, {
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
      const response = await fetch(`/api/cart/${sessionToken}/clear`, {
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
  async confirmOrder(sessionToken, orderData = {}) {
    try {
      const response = await fetch(`/api/cart/${sessionToken}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreClienteFactura: orderData.nombreCliente || undefined,
          notas: orderData.notas || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error confirmando pedido')
      }
      
      return data.data
    } catch (error) {
      console.error('Error en confirmOrder:', error)
      throw error
    }
  }

  // Actualizar carrito de sesión (para sincronización con estado local)
  async updateSessionCart(sessionToken, cartItems) {
    try {
      // Esta función maneja la sincronización del carrito con el backend
      // Por ahora, podemos usar clearCart y luego agregar items uno por uno
      await this.clearCart(sessionToken)
      
      for (const item of cartItems) {
        await this.addToCart(sessionToken, item.productoId, item.cantidad, item.notas || '')
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
      const response = await fetch(`/api/sessions/${sessionToken}/close`, {
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
}

export default new MenuService() 