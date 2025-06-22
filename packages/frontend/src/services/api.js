// Token management following project pattern
const TOKEN_KEYS = {
  auth: 'authToken',
  admin: 'adminToken', 
  staff: 'staffToken'
};

class ApiClient {
  constructor() {
    // Following project pattern - use '/api' directly like adminApi.js
    this.baseURL = '/api';
  }

  // Get token for specific user type
  getToken(userType = 'auth') {
    return localStorage.getItem(TOKEN_KEYS[userType] || TOKEN_KEYS.auth);
  }

  // Save token for specific user type
  saveToken(token, userType = 'auth') {
    localStorage.setItem(TOKEN_KEYS[userType] || TOKEN_KEYS.auth, token);
  }

  // Remove token for specific user type
  removeToken(userType = 'auth') {
    localStorage.removeItem(TOKEN_KEYS[userType] || TOKEN_KEYS.auth);
  }

  // Clear all tokens
  clearAllTokens() {
    Object.values(TOKEN_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Check if user is authenticated
  isAuthenticated(userType = 'auth') {
    return !!this.getToken(userType);
  }

  // Base request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    const token = this.getToken(options.userType);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth specific methods
  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async logout() {
    // Just clear tokens - no server call needed for JWT
    return { success: true };
  }

  async getMe(userType = 'auth') {
    return this.get('/auth/me', { userType });
  }

  async verifyEmail(token) {
    return this.post('/auth/verify-email', { token });
  }

  async resendVerification() {
    return this.post('/auth/resend-verification');
  }
}

// Create singleton instance
const api = new ApiClient();

// Also export the original apiRequest function for backward compatibility
export const apiRequest = async (path, method = 'GET', body = null, options = {}) => {
  const url = `/api${path}`;
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
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `Error en la petición: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error en la petición a la API: ${error.message}`);
    throw error;
  }
};

export default api; 