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
import menuService from '../services/menuService'
import OrderStatusBanner from '../components/OrderStatusBanner'
import { formatMenuPrice, formatOrderTotal } from '../utils/currencyUtils'
import NamePromptModal from '../components/NamePromptModal'

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // Comprueba que no sea una URL relativa que empiece con "undefined"
  if (url.startsWith('undefined')) return false;
  // Comprueba que sea una URL http o https
  return url.startsWith('http://') || url.startsWith('https://');
};

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
  const [cart, setCart] = useState(null)
  const [sesionId, setSesionId] = useState(null)
  const [currentOrdenId, setCurrentOrdenId] = useState(null)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  // Estados UI
  const [showCart, setShowCart] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  // Función para hacer scroll suave a la categoría seleccionada
  const scrollToSelectedCategory = (categoryId) => {
    const button = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (button) {
      button.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  useEffect(() => {
    if (slug) {
      loadMenu()
      // Only prompt for name if a table number is present in the URL
      if (mesaNumero) {
      const savedName = localStorage.getItem(`customerName_${slug}_${mesaNumero}`)
      if (savedName) {
        setCustomerName(savedName)
      } else {
        setTimeout(() => setIsNameModalOpen(true), 500)
      }
    }
    }
  }, [slug, mesaNumero])

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
      const sesion = await menuService.createOrResumeSession(slug, mesaNumero)
      setSesionId(sesion.id)
      
      // Si hay un nombre guardado y la sesión no lo tiene, actualizarla
      const savedName = localStorage.getItem(`customerName_${slug}_${mesaNumero}`)
      if (savedName && !sesion.clienteNombre) {
        try {
          await menuService.updateSession(sesion.id, { clienteNombre: savedName })
        } catch (error) {
          console.error('Error updating session with saved name:', error)
        }
      }
      
      const initialCart = await menuService.getCart(sesion.id)
      setCart(initialCart)

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
      const updatedCart = await menuService.addToCart(sesionId, producto.id, 1)
      setCart(updatedCart)
      showNotification(`${producto.nombre} agregado al carrito`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      showNotification('Error al agregar al carrito', 'error')
    }
  }

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      const updatedCart = await menuService.updateCartItem(sesionId, itemId, newQuantity);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating quantity:', error)
      showNotification('Error al actualizar cantidad', 'error')
    }
  }

  const handleNameSubmit = async (name) => {
    try {
      setCustomerName(name)
      localStorage.setItem(`customerName_${slug}_${mesaNumero}`, name)
      
      // Actualizar la sesión con el nombre del cliente
      if (sesionId) {
        await menuService.updateSession(sesionId, { clienteNombre: name })
      }
      
      setIsNameModalOpen(false)
      showNotification(`¡Hola, ${name}! Bienvenido.`, 'success')
    } catch (error) {
      console.error('Error updating session with customer name:', error)
      // Aún así permitir continuar, solo mostrar advertencia
    setCustomerName(name)
    localStorage.setItem(`customerName_${slug}_${mesaNumero}`, name)
    setIsNameModalOpen(false)
    showNotification(`¡Hola, ${name}! Bienvenido.`, 'success')
    }
  }

  const showOrderConfirmation = () => {
    if (!cart || cart.items.length === 0) {
      showNotification('El carrito está vacío', 'error')
      return
    }
    if (!customerName) {
      setIsNameModalOpen(true)
      showNotification('Por favor, ingresa un nombre para tu pedido', 'error')
      return
    }
    setShowOrderModal(true)
  }

  const confirmOrder = async () => {
    if (!sesionId) {
      showNotification('La sesión no es válida. Recarga la página.', 'error')
      return
    }
    
    try {
      setSubmittingOrder(true)
      const data = await menuService.confirmOrder(sesionId, {
        nombreClienteFactura: customerName,
        notas: orderNotes.trim() || undefined,
      });
      
      setCurrentOrdenId(data.orden.id)
      localStorage.setItem(`orden_${slug}_${mesaNumero}`, data.orden.id)
      
      setCart(null)
      setShowOrderModal(false)
      setOrderNotes('')
      
      setOrderSubmitted(true)
      showNotification('¡Pedido enviado exitosamente!', 'success')
      
      setTimeout(() => setOrderSubmitted(false), 3000)

    } catch (error) {
      console.error('Error confirming order:', error)
      showNotification(error.message || 'Error al enviar el pedido. Intenta de nuevo.', 'error')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const clearOrderTracking = () => {
    setCurrentOrdenId(null)
    localStorage.removeItem(`orden_${slug}_${mesaNumero}`)
  }

  const getTotalItems = () => {
    return cart?.items?.reduce((total, item) => total + item.cantidad, 0) || 0
  }

  const getTotalPrice = () => {
    return cart?.total || 0;
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

  // Estilo para el contenedor principal de la página
  const pageStyle = restaurante?.backgroundImage && isValidImageUrl(restaurante.backgroundImage) ? {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(${restaurante.backgroundImage})`,
    backgroundAttachment: 'fixed',
    backgroundSize: 'cover'
  } : {
    backgroundColor: restaurante?.backgroundColor || '#F9FAFB' // Un gris muy claro por defecto
  };
  
  // Estilo para el banner (encabezado) - overlay más suave para mejor visibilidad
  const bannerStyle = restaurante?.bannerUrl && isValidImageUrl(restaurante.bannerUrl) ? {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.25)), url(${restaurante.bannerUrl})`,
  } : {
    backgroundColor: '#374151' // Un gris oscuro si no hay banner
  };

  return (
    <div className="min-h-screen" style={pageStyle}>
      {/* CSS para ocultar scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <NamePromptModal 
        isOpen={isNameModalOpen}
        onSubmit={handleNameSubmit}
        restaurantName={restaurante?.nombre || 'este restaurante'}
      />

      {/* Banner Section */}
      <header 
        className="bg-cover bg-center py-8 md:py-12 text-white shadow-lg"
        style={bannerStyle}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-6 text-left">
            {/* Logo siempre a la izquierda */}
            {restaurante?.logoUrl && isValidImageUrl(restaurante.logoUrl) && (
              <div className="flex-shrink-0">
                <img
                  src={restaurante.logoUrl} 
                  alt={`${restaurante.nombre} logo`} 
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover shadow-2xl"
                />
              </div>
            )}
            
            {/* Info a la derecha */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6), 1px 1px 2px rgba(0,0,0,0.8)' }}>
                {restaurante?.nombre}
              </h1>
              {restaurante?.descripcion && (
                <p className="mt-2 text-sm sm:text-base md:text-lg opacity-95 leading-relaxed" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6), 0px 0px 1px rgba(0,0,0,0.8)' }}>
                  {restaurante.descripcion}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Pestañas de categorías horizontales */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm mb-6 sticky top-0 z-10 border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex overflow-x-auto scrollbar-hide space-x-3 pb-2" 
               style={{
                 scrollbarWidth: 'none', 
                 msOverflowStyle: 'none',
                 scrollBehavior: 'smooth'
               }}>
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id}
                data-category-id={categoria.id}
                onClick={() => {
                  setSelectedCategory(categoria.id);
                  setTimeout(() => scrollToSelectedCategory(categoria.id), 100);
                }}
                className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap border-2 ${
                        selectedCategory === categoria.id
                    ? 'bg-primary-600 text-white shadow-lg border-primary-600 scale-105'
                    : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border-gray-200 hover:border-primary-300'
                      }`}
                style={{
                  minWidth: 'fit-content'
                }}
              >
                <span className="font-semibold">{categoria.nombre}</span>
                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                  selectedCategory === categoria.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {categoria.productos?.length || 0}
                </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

      {/* Contenido del menú */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Contenido principal */}
            <div className="lg:w-2/3">
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
                              src={producto.imagenUrl}
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
            <div className="lg:w-1/3">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-4 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Tu Pedido</h2>
                  <div className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                    {getTotalItems()} items
                  </div>
                </div>

                {!cart || cart.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tu carrito está vacío</p>
                    <p className="text-sm text-gray-400 mt-1">Agrega productos para hacer tu pedido</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.producto.nombre}</h4>
                          <p className="text-sm text-gray-600">{formatCurrency(item.producto.precio)}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <MinusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                            {item.cantidad}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
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
                        disabled={submittingOrder || !cart || cart.items.length === 0}
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
      </main>

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

      {/* Order Confirmation Modal (simplificado) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900">Confirmar Pedido</h2>
            <p className="text-gray-600 mt-2">
              Tu pedido para <span className="font-semibold">{customerName}</span> está casi listo.
            </p>
            <div className="mt-4">
              <label htmlFor="order-notes" className="block text-sm font-medium text-gray-700">
                Notas para la cocina (opcional)
              </label>
              <textarea
                id="order-notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: sin cebolla, muy picante..."
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={submittingOrder}
              >
                Cancelar
              </button>
              <button
                onClick={confirmOrder}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                disabled={submittingOrder}
              >
                {submittingOrder ? 'Enviando...' : 'Enviar Pedido'}
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