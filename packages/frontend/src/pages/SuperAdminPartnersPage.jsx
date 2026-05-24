import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  ArrowLeftIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import apiClient from '../lib/apiClient';
import logo from '../assets/logo.png';
import useDocumentTitle from '../hooks/useDocumentTitle';

const SuperAdminPartnersPage = () => {
  useDocumentTitle('MenuView.app | Gestión de Agencias');
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombreAgencia: '',
    nombreContacto: '',
    email: '',
    telefono: '',
    password: '',
    porcentajeComision: 30
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/super-admin/partners');
      setPartners(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/super-admin/partners', formData);
      setShowModal(false);
      setFormData({
        nombreAgencia: '',
        nombreContacto: '',
        email: '',
        telefono: '',
        password: '',
        porcentajeComision: 30
      });
      loadPartners();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear la agencia');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/super-admin/dashboard')} className="text-gray-500 hover:text-gray-700 mr-2">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <h1 className="text-xl font-bold text-gray-900 border-l pl-3 ml-2 border-gray-300">Gestión de Agencias (Partners)</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Agencia
        </button>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {loading ? (
          <div className="text-center py-10">Cargando agencias...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {partners.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500">No hay agencias registradas.</li>
              ) : (
                partners.map((partner) => (
                  <li key={partner.id} className="p-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <h2 className="text-lg font-bold text-gray-900">{partner.nombreAgencia}</h2>
                          <div className="text-sm text-gray-500">
                            Contacto: {partner.nombreContacto} ({partner.email})
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Comisión: {partner.porcentajeComision}% | Creado: {new Date(partner.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 text-center">
                        <div className="bg-gray-50 p-2 rounded-lg border">
                          <div className="text-xs text-gray-500 uppercase">Restaurantes</div>
                          <div className="text-lg font-bold text-gray-900">{partner.stats.totalRestaurants}</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                          <div className="text-xs text-blue-600 uppercase flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3"/> Activos
                          </div>
                          <div className="text-lg font-bold text-blue-900">{partner.stats.activeCommissionsCount}</div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                          <div className="text-xs text-orange-600 uppercase flex items-center gap-1">
                            <XCircleIcon className="w-3 h-3"/> Expirados
                          </div>
                          <div className="text-lg font-bold text-orange-900">{partner.stats.expiredCommissionsCount}</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg border border-green-100 min-w-[100px]">
                          <div className="text-xs text-green-600 uppercase">A Pagar</div>
                          <div className="text-lg font-bold text-green-900">${partner.stats.totalMonthlyComission.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

      </main>

      {/* Modal para Crear Partner */}
      {showModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Nueva Agencia Partner</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre de la Agencia</label>
                      <input type="text" required value={formData.nombreAgencia} onChange={(e) => setFormData({...formData, nombreAgencia: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre del Contacto</label>
                      <input type="text" required value={formData.nombreContacto} onChange={(e) => setFormData({...formData, nombreContacto: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email (Usuario)</label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contraseña Temporal</label>
                      <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Porcentaje de Comisión</label>
                      <select value={formData.porcentajeComision} onChange={(e) => setFormData({...formData, porcentajeComision: Number(e.target.value)})} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                        <option value={30}>30%</option>
                        <option value={50}>50%</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Crear Agencia
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPartnersPage;
