import api from './api.js';

const authService = {
  // Login for different user types
  login: async (credentials) => {
    try {
      const { email, password, role } = credentials;
      
      // All roles use the same login endpoint
      const response = await api.post('/auth/login', { email, password, role });
      
      if (response && response.success && response.data) {
        const { token, user } = response.data;
        
        // Save token based on role
        if (role === 'MESERO' || role === 'STAFF') {
          api.saveToken(token, 'staff');
          localStorage.setItem('staffUser', JSON.stringify(user));
        } else if (role === 'ADMIN' || role === 'ADMINISTRADOR') {
          api.saveToken(token, 'admin');
          localStorage.setItem('adminUser', JSON.stringify(user));
        } else if (role === 'SUPER_ADMIN') {
          api.saveToken(token, 'auth');
          localStorage.setItem('superUser', JSON.stringify(user));
        } else {
          api.saveToken(token);
        }
        
        return { data: response.data };
      } else {
        return { error: response.error || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { error: error.message || 'Error al iniciar sesión' };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.register(userData);
      return { data: response };
    } catch (error) {
      console.error('Register error:', error);
      return { error: error.message || 'Error al registrar usuario' };
    }
  },

  // Logout
  logout: async (userType = 'auth') => {
    try {
      await api.logout();
      
      // Clear tokens and user data
      if (userType === 'staff') {
        api.removeToken('staff');
        localStorage.removeItem('staffUser');
      } else if (userType === 'admin') {
        api.removeToken('admin');
        localStorage.removeItem('adminUser');
      } else if (userType === 'super') {
        api.removeToken('auth');
        localStorage.removeItem('superUser');
      } else {
        api.clearAllTokens();
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
      const response = await api.getMe();
      return { data: response };
    } catch (error) {
      console.error('GetMe error:', error);
      return { error: error.message || 'Error al obtener información del usuario' };
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.verifyEmail(token);
      return { data: response };
    } catch (error) {
      console.error('Verify email error:', error);
      return { error: error.message || 'Error al verificar email' };
    }
  },

  // Resend verification email
  resendVerification: async () => {
    try {
      const response = await api.resendVerification();
      return { data: response };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { error: error.message || 'Error al reenviar verificación' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: (userType = 'auth') => {
    return api.isAuthenticated(userType);
  },

  // Get stored token
  getToken: (userType = 'auth') => {
    return api.getToken(userType);
  },

  // Get stored user data
  getUser: (userType = 'auth') => {
    let userKey = 'user';
    if (userType === 'staff') userKey = 'staffUser';
    else if (userType === 'admin') userKey = 'adminUser';
    else if (userType === 'super') userKey = 'superUser';
    
    const userData = localStorage.getItem(userKey);
    return userData ? JSON.parse(userData) : null;
  }
};

export default authService; 