import apiClient from '../lib/apiClient';

const AI_MENU_API_URL = '/super-admin/ai-menu-generator';

export const aiMenuService = {
  // Obtener lista de restaurantes para selección
  async getRestaurants() {
    try {
      const response = await apiClient.get(`${AI_MENU_API_URL}/restaurants`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Generar menú usando IA desde imágenes (máximo 3)
  async generateMenuFromImage(formData) {
    try {
      const response = await apiClient.post(`${AI_MENU_API_URL}/generate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear FormData para generación de menú
  createMenuFormData(restauranteId, files, options = {}) {
    const formData = new FormData();
    
    // Validar y agregar archivos (máximo 3)
    const fileArray = Array.isArray(files) ? files : [files];
    if (fileArray.length > 3) {
      throw new Error('Máximo 3 archivos permitidos');
    }
    
    fileArray.forEach(file => {
      formData.append('menuImages', file);
    });
    
    // Agregar parámetros
    formData.append('restauranteId', restauranteId);
    formData.append('replaceExistingMenu', options.replaceExistingMenu || false);
    formData.append('generateDescriptions', options.generateDescriptions !== false); // true por defecto
    
    if (options.menuType) {
      formData.append('menuType', options.menuType);
    }
    
    if (options.specialCases && options.specialCases.length > 0) {
      formData.append('specialCases', JSON.stringify(options.specialCases));
    }
    
    return formData;
  },

  // Crear múltiples mesas consecutivas
  async createBulkTables(tableData) {
    try {
      const response = await apiClient.post(`${AI_MENU_API_URL}/bulk-tables`, tableData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener prompts actuales
  async getPrompts() {
    try {
      const response = await apiClient.get(`${AI_MENU_API_URL}/prompts`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Generar menú con prompt personalizado
  async generateMenuWithCustomPrompt(formData) {
    try {
      const response = await apiClient.post(`${AI_MENU_API_URL}/generate-with-custom-prompt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear FormData para prompt personalizado
  createCustomPromptFormData(restauranteId, files, customPrompt, options = {}) {
    const formData = new FormData();
    
    // Validar y agregar archivos (máximo 3)
    const fileArray = Array.isArray(files) ? files : [files];
    if (fileArray.length > 3) {
      throw new Error('Máximo 3 archivos permitidos');
    }
    
    fileArray.forEach(file => {
      formData.append('menuImages', file);
    });
    
    // Agregar parámetros
    formData.append('restauranteId', restauranteId);
    formData.append('customPrompt', customPrompt);
    formData.append('replaceExistingMenu', options.replaceExistingMenu || false);
    formData.append('generateDescriptions', options.generateDescriptions !== false); // true por defecto
    
    return formData;
  },

  // Actualizar identidad visual del restaurante
  async updateVisualIdentity(formData) {
    try {
      const response = await apiClient.post(`${AI_MENU_API_URL}/visual-identity`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Actualizar información básica del restaurante
  async updateBasicInfo(restauranteId, data) {
    try {
      const response = await apiClient.put(`${AI_MENU_API_URL}/basic-info`, {
        restauranteId,
        ...data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Funciones utilitarias
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  isValidImageFile(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    return validTypes.includes(file.type);
  },

  isValidFileSize(file, maxSizeMB = 5) {
    return file.size <= maxSizeMB * 1024 * 1024;
  },

  // Validar múltiples archivos
  validateFiles(files) {
    const fileArray = Array.isArray(files) ? files : [files];
    const errors = [];
    
    if (fileArray.length === 0) {
      errors.push('Debe seleccionar al menos un archivo');
    }
    
    if (fileArray.length > 3) {
      errors.push('Máximo 3 archivos permitidos');
    }
    
    fileArray.forEach((file, index) => {
      if (!this.isValidImageFile(file)) {
        errors.push(`Archivo ${index + 1}: Tipo no válido. Solo se permiten PNG, JPG, JPEG y PDF`);
      }
      
      if (!this.isValidFileSize(file)) {
        errors.push(`Archivo ${index + 1}: Demasiado grande. Máximo 5MB`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Tipos de menú disponibles
  getMenuTypes() {
    return [
      { value: 'FAST_FOOD', label: 'Comida Rápida' },
      { value: 'FINE_DINING', label: 'Restaurante Formal' },
      { value: 'PIZZA', label: 'Pizzería' },
      { value: 'CAFE_BAKERY', label: 'Cafetería/Panadería' },
      { value: 'BAR', label: 'Bar/Cantina' }
    ];
  },

  // Casos especiales disponibles
  getSpecialCases() {
    return [
      { value: 'MULTILINGUAL', label: 'Menú en varios idiomas' },
      { value: 'WITH_IMAGES', label: 'Menú con imágenes de productos' },
      { value: 'PROMOTIONS', label: 'Menú con promociones/precios tachados' },
      { value: 'POOR_QUALITY', label: 'Imagen de baja calidad/poco legible' }
    ];
  }
};

export default aiMenuService; 