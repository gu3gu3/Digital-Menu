import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { StarIcon, SparklesIcon, RocketLaunchIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import useUserLocation from '../../hooks/useUserLocation'

const PricingSection = () => {
  const { countryCode } = useUserLocation();
  const currencySymbol = countryCode === 'ES' ? '€' : '$';
  const plans = [
    {
      name: 'Plan Emprendedor',
      icon: StarIcon,
      price: countryCode === 'ES' ? 16.00 : 6.00,
      description: 'Ideal para comenzar tu digitalización',
      color: 'border-gray-200',
      buttonColor: 'btn-secondary',
      popular: false,
      features: [
        { text: 'Hasta 100 productos', included: true },
        { text: 'Hasta 10 categorías', included: true },
        { text: 'Hasta 10 mesas con QR únicos', included: true },
        { text: 'Hasta 2 meseros con panel dedicado', included: true },
        { text: 'Hasta 1,500 órdenes/mes', included: true },
        { text: '🤖 Digitalización de menú con IA*', included: true, highlight: true },
        { text: '💱 Soporte Multimoneda', included: true },
        { text: '📱 Menú digital responsivo', included: true },
        { text: '📊 Dashboard con estadísticas', included: true, highlight: true },
        { text: '🔔 Notificaciones en tiempo real', included: true, highlight: true },
        { text: '🛎️ Botón Solicitar mesero', included: true, highlight: true },
        { text: '💳 Botón Pedir la cuenta', included: true, highlight: true }
      ]
    },
    {
      name: 'Plan Crecimiento',
      icon: SparklesIcon,
      price: countryCode === 'ES' ? 25.00 : 20.00,
      description: 'Para restaurantes en expansión',
      color: 'border-primary-200 ring-2 ring-primary-500',
      buttonColor: 'btn-primary',
      popular: true,
      badge: 'MÁS POPULAR',
      features: [
        { text: 'Hasta 150 productos', included: true },
        { text: 'Hasta 15 categorías', included: true },
        { text: 'Hasta 20 mesas con QR únicos', included: true },
        { text: 'Hasta 6 meseros con gestión completa', included: true },
        { text: 'Hasta 3,000 órdenes/mes', included: true },
        { text: '🤖 Digitalización de menú con IA*', included: true, highlight: true },
        { text: '💱 Soporte Multimoneda', included: true },
        { text: '📊 Dashboard con estadísticas', included: true, highlight: true },
        { text: '🔔 Notificaciones en tiempo real', included: true, highlight: true },
        { text: '🛎️ Botón Solicitar mesero', included: true, highlight: true },
        { text: '💳 Botón Pedir la cuenta', included: true, highlight: true }
      ]
    },
    {
      name: 'Plan Pro',
      icon: RocketLaunchIcon,
      price: countryCode === 'ES' ? 50.00 : 40.00,
      description: 'Operación completa y avanzada',
      color: 'border-blue-200 ring-2 ring-blue-400',
      buttonColor: 'bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300',
      popular: false,
      features: [
        { text: 'Hasta 300 productos', included: true },
        { text: 'Hasta 45 categorías', included: true },
        { text: 'Hasta 75 mesas con QR únicos', included: true },
        { text: 'Hasta 10 meseros', included: true, highlight: true },
        { text: 'Hasta 7,500 órdenes/mes', included: true },
        { text: '🤖 Digitalización de menú con IA*', included: true, highlight: true },
        { text: '🔔 Notificaciones en tiempo real', included: true, highlight: true },
        { text: '🛎️ Botón Solicitar mesero', included: true, highlight: true },
        { text: '💳 Botón Pedir la cuenta', included: true, highlight: true },
        { text: '🧾 Cálculo automático de IVA y Servicio', included: true, highlight: true },
        { text: '🧑‍🍳 Módulo KDS (Cocina)', included: true, highlight: true }
      ]
    },
    {
      name: 'Plan Platinum',
      icon: StarIcon,
      price: 'Contactanos',
      description: 'Sin límites para franquicias y cadenas',
      color: 'border-yellow-200 ring-2 ring-yellow-400',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-out',
      popular: false,
      badge: 'MÁXIMO VALOR',
      features: [
        { text: 'Productos ilimitados', included: true, highlight: true },
        { text: 'Categorías ilimitadas', included: true, highlight: true },
        { text: 'Mesas ilimitadas', included: true, highlight: true },
        { text: 'Meseros ilimitados', included: true, highlight: true },
        { text: 'Órdenes ilimitadas', included: true, highlight: true },
        { text: '🤖 Digitalización de menú con IA*', included: true, highlight: true },
        { text: '📊 Analytics empresariales', included: true, highlight: true },
        { text: '🆘 Soporte 24/7 dedicado', included: true, highlight: true },
        { text: '🔔 Notificaciones en tiempo real', included: true, highlight: true },
        { text: '🛎️ Botón Solicitar mesero', included: true, highlight: true },
        { text: '💳 Botón Pedir la cuenta', included: true, highlight: true },
        { text: '🧾 Cálculo automático de IVA y Servicio', included: true, highlight: true },
        { text: '🧑‍🍳 Módulo KDS (Cocina)', included: true, highlight: true }
      ]
    }
  ]

  const competitorFeatures = [
    '❌ Sin digitalización con IA',
    '❌ Solo USD/moneda local',
    '❌ Sin gestión de personal integrada',
    '❌ Sin notificaciones en tiempo real',
    '❌ Sin panel dedicado para meseros',
    '❌ Sin sistema de carrito avanzado'
  ]

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Planes que <span className="text-primary-600">Superan a la Competencia</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Tecnología superior, funcionalidades exclusivas, <strong className="text-primary-600">precios hasta 67% más bajos</strong>
          </p>
          
          {/* Competitive Advantage Banner */}
          <div className="bg-gradient-to-r from-primary-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg max-w-4xl mx-auto mb-8">
            <h3 className="text-2xl font-bold mb-4">🚀 ¿Por qué somos superiores?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <h4 className="font-semibold mb-2">✨ Características Exclusivas:</h4>
                <ul className="space-y-1 text-sm">
                  <li>🤖 Digitalización automática con IA</li>
                  <li>💱 Soporte Multimoneda</li>
                  <li>👥 Gestión completa de personal integrada</li>
                  <li>📱 Panel dedicado para meseros</li>
                  <li>🔔 Notificaciones en tiempo real</li>
                  <li>🛒 Sistema de carrito inteligente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">💰 Ventaja Competitiva:</h4>
                <ul className="space-y-1 text-sm">
                  <li>📉 Plan Básico: {currencySymbol}6 vs {currencySymbol}10 la competencia</li>
                  <li>🎯 Mejor relación precio-funcionalidad</li>
                  <li>🚀 Tecnología más moderna y rápida</li>
                  <li>🌎 Alcance y soporte global</li>
                  <li>🔧 Soporte técnico en español</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div key={index} className={`relative bg-white rounded-2xl shadow-lg p-8 ${plan.color} hover:shadow-xl transition-all duration-300 ${plan.popular ? 'scale-105' : ''}`}>
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <plan.icon className="w-12 h-12 mx-auto mb-4 text-primary-600" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4 h-12 flex items-center justify-center">
                  {typeof plan.price === 'number' ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">{currencySymbol}{plan.price.toFixed(2)}</span>
                      <span className="text-gray-600 ml-1">/mes</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    {feature.included ? (
                      <CheckIcon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${feature.highlight ? 'text-green-500' : 'text-primary-500'}`} />
                    ) : (
                      <XMarkIcon className="w-5 h-5 mt-0.5 mr-3 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? (feature.highlight ? 'text-green-600 font-semibold' : 'text-gray-700') : 'text-gray-400'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => document.getElementById('register').scrollIntoView({ behavior: 'smooth' })}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${plan.buttonColor === 'btn-primary' ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1' : plan.buttonColor === 'btn-secondary' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : plan.buttonColor}`}
              >
                {typeof plan.price === 'string' ? 'Contáctanos' : 'Elegir Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Competitor Comparison */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-red-800 mb-4">
            ❌ Lo que NO obtienes con la competencia
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            {competitorFeatures.map((feature, index) => (
              <div key={index} className="flex items-center">
                <span className="text-red-600 text-sm">{feature}</span>
              </div>
            ))}
          </div>
          <p className="text-red-700 mt-4 font-semibold">
            Con nosotros obtienes TODO esto incluido + precios hasta 67% más bajos
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 Oferta Especial de Lanzamiento
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Digitaliza tu menú con IA <strong className="text-primary-600">GRATIS</strong> + 15 días de prueba sin compromiso
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => document.getElementById('register').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary text-lg px-8 py-4"
            >
              🚀 Comenzar Gratis Ahora
            </button>
            <button 
              onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-lg px-8 py-4"
            >
              Ver Demo en Vivo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✨ Sin tarjeta de crédito • Cancelación en cualquier momento • Soporte en español
          </p>
        </div>
      </div>
    </section>
  )
}

export default PricingSection