import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  EyeIcon,
  HandRaisedIcon,
  XMarkIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import API_BASE_URL from '../config/api';

const OrderTracker = ({ ordenId, restauranteSlug, onClose }) => {
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Configuración de estados con colores y iconos
  const estadosConfig = {
    ENVIADA: {
      label: 'Orden Enviada',
      description: 'Tu orden ha sido enviada al restaurante',
      color: 'blue',
      icon: ClockIcon,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600'
    },
    RECIBIDA: {
      label: 'Orden Recibida',
      description: 'El restaurante ha recibido tu orden',
      color: 'purple',
      icon: CheckCircleIcon,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600'
    },
    CONFIRMADA: {
      label: 'Orden Confirmada',
      description: 'Tu orden ha sido confirmada y está en cola',
      color: 'indigo',
      icon: CheckCircleIcon,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600'
    },
    EN_PREPARACION: {
      label: 'En Preparación',
      description: 'Tu orden se está preparando en la cocina',
      color: 'orange',
      icon: FireIcon,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600'
    },
    LISTA: {
      label: 'Orden Lista',
      description: 'Tu orden está lista para ser servida',
      color: 'green',
      icon: EyeIcon,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600'
    },
    SERVIDA: {
      label: 'Orden Servida',
      description: 'Tu orden ha sido servida en tu mesa',
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
      description: 'Tu orden ha sido cancelada',
      color: 'red',
      icon: XMarkIcon,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600'
    }
  };

  // Orden de progreso de estados
  const estadosProgreso = ['ENVIADA', 'RECIBIDA', 'CONFIRMADA', 'EN_PREPARACION', 'LISTA', 'SERVIDA', 'COMPLETADA'];

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/public/orders/${ordenId}?restaurantSlug=${restauranteSlug}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'No se pudo obtener la orden.');
        }
        const data = await response.json();
        setOrden(data);
        setError('');
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ordenId && restauranteSlug) {
      fetchOrder();
      const intervalId = setInterval(fetchOrder, 20000); // Poll every 20 seconds
      return () => clearInterval(intervalId);
    }
  }, [ordenId, restauranteSlug]);

  const getCurrentStepIndex = () => {
    if (!orden) return 0;
    return estadosProgreso.indexOf(orden.estado);
  };

  const getStepStatus = (stepIndex) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const formatCurrency = (amount) => {
    return `C$ ${parseFloat(amount).toFixed(2)}`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-NI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando estado de tu orden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="text-center">
            <XMarkIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={fetchOrder}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Reintentar
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orden) return null;

  const estadoActual = estadosConfig[orden.estado];
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Seguimiento de Orden</h2>
              <p className="text-gray-600">#{orden.numeroOrden}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Estado Actual Destacado */}
        <div className={`p-6 ${estadoActual.bgColor} ${estadoActual.borderColor} border-l-4`}>
          <div className="flex items-center">
            <div className={`p-3 ${estadoActual.bgColor} rounded-full`}>
              <estadoActual.icon className={`h-8 w-8 ${estadoActual.iconColor}`} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className={`text-xl font-semibold ${estadoActual.textColor}`}>
                {estadoActual.label}
              </h3>
              <p className="text-gray-600 mt-1">{estadoActual.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                Última actualización: {formatTime(orden.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Progreso Visual */}
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Progreso de tu orden</h4>
          <div className="space-y-4">
            {estadosProgreso.map((estado, index) => {
              const config = estadosConfig[estado];
              const status = getStepStatus(index);
              const Icon = config.icon;

              return (
                <div key={estado} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : status === 'current'
                          ? `${config.bgColor} ${config.borderColor} ${config.iconColor}`
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {index < estadosProgreso.length - 1 && (
                      <div
                        className={`w-16 h-0.5 ml-2 ${
                          status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <p
                      className={`font-medium ${
                        status === 'completed' || status === 'current'
                          ? config.textColor
                          : 'text-gray-400'
                      }`}
                    >
                      {config.label}
                    </p>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalles de la Orden */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Detalles de tu orden</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Mesa</p>
              <p className="font-medium">Mesa {orden.mesa?.numero}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-medium text-lg">{formatCurrency(orden.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hora de pedido</p>
                              <p className="font-medium">{formatTime(orden.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Items</p>
              <p className="font-medium">{orden.items?.length || 0} productos</p>
            </div>
          </div>

          {/* Lista de productos */}
          <div className="space-y-2">
            <p className="font-medium text-gray-900">Productos ordenados:</p>
            {orden.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="font-medium">{item.producto?.nombre}</p>
                  <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                </div>
                <p className="font-medium">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <p>Se actualiza automáticamente cada 20 segundos</p>
            </div>
            <button
              onClick={onClose}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker; 