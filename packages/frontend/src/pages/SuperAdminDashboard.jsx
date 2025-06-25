import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { superAdminAuth, subscriptionsService, superAdminUtils, superAdminService } from '../services/superAdminService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncingPlans, setSyncingPlans] = useState(false);
  const [autoBlockLoading, setAutoBlockLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAutoBlockModal, setShowAutoBlockModal] = useState(false);
  const navigate = useNavigate();

  // Set dynamic page title
  useDocumentTitle('MenuView.app | Superadmin Panel');

  useEffect(() => {
    // Verificar autenticación
    if (!superAdminAuth.isAuthenticated()) {
      navigate('/super-admin/login');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas y suscripciones próximas a vencer en paralelo
      const [statsResponse, expiringResponse] = await Promise.all([
        subscriptionsService.getStats(),
        subscriptionsService.getExpiringSubscriptions(7)
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (expiringResponse.success) {
        setExpiringSubscriptions(expiringResponse.data.suscripciones || []);
      }

    } catch (error) {
      setError(error.message || 'Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await superAdminAuth.logout();
    navigate('/super-admin/login');
  };

  const handleSyncPlans = async () => {
    try {
      setSyncingPlans(true);
      await superAdminService.syncRestaurantPlans();
      loadDashboardData();
    } catch (error) {
      setError(error.message || 'Error sincronizando planes');
    } finally {
      setSyncingPlans(false);
    }
  };

  const handleAutoBlockExpired = async (dryRun = false) => {
    try {
      setAutoBlockLoading(true);
      const response = await superAdminService.autoBlockExpiredSubscriptions({
        gracePeriodDays: 3,
        dryRun,
        notifyUsers: true
      });
      
      if (response.success) {
        alert(response.message);
        if (!dryRun) {
          loadDashboardData(); // Recargar datos después del bloqueo real
        }
      }
    } catch (error) {
      setError(error.message || 'Error en bloqueo automático');
    } finally {
      setAutoBlockLoading(false);
      setShowAutoBlockModal(false);
    }
  };

  const currentUser = superAdminAuth.getCurrentUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Sistema de gestión de suscripciones</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser?.nombre} {currentUser?.apellido}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              <Link
                to="/super-admin/settings"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2"
              >
                Configuración
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Suscripciones */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-2 4h2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Suscripciones</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.resumen.totalSuscripciones}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Suscripciones Activas */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Activas</dt>
                      <dd className="text-lg font-medium text-green-600">{stats.resumen.suscripcionesActivas}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Próximas a Vencer */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Vencen en 7 días</dt>
                      <dd className="text-lg font-medium text-yellow-600">{stats.resumen.proximasAVencer7Dias}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingresos del Mes */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ingresos del Mes</dt>
                      <dd className="text-lg font-medium text-blue-600">{superAdminUtils.formatCurrency(stats.ingresos.mesActual)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Suscripciones Próximas a Vencer */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Suscripciones Próximas a Vencer
              </h3>
              
              {expiringSubscriptions.length === 0 ? (
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No hay suscripciones próximas a vencer</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringSubscriptions.slice(0, 5).map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{subscription.restaurante.nombre}</p>
                        <p className="text-xs text-gray-500">{subscription.plan.nombre}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-yellow-600">
                          {subscription.diasHastaVencimiento} días
                        </p>
                        <p className="text-xs text-gray-500">
                          {superAdminUtils.formatDate(subscription.fechaVencimiento)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {expiringSubscriptions.length > 5 && (
                    <button
                      onClick={() => navigate('/super-admin/expiring')}
                      className="w-full text-center py-2 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Ver todas ({expiringSubscriptions.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Distribución por Plan */}
          {stats && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Distribución por Plan
                </h3>
                
                <div className="space-y-3">
                  {stats.distribucionPorPlan.map((plan, index) => (
                    <div key={plan.planId || `plan-${index}`} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">{plan.planNombre}</span>
                      </div>
                      <span className="text-sm text-gray-500">{plan.cantidad} suscripciones</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              key="subscriptions-link"
              to="/super-admin/subscriptions"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-center font-medium transition-colors"
            >
              Ver Suscripciones
            </Link>
            <Link
              key="expiring-link"
              to="/super-admin/expiring"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-md text-center font-medium transition-colors"
            >
              Próximas a Vencer
            </Link>
            <Link
              key="notifications-link"
              to="/super-admin/notifications"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-center font-medium transition-colors"
            >
              Enviar Notificaciones
            </Link>
          </div>

          {/* Acciones administrativas */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Sincronizar Planes */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Sincronizar Planes</h4>
                  <p className="text-sm text-blue-700">
                    Sincroniza los planes de restaurantes con sus suscripciones activas
                  </p>
                </div>
                <button
                  onClick={handleSyncPlans}
                  disabled={syncingPlans}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {syncingPlans ? 'Sincronizando...' : 'Sincronizar Planes'}
                </button>
              </div>

              {/* Bloqueo Automático */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-orange-900">Bloqueo Automático</h4>
                  <p className="text-sm text-orange-700">
                    Bloquear automáticamente suscripciones vencidas (período de gracia: 3 días)
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAutoBlockExpired(true)}
                    disabled={autoBlockLoading}
                    className="inline-flex items-center px-3 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                  >
                    Simular
                  </button>
                  <button
                    onClick={() => setShowAutoBlockModal(true)}
                    disabled={autoBlockLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                  >
                    {autoBlockLoading ? 'Procesando...' : 'Ejecutar Bloqueo'}
                  </button>
                </div>
              </div>

              {/* Gestión de Planes */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-green-900">Gestión de Planes</h4>
                  <p className="text-sm text-green-700">
                    Crear, editar y gestionar los planes de suscripción
                  </p>
                </div>
                <Link
                  to="/super-admin/plans"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Gestionar Planes
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Gestión de Planes</h2>
            <Link
              to="/super-admin/plans"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Administrar Planes
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Crea, edita y administra los planes de suscripción disponibles para los restaurantes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div key="create-plans" className="text-center p-4 bg-gray-50 rounded-lg">
              <svg className="h-8 w-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-2 4h2" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Crear Planes</p>
              <p className="text-xs text-gray-500">Nuevos planes personalizados</p>
            </div>
            <div key="edit-plans" className="text-center p-4 bg-gray-50 rounded-lg">
              <svg className="h-8 w-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Editar Planes</p>
              <p className="text-xs text-gray-500">Modificar configuraciones</p>
            </div>
            <div key="stats-plans" className="text-center p-4 bg-gray-50 rounded-lg">
              <svg className="h-8 w-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">Ver Estadísticas</p>
              <p className="text-xs text-gray-500">Uso y rendimiento</p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Confirmación para Bloqueo Automático */}
      {showAutoBlockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Confirmar Bloqueo Automático
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Esta acción bloqueará automáticamente todas las suscripciones que estén vencidas por más de 3 días y suspenderá los restaurantes asociados.
                  </p>
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    ⚠️ Esta acción no se puede deshacer automáticamente.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={() => setShowAutoBlockModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleAutoBlockExpired(false)}
                    disabled={autoBlockLoading}
                    className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {autoBlockLoading ? 'Ejecutando...' : 'Confirmar Bloqueo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard; 