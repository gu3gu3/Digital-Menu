import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { superAdminService } from '../services/superAdminService';

const SendNotificationsPage = () => {
  const [searchParams] = useSearchParams();
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filters, setFilters] = useState({
    estado: '',
    planId: '',
    search: ''
  });

  const [notification, setNotification] = useState({
    tipo: searchParams.get('tipo') || 'RENOVACION_PROXIMA',
    titulo: '',
    mensaje: ''
  });

  const [templates] = useState({
    RENOVACION_PROXIMA: {
      titulo: 'Renovación de Suscripción Próxima',
      mensaje: 'Estimado cliente, su suscripción vencerá pronto. Para evitar interrupciones en el servicio, le recomendamos renovar su plan.'
    },
    SUSCRIPCION_VENCIDA: {
      titulo: 'Suscripción Vencida',
      mensaje: 'Su suscripción ha vencido. Para continuar disfrutando de nuestros servicios, por favor renueve su plan.'
    },
    CUENTA_SUSPENDIDA: {
      titulo: 'Cuenta Suspendida',
      mensaje: 'Su cuenta ha sido suspendida temporalmente. Para más información, póngase en contacto con nuestro equipo de soporte.'
    },
    PAGO_CONFIRMADO: {
      titulo: 'Pago Confirmado',
      mensaje: '¡Gracias! Su pago ha sido confirmado exitosamente y su suscripción ha sido renovada.'
    },
    UPGRADE_PLAN: {
      titulo: 'Actualización de Plan Disponible',
      mensaje: 'Tenemos nuevas funcionalidades disponibles. Considere actualizar su plan para acceder a más beneficios.'
    },
    BIENVENIDA: {
      titulo: '¡Bienvenido a MenuView!',
      mensaje: 'Gracias por unirse a MenuView. Estamos aquí para ayudarle a digitalizar su restaurante.'
    }
  });

  useEffect(() => {
    fetchSubscriptions();
    
    // Preseleccionar restaurantes si vienen en la URL
    const preselected = searchParams.get('preselected');
    if (preselected) {
      setSelectedSubscriptions(preselected.split(','));
    }
  }, [filters]);

  useEffect(() => {
    // Aplicar plantilla cuando cambia el tipo
    if (templates[notification.tipo]) {
      setNotification(prev => ({
        ...prev,
        titulo: templates[notification.tipo].titulo,
        mensaje: templates[notification.tipo].mensaje
      }));
    }
  }, [notification.tipo]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getSubscriptions({
        ...filters,
        limit: 100
      });
      setSubscriptions(response.data.suscripciones);
      setError('');
    } catch (err) {
      setError('Error al cargar las suscripciones');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSubscriptions.length === subscriptions.length) {
      setSelectedSubscriptions([]);
    } else {
      setSelectedSubscriptions(subscriptions.map(sub => sub.restauranteId));
    }
  };

  const handleSelectSubscription = (restauranteId) => {
    setSelectedSubscriptions(prev => {
      if (prev.includes(restauranteId)) {
        return prev.filter(id => id !== restauranteId);
      } else {
        return [...prev, restauranteId];
      }
    });
  };

  const handleSendNotifications = async () => {
    if (selectedSubscriptions.length === 0) {
      setError('Debe seleccionar al menos un destinatario');
      return;
    }

    if (!notification.titulo.trim() || !notification.mensaje.trim()) {
      setError('El título y mensaje son obligatorios');
      return;
    }

    try {
      setSending(true);
      setError('');
      
      await superAdminService.sendNotifications({
        restauranteIds: selectedSubscriptions,
        tipo: notification.tipo,
        titulo: notification.titulo,
        mensaje: notification.mensaje
      });
      
      setSuccess(`Notificaciones enviadas exitosamente a ${selectedSubscriptions.length} restaurantes`);
      setSelectedSubscriptions([]);
      setNotification({ tipo: 'RENOVACION_PROXIMA', titulo: '', mensaje: '' });
      
    } catch (err) {
      setError('Error al enviar las notificaciones');
      console.error('Error:', err);
    } finally {
      setSending(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando destinatarios...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Enviar Notificaciones</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de notificación */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Configurar Notificación</h2>
            
            {/* Tipo de notificación */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Notificación
              </label>
              <select
                value={notification.tipo}
                onChange={(e) => setNotification(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="RENOVACION_PROXIMA">Renovación Próxima</option>
                <option value="SUSCRIPCION_VENCIDA">Suscripción Vencida</option>
                <option value="CUENTA_SUSPENDIDA">Cuenta Suspendida</option>
                <option value="PAGO_CONFIRMADO">Pago Confirmado</option>
                <option value="UPGRADE_PLAN">Actualización de Plan</option>
                <option value="BIENVENIDA">Bienvenida</option>
              </select>
            </div>

            {/* Título */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Notificación
              </label>
              <input
                type="text"
                value={notification.titulo}
                onChange={(e) => setNotification(prev => ({ ...prev, titulo: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Título de la notificación..."
                maxLength={100}
              />
              <p className="text-sm text-gray-500 mt-1">{notification.titulo.length}/100 caracteres</p>
            </div>

            {/* Mensaje */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                value={notification.mensaje}
                onChange={(e) => setNotification(prev => ({ ...prev, mensaje: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Escriba el mensaje de la notificación..."
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">{notification.mensaje.length}/500 caracteres</p>
            </div>

            {/* Destinatarios seleccionados */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Destinatarios Seleccionados ({selectedSubscriptions.length})
              </h3>
              {selectedSubscriptions.length > 0 ? (
                <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
                  <p className="text-sm text-indigo-700">
                    {selectedSubscriptions.length} restaurante(s) seleccionado(s)
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-sm text-gray-500">
                    No hay destinatarios seleccionados
                  </p>
                </div>
              )}
            </div>

            {/* Botón enviar */}
            <button
              onClick={handleSendNotifications}
              disabled={sending || selectedSubscriptions.length === 0}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </span>
              ) : (
                `Enviar Notificaciones (${selectedSubscriptions.length})`
              )}
            </button>
          </div>

          {/* Lista de destinatarios */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Seleccionar Destinatarios</h2>
              <button
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                {selectedSubscriptions.length === subscriptions.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Nombre o email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.estado}
                  onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos</option>
                  <option value="ACTIVA">Activa</option>
                  <option value="VENCIDA">Vencida</option>
                  <option value="SUSPENDIDA">Suspendida</option>
                </select>
              </div>
            </div>

            {/* Lista de suscripciones */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((suscripcion) => (
                    <tr key={suscripcion.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSubscriptions.includes(suscripcion.restauranteId)}
                            onChange={() => handleSelectSubscription(suscripcion.restauranteId)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{suscripcion.restaurante.nombre}</div>
                            <div className="text-sm text-gray-500">{suscripcion.restaurante.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {suscripcion.restaurante.plan.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                            suscripcion.estado
                          )}`}
                        >
                          {suscripcion.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {subscriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No se encontraron restaurantes</p>
              </div>
            )}
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-green-400 text-xl">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-green-600">{success}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-400 hover:text-green-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plantillas de ejemplo */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Plantillas de Notificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(templates).map(([tipo, template]) => (
              <div key={tipo} className="border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">{template.titulo}</h4>
                <p className="text-sm text-gray-600 mb-3">{template.mensaje}</p>
                <button
                  onClick={() => setNotification({ tipo, titulo: template.titulo, mensaje: template.mensaje })}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Usar plantilla
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendNotificationsPage; 