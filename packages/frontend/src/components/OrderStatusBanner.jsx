import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  EyeIcon,
  HandRaisedIcon,
  XMarkIcon,
  CreditCardIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import OrderTracker from './OrderTracker';
import menuService from '../services/menuService';
import { formatOrderTotal } from '../utils/currencyUtils';

const OrderStatusBanner = ({ ordenId, restauranteSlug, onClearOrder, tableNumber }) => {
  const [orden, setOrden] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  // Configuración de estados con colores
  const estadosConfig = {
    ENVIADA: {
      label: 'Orden Enviada',
      description: 'En espera de confirmación',
      color: 'blue',
      icon: ClockIcon,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600'
    },
    RECIBIDA: {
      label: 'Orden Recibida',
      description: 'El restaurante recibió tu orden',
      color: 'purple',
      icon: CheckCircleIcon,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600'
    },
    CONFIRMADA: {
      label: 'Orden Confirmada',
      description: 'Confirmada y en cola',
      color: 'indigo',
      icon: CheckCircleIcon,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600'
    },
    EN_PREPARACION: {
      label: 'En Preparación',
      description: 'Se está preparando en cocina',
      color: 'orange',
      icon: FireIcon,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600'
    },
    LISTA: {
      label: 'Orden Lista',
      description: 'Lista para ser servida',
      color: 'green',
      icon: EyeIcon,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600'
    },
    SERVIDA: {
      label: 'Orden Servida',
      description: 'Servida en tu mesa',
      color: 'emerald',
      icon: HandRaisedIcon,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600'
    },
    COMPLETADA: {
      label: 'Orden Completada',
      description: '¡Gracias por tu preferencia!',
      color: 'green',
      icon: CreditCardIcon,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600'
    },
    CANCELADA: {
      label: 'Orden Cancelada',
      description: 'Tu orden fue cancelada',
      color: 'red',
      icon: XMarkIcon,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600'
    }
  };

  useEffect(() => {
    if (!ordenId || !restauranteSlug) return;

    const fetchOrder = async () => {
    try {
        const response = await fetch(`/api/public/orden/${ordenId}?restaurantSlug=${restauranteSlug}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener el estado de la orden');
        }
      const data = await response.json();
        setOrden(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const interval = setInterval(fetchOrder, 30000); // Actualiza cada 30 segundos

    return () => clearInterval(interval);
  }, [ordenId, restauranteSlug]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/orden/${ordenId}?restaurantSlug=${restauranteSlug}`);
      if (!response.ok) {
        throw new Error('No se pudo obtener el estado de la orden');
      }
      const data = await response.json();
      setOrden(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    // Usar la moneda del restaurante si está disponible en la orden
    const currency = orden?.restaurante?.moneda || 'USD';
    return formatOrderTotal(amount, currency);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-NI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCallWaiter = async () => {
    setIsCalling(true);
    try {
      await menuService.callWaiter(ordenId);
      setCallSuccess(true);
      setTimeout(() => setCallSuccess(false), 3000); // Reset success message
    } catch (err) {
      console.error('Error calling waiter', err);
      // Podríamos mostrar un error específico si quisiéramos
    } finally {
      setTimeout(() => setIsCalling(false), 15000); // Re-enable after 15 seconds
    }
  };

  if (!ordenId || loading || !orden) return null;

  const estadoActual = estadosConfig[orden.estado];
  
  if (!estadoActual) {
    return null;
  }
  
  const Icon = estadoActual.icon;
  
  // No mostrar si la orden está completada o cancelada después de cierto tiempo
  const tiempoTranscurrido = new Date() - new Date(orden.updatedAt);
  const minutosTranscurridos = tiempoTranscurrido / (1000 * 60);
  
  // Para COMPLETADA: ocultar después de 2 minutos (orden finalizada y pagada)
  // Para CANCELADA: ocultar después de 5 minutos
  // Para otros estados: no ocultar automáticamente
  if (orden.estado === 'COMPLETADA' && minutosTranscurridos > 2) {
    return null;
  }
  
  if (orden.estado === 'CANCELADA' && minutosTranscurridos > 5) {
    return null;
  }

  return (
    <>
      <div className={`fixed bottom-4 left-4 right-4 z-40 ${estadoActual.bgColor} ${estadoActual.borderColor} border-l-4 rounded-lg shadow-lg backdrop-blur-sm`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${estadoActual.bgColor} rounded-full`}>
                <Icon className={`h-6 w-6 ${estadoActual.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold ${estadoActual.textColor}`}>
                    {estadoActual.label}
                  </h3>
                  <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                    #{orden.numeroOrden}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {estadoActual.description} • {formatCurrency(orden.total)} • {formatTime(orden.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleCallWaiter}
                disabled={isCalling}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isCalling 
                    ? 'bg-gray-200 cursor-not-allowed' 
                    : callSuccess 
                    ? 'bg-green-500 text-white transform scale-110'
                    : 'bg-primary-500 text-white hover:bg-primary-600 hover:scale-110'
                }`}
                title="Llamar al mesero"
              >
                {callSuccess ? <CheckCircleIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
              </button>
              <button onClick={fetchOrden} className="p-2 text-gray-500 hover:text-gray-800" title="Actualizar">
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowTracker(true)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${estadoActual.textColor} hover:bg-white hover:bg-opacity-50`}
                title="Ver detalles completos"
              >
                <span className="text-sm font-medium">Ver detalles</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Barra de progreso simple */}
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              orden.estado === 'ENVIADA' ? 'bg-blue-500 w-1/7' :
              orden.estado === 'RECIBIDA' ? 'bg-purple-500 w-2/7' :
              orden.estado === 'CONFIRMADA' ? 'bg-indigo-500 w-3/7' :
              orden.estado === 'EN_PREPARACION' ? 'bg-orange-500 w-4/7' :
              orden.estado === 'LISTA' ? 'bg-green-500 w-5/7' :
              orden.estado === 'SERVIDA' ? 'bg-emerald-500 w-6/7' :
              orden.estado === 'COMPLETADA' ? 'bg-green-600 w-full' :
              orden.estado === 'CANCELADA' ? 'bg-red-500 w-full' : 'w-0'
            }`}
          />
        </div>
      </div>

      {/* Modal de seguimiento completo */}
      {showTracker && (
        <OrderTracker
          ordenId={ordenId}
          restauranteSlug={restauranteSlug}
          onClose={() => setShowTracker(false)}
        />
      )}
    </>
  );
};

export default OrderStatusBanner; 