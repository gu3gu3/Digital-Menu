import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { superAdminService } from '../services/superAdminService';

const SubscriptionsListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  
  // Filtros
  const [filters, setFilters] = useState({
    estado: searchParams.get('estado') || '',
    planId: searchParams.get('planId') || '',
    vencenEn: searchParams.get('vencenEn') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });

  const [plans, setPlans] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, [filters]);

  const fetchPlans = async () => {
    try {
      const response = await superAdminService.getPlans();
      setPlans(response.data);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('No se pudieron cargar los planes. Intente de nuevo.');
      setPlans([]);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getSubscriptions(filters);
      setSubscriptions(response.data.suscripciones);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      setError('Error al cargar las suscripciones');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    // Actualizar URL
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && k !== 'limit') {
        newSearchParams.set(k, v);
      }
    });
    setSearchParams(newSearchParams);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadgeClass = (estado) => {
    const classes = {
      'ACTIVA': 'bg-green-100 text-green-800',
      'VENCIDA': 'bg-red-100 text-red-800',
      'SUSPENDIDA': 'bg-yellow-100 text-yellow-800',
      'CANCELADA': 'bg-gray-100 text-gray-800',
      'BLOQUEADA': 'bg-red-200 text-red-900'
    };
    return classes[estado] || 'bg-gray-100 text-gray-800';
  };

  const getDaysUntilExpiryColor = (days) => {
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 7) return 'text-orange-600 font-bold';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleDeleteRestaurant = async () => {
    if (!selectedRestaurant) return;

    try {
      setDeleting(true);
      const response = await superAdminService.deleteRestaurantCompletely(selectedRestaurant.id);
      
      if (response.success) {
        alert(`Restaurante "${selectedRestaurant.nombre}" eliminado completamente`);
        setShowDeleteModal(false);
        setSelectedRestaurant(null);
        fetchSubscriptions(); // Recargar la lista
      }
    } catch (error) {
      alert('Error al eliminar el restaurante: ' + (error.message || 'Error desconocido'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando suscripciones...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Suscripciones</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Restaurante
              </label>
              <input
                type="text"
                placeholder="Nombre, email o slug..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVA">Activa</option>
                <option value="VENCIDA">Vencida</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="BLOQUEADA">Bloqueada</option>
              </select>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <select
                value={filters.planId}
                onChange={(e) => handleFilterChange('planId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos los planes</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                ))}
              </select>
            </div>

            {/* Vencen en */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencen en
              </label>
              <select
                value={filters.vencenEn}
                onChange={(e) => handleFilterChange('vencenEn', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Cualquier fecha</option>
                <option value="7">7 días</option>
                <option value="15">15 días</option>
                <option value="30">30 días</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => {
                setFilters({
                  estado: '',
                  planId: '',
                  vencenEn: '',
                  search: '',
                  page: 1,
                  limit: 20
                });
                setSearchParams(new URLSearchParams());
              }}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Limpiar filtros
            </button>
            <p className="text-sm text-gray-600">
              {pagination.total || 0} suscripciones encontradas
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Lista de suscripciones */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map(suscripcion => (
                  <tr key={suscripcion.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{suscripcion.restaurante.nombre}</div>
                      <div className="text-sm text-gray-500">{suscripcion.restaurante.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{suscripcion.restaurante.plan.nombre}</div>
                      <div className="text-sm text-gray-500">${parseFloat(suscripcion.restaurante.plan.precio).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(suscripcion.estado)}`}
                      >
                        {suscripcion.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${getDaysUntilExpiryColor(suscripcion.diasHastaVencimiento)}`}>
                        {new Date(suscripcion.fechaVencimiento).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {suscripcion.diasHastaVencimiento >= 0 
                          ? `en ${suscripcion.diasHastaVencimiento} días`
                          : `hace ${-suscripcion.diasHastaVencimiento} días`
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {suscripcion.historialPagos && suscripcion.historialPagos.length > 0 ? (
                        <>
                          <div className="text-sm text-gray-900">${parseFloat(suscripcion.historialPagos[0].monto).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(suscripcion.historialPagos[0].fechaPago).toLocaleDateString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/super-admin/subscriptions/${suscripcion.id}`}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Ver Detalles
                        </Link>
                        <Link
                          to={`/super-admin/subscriptions/${suscripcion.id}/renew`}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Renovar
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedRestaurant({
                              id: suscripcion.restauranteId,
                              nombre: suscripcion.restaurante.nombre,
                              email: suscripcion.restaurante.email
                            });
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Eliminar Restaurante
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span> de{' '}
                    <span className="font-medium">{pagination.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {subscriptions.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-xl mb-2">No se encontraron suscripciones</p>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación para Eliminar Restaurante */}
      {showDeleteModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Eliminar Restaurante Completamente
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-3">
                    ¿Está seguro de que desea eliminar completamente el restaurante:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md mb-3">
                    <p className="font-medium text-gray-900">{selectedRestaurant.nombre}</p>
                    <p className="text-sm text-gray-600">{selectedRestaurant.email}</p>
                  </div>
                  <div className="text-left text-sm text-red-600 space-y-1">
                    <p className="font-medium">⚠️ Esta acción eliminará PERMANENTEMENTE:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Todos los usuarios administradores y meseros</li>
                      <li>Todas las mesas y códigos QR</li>
                      <li>Todo el menú (categorías y productos)</li>
                      <li>Todas las órdenes e historial</li>
                      <li>Todas las sesiones de mesa</li>
                      <li>La suscripción y historial de pagos</li>
                      <li>Todas las notificaciones</li>
                    </ul>
                    <p className="font-medium mt-2">🚨 Esta acción NO se puede deshacer.</p>
                  </div>
                </div>
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedRestaurant(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteRestaurant}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar Definitivamente'}
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

export default SubscriptionsListPage; 