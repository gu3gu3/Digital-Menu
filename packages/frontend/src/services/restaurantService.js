import apiClient from '../lib/apiClient';

class RestaurantService {
  async getMyRestaurant() {
    // El interceptor de apiClient se encarga del token
    const response = await apiClient.get('/restaurants/me');
    return response.data.data; // Devolver directamente los datos del restaurante
  }

  async updateMyRestaurant(restaurantData) {
    const response = await apiClient.put('/restaurants/me', restaurantData);
    return response.data;
  }

  async getSupportedCurrencies() {
    const response = await apiClient.get('/restaurants/currencies');
    return response.data.data;
  }

  async uploadRestaurantFiles(formData) {
    // axios (usado por apiClient) maneja FormData y los headers correctos
    const response = await apiClient.put('/restaurants/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async deleteImage(imageType) {
    const response = await apiClient.delete(`/restaurants/image/${imageType}`);
    return response.data;
  }
}

export default new RestaurantService(); 