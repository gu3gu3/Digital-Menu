import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { superAdminService } from '../services/superAdminService';

const ExpiringSubscriptionsPage = () => {
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchExpiringSubscriptions();
    fetchStats();
  }, [selectedPeriod]);

  const fetchExpiringSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getSubscriptions({
        vencenEn: selectedPeriod,
        limit: 50
      });
      setExpiringSubscriptions(response.data.suscripciones);
      setError('');
    } catch (err) {
      setError('Error al cargar las suscripciones próximas a vencer');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await superAdminService.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSendReminder = async (subscription) => {
    try {
      await superAdminService.sendNotifications({
        restauranteIds: [subscription.restauranteId],
        tipo: 'RENOVACION_PROXIMA',
        titulo: 'Renovación de Suscripción Próxima',
        mensaje: `Estimado cliente, su suscripción vencerá el ${superAdminService.formatDate(subscription.fechaVencimiento)}. Para evitar interrupciones en el servicio, le recomendamos renovar su plan.`
      });
      
      alert('Recordatorio enviado exitosamente');
    } catch (err) {
      alert('Error al enviar recordatorio');
      console.error('Error:', err);
    }
  };

  const getDaysUntilExpiryColor = (days) => {
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 3) return 'text-red-500 font-bold';
    if (days <= 7) return 'text-orange-500 font-bold';
    return 'text-yellow-600';
  };

  const getUrgencyBadgeClass = (days) => {
    if (days < 0) return 'bg-red-100 text-red-800 border-red-200';
    if (days <= 3) return 'bg-red-50 text-red-700 border-red-200';
    if (days <= 7) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  const getUrgencyLabel = (days) => {
    if (days < 0) return 'VENCIDA';
    if (days <= 3) return 'CRÍTICO';
    if (days <= 7) return 'URGENTE';
    return 'PRÓXIMO';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando suscripciones próximas a vencer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/super-admin/dashboard" className="text-indigo-600 hover:text-indigo-800">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Suscripciones Próximas a Vencer</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-red-800 font-bold text-sm">!</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-red-100 text-sm">Vencen en 7 días</p>
                <p className="text-2xl font-bold">{stats?.resumen?.proximasAVencer7Dias || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                  <span className="text-orange-800 font-bold text-sm">30</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-orange-100 text-sm">Vencen en 30 días</p>
                <p className="text-2xl font-bold">{stats?.resumen?.proximasAVencer30Dias || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg shadow p-6 text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-800 font-bold text-sm">✗</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-gray-100 text-sm">Ya Vencidas</p>
                <p className="text-2xl font-bold">{stats?.resumen?.suscripcionesVencidas || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro de período */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Filtrar por período</h2>
            <div className="flex space-x-4">
              {[
                { value: '7', label: '7 días', color: 'red' },
                { value: '15', label: '15 días', color: 'orange' },
                { value: '30', label: '30 días', color: 'yellow' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPeriod === period.value
                      ? `bg-${period.color}-100 text-${period.color}-800 border-2 border-${period.color}-300`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Lista de suscripciones */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Suscripciones que vencen en {selectedPeriod} días ({expiringSubscriptions.length})
            </h3>
          </div>

          {expiringSubscriptions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {expiringSubscriptions.map((subscription) => (
                <div key={subscription.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getUrgencyBadgeClass(subscription.diasHastaVencimiento)}`}>
                          {getUrgencyLabel(subscription.diasHastaVencimiento)}
                        </span>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {subscription.restaurante.nombre}
                          </h4>
                          <p className="text-sm text-gray-500">{subscription.restaurante.email}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Plan:</span>
                          <p className="font-medium">{subscription.restaurante.plan.nombre}</p>
                          <p className="text-gray-600">${subscription.restaurante.plan.precio}/mes</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Vencimiento:</span>
                          <p className={`font-medium ${getDaysUntilExpiryColor(subscription.diasHastaVencimiento)}`}>
                            {superAdminService.formatDate(subscription.fechaVencimiento)}
                          </p>
                          <p className={`text-xs ${getDaysUntilExpiryColor(subscription.diasHastaVencimiento)}`}>
                            {subscription.diasHastaVencimiento < 0 
                              ? `Vencida hace ${Math.abs(subscription.diasHastaVencimiento)} días`
                              : `${subscription.diasHastaVencimiento} días restantes`
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Estado:</span>
                          <p className={`font-medium ${
                            subscription.estado === 'ACTIVA' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {subscription.estado}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Último Pago:</span>
                          <p className="font-medium">
                            {subscription.historialPagos.length > 0 
                              ? superAdminService.formatDate(subscription.historialPagos[0].fechaPago)
                              : 'Sin pagos'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      <button
                        onClick={() => handleSendReminder(subscription)}
                        className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        📧 Recordatorio
                      </button>
                      <Link
                        to={`/super-admin/subscriptions/${subscription.id}/renew`}
                        className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        💳 Renovar
                      </Link>
                      <Link
                        to={`/super-admin/subscriptions/${subscription.id}`}
                        className="inline-flex items-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        👁️ Ver Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-2xl">✓</span>
                </div>
                <p className="text-xl mb-2">¡Excelente!</p>
                <p>No hay suscripciones próximas a vencer en {selectedPeriod} días</p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones masivas */}
        {expiringSubscriptions.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Masivas</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  const restauranteIds = expiringSubscriptions.map(sub => sub.restauranteId);
                  // Navegar a página de notificaciones con IDs preseleccionados
                  const params = new URLSearchParams();
                  params.set('preselected', restauranteIds.join(','));
                  params.set('tipo', 'RENOVACION_PROXIMA');
                  window.location.href = `/super-admin/notifications?${params.toString()}`;
                }}
                className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                📧 Enviar Recordatorios Masivos
              </button>
              
              <Link
                to="/super-admin/subscriptions"
                className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                📋 Ver Todas las Suscripciones
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiringSubscriptionsPage; 