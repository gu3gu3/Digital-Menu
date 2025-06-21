import { API_ENDPOINTS } from '../config/api';

class RestaurantService {
  async getMyRestaurant() {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.RESTAURANT_ME, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo información del restaurante');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getMyRestaurant:', error);
      throw error;
    }
  }

  async updateMyRestaurant(restaurantData) {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.RESTAURANT_ME, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(restaurantData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando restaurante');
      }

      return data.data;
    } catch (error) {
      console.error('Error en updateMyRestaurant:', error);
      throw error;
    }
  }

  async getSupportedCurrencies() {
    try {
      const response = await fetch(`${API_ENDPOINTS.RESTAURANT_ME.replace('/me', '/currencies')}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo monedas soportadas');
      }

      return data.data;
    } catch (error) {
      console.error('Error en getSupportedCurrencies:', error);
      throw error;
    }
  }

  async uploadRestaurantFiles(formData) {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(API_ENDPOINTS.RESTAURANT_UPDATE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // No agregar Content-Type para multipart/form-data
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error subiendo archivos');
      }

      return data.data;
    } catch (error) {
      console.error('Error en uploadRestaurantFiles:', error);
      throw error;
    }
  }

  async deleteImage(imageType) {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_ENDPOINTS.RESTAURANT_ME.replace('/me', '/image')}/${imageType}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error al eliminar la imagen de ${imageType}`);
    }
    return data.data;
  }
}

export default new RestaurantService(); 