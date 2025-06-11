import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { superAdminService } from '../services/superAdminService';

const RenewSubscriptionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [renewalData, setRenewalData] = useState({
    meses: 1,
    planId: '',
    monto: '',
    metodoPago: '',
    referenciaPago: '',
    notas: ''
  });

  // Opciones de meses disponibles
  const monthOptions = [
    { value: 1, label: '1 mes', discount: 0 },
    { value: 3, label: '3 meses', discount: 5 },
    { value: 6, label: '6 meses', discount: 10 },
    { value: 9, label: '9 meses', discount: 15 },
    { value: 12, label: '12 meses', discount: 20 }
  ];

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    // Calcular monto automáticamente cuando cambian meses o plan
    if (subscription && plans.length > 0) {
      calculateAmount();
    }
  }, [renewalData.meses, renewalData.planId, subscription, plans]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subscriptionResponse, plansResponse] = await Promise.all([
        superAdminService.getSubscription(id),
        superAdminService.getPlans()
      ]);

      if (subscriptionResponse.success) {
        const sub = subscriptionResponse.data;
        setSubscription(sub);
        setRenewalData(prev => ({
          ...prev,
          planId: sub.planId // Set current plan as default
        }));
      }

      if (plansResponse.success) {
        setPlans(plansResponse.data);
      }

    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = () => {
    if (!subscription || !plans.length) return;

    const selectedPlan = plans.find(p => p.id === renewalData.planId) || subscription.plan;
    const monthOption = monthOptions.find(m => m.value === renewalData.meses);
    
    let baseAmount = selectedPlan.precio * renewalData.meses;
    let discountAmount = 0;

    if (monthOption && monthOption.discount > 0) {
      discountAmount = (baseAmount * monthOption.discount) / 100;
    }

    const finalAmount = baseAmount - discountAmount;

    setRenewalData(prev => ({
      ...prev,
      monto: finalAmount.toFixed(2)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!renewalData.meses || renewalData.meses < 1) {
      setError('Debe seleccionar al menos 1 mes');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await superAdminService.renewSubscription(id, {
        meses: parseInt(renewalData.meses),
        planId: renewalData.planId !== subscription.planId ? renewalData.planId : undefined,
        monto: parseFloat(renewalData.monto),
        metodoPago: renewalData.metodoPago || 'Renovación Manual',
        referenciaPago: renewalData.referenciaPago,
        notas: renewalData.notas
      });

      if (response.success) {
        setSuccess(response.message);
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/super-admin/subscriptions');
        }, 2000);
      }

    } catch (err) {
      setError(err.message || 'Error al renovar la suscripción');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysUntilExpiryColor = (days) => {
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 7) return 'text-orange-600 font-bold';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
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
          <p className="mt-2 text-gray-600">Cargando información de renovación...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Suscripción no encontrada</p>
          <Link to="/super-admin/subscriptions" className="text-indigo-600 hover:text-indigo-800">
            ← Volver a suscripciones
          </Link>
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
              <Link to="/super-admin/subscriptions" className="text-indigo-600 hover:text-indigo-800">
                ← Volver a Suscripciones
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Renovar Suscripción</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información actual de la suscripción */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información Actual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Restaurante</h3>
              <p className="text-lg font-semibold text-gray-900">{subscription.restaurante.nombre}</p>
              <p className="text-sm text-gray-500">{subscription.restaurante.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Plan Actual</h3>
              <p className="text-lg font-semibold text-gray-900">{subscription.plan.nombre}</p>
              <p className="text-sm text-gray-500">${subscription.plan.precio}/mes</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Estado</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(subscription.estado)}`}>
                {subscription.estado}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vencimiento</h3>
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
          </div>
        </div>

        {/* Formulario de renovación */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Renovar Suscripción</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de meses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Período de Renovación
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {monthOptions.map(option => {
                  const isSelected = renewalData.meses === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRenewalData(prev => ({ ...prev, meses: option.value }))}
                      className={`relative p-4 border rounded-lg text-center transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      {option.discount > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          {option.discount}% descuento
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cambio de plan opcional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan (opcional: cambiar plan)
              </label>
              <select
                value={renewalData.planId}
                onChange={(e) => setRenewalData(prev => ({ ...prev, planId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre} - ${plan.precio}/mes
                    {plan.id === subscription.planId && ' (Plan actual)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Total (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={renewalData.monto}
                  onChange={(e) => setRenewalData(prev => ({ ...prev, monto: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente, pero puede ajustarse</p>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={renewalData.metodoPago}
                  onChange={(e) => setRenewalData(prev => ({ ...prev, metodoPago: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar método</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Criptomonedas">Criptomonedas</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Referencia del pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia del Pago (opcional)
              </label>
              <input
                type="text"
                value={renewalData.referenciaPago}
                onChange={(e) => setRenewalData(prev => ({ ...prev, referenciaPago: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Número de referencia, comprobante, etc."
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales (opcional)
              </label>
              <textarea
                value={renewalData.notas}
                onChange={(e) => setRenewalData(prev => ({ ...prev, notas: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Notas internas sobre la renovación..."
              />
            </div>

            {/* Mensajes de estado */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-600">{success}</p>
                <p className="text-sm text-green-500 mt-1">Redirigiendo a la lista de suscripciones...</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <Link
                to="/super-admin/subscriptions"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </span>
                ) : (
                  `Renovar por ${renewalData.meses} mes${renewalData.meses !== 1 ? 'es' : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RenewSubscriptionPage; 