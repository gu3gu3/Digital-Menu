import { useState, useEffect } from 'react'
import { ArrowLeftIcon, ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/solid'
import API_BASE_URL from '../config/api'

const DemoPage = () => {
  const [menuData, setMenuData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    fetchDemoMenu()
  }, [])

  const fetchDemoMenu = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/demo`)
      const data = await response.json()
      
      if (data.success) {
        setMenuData(data.data)
      }
    } catch (error) {
      console.error('Error fetching demo data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const goBack = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando menú...</p>
        </div>
      </div>
    )
  }

  if (showCart) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => setShowCart(false)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver al Menú
            </button>
            <h1 className="text-lg font-semibold">Mi Pedido</h1>
            <div className="w-20"></div>
          </div>
        </div>

        {/* Cart Content */}
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                      <p className="text-gray-600 text-sm">{item.descripcion}</p>
                      <p className="font-bold text-primary-600 mt-1">${item.precio}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      
                      <span className="text-lg font-medium px-3">{item.quantity}</span>
                      
                      <button
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <span className="text-lg font-bold text-primary-600">
                      ${(item.precio * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="bg-white rounded-lg p-4 shadow-sm border-t-2 border-primary-600">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                
                <button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg">
                  Enviar Pedido
                </button>
                
                <p className="text-center text-gray-500 text-sm mt-2">
                  Este es solo un demo - no se procesará ningún pedido real
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={goBack}
            className="flex items-center text-primary-100 hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h1 className="text-lg font-semibold">Demo - Menú Digital</h1>
          <div className="w-16"></div>
        </div>
        
        {menuData && (
          <div className="px-4 pb-4">
            <h2 className="text-xl font-bold">{menuData.restaurant.nombre}</h2>
            <p className="text-primary-100 text-sm">{menuData.restaurant.descripcion}</p>
            <div className="flex items-center mt-2 text-primary-200 text-sm">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>Mesa 1 - {menuData.restaurant.direccion}</span>
            </div>
            <div className="flex items-center mt-1 text-primary-200 text-sm">
              <PhoneIcon className="h-4 w-4 mr-1" />
              <span>{menuData.restaurant.telefono}</span>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      {menuData && (
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex overflow-x-auto px-4 py-3">
            {menuData.categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(index)}
                className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium mr-3 transition-colors ${
                  selectedCategory === index
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="p-4 pb-24">
        {menuData && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {menuData.categories[selectedCategory]?.nombre}
            </h3>
            
            {menuData.categories[selectedCategory]?.productos.map((product) => {
              const cartItem = cart.find(item => item.id === product.id)
              const quantity = cartItem ? cartItem.quantity : 0

              return (
                <div key={product.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{product.nombre}</h4>
                      <p className="text-gray-600 text-sm mt-1">{product.descripcion}</p>
                      <p className="font-bold text-primary-600 text-lg mt-2">${product.precio}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3">
                      {quantity > 0 && (
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {quantity > 0 && (
                        <span className="text-lg font-medium px-3">{quantity}</span>
                      )}
                      
                      <button
                        onClick={() => addToCart(product)}
                        className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {quantity > 0 && (
                      <span className="text-lg font-bold text-primary-600">
                        ${(product.precio * quantity).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary-600 text-white p-4 shadow-lg">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <ShoppingCartIcon className="h-6 w-6" />
              <span className="font-medium">{getCartQuantity()} artículos</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">${getCartTotal().toFixed(2)}</div>
              <div className="text-primary-200 text-sm">Ver Carrito</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default DemoPage 