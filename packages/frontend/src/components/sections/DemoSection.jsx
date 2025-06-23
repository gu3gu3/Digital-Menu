import React, { useState, useEffect } from 'react'
import { PlayIcon, PhoneIcon, MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

const DemoSection = () => {
  const [menuData, setMenuData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [cart, setCart] = useState([])
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    const fetchDemoMenu = async () => {
    try {
        const response = await fetch(`/api/menu/demo`)
      const data = await response.json()
      
      if (data.success) {
        setMenuData(data.data)
      }
    } catch (error) {
        console.error('Error fetching demo menu:', error)
    } finally {
      setLoading(false)
    }
  }
    fetchDemoMenu()
  }, [])

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: Math.max(0, item.quantity - 1) }
        : item
    ).filter(item => item.quantity > 0))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.precio * item.quantity), 0)
  }

  const getCartQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  if (loading) {
    return (
      <section id="demo" className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando demo...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!showDemo) {
    return (
      <section id="demo" className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ve nuestro menú digital en acción
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Experimenta como tus clientes interactuarán con el menú digital. 
              Prueba agregar productos al carrito y ve la magia en tiempo real.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Mini Demo */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <PhoneIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-2">Vista Previa Rápida</h3>
                    <p className="text-gray-600 text-sm">Demo integrado en esta página</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowDemo(true)}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-out flex items-center justify-center space-x-2"
                >
                  <PlayIcon className="h-6 w-6" />
                  <span>Demo Rápido</span>
                </button>
              </div>

              {/* Full Demo */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <ArrowTopRightOnSquareIcon className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-2">Experiencia Completa</h3>
                    <p className="text-gray-600 text-sm">Demo en pantalla completa como lo verían tus clientes</p>
                  </div>
                </div>
                
                <Link 
                  to="/demo"
                  className="w-full bg-gradient-to-r from-secondary-600 to-primary-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-out flex items-center justify-center space-x-2"
                >
                  <ArrowTopRightOnSquareIcon className="h-6 w-6" />
                  <span>Demo Completo</span>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">13</div>
                <div className="text-gray-600 text-sm">Productos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600">4</div>
                <div className="text-gray-600 text-sm">Categorías</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">100%</div>
                <div className="text-gray-600 text-sm">Móvil</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600">0</div>
                <div className="text-gray-600 text-sm">Papel</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="demo" className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-8">
          <button 
            onClick={() => setShowDemo(false)}
            className="text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            ← Volver a la descripción
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Demo Interactivo - Menú Digital
          </h2>
          <p className="text-gray-600">Simulando la experiencia de un cliente real</p>
          
          <div className="mt-4">
            <Link 
              to="/demo"
              className="inline-flex items-center space-x-2 text-secondary-600 hover:text-secondary-700 font-medium"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              <span>Ver demo en pantalla completa</span>
            </Link>
          </div>
        </div>

        {/* Mobile Demo Frame */}
        <div className="max-w-sm mx-auto">
          <div className="bg-gray-900 rounded-3xl p-2 shadow-2xl">
            <div className="bg-white rounded-2xl overflow-hidden h-[600px] relative">
              {/* Status Bar */}
              <div className="bg-gray-100 px-4 py-2 flex justify-between items-center text-xs">
                <span className="font-medium">9:41</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                  <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                  <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                </div>
              </div>

              {/* Restaurant Header */}
              {menuData && (
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-4">
                  <h1 className="text-lg font-bold">{menuData.restaurant.nombre}</h1>
                  <p className="text-primary-100 text-sm">{menuData.restaurant.descripcion}</p>
                  <div className="flex items-center mt-2 text-primary-200 text-xs">
                    <MapPinIcon className="h-3 w-3 mr-1" />
                    <span>Mesa 1 - {menuData.restaurant.direccion}</span>
                  </div>
                </div>
              )}

              {/* Categories */}
              {menuData && (
                <div className="flex overflow-x-auto bg-white border-b px-2 py-2">
                  {menuData.categories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(index)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium mr-2 transition-colors ${
                        selectedCategory === index
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.nombre}
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 180px)' }}>
                {menuData && menuData.categories[selectedCategory]?.productos.map((product) => {
                  const cartItem = cart.find(item => item.id === product.id)
                  const quantity = cartItem ? cartItem.quantity : 0

                  return (
                    <div key={product.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{product.nombre}</h3>
                          <p className="text-gray-600 text-xs mt-1">{product.descripcion}</p>
                          <p className="font-bold text-primary-600 mt-2">${product.precio}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          {quantity > 0 && (
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              <MinusIcon className="h-3 w-3" />
                            </button>
                          )}
                          
                          {quantity > 0 && (
                            <span className="text-sm font-medium px-2">{quantity}</span>
                          )}
                          
                          <button
                            onClick={() => addToCart(product)}
                            className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {quantity > 0 && (
                          <span className="text-xs font-bold text-primary-600">
                            ${(product.precio * quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingCartIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">{getCartQuantity()} artículos</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">${getCartTotal().toFixed(2)}</div>
                      <button className="text-xs bg-white text-primary-600 px-2 py-1 rounded mt-1">
                        Ver Carrito
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Demo Instructions */}
          <div className="mt-8 text-center">
            <h3 className="font-semibold text-gray-900 mb-4">¡Prueba el demo!</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="text-primary-600 font-medium mb-1">1. Navega</div>
                <div className="text-gray-600">Explora las categorías del menú</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-secondary-600 font-medium mb-1">2. Agrega</div>
                <div className="text-gray-600">Añade productos al carrito</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DemoSection 