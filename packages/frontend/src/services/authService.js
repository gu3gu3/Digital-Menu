import apiClient from '../lib/apiClient.js';

// Mapeo de tipos de usuario a nombres de token y usuario en localStorage
const TOKEN_MAPPING = {
  'MESERO': { tokenKey: 'staffToken', userKey: 'staffUser' },
  'STAFF': { tokenKey: 'staffToken', userKey: 'staffUser' },
  'ADMIN': { tokenKey: 'adminToken', userKey: 'adminUser' },
  'ADMINISTRADOR': { tokenKey: 'adminToken', userKey: 'adminUser' },
  'SUPER_ADMIN': { tokenKey: 'superAdminToken', userKey: 'superAdminUser' }
};

const authService = {
  // Login for different user types
  login: async (credentials) => {
    try {
      const { email, password, role } = credentials;
      
      // All roles use the same login endpoint
      const response = await apiClient.post('/auth/login', { email, password, role });
      
      if (response && response.data && response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        // Get token and user keys based on role
        const mapping = TOKEN_MAPPING[role];
        if (mapping) {
          localStorage.setItem(mapping.tokenKey, token);
          localStorage.setItem(mapping.userKey, JSON.stringify(user));
        } else {
          // Fallback for unknown roles
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { data: response.data.data };
      } else {
        return { error: response.data?.error || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { error: error.response?.data?.error || error.message || 'Error al iniciar sesión' };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return { data: response.data };
    } catch (error) {
      console.error('Register error:', error);
      return { error: error.response?.data?.error || error.message || 'Error al registrar usuario' };
    }
  },

  // Logout
  logout: async (userType = 'auth') => {
    try {
      // Clear tokens and user data based on userType
      if (userType === 'staff') {
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffUser');
      } else if (userType === 'admin') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      } else if (userType === 'super') {
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminUser');
      } else {
        // Clear all tokens
        Object.values(TOKEN_MAPPING).forEach(mapping => {
          localStorage.removeItem(mapping.tokenKey);
          localStorage.removeItem(mapping.userKey);
        });
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: error.message || 'Error al cerrar sesión' };
    }
  },

  // Get current user info
  getMe: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return { data: response.data };
    } catch (error) {
      console.error('GetMe error:', error);
      return { error: error.response?.data?.error || error.message || 'Error al obtener información del usuario' };
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      return { data: response.data };
    } catch (error) {
      console.error('Verify email error:', error);
      return { error: error.response?.data?.error || error.message || 'Error al verificar email' };
    }
  },

  // Resend verification email
  resendVerification: async () => {
    try {
      const response = await apiClient.post('/auth/resend-verification');
      return { data: response.data };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { error: error.response?.data?.error || error.message || 'Error al reenviar verificación' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: (userType = 'auth') => {
    if (userType === 'staff') {
      return !!localStorage.getItem('staffToken');
    } else if (userType === 'admin') {
      return !!localStorage.getItem('adminToken');
    } else if (userType === 'super') {
      return !!localStorage.getItem('superAdminToken');
    } else {
      // Check if any token exists
      return !!(localStorage.getItem('staffToken') || 
                localStorage.getItem('adminToken') || 
                localStorage.getItem('superAdminToken') ||
                localStorage.getItem('authToken'));
    }
  },

  // Get stored token
  getToken: (userType = 'auth') => {
    if (userType === 'staff') {
      return localStorage.getItem('staffToken');
    } else if (userType === 'admin') {
      return localStorage.getItem('adminToken');
    } else if (userType === 'super') {
      return localStorage.getItem('superAdminToken');
    } else {
      // Return first available token
      return localStorage.getItem('superAdminToken') || 
             localStorage.getItem('adminToken') || 
             localStorage.getItem('staffToken') ||
             localStorage.getItem('authToken');
    }
  },

  // Get stored user data
  getUser: (userType = 'auth') => {
    let userKey = 'user';
    if (userType === 'staff') userKey = 'staffUser';
    else if (userType === 'admin') userKey = 'adminUser';
    else if (userType === 'super') userKey = 'superAdminUser';
    
    const userData = localStorage.getItem(userKey);
    return userData ? JSON.parse(userData) : null;
  }
};

export default authService; 