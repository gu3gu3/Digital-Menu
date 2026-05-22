import { useState, useEffect } from 'react'
import { 
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import apiClient from '../lib/apiClient'
import { Link } from 'react-router-dom'

const AdminFeedbackPage = () => {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [planName, setPlanName] = useState('')
  const [status, setStatus] = useState({ canSubmit: false, daysRemaining: 0 })
  const [mensaje, setMensaje] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // 1. Obtener plan
      const statsRes = await apiClient.get('/admin/stats')
      const currentPlan = statsRes.data.data.plan.nombre
      setPlanName(currentPlan)

      // 2. Si es plan superior a Emprendedor, obtener estado de feedback
      if (currentPlan !== 'Plan Emprendedor') {
        const statusRes = await apiClient.get('/feedback/status')
        setStatus(statusRes.data.data)
      }
    } catch (error) {
      console.error('Error loading feedback data:', error)
      setError('No se pudo cargar la información.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mensaje.trim()) return
    
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await apiClient.post('/feedback', { mensaje })
      setSuccess('¡Gracias por tu sugerencia! La hemos recibido correctamente.')
      setMensaje('')
      setStatus({ canSubmit: false, daysRemaining: 30 })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError(error.response?.data?.error || 'Ocurrió un error al enviar tu sugerencia.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Vista bloqueada para Plan Emprendedor
  if (planName === 'Plan Emprendedor') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChatBubbleBottomCenterTextIcon className="h-6 w-6 mr-2 text-primary-600" />
            Danos tu opinión
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ayúdanos a mejorar MenuView contándonos qué funcionalidades necesitas.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-8 text-center border-t-4 border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Característica Premium</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            El buzón de sugerencias directas está disponible para los planes Crecimiento en adelante. 
            Mejora tu plan para tener voz directa en el desarrollo de nuevas funciones.
          </p>
          <a
            href="https://wa.me/50577483492?text=Hola,%20me%20gustar%C3%ADa%20mejorar%20mi%20plan%20en%20MenuView"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Mejorar mi Plan
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ChatBubbleBottomCenterTextIcon className="h-6 w-6 mr-2 text-primary-600" />
          Danos tu opinión
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          En MenuView.app tu opinión sí cuenta, dinos qué te gustaría tener.
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          {!status.canSubmit ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Sugerencia Recibida!</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Hemos recibido tu última sugerencia y nuestro equipo la está evaluando. 
                Para asegurar que procesamos todas las ideas correctamente, limitamos las sugerencias a una por mes.
              </p>
              <div className="mt-6 inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700">
                Podrás enviar otra sugerencia en {status.daysRemaining} {status.daysRemaining === 1 ? 'día' : 'días'}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué nueva funcionalidad o mejora te gustaría ver en la plataforma?
                </label>
                <div className="mt-1">
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={6}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
                    placeholder="Ejemplo: Me gustaría tener la opción de imprimir directamente el ticket de comanda en cocina cuando se recibe una nueva orden..."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    maxLength={500}
                    required
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>Sé lo más descriptivo posible.</span>
                  <span className={mensaje.length >= 500 ? 'text-red-500 font-medium' : ''}>
                    {mensaje.length} / 500 caracteres
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !mensaje.trim() || mensaje.length > 500}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  {submitting ? 'Enviando...' : 'Enviar Sugerencia'}
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center">
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1 text-gray-400" />
            Las sugerencias son leídas directamente por el equipo de producto.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminFeedbackPage
