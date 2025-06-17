const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available - check both admin and staff tokens
    const adminToken = localStorage.getItem('adminToken')
    const staffToken = localStorage.getItem('staffToken')
    const authToken = localStorage.getItem('authToken')
    
    const token = adminToken || staffToken || authToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    })
  }

  async getMe() {
    return this.makeRequest('/auth/me')
  }

  async verifyEmail(token) {
    return this.makeRequest(`/auth/verify-email?token=${token}`)
  }

  async resendVerification() {
    return this.makeRequest('/auth/resend-verification', {
      method: 'POST',
    })
  }

  // Generic HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.makeRequest(url, { method: 'GET' })
  }

  async post(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint) {
    return this.makeRequest(endpoint, { method: 'DELETE' })
  }

  // Auth utilities
  saveToken(token, type = 'auth') {
    localStorage.setItem(`${type}Token`, token)
  }

  removeToken(type = 'auth') {
    localStorage.removeItem(`${type}Token`)
  }

  getToken(type = 'auth') {
    return localStorage.getItem(`${type}Token`)
  }

  isAuthenticated(type = 'auth') {
    return !!this.getToken(type)
  }

  // Clear all tokens
  clearAllTokens() {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('staffToken')
    localStorage.removeItem('authToken')
    localStorage.removeItem('adminUser')
    localStorage.removeItem('staffUser')
  }
}

export default new ApiService() 