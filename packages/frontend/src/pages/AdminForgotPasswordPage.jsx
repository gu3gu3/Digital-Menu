import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import logo from '../assets/logo.png'
import authService from '../services/authService'

const AdminForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authService.requestPasswordReset(email)
      
      if (result.data) {
        setSuccess(true)
      } else {
        setError(result.error || 'Error al enviar el email de recuperación')
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

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
                ¡Email enviado!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Si el email <strong>{email}</strong> está registrado en nuestro sistema, 
                recibirás un enlace para restablecer tu contraseña.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Próximos pasos:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Revisa tu bandeja de entrada</li>
                  <li>• Verifica también la carpeta de spam</li>
                  <li>• El enlace expirará en 1 hora</li>
                  <li>• Sigue las instrucciones del email</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <Link
                  to="/admin/login"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Volver al Login
                </Link>
                
                <button
                  onClick={() => setSuccess(false)}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Intentar con otro email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <img src={logo} alt="Menu View" className="h-20 w-auto" />
            </div>
          </div>
          <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu email para recibir un enlace de recuperación
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email de tu cuenta
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="admin@restaurante.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Ingresa el email que usas para acceder a tu cuenta de administrador
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">Información importante:</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Te enviaremos un enlace seguro para restablecer tu contraseña</li>
                <li>• El enlace será válido por 1 hora únicamente</li>
                <li>• Revisa tu bandeja de entrada y carpeta de spam</li>
                <li>• Si no recibes el email, verifica que el email sea correcto</li>
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
                    Enviando email...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Enviar enlace de recuperación
                  </div>
                )}
              </button>
            </div>

            <div className="text-center space-y-2">
              <Link
                to="/admin/login"
                className="text-sm text-primary-600 hover:text-primary-500 transition-colors flex items-center justify-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Volver al login
              </Link>
              
              <div className="text-xs text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/admin/register"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminForgotPasswordPage 