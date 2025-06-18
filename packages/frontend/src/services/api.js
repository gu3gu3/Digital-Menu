import API_BASE_URL from '../config/api';

const apiRequest = async (path, method = 'GET', body = null, options = {}) => {
  const url = `${API_BASE_URL}/api${path}`;
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido en la API' }));
      throw new Error(errorData.message || `Error en la petición: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error en la petición a la API: ${error.message}`);
    throw error;
  }
};

export default apiRequest; 