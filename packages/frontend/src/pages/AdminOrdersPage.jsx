import { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  EyeIcon,
  BanknotesIcon,
  ClockIcon,
  FireIcon,
  CheckCircleIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderDetailsModal from '../components/OrderDetailsModal';
import apiRequest from '../services/api';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [activeSessions, setActiveSessions] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    estado: '',
    mesa: '',
    fecha: new Date().toISOString().split('T')[0] // Fecha de hoy por defecto
  });

  const tabs = [
    { id: 'all', name: 'Todas', icon: ClipboardDocumentListIcon, count: stats.total },
    { id: 'ENVIADA', name: 'Enviadas', icon: ClockIcon, count: stats.enviadas },
    { id: 'RECIBIDA', name: 'Recibidas', icon: CheckCircleIcon, count: stats.recibidas },
    { id: 'CONFIRMADA', name: 'Confirmadas', icon: HandRaisedIcon, count: stats.confirmadas },
    { id: 'EN_PREPARACION', name: 'En Cocina', icon: FireIcon, count: stats.enPreparacion },
    { id: 'LISTA', name: 'Listas', icon: EyeIcon, count: stats.listas },
    { id: 'SERVIDA', name: 'Servidas', icon: BanknotesIcon, count: stats.servidas },
    { id: 'COMPLETADA', name: 'Completadas', icon: CheckCircleIcon, count: stats.completadas }
  ];

  useEffect(() => {
    loadOrders();
    loadStats();
    loadActiveSessions();
  }, [activeTab, filters, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const queryFilters = {
        limit: 50,
        offset: 0,
        ...filters,
        search: searchTerm
      };

      if (activeTab !== 'all') {
        queryFilters.estado = activeTab;
      }
      
      const query = new URLSearchParams(queryFilters).toString();
      const response = await apiRequest(`/orders?${query}`);
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
      const response = await apiRequest('/orders/stats?period=today');
      setStats(response.data || response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const response = await apiRequest('/sessions/active');
      setActiveSessions(response.data?.sessions || response.sessions || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-NI', {
      day: '2-digit',
      month: '2-digit',
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

  const resetFilters = () => {
    setFilters({ 
      estado: '', 
      mesa: '', 
      fecha: new Date().toISOString().split('T')[0] // Mantener fecha de hoy
    });
    setSearchTerm('');
    setActiveTab('all');
  };

  const getOrderPriority = (order) => {
    const minutes = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60));
    if (order.estado === 'EN_PREPARACION' && minutes > 30) return 'high';
    if (order.estado === 'ENVIADA' && minutes > 15) return 'medium';
    return 'normal';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra todas las órdenes de tu restaurante
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={loadOrders}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Órdenes Hoy</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FireIcon className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">En Cocina</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.enPreparacion || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BanknotesIcon className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Ventas Hoy</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalVentas || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Mesas Activas</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{activeSessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtrar por Estado</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
          
          {/* Responsive Tabs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 border-primary-200 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium text-center leading-tight">{tab.name}</span>
                  <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por orden, mesa, cliente o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Mesa Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesa</label>
                <select
                  value={filters.mesa}
                  onChange={(e) => setFilters({ ...filters, mesa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todas las mesas</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Mesa {i + 1}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={filters.fecha}
                  onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Quick Date Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accesos rápidos</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, fecha: new Date().toISOString().split('T')[0] })}
                    className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setFilters({ ...filters, fecha: yesterday.toISOString().split('T')[0] });
                    }}
                    className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ayer
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, fecha: '' })}
                    className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Todas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Cargando órdenes...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mx-4">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={loadOrders}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes</h3>
            <p className="text-gray-500">No se encontraron órdenes que coincidan con los filtros aplicados.</p>
            <button
              onClick={resetFilters}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesero
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => {
                    const priority = getOrderPriority(order);
                    return (
                      <tr 
                        key={order.id} 
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          priority === 'high' ? 'bg-red-50 border-l-4 border-red-500' :
                          priority === 'medium' ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                        }`}
                        onClick={() => handleOrderClick(order)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.numeroOrden}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Mesa {order.mesa?.numero}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.nombreClienteFactura || order.sesion?.clienteNombre || 'Cliente anónimo'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.mesero ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">
                                    {order.mesero.nombre?.charAt(0)?.toUpperCase() || 'M'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.mesero.nombre} {order.mesero.apellido || ''}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Mesero
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <OrderStatusBadge status={order.estado} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items?.length || 0} items
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${
                            priority === 'high' ? 'text-red-600 font-semibold' :
                            priority === 'medium' ? 'text-yellow-600 font-medium' :
                            'text-gray-600'
                          }`}>
                            {getTimeElapsed(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
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
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          #{order.numeroOrden}
                        </h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Mesa {order.mesa?.numero}
                        </span>
                      </div>
                      <OrderStatusBadge status={order.estado} size="sm" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Cliente:</span>
                        <p className="font-medium text-gray-900">
                          {order.nombreClienteFactura || order.sesion?.clienteNombre || 'Cliente anónimo'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Hora:</span>
                        <p className="text-gray-900">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tiempo:</span>
                        <p className={`font-medium ${
                          priority === 'high' ? 'text-red-600' :
                          priority === 'medium' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {getTimeElapsed(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Información del Mesero en móvil */}
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-xs">Mesero:</span>
                      {order.mesero ? (
                        <div className="flex items-center mt-1">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-medium">
                              {order.mesero.nombre?.charAt(0)?.toUpperCase() || 'M'}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {order.mesero.nombre} {order.mesero.apellido || ''}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                          Sin asignar
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {order.items?.length || 0} productos
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order);
                        }}
                        className="text-xs text-primary-600 hover:text-primary-900 font-medium"
                      >
                        Ver detalles →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
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

export default AdminOrdersPage; 