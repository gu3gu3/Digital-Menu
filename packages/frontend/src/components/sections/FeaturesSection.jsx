import { 
  PhotoIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  QrCodeIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const FeaturesSection = () => {
  const features = [
    {
      icon: PhotoIcon,
      title: 'Menús con Imágenes Atractivas',
      description: 'Muestra fotos profesionales de tus platillos que despiertan el apetito y aumentan las ventas.',
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: ShieldCheckIcon,
      title: '100% Higiénico y Contactless',
      description: 'Elimina completamente el contacto físico. Los clientes acceden al menú escaneando un QR.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: ClockIcon,
      title: 'Actualización en Tiempo Real',
      description: 'Cambia precios, añade platillos o marca disponibilidad al instante desde cualquier dispositivo.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Ahorro en Costos',
      description: 'Elimina para siempre los costos de impresión y reimpresión de menús físicos.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: QrCodeIcon,
      title: 'Códigos QR Únicos por Mesa',
      description: 'Cada mesa tiene su código QR único, permitiendo identificar pedidos y optimizar el servicio.',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Estadísticas y Reportes',
      description: 'Obtén insights valiosos sobre tus productos más populares y comportamiento de clientes.',
      gradient: 'from-teal-500 to-green-500'
    },
    {
      icon: UsersIcon,
      title: 'Gestión de Personal',
      description: 'Administra meseros y personal con diferentes niveles de acceso y permisos.',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      icon: CogIcon,
      title: 'Fácil de Usar',
      description: 'Interfaz intuitiva que no requiere conocimientos técnicos. Tu equipo se adaptará rápidamente.',
      gradient: 'from-gray-500 to-slate-500'
    }
  ]

  return (
    <section id="features" className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            La solución completa para tu restaurante
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Digital Menu QR transforma completamente la experiencia de tus clientes y optimiza 
            la operación de tu restaurante
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center group hover:-translate-y-2">
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional benefits */}
        <div className="mt-20">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  ¿Por qué elegir Digital Menu QR?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Implementación Inmediata</h4>
                      <p className="text-gray-600">Tu menú digital estará listo en menos de 24 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Soporte 24/7</h4>
                      <p className="text-gray-600">Nuestro equipo está disponible cuando lo necesites</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Escalable</h4>
                      <p className="text-gray-600">Desde un pequeño café hasta una cadena de restaurantes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Seguro y Confiable</h4>
                      <p className="text-gray-600">Infraestructura en la nube con máxima seguridad</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl p-8">
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-primary-600">30 días</div>
                    <p className="text-lg font-medium text-gray-900">Prueba gratuita</p>
                    <p className="text-gray-600">Sin compromisos, sin tarjeta de crédito</p>
                    <button 
                      onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                      className="btn-primary w-full"
                    >
                      Ver Planes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection 