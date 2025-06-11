import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import apiService from '../services/api'

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Token de verificación no encontrado en la URL')
        setIsLoading(false)
        return
      }

      try {
        const response = await apiService.verifyEmail(token)
        
        if (response.success) {
          setStatus('success')
          setMessage('¡Tu email ha sido verificado exitosamente!')
        } else {
          setStatus('error')
          setMessage(response.error || 'Error al verificar el email')
        }
      } catch (error) {
        setStatus('error')
        setMessage(error.message || 'Error al verificar el email')
      } finally {
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleContinue = () => {
    if (apiService.isAuthenticated()) {
      navigate('/admin/dashboard')
    } else {
      navigate('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {isLoading ? (
          // Loading state
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-10 h-10 bg-primary-300 rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando tu email...
            </h1>
            <p className="text-gray-600">
              Por favor espera mientras verificamos tu dirección de correo electrónico.
            </p>
          </div>
        ) : status === 'success' ? (
          // Success state
          <>
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-900 mb-2">
                ¡Email Verificado!
              </h1>
              <p className="text-green-700">
                {message}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>¡Excelente!</strong> Tu cuenta está ahora completamente verificada. 
                Puedes acceder a todas las funciones de tu dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleContinue}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <span>Ir al Dashboard</span>
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
              
              <p className="text-xs text-gray-500">
                Serás redirigido al {apiService.isAuthenticated() ? 'dashboard' : 'login'}
              </p>
            </div>
          </>
        ) : (
          // Error state
          <>
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-900 mb-2">
                Error de Verificación
              </h1>
              <p className="text-red-700">
                {message}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Posibles causas:</strong>
              </p>
              <ul className="text-xs text-red-700 mt-2 space-y-1 text-left">
                <li>• El enlace ha expirado (válido por 24 horas)</li>
                <li>• El enlace ya fue utilizado</li>
                <li>• El enlace está malformado o incompleto</li>
                <li>• Ya verificaste tu email anteriormente</li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/admin/login')}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Ir al Login
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Volver al Inicio
              </button>
            </div>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ¿Necesitas ayuda? Contacta nuestro soporte: 
            <a href="mailto:soporte@menuview.app" className="text-primary-600 hover:underline ml-1">
              soporte@menuview.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationPage 