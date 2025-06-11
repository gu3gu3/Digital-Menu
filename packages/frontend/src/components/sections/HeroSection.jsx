import { CheckCircleIcon } from '@heroicons/react/24/solid'

const HeroSection = () => {
  const scrollToRegister = () => {
    const element = document.getElementById('register')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const benefits = [
    'Menús con imágenes atractivas',
    'Experiencia 100% higiénica',
    'Actualización en tiempo real',
    'Ahorro en costos de impresión'
  ]

  return (
    <section className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        </div>
      </div>

      <div className="relative section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  La revolución de los{' '}
                  <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    menús digitales
                  </span>{' '}
                  ha llegado
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transforma la experiencia de tus clientes con menús digitales QR. 
                  Adiós a los menús físicos deteriorados, sin imágenes y poco higiénicos.
                </p>
              </div>

              {/* Benefits list */}
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={scrollToRegister}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Comenzar Gratis Ahora
                </button>
                <button 
                  onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Ver Demo
                </button>
              </div>

              {/* Social proof */}
              <p className="text-sm text-gray-500">
                ✨ Únete a más de <span className="font-semibold text-primary-600">1,000+</span> restaurantes 
                que ya modernizaron su experiencia gastronómica
              </p>
            </div>

            {/* Visual/Mockup */}
            <div className="relative">
              <div className="relative mx-auto w-full max-w-md">
                {/* Phone mockup */}
                <div className="relative bg-gray-900 rounded-3xl p-2 shadow-2xl">
                  <div className="bg-white rounded-2xl p-6 h-96 overflow-hidden">
                    {/* Mockup content */}
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">QR</span>
                        </div>
                        <h3 className="font-bold text-gray-900">Restaurante Demo</h3>
                        <p className="text-sm text-gray-600">Mesa #5</p>
                      </div>
                      
                      {/* Menu items mockup */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg"></div>
                          <div>
                            <p className="font-medium text-gray-900">Hamburguesa Clásica</p>
                            <p className="text-sm text-gray-600">$18.99</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-lg"></div>
                          <div>
                            <p className="font-medium text-gray-900">Salmón a la Parrilla</p>
                            <p className="text-sm text-gray-600">$24.99</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg"></div>
                          <div>
                            <p className="font-medium text-gray-900">Cheesecake</p>
                            <p className="text-sm text-gray-600">$8.99</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating QR code */}
                <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border">
                  <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-1">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">Escanea aquí</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection 