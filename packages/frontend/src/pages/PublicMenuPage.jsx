import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useLocation } from 'react-router-dom'
import { 
  ShoppingBagIcon, XMarkIcon, PlusIcon, MinusIcon, TrashIcon,
  ChevronUpIcon, ChevronDownIcon, ClockIcon, MapPinIcon, CheckCircleIcon 
} from '@heroicons/react/24/outline'
import menuService from '../services/menuService'
import OrderStatusBanner from '../components/OrderStatusBanner'
import { formatMenuPrice, formatOrderTotal } from '../utils/currencyUtils'
import NamePromptModal from '../components/NamePromptModal'
import SplashOverlay from '../components/public/SplashOverlay'
import SponsorBanner from '../components/public/SponsorBanner'

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // Comprueba que no sea una URL relativa que empiece con "undefined"
  if (url.startsWith('undefined')) return false;
  // Comprueba que sea una URL http o https
  return url.startsWith('http://') || url.startsWith('https://');
};

const PublicMenuPage = ({ slugOverride }) => {
  const params = useParams()
  const activeSlug = slugOverride || params.slug
  const countryCode = params.countryCode
  const location = useLocation()
  const isExternalOrder = location.pathname.startsWith('/order/')
  
  const [searchParams] = useSearchParams()
  const mesaNumero = searchParams.get('mesa')

  // Estados principales
  const [restaurante, setRestaurante] = useState(null)
  
  // Definimos realSlug que siempre usará el slug oficial de la DB si está disponible
  const realSlug = restaurante?.slug || activeSlug;
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
  const [ultimoTotal, setUltimoTotal] = useState(0)
  const [tableInactiveMessage, setTableInactiveMessage] = useState('')

  // Estados UI
  const [showCart, setShowCart] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [showSplash, setShowSplash] = useState(false)
  
  // Estados para Pedidos Externos
  const [tipoPedido, setTipoPedido] = useState('RECOGER') // 'RECOGER' o 'A_DOMICILIO'
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [calculatedCostoEnvio, setCalculatedCostoEnvio] = useState(0)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')

  const isHotelMode = restaurante?.configuracion?.isHotelMode === true;

  // Estados Swipe
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = categorias.findIndex(c => c.id === selectedCategory)
      if (currentIndex === -1) return

      if (isLeftSwipe && currentIndex < categorias.length - 1) {
        const nextId = categorias[currentIndex + 1].id
        setSelectedCategory(nextId)
        setTimeout(() => scrollToSelectedCategory(nextId), 100)
      }
      if (isRightSwipe && currentIndex > 0) {
        const prevId = categorias[currentIndex - 1].id
        setSelectedCategory(prevId)
        setTimeout(() => scrollToSelectedCategory(prevId), 100)
      }
    }
  }

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
    if (activeSlug) {
      setCart({ items: [], total: 0 }); // Limpiar carrito al cambiar de restaurante
      loadMenu()
    }
  }, [activeSlug, countryCode, mesaNumero])

  // Lógica para coordinar el Splash y el Modal de Nombre (Se ejecuta cuando ya tenemos los datos del restaurante)
  useEffect(() => {
    if (restaurante && !loading) {
      const splashAlreadyShown = sessionStorage.getItem(`splashShown_${realSlug}`) === 'true';
      const splashCampaign = restaurante.sponsorActivo?.campanas?.find(c => c.position === 'SPLASH' || (!c.position && c.splashImageUrl));
      const hasActiveCampaign = !!splashCampaign;

      if (mesaNumero) {
        const savedName = localStorage.getItem(`customerName_${realSlug}_${mesaNumero}`)
        if (savedName) {
          setCustomerName(savedName)
          // Si ya tiene nombre y no ha visto el splash en esta sesión, mostrarlo
          if (hasActiveCampaign && !splashAlreadyShown) {
            setShowSplash(true)
          }
        } else {
          // Si no tiene nombre, el modal se abre. El splash se mostrará DESPUÉS de ingresar el nombre.
          setTimeout(() => setIsNameModalOpen(true), 500)
        }
      } else {
        // Vista pública (sin mesa). Mostrar splash si hay campaña.
        if (hasActiveCampaign && !splashAlreadyShown) {
          setShowSplash(true)
        }
      }
    }
  }, [restaurante, loading, activeSlug, mesaNumero])

  useEffect(() => {
    if (restaurante && mesaNumero) {
      initializeSession()
    }
  }, [restaurante, mesaNumero])

  // Cargar ID de orden guardado en localStorage al inicializar
  useEffect(() => {
    const savedOrdenId = localStorage.getItem(`orden_${realSlug}_${mesaNumero || 'externo'}`)
    if (savedOrdenId) {
      setCurrentOrdenId(savedOrdenId)
    }
  }, [realSlug, mesaNumero])

  const loadMenu = async () => {
    try {
      setLoading(true)
      const data = await menuService.getPublicMenu(activeSlug, countryCode)
      
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
      const sesion = await menuService.createOrResumeSession(realSlug, mesaNumero)
      setSesionId(sesion.id)
      setTableInactiveMessage('') // Limpiar mensaje si tuvo éxito
      
      const previousSesionId = localStorage.getItem(`lastSesionId_${realSlug}_${mesaNumero}`)
      
      if (previousSesionId !== sesion.id) {
        // La sesión cambió (el admin limpió la mesa o es una visita nueva)
        // Purgamos los datos locales de la sesión anterior
        localStorage.removeItem(`customerName_${realSlug}_${mesaNumero}`)
        localStorage.removeItem(`orden_${realSlug}_${mesaNumero}`)
        setCustomerName('')
        setCurrentOrdenId(null)
        setTimeout(() => setIsNameModalOpen(true), 500)
      } else {
        // Es la misma sesión actual, sincronizar nombre si es necesario
        const savedName = localStorage.getItem(`customerName_${realSlug}_${mesaNumero}`)
        if (savedName && !sesion.clienteNombre) {
          try {
            await menuService.updateSession(sesion.id, { clienteNombre: savedName })
          } catch (error) {
            console.error('Error updating session with saved name:', error)
          }
        }
      }
      
      // Guardar el nuevo id para la próxima vez
      localStorage.setItem(`lastSesionId_${realSlug}_${mesaNumero}`, sesion.id)
      
      // Iniciar con carrito local vacío
      setCart({ items: [], total: 0 })

    } catch (error) {
      console.error('Error initializing session:', error)
      const errorMessage = error.response?.data?.error || error.message;
      if (errorMessage && errorMessage.toLowerCase().includes('inactiva')) {
        setTableInactiveMessage(errorMessage);
        showNotification(errorMessage, 'error');
      } else {
        showNotification('Error al inicializar la sesión', 'error')
      }
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const addToCart = async (producto) => {
    try {
      setCart(prev => {
        const currentCart = prev || { items: [], total: 0 };
        const existingItemIndex = currentCart.items.findIndex(item => item.producto.id === producto.id);
        
        let newItems = [...currentCart.items];
        
        if (existingItemIndex >= 0) {
          const item = newItems[existingItemIndex];
          newItems[existingItemIndex] = {
            ...item,
            cantidad: item.cantidad + 1,
            subtotal: item.producto.precio * (item.cantidad + 1)
          };
        } else {
          newItems.push({
            id: `local_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
            productoId: producto.id,
            producto: producto,
            cantidad: 1,
            precioUnitario: producto.precio,
            subtotal: producto.precio
          });
        }
        
        const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        return { ...currentCart, items: newItems, total: newTotal };
      });
      showNotification(`${producto.nombre} agregado al carrito`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      showNotification('Error al agregar al carrito', 'error')
    }
  }

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      setCart(prev => {
        if (!prev) return prev;
        
        let newItems;
        if (newQuantity <= 0) {
          newItems = prev.items.filter(item => item.id !== itemId);
        } else {
          newItems = prev.items.map(item => 
            item.id === itemId 
              ? { ...item, cantidad: newQuantity, subtotal: item.producto.precio * newQuantity }
              : item
          );
        }
        
        const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        return { ...prev, items: newItems, total: newTotal };
      });
    } catch (error) {
      console.error('Error updating quantity:', error)
      showNotification('Error al actualizar cantidad', 'error')
    }
  }

  const handleNameSubmit = async (name) => {
    try {
      setCustomerName(name)
      localStorage.setItem(`customerName_${realSlug}_${mesaNumero}`, name)
      
      // Actualizar la sesión con el nombre del cliente
      if (sesionId) {
        await menuService.updateSession(sesionId, { clienteNombre: name })
      }
      
      setIsNameModalOpen(false)
      showNotification(`¡Hola, ${name}! Bienvenido.`, 'success')

      // Una vez ingresado el nombre, revisamos si toca mostrar el Splash
      const splashAlreadyShown = sessionStorage.getItem(`splashShown_${realSlug}`) === 'true';
      const splashCampaign = restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'SPLASH' || (!c.position && c.splashImageUrl));
      if (splashCampaign && !splashAlreadyShown) {
        setTimeout(() => {
          setShowSplash(true);
        }, 300); // Pequeño delay para que el modal se cierre visualmente primero
      }

    } catch (error) {
      console.error('Error updating session with customer name:', error)
      // Aún así permitir continuar, solo mostrar advertencia
      setCustomerName(name)
      localStorage.setItem(`customerName_${realSlug}_${mesaNumero}`, name)
      setIsNameModalOpen(false)
      showNotification(`¡Hola, ${name}! Bienvenido.`, 'success')
      
      // Una vez ingresado el nombre, revisamos si toca mostrar el Splash
      const splashAlreadyShown = sessionStorage.getItem(`splashShown_${realSlug}`) === 'true';
      const splashCampaign = restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'SPLASH' || (!c.position && c.splashImageUrl));
      if (splashCampaign && !splashAlreadyShown) {
        setTimeout(() => {
          setShowSplash(true);
        }, 300);
      }
    }
  }

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem(`splashShown_${realSlug}`, 'true');
  };

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
    // Si hay mesaNumero, la orden requiere sesión activa
    if (mesaNumero && !sesionId) {
      showNotification('La sesión no es válida. Recarga la página.', 'error')
      return
    }

    if (!mesaNumero) {
      if (tipoPedido === 'A_DOMICILIO' && (!direccion || direccion.trim() === '')) {
        showNotification('Por favor, ingresa tu dirección para el envío a domicilio', 'error')
        return
      }
      if (!telefono || telefono.trim() === '') {
        showNotification('Por favor, ingresa tu teléfono para contactarte', 'error')
        return
      }
      if (tipoPedido === 'A_DOMICILIO' && restaurante?.configuracion?.delivery?.enabled && !userLocation) {
        showNotification('Por favor, utiliza el botón para obtener tu ubicación GPS para el cálculo de envío', 'error')
        return
      }
    }
    
    try {
      setSubmittingOrder(true)
      
      const itemsParaBackend = cart.items.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        notas: ''
      }));

      let data;

      if (mesaNumero) {
        data = await menuService.confirmOrder(sesionId, {
          nombreClienteFactura: customerName,
          notas: orderNotes.trim() || undefined,
          items: itemsParaBackend
        });
      } else {
        data = await menuService.createExternalOrder({
          slug: realSlug,
          tipoPedido,
          datosCliente: {
            nombre: customerName,
            telefono: telefono.trim(),
            direccion: tipoPedido === 'A_DOMICILIO' ? direccion.trim() : undefined,
            coordenadas: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined
          },
          costoEnvio: tipoPedido === 'A_DOMICILIO' ? getDeliveryAmount() : 0,
          notas: orderNotes.trim() || undefined,
          items: itemsParaBackend
        });
      }
      
      setCurrentOrdenId(data.orden.id)
      localStorage.setItem(`orden_${realSlug}_${mesaNumero || 'externo'}`, data.orden.id)
      
      setUltimoTotal(getTotalPrice())
      setCart({ items: [], total: 0 })
      setShowOrderModal(false)
      setOrderNotes('')
      
      setOrderSubmitted(true)
      showNotification('¡Pedido enviado exitosamente!', 'success')
      
      setTimeout(() => setOrderSubmitted(false), 3000)

    } catch (error) {
      console.error('Error confirming order:', error)
      showNotification(error.response?.data?.error || error.message || 'Error al enviar el pedido. Intenta de nuevo.', 'error')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const clearOrderTracking = () => {
    setCurrentOrdenId(null)
    localStorage.removeItem(`orden_${activeSlug}_${mesaNumero}`)
  }

  const getTotalItems = () => {
    return cart?.items?.reduce((total, item) => total + item.cantidad, 0) || 0
  }

  const getSubtotalPrice = () => {
    return cart?.total || 0;
  }

  const getTaxAmount = () => {
    const ivaPct = restaurante?.configuracion?.iva || 0;
    return getSubtotalPrice() * (ivaPct / 100);
  }

  const getServiceAmount = () => {
    const servicePct = restaurante?.configuracion?.servicio || 0;
    return getSubtotalPrice() * (servicePct / 100);
  }

  const getDeliveryAmount = () => {
    if (tipoPedido === 'A_DOMICILIO') {
      // Si el GPS determinó un costo, se usa ese.
      if (calculatedCostoEnvio > 0) return calculatedCostoEnvio;
      // De lo contrario, si el restaurante tiene una tarifa base fija configurada, úsala como fallback
      if (restaurante?.configuracion?.delivery?.tarifaBase) {
        return Number(restaurante.configuracion.delivery.tarifaBase);
      }
    }
    return 0;
  }

  const getTotalPrice = () => {
    return getSubtotalPrice() + getTaxAmount() + getServiceAmount() + getDeliveryAmount();
  }

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const clientLat = position.coords.latitude;
        const clientLng = position.coords.longitude;
        setUserLocation({ lat: clientLat, lng: clientLng });
        
        // Calculate delivery fee if restaurant has delivery config
        const deliveryConfig = restaurante?.configuracion?.delivery;
        if (deliveryConfig && deliveryConfig.enabled && deliveryConfig.latitud && deliveryConfig.longitud) {
          const distanceKm = calculateDistance(
            deliveryConfig.latitud, 
            deliveryConfig.longitud,
            clientLat,
            clientLng
          );
          
          let costo = deliveryConfig.tarifaBase || 0;
          if (distanceKm > (deliveryConfig.kmBase || 0)) {
            const extraKm = distanceKm - (deliveryConfig.kmBase || 0);
            costo += extraKm * (deliveryConfig.costoKmExtra || 0);
          }
          
          setCalculatedCostoEnvio(Math.round(costo)); // Redondear
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('No pudimos acceder a tu ubicación. Verifica los permisos de tu navegador.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

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

  const primaryButtonColor = restaurante?.configuracion?.buttonColor || '#ea580c';

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
      
      {showSplash && (
        <SplashOverlay 
          campana={restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'SPLASH' || (!c.position && c.splashImageUrl))} 
          onComplete={handleSplashComplete} 
          restauranteId={restaurante?.id}
        />
      )}

      {restaurante?.sponsorActivo?.campanas?.some(c => c.position === 'BOTTOM') && (
        <SponsorBanner 
          campana={restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'BOTTOM')}
          restauranteId={restaurante?.id}
        />
      )}

      <NamePromptModal 
        isOpen={isNameModalOpen}
        onSubmit={handleNameSubmit}
        restaurantName={restaurante?.nombre || 'este restaurante'}
        isExternalOrder={isExternalOrder}
        isHotelMode={isHotelMode}
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
            {(restaurante?.configuracion?.mostrarNombreBanner !== false) && (
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
            )}
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
                  {categorias.map((categoria) => {
                    const isSelected = selectedCategory === categoria.id;
                    return (
                      <button
                        key={categoria.id}
                        data-category-id={categoria.id}
                        onClick={() => {
                          setSelectedCategory(categoria.id);
                          setTimeout(() => scrollToSelectedCategory(categoria.id), 100);
                        }}
                        className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap border-2 flex items-center ${
                          isSelected 
                            ? 'text-white shadow-md scale-105' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                        style={{
                          minWidth: 'fit-content',
                          backgroundColor: isSelected ? primaryButtonColor : undefined,
                          borderColor: isSelected ? primaryButtonColor : undefined,
                        }}
                      >
                        <span className="tracking-wide">{categoria.nombre}</span>
                        <span className={`ml-2 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {categoria.productos?.length || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

      {/* Contenido del menú */}
      <main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Contenido principal */}
            <div className="lg:w-2/3">
              {selectedCategoryData && (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
                  
                  {restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'TOP') && (
                    <div className="mb-6">
                      <SponsorBanner 
                        campana={restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'TOP')} 
                        restauranteId={restaurante?.id}
                      />
                    </div>
                  )}

                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCategoryData.nombre}</h2>
                    <p className="text-gray-600 mt-1">{selectedCategoryData.descripcion}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {selectedCategoryData.productos
                      ?.filter(producto => producto.disponible)
                      ?.map((producto, index) => (
                        <React.Fragment key={producto.id}>
                          {index === 2 && restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'IN_FEED') && (
                            <div className="col-span-1 lg:col-span-2 xl:col-span-3">
                              <SponsorBanner 
                                campana={restaurante?.sponsorActivo?.campanas?.find(c => c.position === 'IN_FEED')} 
                                restauranteId={restaurante?.id}
                              />
                            </div>
                          )}
                      <div className="border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{producto.nombre}</h3>
                            <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">{producto.descripcion}</p>
                            <p className="text-xl font-bold mt-3" style={{ color: primaryButtonColor }}>
                              <span translate="no">{formatCurrency(producto.precio)}</span>
                            </p>
                          </div>
                          
                          {producto.imagenUrl && (
                            <div className="flex-shrink-0 overflow-hidden rounded-xl w-24 h-24 shadow-sm">
                              <img
                                src={producto.imagenUrl}
                                alt={producto.nombre}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => addToCart(producto)}
                            disabled={!!tableInactiveMessage}
                            style={tableInactiveMessage ? {} : { backgroundColor: primaryButtonColor }}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                              tableInactiveMessage 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'text-white shadow hover:shadow-md hover:-translate-y-0.5'
                            }`}
                          >
                            <ShoppingBagIcon className="w-5 h-5" />
                            Agregar
                          </button>
                        </div>
                      </div>
                      </React.Fragment>
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
                  <div className="text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm" style={{ backgroundColor: primaryButtonColor }}>
                    {getTotalItems()} items
                  </div>
                </div>

                {tableInactiveMessage ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <XMarkIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{isHotelMode ? 'Habitación Inactiva' : 'Mesa Inactiva'}</h3>
                    <p className="text-gray-500 text-sm">
                      {tableInactiveMessage}
                    </p>
                  </div>
                ) : !cart || cart.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tu carrito está vacío</p>
                    <p className="text-sm text-gray-400 mt-1">Agrega productos para hacer tu pedido</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.producto.nombre}</h4>
                          <p className="text-sm text-gray-600"><span translate="no">{formatCurrency(item.producto.precio)}</span></p>
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
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm font-medium text-gray-900" translate="no">
                          {formatCurrency(getSubtotalPrice())}
                        </span>
                      </div>
                      
                      {restaurante?.configuracion?.iva > 0 && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">IVA ({restaurante.configuracion.iva}%):</span>
                          <span className="text-sm font-medium text-gray-900" translate="no">
                            {formatCurrency(getTaxAmount())}
                          </span>
                        </div>
                      )}
                      
                      {restaurante?.configuracion?.servicio > 0 && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">Servicio ({restaurante.configuracion.servicio}%):</span>
                          <span className="text-sm font-medium text-gray-900" translate="no">
                            {formatCurrency(getServiceAmount())}
                          </span>
                        </div>
                      )}
                      
                      {tipoPedido === 'A_DOMICILIO' && calculatedCostoEnvio > 0 && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">Costo de Envío:</span>
                          <span className="text-sm font-medium text-gray-900" translate="no">{formatCurrency(getDeliveryAmount())}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-4 mt-2 pt-2 border-t border-gray-100">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-primary-600" translate="no">
                          {formatCurrency(getTotalPrice())}
                        </span>
                      </div>

                      <button
                        onClick={showOrderConfirmation}
                        disabled={submittingOrder || !cart || cart.items.length === 0}
                        style={(submittingOrder || !cart || cart.items.length === 0) ? {} : { backgroundColor: primaryButtonColor }}
                        className={`w-full py-3.5 rounded-xl text-white font-bold transition-all duration-200 shadow-md flex justify-center items-center ${
                          (submittingOrder || !cart || cart.items.length === 0) 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                            : 'hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
                        }`}
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
        restauranteSlug={realSlug}
        onClearOrder={clearOrderTracking}
        primaryButtonColor={primaryButtonColor}
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
            <div className="mt-4 max-h-[60vh] overflow-y-auto px-1 scrollbar-hide">
              
              {!mesaNumero && !isHotelMode && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pedido</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="RECOGER"
                          checked={tipoPedido === 'RECOGER'}
                          onChange={(e) => setTipoPedido(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">Pasar a recoger</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="A_DOMICILIO"
                          checked={tipoPedido === 'A_DOMICILIO'}
                          onChange={(e) => setTipoPedido(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">A domicilio</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono *</label>
                    <input
                      type="tel"
                      id="telefono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ej: 8888-8888"
                    />
                  </div>

                  {tipoPedido === 'A_DOMICILIO' && (
                    <div className="mb-4">
                      <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega *</label>
                      {restaurante?.configuracion?.delivery?.enabled && (
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isGettingLocation}
                            className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${userLocation ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-600 hover:bg-primary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                          >
                            <MapPinIcon className="h-5 w-5 mr-2" />
                            {isGettingLocation ? 'Obteniendo GPS...' : (userLocation ? 'Ubicación obtenida ✓' : 'Obtener mi ubicación exacta para calcular envío')}
                          </button>
                          {locationError && <p className="mt-1 text-sm text-red-600">{locationError}</p>}
                        </div>
                      )}
                      <textarea
                        id="direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        rows="2"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Escribe detalles o referencias (Ej. Casa amarilla frente al parque)"
                      />
                    </div>
                  )}
                </>
              )}

              {isHotelMode && !mesaNumero && (
                <div className="mb-4">
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Número de Habitación *</label>
                  <input
                    type="text"
                    id="direccion"
                    value={direccion}
                    onChange={(e) => {
                      setDireccion(e.target.value);
                      if (tipoPedido !== 'PARA_COMER_AQUI') setTipoPedido('PARA_COMER_AQUI');
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ej: 204"
                    required
                  />
                </div>
              )}

              <label htmlFor="order-notes" className="block text-sm font-medium text-gray-700">
                Notas para la cocina (opcional)
              </label>
              <textarea
                id="order-notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows="2"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: sin cebolla, muy picante..."
              />
            </div>
            
            {/* Resumen del Costo Total */}
            <div className="mt-4 border-t border-gray-200 pt-4 px-1">
               <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                 <span>Subtotal:</span>
                 <span translate="no">{formatCurrency(getSubtotalPrice())}</span>
               </div>
               {getTaxAmount() > 0 && (
                 <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                   <span>IVA:</span>
                   <span translate="no">{formatCurrency(getTaxAmount())}</span>
                 </div>
               )}
               {getServiceAmount() > 0 && (
                 <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                   <span>Servicio:</span>
                   <span translate="no">{formatCurrency(getServiceAmount())}</span>
                 </div>
               )}
               {getDeliveryAmount() > 0 && (
                 <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                   <span>Envío a Domicilio:</span>
                   <span translate="no">{formatCurrency(getDeliveryAmount())}</span>
                 </div>
               )}
               <div className="flex justify-between items-center text-lg font-bold text-gray-900 mt-2">
                 <span>Total a Pagar:</span>
                 <span translate="no" className="text-primary-600">{formatCurrency(getTotalPrice())}</span>
               </div>
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
              Tu pedido ha sido enviado al restaurante por un total de <b className="text-gray-900">{formatCurrency(ultimoTotal)}</b>. Puedes seguir el estado de tu orden desde el banner que aparecerá abajo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicMenuPage 