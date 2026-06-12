import { useState, useEffect } from 'react'
import { EnvelopeIcon, BuildingStorefrontIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline'
import apiService from '../../services/api'
import EmailVerification from '../EmailVerification'
import WelcomeDashboard from '../WelcomeDashboard'
import InternationalPhoneInput from '../InternationalPhoneInput'

const RegisterSection = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    restauranteName: '',
    restauranteDescripcion: '',
    restauranteTelefono: '',
    restauranteDireccion: '',
    restauranteEmail: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentStep, setCurrentStep] = useState('register') // register, verification, welcome
  const [registeredUser, setRegisteredUser] = useState(null)
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiService.getPublicPlans()
        if (response.success && response.data) {
          setPlans(response.data)
          // Preseleccionar el plan más barato (o gratis) si existe
          if (response.data.length > 0) {
            setSelectedPlanId(response.data[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      }
    }
    fetchPlans()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePhoneChange = (value, fieldName = 'telefono') => {
    setFormData({
      ...formData,
      [fieldName]: value || ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      if (!selectedPlanId) {
        setMessage('Por favor, selecciona un plan.')
        setIsLoading(false)
        return
      }

      // Preparar datos para el backend
      const registrationData = {
        email: formData.email,
        password: 'tempPassword123!', // Se cambiará en el dashboard
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        restaurante: {
          nombre: formData.restauranteName,
          descripcion: formData.restauranteDescripcion,
          telefono: formData.restauranteTelefono,
          direccion: formData.restauranteDireccion,
          email: formData.restauranteEmail,
          planId: selectedPlanId
        }
      }

      console.log('Sending registration data:', registrationData)
      
      const response = await apiService.register(registrationData)
      
      if (response.success) {
        // Guardar token y datos del usuario
        apiService.saveToken(response.data.token)
        setRegisteredUser(response.data.user)
        
        // Mostrar mensaje de éxito y continuar al paso de verificación
        setMessage('¡Registro exitoso! Te contactaremos pronto para activar tu cuenta.')
        
        // Por ahora saltamos directo a bienvenida, pero podrías activar verificación
        // setCurrentStep('verification')
        setCurrentStep('welcome')
        
        // Limpiar formulario
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          restauranteName: '',
          restauranteDescripcion: '',
          restauranteTelefono: '',
          restauranteDireccion: '',
          restauranteEmail: ''
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setMessage(error.message || 'Error al procesar el registro. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueFromVerification = () => {
    setCurrentStep('welcome')
  }

  const handleContinueToDashboard = () => {
    // Redirigir al dashboard administrativo
    window.location.href = '/admin/dashboard'
  }

  // Si estamos en el paso de verificación
  if (currentStep === 'verification') {
    return (
      <EmailVerification 
        email={formData.email}
        onContinue={handleContinueFromVerification}
      />
    )
  }

  // Si estamos en el paso de bienvenida
  if (currentStep === 'welcome') {
    return (
      <WelcomeDashboard 
        userData={registeredUser}
        onContinueToDashboard={handleContinueToDashboard}
      />
    )
  }

  // Paso de registro (por defecto)
  return (
    <section id="register" className="section-padding bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¡Comienza tu transformación digital hoy!
            </h2>
            <p className="text-xl text-gray-600">
              Regístrate gratis y moderniza la experiencia de tu restaurante en minutos
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('exitoso') 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <UserIcon className="h-6 w-6 text-primary-600 mr-2" />
                  Información Personal
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      name="apellido"
                      required
                      value={formData.apellido}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Tu apellido"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <InternationalPhoneInput
                      label="Teléfono Personal *"
                      value={formData.telefono}
                      onChange={(value) => handlePhoneChange(value, 'telefono')}
                      placeholder="Ingresa tu número de teléfono"
                      name="telefono"
                      required={true}
                    />
                  </div>
                </div>
              </div>

              {/* Restaurant Information */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BuildingStorefrontIcon className="h-6 w-6 text-primary-600 mr-2" />
                  Información del Restaurante
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Restaurante *
                    </label>
                    <input
                      type="text"
                      name="restauranteName"
                      value={formData.restauranteName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nombre de tu restaurante"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      name="restauranteDescripcion"
                      required
                      value={formData.restauranteDescripcion}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Descripción breve de tu restaurante"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <InternationalPhoneInput
                        label="Teléfono del Restaurante *"
                        value={formData.restauranteTelefono}
                        onChange={(value) => handlePhoneChange(value, 'restauranteTelefono')}
                        placeholder="Teléfono de contacto del restaurante"
                        name="restauranteTelefono"
                        required={true}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email del Restaurante *
                      </label>
                      <input
                        type="email"
                        name="restauranteEmail"
                        required
                        value={formData.restauranteEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="contacto@turestaurante.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="restauranteDireccion"
                      required
                      value={formData.restauranteDireccion}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Dirección completa del restaurante"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Selecciona tu Plan</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.length === 0 ? (
                    <div className="col-span-full flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    plans.filter(plan => plan.nombre !== 'Plan Platinum').map((plan) => (
                      <div 
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`relative rounded-lg border p-4 cursor-pointer flex flex-col focus:outline-none transition-all duration-200 ${
                          selectedPlanId === plan.id 
                            ? 'bg-green-50 border-green-500 ring-2 ring-green-500' 
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className={`text-lg font-bold ${selectedPlanId === plan.id ? 'text-green-800' : 'text-gray-900'}`}>
                            {plan.nombre}
                          </h4>
                          <span className={`text-lg font-bold ${selectedPlanId === plan.id ? 'text-green-700' : 'text-gray-900'}`}>
                            {plan.precio === 0 ? 'Gratis' : `$${plan.precio}/mes`}
                          </span>
                        </div>
                        
                        <div className={`grid grid-cols-1 gap-1 text-sm ${selectedPlanId === plan.id ? 'text-green-700' : 'text-gray-600'}`}>
                          <div>• Hasta {plan.limiteProductos} productos</div>
                          <div>• Hasta {plan.limiteCategorias} categorías</div>
                          {plan.limiteMesas > 0 && <div>• Hasta {plan.limiteMesas} mesas (QR)</div>}
                          {plan.limiteMeseros > 0 && <div>• Hasta {plan.limiteMeseros} meseros</div>}
                          {plan.limiteOrdenes > 0 && <div>• {plan.limiteOrdenes} órdenes mensuales</div>}
                          <div>• 🤖 Digitalización de menú con IA*</div>
                          {plan.nombre !== 'Plan Emprendedor' && <div>• 📊 Dashboard de analíticas</div>}
                          <div>• 🛍️ Pick-up / Delivery (Addon)</div>
                          <div>• 🚀 Próximamente: Módulo de marketing</div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
                          <p className="text-xs text-gray-500 text-center font-medium">
                            Incluye 15 días de prueba gratis
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Acepto los{' '}
                    <a href="#" className="text-primary-600 hover:underline">términos y condiciones</a>
                    {' '}y la{' '}
                    <a href="#" className="text-primary-600 hover:underline">política de privacidad</a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 px-6 text-lg font-semibold rounded-lg transition-all duration-300 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                >
                  {isLoading ? 'Procesando...' : '🚀 Comenzar mi Prueba Gratuita'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  ✨ 15 días gratis • Sin tarjeta de crédito • Cancelación en cualquier momento
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegisterSection 