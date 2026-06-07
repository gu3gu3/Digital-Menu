import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, UserIcon, IdentificationIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import apiClient from '../lib/apiClient';
import { superAdminService } from '../services/superAdminService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const SubscriptionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Detalles de Suscripción | Super Admin');

  const [subscription, setSubscription] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Para asignar partner
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  
  // Para asignar sponsor
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsorId, setSelectedSponsorId] = useState('');
  const [savingSponsor, setSavingSponsor] = useState(false);
  
  // Para asignar dominio personalizado
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch Subscription details
      const subResponse = await superAdminService.getSubscription(id);
      if (subResponse.success) {
        setSubscription(subResponse.data);
        setSelectedPartnerId(subResponse.data.restaurante.partnerId || '');
        setSelectedSponsorId(subResponse.data.restaurante.sponsorId || '');
        setDomainInput(subResponse.data.restaurante.dominioPersonalizado || '');
      }

      // 2. Fetch Partners list
      const partnersResponse = await apiClient.get('/super-admin/partners');
      if (partnersResponse.data && partnersResponse.data.success) {
        setPartners(partnersResponse.data.data);
      }

      // 3. Fetch Sponsors list
      const sponsorsResponse = await apiClient.get('/super-admin/sponsors');
      if (sponsorsResponse.data && sponsorsResponse.data.success) {
        setSponsors(sponsorsResponse.data.data);
      }
      
    } catch (err) {
      setError(err.message || 'Error cargando detalles');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDomain = async () => {
    try {
      setSavingDomain(true);
      setError('');
      const response = await superAdminService.updateRestaurantDomain(subscription.restaurante.id, domainInput.trim() || null);
      if (response.success) {
        alert('Dominio personalizado actualizado correctamente');
        fetchData(); // Reload data
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar dominio');
    } finally {
      setSavingDomain(false);
    }
  };

  const handleAssignPartner = async () => {
    try {
      setSaving(true);
      setError('');
      
      const payload = {
        restauranteId: subscription.restaurante.id,
        partnerId: selectedPartnerId || null
      };

      const response = await apiClient.post('/super-admin/partners/assign-restaurant', payload);
      
      if (response.data.success) {
        alert('Agencia asignada correctamente');
        fetchData(); // Reload data
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al asignar agencia');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSponsor = async () => {
    try {
      setSavingSponsor(true);
      setError('');
      
      const payload = {
        restauranteId: subscription.restaurante.id,
        sponsorId: selectedSponsorId || null
      };

      const response = await apiClient.post('/super-admin/sponsors/assign-restaurant', payload);
      
      if (response.data.success) {
        alert('Sponsor asignado correctamente');
        fetchData(); // Reload data
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al asignar sponsor');
    } finally {
      setSavingSponsor(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error || 'Suscripción no encontrada'}</p>
          <button onClick={() => navigate('/super-admin/subscriptions')} className="text-indigo-600 hover:text-indigo-800">
            Volver a Suscripciones
          </button>
        </div>
      </div>
    );
  }

  const { restaurante, stats } = subscription;
  const planName = restaurante?.plan?.nombre || 'Plan Desconocido';
  const hasPartner = !!restaurante?.partner;
  const hasSponsor = !!restaurante?.sponsor;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link to="/super-admin/subscriptions" className="text-indigo-600 hover:text-indigo-800 font-medium">
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Detalles: {restaurante?.nombre}
              </h1>
            </div>
            <div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${subscription.estado === 'ACTIVA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {subscription.estado}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Basic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-5 border-t-4 border-indigo-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Plan Actual</p>
            <p className="text-xl font-bold text-gray-900">{planName}</p>
            <p className="text-xs text-gray-400 mt-1">Vence: {new Date(subscription.fechaVencimiento).toLocaleDateString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-t-4 border-green-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Usuarios</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsuariosAdmin || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-t-4 border-blue-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Menú (Productos)</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalProductos || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-t-4 border-orange-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Pagos Procesados</p>
            <p className="text-2xl font-bold text-gray-900">${stats?.montoTotalPagado || 0}</p>
            <p className="text-xs text-gray-400 mt-1">{stats?.totalPagos} transacciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Restaurant Info */}
          <div className="bg-white shadow rounded-lg md:col-span-2 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Información del Restaurante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{restaurante?.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Principal</p>
                <p className="font-medium text-gray-900">{restaurante?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">URL / Slug</p>
                <p className="font-medium text-blue-600">/{restaurante?.slug}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de Registro</p>
                <p className="font-medium text-gray-900">{new Date(subscription.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Partner Assignment Box */}
          <div className="bg-white shadow rounded-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4 border-b pb-2">
                <BuildingOfficeIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">Agencia / Partner</h3>
              </div>
              
              {hasPartner && (
                <div className="mb-4 bg-indigo-50 p-3 rounded-md border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">Agencia Actual</p>
                  <p className="font-bold text-gray-900 text-lg">{restaurante.partner.nombreAgencia}</p>
                  <p className="text-sm text-gray-600">{restaurante.partner.nombreContacto}</p>
                  <p className="text-xs text-gray-500 mt-1">Asignado: {new Date(restaurante.fechaAsignacionPartner).toLocaleDateString()}</p>
                  <p className="text-xs font-semibold text-green-700 mt-1">Comisión: {restaurante.partner.porcentajeComision}%</p>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reasignar o Remover Agencia
                </label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="">-- Sin Agencia Asignada --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombreAgencia} ({p.porcentajeComision}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAssignPartner}
                disabled={saving || selectedPartnerId === (restaurante?.partnerId || '')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Asignación'}
              </button>
            </div>
          </div>

          {/* Sponsor Assignment Box */}
          <div className="bg-white shadow rounded-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4 border-b pb-2">
                <BuildingOfficeIcon className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-medium text-gray-900">Sponsor B2B</h3>
              </div>
              
              {hasSponsor && (
                <div className="mb-4 bg-amber-50 p-3 rounded-md border border-amber-100">
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Sponsor Actual</p>
                  <p className="font-bold text-gray-900 text-lg">{restaurante.sponsor.nombreEmpresa}</p>
                  <p className="text-sm text-gray-600">{restaurante.sponsor.contactoName}</p>
                  <p className="text-xs text-gray-500 mt-1">{restaurante.sponsor.email}</p>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asignar o Remover Sponsor
                </label>
                <select
                  value={selectedSponsorId}
                  onChange={(e) => setSelectedSponsorId(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2 border"
                >
                  <option value="">-- Sin Sponsor Asignado --</option>
                  {sponsors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombreEmpresa} ({s.contactoName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAssignSponsor}
                disabled={savingSponsor || selectedSponsorId === (restaurante?.sponsorId || '')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              >
                {savingSponsor ? 'Guardando...' : 'Guardar Sponsor'}
              </button>
            </div>
          </div>
          
          {/* Custom Domain Assignment Box */}
          <div className="bg-white shadow rounded-lg p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4 border-b pb-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Dominio Personalizado</h3>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dominio Personalizado (CNAME)
                </label>
                <input
                  type="text"
                  placeholder="ej. menu.mirestaurante.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Introduce el dominio personalizado sin 'https://'. 
                  <br />Ej: <code>menu.mirestaurante.com</code> o <code>www.mirestaurante.com</code>
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAssignDomain}
                disabled={savingDomain || domainInput === (restaurante?.dominioPersonalizado || '')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {savingDomain ? 'Guardando...' : 'Guardar Dominio'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetailsPage;
