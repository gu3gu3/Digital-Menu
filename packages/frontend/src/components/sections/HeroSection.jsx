import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

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
            <div className="space-y-6">
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

            {/* Visual/Mockup + AI Offer */}
            <div className="relative space-y-8">
              {/* Menu Mockup REALISTA - PRIMERO */}
              <div className="relative mx-auto w-full max-w-2xl">
                {/* Header del restaurante */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 rounded-t-2xl shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <span className="text-white font-bold text-sm">BV</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Bella Vista</h3>
                      <p className="text-sm opacity-90">Cocina internacional con vista panorámica</p>
                    </div>
                  </div>
                </div>

                {/* Contenido del menú - 3 columnas como el real */}
                <div className="bg-gray-50 p-4 rounded-b-2xl shadow-lg">
                  <div className="grid grid-cols-12 gap-3 text-xs">
                    {/* Categorías */}
                    <div className="col-span-3">
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">Categorías</h4>
                        <div className="space-y-1">
                          <div className="bg-primary-600 text-white px-2 py-1 rounded text-xs">
                            <div className="font-medium">Tapas y Entrantes</div>
                            <div className="opacity-75">1 productos</div>
                          </div>
                          <div className="text-gray-700 px-2 py-1">
                            <div className="font-medium">Platos Fuertes</div>
                            <div className="opacity-75">1 productos</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="col-span-6">
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
                        <div className="p-3 border-b border-gray-200">
                          <h4 className="font-bold text-gray-900">Tapas y Entrantes</h4>
                          <p className="text-gray-600">Pequeños bocados para compartir</p>
                        </div>
                        <div className="p-3">
                          <div className="border border-gray-200 rounded-lg p-3 bg-white/80">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">Bruschettas de Prosciutto</h5>
                                <p className="text-gray-600 text-xs">Pan tostado con tomate, albahaca y prosciutto</p>
                                <p className="font-bold text-primary-600 mt-1">C$25.00</p>
                              </div>
                              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg ml-2"></div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button className="bg-primary-600 text-white px-2 py-1 rounded text-xs hover:bg-primary-700">
                                Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Carrito - COMO EL REAL */}
                    <div className="col-span-3">
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Tu Pedido</h4>
                          <div className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                            0 items
                          </div>
                        </div>
                        
                        <div className="text-center py-4">
                          <ShoppingCartIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-xs">Tu carrito está vacío</p>
                          <p className="text-gray-400 text-xs">Agrega productos para hacer tu pedido</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating QR code */}
                <div className="absolute -top-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-0.5">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="w-0.5 h-0.5 bg-white rounded-full"></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center font-medium">QR</p>
                </div>
              </div>

              {/* AI Digitization Banner - SEGUNDO, MÁS ABAJO */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-xl border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <SparklesIcon className="h-7 w-7 text-yellow-300" />
                  <h3 className="text-lg font-bold">🚀 Oferta Especial de Lanzamiento</h3>
                </div>
                <p className="text-sm mb-4 leading-relaxed">
                  <strong>¡Digitalizamos tu menú actual con IA!</strong><br/>
                  Nuestro equipo convierte tu menú físico a digital en menos de 24 horas
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={scrollToRegister}
                    className="bg-white text-blue-600 font-bold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center text-sm"
                  >
                    🤖 Digitalizar Mi Menú
                  </button>
                  <button 
                    onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-white text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300 text-center text-sm"
                  >
                    Ver Planes y Precios
                  </button>
                </div>
                <p className="text-xs mt-3 opacity-90">
                  * Servicio de digitalización disponible como servicio adicional para clientes activos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection