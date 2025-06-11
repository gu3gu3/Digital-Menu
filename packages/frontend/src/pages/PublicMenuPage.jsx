import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { 
  MapPinIcon, 
  PhoneIcon, 
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { API_ENDPOINTS, getImageUrl } from '../config/api'
import menuService from '../services/menuService'
import OrderStatusBanner from '../components/OrderStatusBanner'
import { formatMenuPrice, formatOrderTotal } from '../utils/currencyUtils'

const PublicMenuPage = () => {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const mesaNumero = searchParams.get('mesa')

  // Estados principales
  const [restaurante, setRestaurante] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estados del carrito y sesión
  const [carrito, setCarrito] = useState([])
  const [sesionId, setSesionId] = useState(null)
  const [currentOrdenId, setCurrentOrdenId] = useState(null) // Nuevo estado para seguimiento
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  // Estados UI
  const [showCart, setShowCart] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderDetails, setOrderDetails] = useState({
    nombreCliente: '',
    notas: ''
  })

  useEffect(() => {
    if (slug) {
      loadMenu()
    }
  }, [slug])

  useEffect(() => {
    if (restaurante && mesaNumero) {
      initializeSession()
    }
  }, [restaurante, mesaNumero])

  // Cargar ID de orden guardado en localStorage al inicializar
  useEffect(() => {
    const savedOrdenId = localStorage.getItem(`orden_${slug}_${mesaNumero}`)
    if (savedOrdenId) {
      setCurrentOrdenId(savedOrdenId)
    }
  }, [slug, mesaNumero])

  const loadMenu = async () => {
    try {
      setLoading(true)
      const data = await menuService.getPublicMenu(slug)
      
      setRestaurante(data.restaurante)
      setCategorias(data.categorias)
      
      if (data.categorias.length > 0) {
        setSelectedCategory(data.categorias[0].id)
      }
    } catch (error) {
      console.error('Error loading menu:', error)
      setError('Error al cargar el menú. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const initializeSession = async () => {
    try {
      const sesion = await menuService.createOrResumeSession(
        slug, 
        mesaNumero, 
        { mesaNumero: parseInt(mesaNumero) }
      )
      
      setSesionId(sesion.sessionToken)
      
      // Cargar carrito existente de la sesión
      if (sesion.metadata?.carrito) {
        setCarrito(sesion.metadata.carrito)
      }
    } catch (error) {
      console.error('Error initializing session:', error)
      showNotification('Error al inicializar la sesión', 'error')
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const addToCart = async (producto) => {
    try {
      const productoIdStr = String(producto.id)
      const existingItem = carrito.find(item => item.productoId === productoIdStr)
      let newCarrito

      if (existingItem) {
        newCarrito = carrito.map(item =>
          item.productoId === productoIdStr
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      } else {
        newCarrito = [...carrito, {
          productoId: productoIdStr,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1
        }]
      }

      setCarrito(newCarrito)
      
      showNotification(`${producto.nombre} agregado al carrito`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      showNotification('Error al agregar al carrito', 'error')
    }
  }

  const updateQuantity = async (productoId, newQuantity) => {
    try {
      const productoIdStr = String(productoId)
      let newCarrito
      
      if (newQuantity <= 0) {
        newCarrito = carrito.filter(item => item.productoId !== productoIdStr)
      } else {
        newCarrito = carrito.map(item =>
          item.productoId === productoIdStr
            ? { ...item, cantidad: newQuantity }
            : item
        )
      }

      setCarrito(newCarrito)
      
    } catch (error) {
      console.error('Error updating quantity:', error)
      showNotification('Error al actualizar cantidad', 'error')
    }
  }

  const showOrderConfirmation = () => {
    if (carrito.length === 0) {
      showNotification('El carrito está vacío', 'error')
      return
    }
    setShowOrderModal(true)
  }

  const confirmOrder = async () => {
    try {
      setSubmittingOrder(true)
      
      // Primero actualizar el carrito en la sesión
      await fetch(`/api/cart/${sesionId}/clear`, { method: 'DELETE' })
      
      for (const item of carrito) {
        const requestBody = {
          productoId: String(item.productoId),
          cantidad: item.cantidad
        };
        
        // Solo agregar notas si no está vacío
        if (item.notas && item.notas.trim()) {
          requestBody.notas = item.notas.trim();
        }
        
        await fetch(`/api/cart/${sesionId}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
      }
      
      // Luego confirmar la orden con los datos del modal
      const response = await fetch(`/api/cart/${sesionId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreClienteFactura: orderDetails.nombreCliente.trim() || undefined,
          notas: orderDetails.notas.trim() || undefined
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error confirmando pedido')
      }
      
      // Guardar ID de orden para seguimiento
      setCurrentOrdenId(data.data.orden.id)
      localStorage.setItem(`orden_${slug}_${mesaNumero}`, data.data.orden.id)
      
      // Limpiar carrito y cerrar modales
      setCarrito([])
      setShowOrderModal(false)
      setOrderDetails({ nombreCliente: '', notas: '' })
      setShowCart(false)
      
      setOrderSubmitted(true)
      
      showNotification('¡Pedido enviado exitosamente!', 'success')
      
      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setOrderSubmitted(false)
      }, 3000)

    } catch (error) {
      console.error('Error confirming order:', error)
      showNotification('Error al enviar el pedido. Intenta de nuevo.', 'error')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const clearOrderTracking = () => {
    setCurrentOrdenId(null)
    localStorage.removeItem(`orden_${slug}_${mesaNumero}`)
  }

  const getTotalItems = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0)
  }

  const getTotalPrice = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0)
  }

  const formatCurrency = (amount) => {
    const currencyCode = restaurante?.moneda || 'USD'; // Usar moneda del restaurante o USD por defecto
    return formatMenuPrice(amount, currencyCode);
  }

  const selectedCategoryData = categorias.find(cat => cat.id === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={loadMenu}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  if (!restaurante) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurante no encontrado</h2>
          <p className="text-gray-600">El restaurante que buscas no existe o no está disponible.</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: restaurante?.backgroundColor || '#f3f4f6',
        backgroundImage: restaurante?.backgroundImage 
          ? `url(${getImageUrl(restaurante.backgroundImage)})` 
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header del restaurante */}
      <div 
        className="bg-white/90 backdrop-blur-sm shadow-sm relative"
        style={{
          backgroundImage: restaurante?.bannerUrl 
            ? `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${getImageUrl(restaurante.bannerUrl)})` 
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Layout mejorado del header con logo a la izquierda */}
          <div className="flex items-start space-x-6">
            {/* Logo del restaurante */}
            {restaurante.logoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={getImageUrl(restaurante.logoUrl)}
                  alt={restaurante.nombre}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
            )}
            
            {/* Información del restaurante */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{restaurante.nombre}</h1>
              {restaurante.descripcion && (
                <p className="text-gray-600 mb-3">{restaurante.descripcion}</p>
              )}
              
              {/* Info de contacto */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                {restaurante.telefono && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1 text-primary-600" />
                    <span>{restaurante.telefono}</span>
                  </div>
                )}
                {restaurante.direccion && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1 text-primary-600" />
                    <span>{restaurante.direccion}</span>
                  </div>
                )}
              </div>
              
              {/* Indicador de mesa */}
              {mesaNumero && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  Mesa {mesaNumero}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con overlay semitransparente */}
      <div className="relative">
        {/* Overlay para mejorar legibilidad cuando hay imagen de fondo */}
        {restaurante?.backgroundImage && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
        )}
        
        <div className="relative max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar de categorías */}
            <div className="lg:w-1/4">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-4 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h2>
                <div className="space-y-2">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id}
                      onClick={() => setSelectedCategory(categoria.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === categoria.id
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{categoria.nombre}</div>
                        <div className="text-sm opacity-75">{categoria.descripcion}</div>
                        <div className="text-xs mt-1">
                          {categoria.productos?.length || 0} productos
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="lg:w-1/2">
              {selectedCategoryData && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCategoryData.nombre}</h2>
                    <p className="text-gray-600 mt-1">{selectedCategoryData.descripcion}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {selectedCategoryData.productos
                      ?.filter(producto => producto.disponible)
                      ?.map((producto) => (
                      <div key={producto.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/80">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{producto.nombre}</h3>
                            <p className="text-gray-600 mt-1">{producto.descripcion}</p>
                            <p className="text-xl font-bold text-primary-600 mt-2">
                              {formatCurrency(producto.precio)}
                            </p>
                          </div>
                          
                          {producto.imagenUrl && (
                            <img
                              src={getImageUrl(producto.imagenUrl)}
                              alt={producto.nombre}
                              className="w-20 h-20 object-cover rounded-lg ml-4"
                            />
                          )}
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => addToCart(producto)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Carrito */}
            <div className="lg:w-1/4">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-4 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Tu Pedido</h2>
                  <div className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                    {getTotalItems()} items
                  </div>
                </div>

                {carrito.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tu carrito está vacío</p>
                    <p className="text-sm text-gray-400 mt-1">Agrega productos para hacer tu pedido</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carrito.map((item) => (
                      <div key={item.productoId} className="flex items-center justify-between py-2 border-b border-gray-200">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                          <p className="text-sm text-gray-600">{formatCurrency(item.precio)}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <MinusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                            {item.cantidad}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <PlusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatCurrency(getTotalPrice())}
                        </span>
                      </div>

                      <button
                        onClick={showOrderConfirmation}
                        disabled={submittingOrder || carrito.length === 0}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {submittingOrder ? 'Enviando...' : 'Confirmar Pedido'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de seguimiento de orden */}
      <OrderStatusBanner 
        ordenId={currentOrdenId}
        restauranteSlug={slug}
      />

      {/* Notificaciones */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <XMarkIcon className="h-5 w-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Modal de confirmación de orden */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirmar Pedido</h3>
              <p className="text-gray-600">
                Agrega tu nombre para identificar tu orden (opcional)
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu nombre (opcional)
                </label>
                <input
                  type="text"
                  value={orderDetails.nombreCliente}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, nombreCliente: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: Juan Pérez"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas especiales (opcional)
                </label>
                <textarea
                  value={orderDetails.notas}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, notas: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ej: Sin cebolla, extra picante, alérgico a..."
                  maxLength={1000}
                />
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Resumen de tu pedido</h4>
              <div className="space-y-1">
                {carrito.map((item) => (
                  <div key={item.productoId} className="flex justify-between text-sm">
                    <span>{item.cantidad}x {item.nombre}</span>
                    <span>{formatCurrency(item.precio * item.cantidad)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-primary-600">{formatCurrency(getTotalPrice())}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={submittingOrder}
              >
                Cancelar
              </button>
              <button
                onClick={confirmOrder}
                disabled={submittingOrder}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submittingOrder ? 'Enviando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {orderSubmitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Pedido enviado exitosamente!</h3>
            <p className="text-gray-600 mb-6">
              Tu pedido ha sido enviado al restaurante. Puedes seguir el estado de tu orden desde el banner que aparecerá abajo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicMenuPage 