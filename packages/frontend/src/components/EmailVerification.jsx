import { useState, useEffect } from 'react'
import { CheckCircleIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline'
import apiService from '../services/api'

const EmailVerification = ({ email, onContinue }) => {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage('')
    
    try {
      const response = await apiService.resendVerification()
      if (response.success) {
        setResendMessage('📧 Email de verificación reenviado exitosamente')
        setTimeLeft(300) // Reset timer
      }
    } catch (error) {
      console.error('Error resending email:', error)
      setResendMessage('❌ Error al reenviar el email. Intenta nuevamente.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Verifica tu email!
          </h1>
          <p className="text-gray-600">
            Te hemos enviado un enlace de verificación a:
          </p>
          <p className="font-semibold text-primary-600 mt-1">
            {email}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-yellow-800 mb-2">
            <ClockIcon className="h-5 w-5 mr-2" />
            <span className="font-semibold">Tiempo restante: {formatTime(timeLeft)}</span>
          </div>
          <p className="text-sm text-yellow-700">
            El enlace de verificación expirará en {formatTime(timeLeft)}
          </p>
        </div>

        {resendMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            resendMessage.includes('exitosamente') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {resendMessage}
          </div>
        )}

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">📧 Revisa tu bandeja de entrada</p>
            <p className="mb-2">📁 No olvides revisar tu carpeta de spam</p>
            <p>🔗 Haz clic en el enlace para verificar tu cuenta</p>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={isResending || timeLeft > 240} // Allow resend after 1 minute
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
              isResending || timeLeft > 240
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isResending ? 'Reenviando...' : 'Reenviar email de verificación'}
          </button>

          <button
            onClick={onContinue}
            className="w-full py-3 px-4 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-300"
          >
            Continuar sin verificar (temporal)
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ¿Problemas con la verificación? Contacta nuestro soporte: 
            <a href="mailto:soporte@menuview.app" className="text-primary-600 hover:underline ml-1">
              soporte@menuview.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailVerification 