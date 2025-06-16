import API_BASE_URL from '../config/api';

const apiRequest = async (path, method = 'GET', body = null, isFormData = false, responseType = 'json') => {
    const token = localStorage.getItem('adminToken');
    const headers = {};

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };
    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api${path}`, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error en la petición a la API' }));
            throw new Error(errorData.message);
        }

        if (responseType === 'blob') {
            return response.blob();
        }
        
        return response.json();
    } catch (error) {
        console.error(`API request failed: ${error.message}`);
        throw error;
    }
};

export default apiRequest; 