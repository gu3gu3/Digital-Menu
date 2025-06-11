import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import OrderDetailsModal from '../components/OrderDetailsModal';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ordersService from '../services/ordersService';
import logo from '../assets/logo.png';

const StaffDashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('staffToken');
    const userData = localStorage.getItem('staffUser');
    
    if (!token || !userData) {
      navigate('/staff/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/staff/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadOrders();
      loadStats();

      // Auto-refresh cada 15 segundos si está habilitado
      let interval;
      if (autoRefresh) {
        interval = setInterval(() => {
          loadOrders();
          loadStats();
        }, 15000);
      }

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [user, activeFilter, autoRefresh]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 50,
        offset: 0
      };

      if (activeFilter !== 'all') {
        params.estado = activeFilter;
      }

      // Solo mostrar órdenes de hoy por defecto para meseros
      params.fecha = new Date().toISOString().split('T')[0];

      const response = await ordersService.getOrders(params);
      setOrders(response.data?.orders || response.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ordersService.getOrderStats('today');
      setStats(response.data || response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleOrderUpdate = () => {
    loadOrders();
    loadStats();
  };

  const handleTakeOrder = async (orderId, event) => {
    event.stopPropagation(); // Prevent opening the modal

    try {
      await ordersService.takeOrder(orderId);
      loadOrders(); // Refresh orders
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error taking order:', error);
      setError('Error al tomar la orden: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffUser');
    navigate('/staff/login');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-NI', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `C$ ${parseFloat(amount).toFixed(2)}`;
  };

  const getTimeElapsed = (dateString) => {
    const minutes = Math.floor((new Date() - new Date(dateString)) / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getOrderPriority = (order) => {
    const minutes = Math.floor((new Date() - new Date(order.fechaOrden)) / (1000 * 60));
    if (order.estado === 'EN_PREPARACION' && minutes > 30) return 'high';
    if (order.estado === 'ENVIADA' && minutes > 15) return 'medium';
    return 'normal';
  };

  const filters = [
    { id: 'all', name: 'Todas', count: stats.total || 0 },
    { id: 'ENVIADA', name: 'Nuevas', count: stats.enviadas || 0, urgent: true },
    { id: 'EN_PREPARACION', name: 'En Cocina', count: stats.enPreparacion || 0 },
    { id: 'LISTA', name: 'Listas', count: stats.listas || 0, urgent: true },
    { id: 'SERVIDA', name: 'Servidas', count: stats.servidas || 0 }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img src={logo} alt="Menu View" className="h-8 w-auto" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary-600">menu</span>
                  <span className="text-sm font-bold text-secondary-600 -mt-1">view.app</span>
                </div>
              </div>
              <div className="ml-6 hidden md:block">
                <h1 className="text-lg font-semibold text-gray-900">
                  Portal de Meseros
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}
                title={autoRefresh ? 'Auto-actualización activa' : 'Auto-actualización pausada'}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>

              {/* Manual refresh */}
              <button
                onClick={() => { loadOrders(); loadStats(); }}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Actualizar ahora"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                  <p className="text-xs text-gray-500">Mesero</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.nombre?.charAt(0)?.toUpperCase() || 'M'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                  title="Cerrar sesión"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Hola, {user.nombre}! 👋
          </h2>
          <p className="text-gray-600">
            Aquí tienes las órdenes de hoy. {autoRefresh && '(Actualización automática cada 15 segundos)'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Hoy</p>
                <p className="text-xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FireIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">En Cocina</p>
                <p className="text-xl font-bold text-gray-900">{stats.enPreparacion || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <EyeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Listas</p>
                <p className="text-xl font-bold text-gray-900">{stats.listas || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Servidas</p>
                <p className="text-xl font-bold text-gray-900">{stats.servidas || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                } ${filter.urgent && filter.count > 0 ? 'ring-2 ring-red-200' : ''}`}
              >
                <span className="font-medium">{filter.name}</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeFilter === filter.id 
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {filter.count}
                </span>
                {filter.urgent && filter.count > 0 && (
                  <BellIcon className="h-4 w-4 ml-1 text-red-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-red-600 hover:text-red-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Cargando órdenes...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeFilter === 'all' ? 'No hay órdenes hoy' : `No hay órdenes ${filters.find(f => f.id === activeFilter)?.name.toLowerCase()}`}
              </h3>
              <p className="text-gray-500">
                {activeFilter === 'all' 
                  ? 'Las órdenes aparecerán aquí cuando los clientes hagan pedidos.'
                  : 'Cambia el filtro para ver órdenes en otros estados.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => {
                const priority = getOrderPriority(order);
                return (
                  <div 
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      priority === 'high' ? 'bg-red-50 border-l-4 border-red-500' :
                      priority === 'medium' ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Orden #{order.numeroOrden.split('-').pop()}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Mesa {order.mesa?.numero}
                          </span>
                          <OrderStatusBadge status={order.estado} size="sm" />
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <span>Cliente: {order.nombreClienteFactura || order.sesion?.clienteNombre || 'Cliente anónimo'}</span>
                          <span className="mx-2">•</span>
                          <span>{formatTime(order.fechaOrden)}</span>
                          <span className="mx-2">•</span>
                          <span className={`font-medium ${
                            priority === 'high' ? 'text-red-600' :
                            priority === 'medium' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {getTimeElapsed(order.fechaOrden)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {order.items?.length || 0} productos • {formatCurrency(order.total)}
                          {order.mesero && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-blue-600">
                                Mesero: {order.mesero.nombre} {order.mesero.apellido || ''}
                              </span>
                            </>
                          )}
                          {!order.mesero && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-amber-600">Sin asignar</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        {/* Take Order Button */}
                        {!order.mesero && order.estado === 'ENVIADA' && (
                          <button
                            onClick={(e) => handleTakeOrder(order.id, e)}
                            className="block w-full mb-2 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                          >
                            Tomar Orden
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                          className="text-primary-600 hover:text-primary-900 font-medium text-sm"
                        >
                          Ver detalles →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default StaffDashboard; 