import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { StarIcon, SparklesIcon, RocketLaunchIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

const PricingSection = () => {
  const plans = [
    {
      name: 'Plan Gratuito',
      icon: StarIcon,
      price: 0,
      description: 'Ideal para comenzar tu digitalización - ¡Gratis para siempre!',
      color: 'border-gray-200',
      buttonColor: 'btn-secondary',
      popular: false,
      features: [
        { text: 'Hasta 25 productos (vs 50 competencia)', included: true },
        { text: 'Hasta 300 órdenes/mes (vs 200 competencia)', included: true, highlight: true },
        { text: 'Hasta 5 mesas con QR únicos', included: true },
        { text: 'Hasta 1 mesero con panel dedicado', included: true },
        { text: '🤖 Digitalización de menú con IA*', included: true, highlight: true },
        { text: '💱 7 monedas centroamericanas', included: true, highlight: true },
        { text: '📱 Menú digital responsivo', included: true },
        { text: '⚡ Actualizaciones en tiempo real', included: true },
        { text: '📧 Soporte por email', included: true },
        { text: '📊 Estadísticas básicas', included: false },
        { text: '🎨 Personalización avanzada', included: false },
        { text: '🔔 Notificaciones push', included: false }
      ]
    },
    {
      name: 'Plan Básico',
      icon: SparklesIcon,
      price: 10,
      description: '67% más barato que la competencia - ¡Valor increíble!',
      color: 'border-primary-200 ring-2 ring-primary-500',
      buttonColor: 'btn-primary',
      popular: true,
      badge: 'MÁS POPULAR',
      features: [
        { text: 'Hasta 75 productos (vs 200 competencia)', included: true },
        { text: 'Hasta 700 órdenes/mes (vs 1,000 competencia)', included: true },
        { text: 'Hasta 10 mesas con QR únicos', included: true },
        { text: 'Hasta 2 meseros con gestión completa', included: true },
        { text: '🤖 Digitalización de menú con IA*', included: true, highlight: true },
        { text: '💱 7 monedas centroamericanas', included: true, highlight: true },
        { text: '📱 Menú digital responsivo', included: true },
        { text: '⚡ Actualizaciones en tiempo real', included: true },
        { text: '📊 Dashboard con estadísticas avanzadas', included: true, highlight: true },
        { text: '🎨 Personalización de marca completa', included: true, highlight: true },
        { text: '🔔 Sistema de notificaciones en tiempo real', included: true, highlight: true },
        { text: '📋 Gestión de personal integrada', included: true, highlight: true },
        { text: '📈 Reportes de ventas', included: true },
        { text: '💳 Soporte prioritario', included: true }
      ]
    },
    {
      name: 'Plan Platinum',
      icon: RocketLaunchIcon,
      price: 25,
      description: '17% más barato que la competencia - ¡Funcionalidad empresarial!',
      color: 'border-yellow-200 ring-2 ring-yellow-400',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-out',
      popular: false,
      badge: 'MÁXIMO VALOR',
      features: [
        { text: 'Hasta 125 productos (vs 200 competencia)', included: true },
        { text: 'Hasta 1,000 órdenes/mes (igual competencia)', included: true },
        { text: 'Hasta 20 mesas con QR únicos', included: true },
        { text: 'Hasta 4 meseros con roles personalizados', included: true },
        { text: '🤖 Digitalización de menú con IA*', included: true, highlight: true },
        { text: '💱 7 monedas centroamericanas', included: true, highlight: true },
        { text: '📱 Menú digital responsivo', included: true },
        { text: '⚡ Actualizaciones en tiempo real', included: true },
        { text: '📊 Analytics empresariales completos', included: true, highlight: true },
        { text: '🎨 Personalización completa + temas', included: true, highlight: true },
        { text: '🔔 Notificaciones push + email automático', included: true, highlight: true },
        { text: '👥 Gestión avanzada de personal', included: true, highlight: true },
        { text: '📋 Importación/Exportación CSV', included: true, highlight: true },
        { text: '🛒 Sistema de carrito avanzado', included: true, highlight: true },
        { text: '📱 Panel de meseros dedicado', included: true, highlight: true },
        { text: '🆘 Soporte 24/7 dedicado', included: true }
      ]
    }
  ]

  const competitorFeatures = [
    '❌ Sin digitalización con IA',
    '❌ Solo USD/moneda local',
    '❌ Sin gestión de personal',
    '❌ Sin notificaciones en tiempo real',
    '❌ Sin panel para meseros',
    '❌ Sin sistema de carrito avanzado'
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Planes que <span className="text-primary-600">Superan a la Competencia</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Mismas funcionalidades, mejor tecnología, <strong className="text-primary-600">precios hasta 67% más bajos</strong>
          </p>
          
          {/* Competitive Advantage Banner */}
          <div className="bg-gradient-to-r from-primary-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg max-w-4xl mx-auto mb-8">
            <h3 className="text-2xl font-bold mb-4">🚀 ¿Por qué somos superiores?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <h4 className="font-semibold mb-2">✨ Características Exclusivas:</h4>
                <ul className="space-y-1 text-sm">
                  <li>🤖 Digitalización automática con IA</li>
                  <li>💱 Soporte para 7 monedas centroamericanas</li>
                  <li>👥 Gestión completa de personal integrada</li>
                  <li>📱 Panel dedicado para meseros</li>
                  <li>🔔 Notificaciones en tiempo real</li>
                  <li>🛒 Sistema de carrito inteligente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">💰 Ventaja Competitiva:</h4>
                <ul className="space-y-1 text-sm">
                  <li>📉 Plan Básico: $10 vs $29.99 competencia</li>
                  <li>📈 Más órdenes incluidas (300 vs 200)</li>
                  <li>🎯 Mejor relación precio-funcionalidad</li>
                  <li>🆓 Plan gratuito sin limitaciones ocultas</li>
                  <li>🚀 Tecnología más moderna</li>
                  <li>🌎 Diseñado para Centroamérica</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
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
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    {feature.included ? (
                      <CheckIcon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${feature.highlight ? 'text-primary-600' : 'text-green-500'}`} />
                    ) : (
                      <XMarkIcon className="w-5 h-5 mt-0.5 mr-3 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? (feature.highlight ? 'text-primary-700 font-semibold' : 'text-gray-700') : 'text-gray-400'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${plan.buttonColor === 'btn-primary' ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1' : plan.buttonColor === 'btn-secondary' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : plan.buttonColor}`}>
                {plan.price === 0 ? 'Comenzar Gratis' : 'Elegir Plan'}
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
          <p className="text-gray-600 mb-6">
            <strong>¡Digitalización GRATUITA de tu menú actual!</strong><br/>
            Nuestro equipo convierte tu menú físico a digital con IA en menos de 24 horas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              🚀 Digitalizar Mi Menú GRATIS
            </button>
            <button className="border-2 border-primary-600 text-primary-600 font-semibold py-4 px-8 rounded-lg hover:bg-primary-50 transition-all duration-300">
              📞 Hablar con un Experto
            </button>
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-4xl mx-auto">
            <p className="text-sm text-gray-600">
              <strong>*</strong> <strong>Digitalización de Menú con IA:</strong> Servicio especializado disponible como complemento para clientes activos. 
              Durante el lanzamiento, ofrecemos digitalización <strong>GRATUITA</strong> de tu menú actual como beneficio especial. 
              Posteriormente, este servicio tendrá un costo adicional de $25 por menú digitalizado.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingSection