import adminApi from '../lib/adminApi';

class RestaurantService {
  async getMyRestaurant() {
    // El interceptor de adminApi se encarga del token
    const response = await adminApi.get('/restaurants/me');
    return response.data.data; // Devolver directamente los datos del restaurante
  }

  async updateMyRestaurant(restaurantData) {
    const response = await adminApi.put('/restaurants/me', restaurantData);
    return response.data;
  }

  async getSupportedCurrencies() {
    const response = await adminApi.get('/restaurants/currencies');
    return response.data.data;
  }

  async uploadRestaurantFiles(formData) {
    // axios (usado por adminApi) maneja FormData y los headers correctos
    const response = await adminApi.put('/restaurants/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async deleteImage(imageType) {
    const response = await adminApi.delete(`/restaurants/image/${imageType}`);
    return response.data;
  }
}

export default new RestaurantService(); 