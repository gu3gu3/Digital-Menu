import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../lib/apiClient';
import logo from '../../assets/logo.png';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const PartnerDashboard = () => {
  useDocumentTitle('MenuView.app | Dashboard de Agencia');
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState(null);
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('partnerToken');
    const partnerData = localStorage.getItem('partnerUser');
    
    if (!token || !partnerData) {
      navigate('/partner/login');
      return;
    }

    try {
      setPartner(JSON.parse(partnerData));
      loadData();
    } catch (e) {
      navigate('/partner/login');
    }
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, restRes] = await Promise.all([
        apiClient.get('/partner/stats'),
        apiClient.get('/partner/restaurantes')
      ]);
      setStats(statsRes.data?.data);
      setRestaurantes(restRes.data?.data || []);
    } catch (error) {
      console.error('Error loading partner data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('partnerToken');
    localStorage.removeItem('partnerUser');
    navigate('/partner/login');
  };

  const goToAiTools = (restauranteId) => {
    navigate(`/partner/ai-tools?restauranteId=${restauranteId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <h1 className="text-xl font-bold text-gray-900 border-l pl-3 ml-2 border-gray-300">Portal de Agencias</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-500 mr-2">Agencia:</span>
            <span className="font-semibold text-gray-900">{partner?.nombreAgencia}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Estadísticas de Comisiones */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen de Comisiones ({stats?.porcentajeComision}%)</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ganancias Mensuales</dt>
                      <dd className="text-2xl font-bold text-gray-900">${stats?.totalMonthlyComission?.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Comisiones Activas</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stats?.activeCommissionsCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-orange-500" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Comisiones Expiradas</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stats?.expiredCommissionsCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-purple-500" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Restaurantes Asignados</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stats?.totalRestaurants}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Restaurantes */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Restaurantes Administrados</h3>
            <p className="text-sm text-gray-500">Selecciona un restaurante para digitalizar su menú usando IA.</p>
          </div>
          <ul className="divide-y divide-gray-200">
            {restaurantes.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-500">
                No tienes restaurantes asignados actualmente.
              </li>
            ) : (
              restaurantes.map((rest) => (
                <li key={rest.id} className="hover:bg-gray-50 p-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary-600 truncate">{rest.nombre}</div>
                        <div className="text-sm text-gray-500">
                          Plan: {rest.plan?.nombre} • Estado: {rest.suscripcion?.estado || 'Sin Suscripción'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right flex flex-col items-end">
                        {rest.isCommissionActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-1">
                            Comisión Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-1">
                            Comisión Expirada
                          </span>
                        )}
                        {rest.isCommissionActive && (
                          <span className="text-xs text-gray-500">Quedan {rest.daysLeftForCommission} días</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => goToAiTools(rest.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Configurar con IA
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

      </main>
    </div>
  );
};

export default PartnerDashboard;
