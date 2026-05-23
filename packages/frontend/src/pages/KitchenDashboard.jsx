import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import ordersService from '../services/ordersService';
import apiClient from '../lib/apiClient';
import logo from '../assets/logo.png';
import useDocumentTitle from '../hooks/useDocumentTitle';

const KitchenDashboard = () => {
  useDocumentTitle('MenuView.app | KDS (Cocina)');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planName, setPlanName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('staffToken');
    const userData = localStorage.getItem('staffUser');
    
    if (!token || !userData) {
      navigate('/staff/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.rol !== 'COCINA') {
        navigate('/staff/dashboard');
        return;
      }
      setUser(parsedUser);
      // Fetch plan to see if it's restricted
      fetchPlan(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/staff/login');
    }
  }, [navigate]);

  const fetchPlan = async (parsedUser) => {
    try {
      // Usamos el auth/me que trae la información del restaurante y el plan
      const response = await apiClient.get('/auth/me');
      if (response.data?.data?.user?.restaurante) {
        setPlanName(response.data.data.user.restaurante.plan.nombre);
      }
    } catch (error) {
      console.warn('Could not fetch plan info:', error);
    }
  };

  useEffect(() => {
    if (user && planName && isPlanAllowed(planName)) {
      loadOrders();
      const interval = setInterval(loadOrders, 15000); // 15s refresh
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user, planName]);

  const isPlanAllowed = (plan) => {
    // Pro y Platinum permitidos
    return ['Plan Pro', 'Plan Platinum', 'Pro', 'Platinum'].includes(plan);
  };

  const loadOrders = async () => {
    try {
      // Necesitamos las órdenes CONFIRMADAS y EN_PREPARACION y LISTA
      const response = await ordersService.getOrders({ limit: 100 });
      let allOrders = response.data?.orders || response.orders || [];
      
      // Filtrar solo los estados de cocina (CONFIRMADA, EN_PREPARACION, LISTA)
      // Ordenamos por fecha de creación (las más antiguas primero)
      const kitchenOrders = allOrders
        .filter(o => ['CONFIRMADA', 'EN_PREPARACION', 'LISTA'].includes(o.estado))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
      setOrders(kitchenOrders);
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
      setError('Error al cargar las órdenes de cocina.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffUser');
    navigate('/staff/login');
  };

  const changeStatus = async (orderId, newStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus, '');
      loadOrders(); // Refresh after update
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Error al actualizar el estado de la orden');
    }
  };

  const calculateTime = (startTime) => {
    if (!startTime) return '0m';
    const diff = Math.floor((new Date() - new Date(startTime)) / 60000);
    return diff > 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff}m`;
  };

  const formatTimeStr = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diff = Math.floor((new Date(end) - new Date(start)) / 60000);
    return diff > 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p>Cargando panel de cocina...</p>
      </div>
    );
  }

  if (planName && !isPlanAllowed(planName)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-gray-900">Kitchen Display System</h1>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center border-t-4 border-primary-500">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <LockClosedIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Módulo Restringido</h2>
            <p className="text-gray-600 mb-6">
              El Módulo de Cocina (KDS) está disponible a partir del Plan Pro. Comunicate con tu administrador para actualizar el plan y aprovechar toda la visibilidad de tu cocina.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar por estados para el kanban
  const confirmadas = orders.filter(o => o.estado === 'CONFIRMADA');
  const enPreparacion = orders.filter(o => o.estado === 'EN_PREPARACION');
  const listas = orders.filter(o => o.estado === 'LISTA');

  const OrderCard = ({ order, type }) => (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 mb-4 ${
      type === 'CONFIRMADA' ? 'border-yellow-400' :
      type === 'EN_PREPARACION' ? 'border-orange-500' : 'border-green-500'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-lg text-gray-900">
          Orden #{order.id.slice(-4)}
        </div>
        <div className="flex items-center text-gray-500 text-sm font-medium">
          <ClockIcon className="h-4 w-4 mr-1" />
          {calculateTime(order.createdAt)}
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-3">
        Mesa: <span className="font-semibold text-gray-900">{order.mesa?.nombre || 'N/A'}</span>
      </div>
      
      <div className="space-y-2 mb-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex flex-col text-sm border-b border-gray-100 pb-2 last:border-0">
            <div className="flex justify-between items-start">
              <div className="flex space-x-2">
                <span className="font-bold text-primary-600">{item.cantidad}x</span>
                <span className="text-gray-800 font-medium">{item.producto.nombre}</span>
              </div>
            </div>
            {item.notas && <div className="text-xs text-red-500 italic mt-1 bg-red-50 p-1 rounded">Nota: {item.notas}</div>}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mb-4 border border-gray-100 space-y-1">
        {order.preparacionStartedAt && (
          <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
            <span className="text-gray-500">Inicio Prep:</span>
            <span className="font-medium">{formatTimeStr(order.preparacionStartedAt)}</span>
          </div>
        )}
        
        {order.preparacionFinishedAt && (
          <div className="flex justify-between">
            <span className="text-gray-500">Fin Prep:</span>
            <span className="font-medium">{formatTimeStr(order.preparacionFinishedAt)}</span>
          </div>
        )}

        {order.preparacionStartedAt && order.preparacionFinishedAt && (
          <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
            <span className="font-semibold text-gray-700">Tiempo de Cocción:</span>
            <span className="font-bold text-primary-600">{calculateDuration(order.preparacionStartedAt, order.preparacionFinishedAt)}</span>
          </div>
        )}
      </div>

      {order.notas && (
        <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mb-4 border border-yellow-200">
          <strong>Nota de orden:</strong> {order.notas}
        </div>
      )}

      <div className="flex space-x-2">
        {type === 'CONFIRMADA' && (
          <button 
            onClick={() => changeStatus(order.id, 'EN_PREPARACION')}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-medium flex items-center justify-center transition-colors"
          >
            <FireIcon className="h-4 w-4 mr-1" /> Preparar
          </button>
        )}
        {type === 'EN_PREPARACION' && (
          <button 
            onClick={() => changeStatus(order.id, 'LISTA')}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-medium flex items-center justify-center transition-colors"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" /> Marcar Lista
          </button>
        )}
        {type === 'LISTA' && (
          <div className="w-full text-center text-sm font-bold text-green-600 py-2 border border-green-200 bg-green-50 rounded">
            Esperando al Mesero
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-8 w-auto brightness-0 invert" />
          <h1 className="text-xl font-bold tracking-wider">Sistema de Display de Cocina</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium">
            <span className="bg-gray-800 px-3 py-1 rounded-full">{user?.nombre}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Columna Pendientes (Confirmadas) */}
          <div className="bg-gray-200 rounded-lg flex flex-col overflow-hidden">
            <div className="bg-yellow-400 text-yellow-900 font-bold py-3 px-4 flex justify-between items-center">
              <span>POR PREPARAR</span>
              <span className="bg-white text-yellow-800 rounded-full h-6 w-6 flex items-center justify-center text-sm">{confirmadas.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {confirmadas.map(order => <OrderCard key={order.id} order={order} type="CONFIRMADA" />)}
              {confirmadas.length === 0 && <div className="text-center text-gray-500 py-8 italic">No hay nuevas órdenes</div>}
            </div>
          </div>

          {/* Columna En Preparación */}
          <div className="bg-gray-200 rounded-lg flex flex-col overflow-hidden">
            <div className="bg-orange-500 text-white font-bold py-3 px-4 flex justify-between items-center">
              <span>EN PREPARACIÓN</span>
              <span className="bg-white text-orange-600 rounded-full h-6 w-6 flex items-center justify-center text-sm">{enPreparacion.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {enPreparacion.map(order => <OrderCard key={order.id} order={order} type="EN_PREPARACION" />)}
              {enPreparacion.length === 0 && <div className="text-center text-gray-500 py-8 italic">No hay órdenes en cocina</div>}
            </div>
          </div>

          {/* Columna Listas */}
          <div className="bg-gray-200 rounded-lg flex flex-col overflow-hidden">
            <div className="bg-green-500 text-white font-bold py-3 px-4 flex justify-between items-center">
              <span>LISTAS PARA ENTREGAR</span>
              <span className="bg-white text-green-600 rounded-full h-6 w-6 flex items-center justify-center text-sm">{listas.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {listas.map(order => <OrderCard key={order.id} order={order} type="LISTA" />)}
              {listas.length === 0 && <div className="text-center text-gray-500 py-8 italic">No hay órdenes esperando</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDashboard;
