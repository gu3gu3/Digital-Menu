import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { KeyIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import logo from '../assets/logo.png'
import authService from '../services/authService'

const AdminResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (!urlToken) {
      setTokenError(true)
    } else {
      setToken(urlToken)
    }
  }, [searchParams])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpiar errores al escribir
    if (error) setError('')
  }

  const validateForm = () => {
    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setError('')

    try {
      const result = await authService.resetPassword(token, formData.newPassword)
      
      if (result.data) {
        setSuccess(true)
      } else {
        setError(result.error || 'Error al restablecer la contraseña')
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Token inválido o faltante
  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <img src={logo} alt="Menu View" className="h-20 w-auto" />
              </div>
            </div>
            
            <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-red-900 mb-4">
                Enlace inválido
              </h2>
              
              <p className="text-gray-600 mb-6">
                El enlace de recuperación no es válido o ha expirado.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-red-900 mb-2">Posibles causas:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• El enlace ha expirado (válido por 1 hora)</li>
                  <li>• El enlace ya fue utilizado</li>
                  <li>• El enlace está malformado o incompleto</li>
                  <li>• Copiaste mal la URL del email</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <Link
                  to="/admin/forgot-password"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  Solicitar nuevo enlace
                </Link>
                
                <Link
                  to="/admin/login"
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Volver al login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Contraseña restablecida exitosamente
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <img src={logo} alt="Menu View" className="h-20 w-auto" />
              </div>
            </div>
            
            <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Contraseña restablecida!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-green-900 mb-2">¿Qué sigue?</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Inicia sesión con tu nueva contraseña</li>
                  <li>• Considera usar un gestor de contraseñas</li>
                  <li>• Mantén tu contraseña segura y privada</li>
                </ul>
              </div>
              
              <button
                onClick={() => navigate('/admin/login')}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de nueva contraseña
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <img src={logo} alt="Menu View" className="h-20 w-auto" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Nueva contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu nueva contraseña para tu cuenta de administrador
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Repite la nueva contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Requisitos de contraseña:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className={formData.newPassword.length >= 6 ? 'text-green-700' : ''}>
                  • Mínimo 6 caracteres
                </li>
                <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-green-700' : ''}>
                  • Las contraseñas deben coincidir
                </li>
                <li>• Se recomienda usar letras, números y símbolos</li>
              </ul>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Restableciendo...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Restablecer contraseña
                  </div>
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/admin/login"
                className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
              >
                Volver al login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminResetPasswordPage 