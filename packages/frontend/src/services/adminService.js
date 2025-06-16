import apiRequest from './api';

const adminService = {
    // Categories
    getCategories: () => apiRequest('/categories'),
    createCategory: (data) => apiRequest('/categories', 'POST', data),
    updateCategory: (id, data) => apiRequest(`/categories/${id}`, 'PUT', data),
    deleteCategory: (id) => apiRequest(`/categories/${id}`, 'DELETE'),

    // Products
    getProducts: (categoryId = null) => {
        const path = categoryId ? `/products?categoriaId=${categoryId}` : '/products';
        return apiRequest(path);
    },
    createProduct: (data) => apiRequest('/products', 'POST', data, true),
    updateProduct: (id, data) => apiRequest(`/products/${id}`, 'PUT', data, true),
    deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),
    toggleProductAvailability: (id) => apiRequest(`/products/${id}/toggle-availability`, 'PATCH'),

    // Menu Import/Export
    exportMenu: () => apiRequest('/menu/export', 'GET', null, false, 'blob'),
    importMenu: (data) => apiRequest('/menu/import', 'POST', data, true),

    // Dashboard
    getDashboardStats: () => apiRequest('/admin/stats'),
    getRecentOrders: (limit = 5) => apiRequest(`/orders?limit=${limit}`),
};

export default adminService; 