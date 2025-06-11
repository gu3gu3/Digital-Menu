import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { StarIcon, SparklesIcon } from '@heroicons/react/24/outline'

const PricingSection = () => {
  const plans = [
    {
      name: 'Gratuito',
      icon: StarIcon,
      price: 0,
      description: 'Perfecto para comenzar y probar el sistema',
      color: 'border-gray-200',
      buttonColor: 'btn-secondary',
      popular: false,
      features: [
        { text: 'Hasta 50 productos', included: true },
        { text: 'Hasta 200 órdenes/mes', included: true },
        { text: 'Hasta 10 mesas', included: true },
        { text: 'Hasta 2 meseros', included: true },
        { text: 'Menú digital con QR', included: true },
        { text: 'Actualizaciones en tiempo real', included: true },
        { text: 'Soporte por email', included: true },
        { text: 'Estadísticas básicas', included: false },
        { text: 'Personalización avanzada', included: false },
        { text: 'Soporte prioritario', included: false },
        { text: 'Integraciones', included: false }
      ]
    },
    {
      name: 'Profesional',
      icon: SparklesIcon,
      price: 29.99,
      description: 'Ideal para restaurantes establecidos que buscan crecer',
      color: 'border-primary-200 ring-2 ring-primary-500',
      buttonColor: 'btn-primary',
      popular: true,
      features: [
        { text: 'Hasta 200 productos', included: true },
        { text: 'Hasta 1,000 órdenes/mes', included: true },
        { text: 'Hasta 50 mesas', included: true },
        { text: 'Hasta 10 meseros', included: true },
        { text: 'Menú digital con QR', included: true },
        { text: 'Actualizaciones en tiempo real', included: true },
        { text: 'Soporte por email', included: true },
        { text: 'Estadísticas avanzadas', included: true },
        { text: 'Personalización de marca', included: true },
        { text: 'Soporte prioritario', included: true },
        { text: 'Integraciones básicas', included: false }
      ]
    },
    {
      name: 'Personalizado',
      icon: SparklesIcon,
      price: null,
      description: 'Solución empresarial para cadenas y restaurantes grandes',
      color: 'border-yellow-200',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-out',
      popular: false,
      features: [
        { text: 'Productos ilimitados', included: true },
        { text: 'Órdenes ilimitadas', included: true },
        { text: 'Mesas ilimitadas', included: true },
        { text: 'Meseros ilimitados', included: true },
        { text: 'Menú digital con QR', included: true },
        { text: 'Actualizaciones en tiempo real', included: true },
        { text: 'Soporte 24/7', included: true },
        { text: 'Estadísticas empresariales', included: true },
        { text: 'Personalización completa', included: true },
        { text: 'Soporte dedicado', included: true },
        { text: 'Integraciones completas', included: true }
      ]
    }
  ]

  const handleSelectPlan = (planName) => {
    if (planName === 'Personalizado') {
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })
    } else {
      document.getElementById('register').scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Planes diseñados para cada tipo de restaurante
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Desde pequeños cafés hasta grandes cadenas, tenemos el plan perfecto para tu negocio
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative bg-white rounded-2xl shadow-lg p-8 ${plan.color}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <plan.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  {plan.price !== null ? (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600 ml-2">/mes</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">Cotización</span>
                      <div className="text-gray-600">Personalizada</div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full ${plan.buttonColor}`}
                >
                  {plan.price === 0 ? 'Comenzar Gratis' : 
                   plan.price !== null ? 'Elegir Plan' : 'Contactar Ventas'}
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">Incluye:</h4>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Necesitas algo específico?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Todos nuestros planes incluyen 30 días de prueba gratuita y puedes cambiar o cancelar en cualquier momento
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary"
              >
                Hablar con Ventas
              </button>
              <button 
                onClick={() => document.getElementById('register').scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary"
              >
                Comenzar Prueba Gratuita
              </button>
            </div>
          </div>
        </div>

        {/* FAQ mini section */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Preguntas Frecuentes</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">¿Puedo cambiar de plan después?</h4>
              <p className="text-gray-600">Sí, puedes upgrade o downgrade tu plan en cualquier momento desde tu dashboard.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">¿Hay costos ocultos?</h4>
              <p className="text-gray-600">No, todos los precios son transparentes. Solo pagas lo que ves en el plan elegido.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">¿Cómo funciona la prueba gratuita?</h4>
              <p className="text-gray-600">30 días completos con todas las funciones del plan elegido, sin tarjeta de crédito.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">¿Qué incluye el soporte?</h4>
              <p className="text-gray-600">Ayuda con configuración, capacitación del personal y resolución de dudas técnicas.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingSection 