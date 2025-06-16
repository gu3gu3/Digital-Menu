import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { superAdminService } from '../services/superAdminService';

const PlansManagementPage = () => {
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    limiteProductos: '',
    limiteCategorias: '',
    limiteMeseros: '',
    limiteMesas: '',
    limiteOrdenes: '',
    soporteEmail: false,
    soporteChat: false,
    analiticas: false,
    activo: true
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getAllPlans();
      setPlans(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar los planes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      precio: '',
      limiteProductos: '',
      limiteCategorias: '',
      limiteMeseros: '',
      limiteMesas: '',
      limiteOrdenes: '',
      soporteEmail: false,
      soporteChat: false,
      analiticas: false,
      activo: true
    });
    setShowEditModal(false);
    setSelectedPlan(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');

      // Preparar datos para envío
      const planData = {
        ...formData,
        precio: parseFloat(formData.precio),
        limiteProductos: parseInt(formData.limiteProductos) || -1,
        limiteCategorias: parseInt(formData.limiteCategorias) || -1,
        limiteMeseros: parseInt(formData.limiteMeseros) || -1,
        limiteMesas: parseInt(formData.limiteMesas) || -1,
        limiteOrdenes: parseInt(formData.limiteOrdenes) || -1,
      };

      await superAdminService.createPlan(planData);
      setSuccess('Plan creado exitosamente');
      setShowCreateModal(false);
      resetForm();
      fetchPlans();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Error al crear el plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPlan = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');

      // Preparar datos para envío
      const planData = {
        ...formData,
        precio: parseFloat(formData.precio),
        limiteProductos: parseInt(formData.limiteProductos) || -1,
        limiteCategorias: parseInt(formData.limiteCategorias) || -1,
        limiteMeseros: parseInt(formData.limiteMeseros) || -1,
        limiteMesas: parseInt(formData.limiteMesas) || -1,
        limiteOrdenes: parseInt(formData.limiteOrdenes) || -1,
      };

      await superAdminService.updatePlan(selectedPlan.id, planData);
      setSuccess('Plan actualizado exitosamente');
      setShowEditModal(false);
      resetForm();
      fetchPlans();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Error al actualizar el plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    try {
      setSubmitting(true);
      setError('');

      await superAdminService.deletePlan(selectedPlan.id);
      setSuccess('Plan eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedPlan(null);
      fetchPlans();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Error al eliminar el plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePlan = async (plan) => {
    try {
      setError('');
      await superAdminService.togglePlan(plan.id);
      setSuccess(`Plan ${plan.activo ? 'desactivado' : 'activado'} exitosamente`);
      fetchPlans();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Error al cambiar estado del plan');
    }
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      nombre: plan.nombre,
      precio: plan.precio.toString(),
      limiteProductos: plan.limiteProductos === -1 ? '' : plan.limiteProductos.toString(),
      limiteCategorias: plan.limiteCategorias === -1 ? '' : plan.limiteCategorias.toString(),
      limiteMeseros: plan.limiteMeseros === -1 ? '' : plan.limiteMeseros.toString(),
      limiteMesas: plan.limiteMesas === -1 ? '' : plan.limiteMesas.toString(),
      limiteOrdenes: plan.limiteOrdenes === -1 ? '' : plan.limiteOrdenes.toString(),
      soporteEmail: plan.soporteEmail,
      soporteChat: plan.soporteChat,
      analiticas: plan.analiticas,
      activo: plan.activo
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const formatLimit = (limit) => {
    return limit === -1 ? 'Ilimitado' : limit.toLocaleString();
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const renderFormFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Plan</label>
          <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>
        <div>
          <label htmlFor="precio" className="block text-sm font-medium text-gray-700">Precio (USD)</label>
          <input type="number" name="precio" id="precio" step="0.01" value={formData.precio} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Límites de Recursos</h3>
        <p className="text-sm text-gray-500">Dejar en blanco o poner -1 para ilimitado.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="limiteProductos" className="block text-sm font-medium text-gray-700">Productos</label>
            <input type="number" name="limiteProductos" id="limiteProductos" value={formData.limiteProductos} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Ilimitado si se deja vacío" />
          </div>
          <div>
            <label htmlFor="limiteCategorias" className="block text-sm font-medium text-gray-700">Categorías</label>
            <input type="number" name="limiteCategorias" id="limiteCategorias" value={formData.limiteCategorias} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Ilimitado si se deja vacío" />
          </div>
          <div>
            <label htmlFor="limiteMeseros" className="block text-sm font-medium text-gray-700">Meseros</label>
            <input type="number" name="limiteMeseros" id="limiteMeseros" value={formData.limiteMeseros} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Ilimitado si se deja vacío" />
          </div>
          <div>
            <label htmlFor="limiteMesas" className="block text-sm font-medium text-gray-700">Mesas</label>
            <input type="number" name="limiteMesas" id="limiteMesas" value={formData.limiteMesas} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Ilimitado si se deja vacío" />
          </div>
          <div>
            <label htmlFor="limiteOrdenes" className="block text-sm font-medium text-gray-700">Órdenes Mensuales</label>
            <input type="number" name="limiteOrdenes" id="limiteOrdenes" value={formData.limiteOrdenes} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Ilimitado si se deja vacío" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Características Adicionales</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input id="soporteEmail" name="soporteEmail" type="checkbox" checked={formData.soporteEmail} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="soporteEmail" className="font-medium text-gray-700">Soporte por Email</label>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input id="soporteChat" name="soporteChat" type="checkbox" checked={formData.soporteChat} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="soporteChat" className="font-medium text-gray-700">Soporte por Chat</label>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input id="analiticas" name="analiticas" type="checkbox" checked={formData.analiticas} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="analiticas" className="font-medium text-gray-700">Analíticas Avanzadas</label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input id="activo" name="activo" type="checkbox" checked={formData.activo} onChange={handleInputChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="activo" className="font-medium text-gray-700">Plan Activo</label>
            <p className="text-gray-500">Los planes inactivos no se pueden asignar a nuevas suscripciones.</p>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planes...</p>
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
              <Link
                to="/super-admin/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Planes</h1>
            </div>
            
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Crear Plan
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Alerts */}
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

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Límites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{plan.nombre}</div>
                          <div className="text-sm text-gray-500">{plan.descripcion}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(plan.precio)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                          <span>Productos: {formatLimit(plan.limiteProductos)}</span>
                          <span>Categorías: {formatLimit(plan.limiteCategorias)}</span>
                          <span>Meseros: {formatLimit(plan.limiteMeseros)}</span>
                          <span>Mesas: {formatLimit(plan.limiteMesas)}</span>
                          <span>Órdenes: {formatLimit(plan.limiteOrdenes)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Restaurantes: {plan._count.restaurantes}</div>
                          <div>Suscripciones: {plan._count.suscripciones}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          plan.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleTogglePlan(plan)}
                          className={`mr-3 ${
                            plan.activo 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {plan.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => openDeleteModal(plan)}
                          className="text-red-600 hover:text-red-900"
                          disabled={plan._count.restaurantes > 0 || plan._count.suscripciones > 0}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {plans.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-2 4h2" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No hay planes creados</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(true);
                    }}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Crear primer plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Plan</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                {renderFormFields()}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Creando...' : 'Crear Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Editar Plan: {selectedPlan.nombre}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditPlan} className="space-y-4">
                {renderFormFields()}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Actualizando...' : 'Actualizar Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Plan</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar el plan "{selectedPlan.nombre}"?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Esta acción no se puede deshacer.
                </p>
                {(selectedPlan._count.restaurantes > 0 || selectedPlan._count.suscripciones > 0) && (
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    No se puede eliminar: hay {selectedPlan._count.restaurantes} restaurantes y {selectedPlan._count.suscripciones} suscripciones asociadas.
                  </p>
                )}
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletePlan}
                  disabled={submitting || selectedPlan._count.restaurantes > 0 || selectedPlan._count.suscripciones > 0}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManagementPage; 