import apiClient from '../lib/apiClient.js';

class CategoryService {
  // Obtener todas las categorías
  async getCategories() {
    try {
      const response = await apiClient.get('/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }

  // Crear nueva categoría
  async createCategory(categoryData) {
    try {
      const response = await apiClient.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }

  // Actualizar categoría
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }

  // Eliminar categoría
  async deleteCategory(categoryId) {
    try {
      const response = await apiClient.delete(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }

  // Reordenar categorías
  async reorderCategories(categoriesOrder) {
    try {
      const response = await apiClient.put('/categories/reorder', {
        categorias: categoriesOrder
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }

  // Utilidad para convertir array de categorías a formato de reordenamiento
  createReorderData(categories) {
    return categories.map((category, index) => ({
      id: category.id,
      orden: index + 1
    }));
  }

  // Utilidad para validar datos de categoría
  validateCategoryData(data) {
    const errors = [];
    
    if (!data.nombre || data.nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (data.nombre && data.nombre.length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    }
    
    if (data.descripcion && data.descripcion.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new CategoryService(); 