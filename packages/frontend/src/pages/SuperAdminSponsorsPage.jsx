import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  ArrowLeftIcon,
  PlusIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import apiClient from '../lib/apiClient';
import logo from '../assets/logo.png';
import useDocumentTitle from '../hooks/useDocumentTitle';

const SuperAdminSponsorsPage = () => {
  useDocumentTitle('MenuView.app | Gestión de Sponsors');
  const navigate = useNavigate();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    contactoName: '',
    email: '',
    telefono: '',
    password: '',
    slug: '',
    cargo: '',
    logoUrl: ''
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/super-admin/sponsors');
      setSponsors(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (sponsor) => {
    if (!window.confirm(`¿Estás seguro de que deseas resetear la contraseña de ${sponsor.nombreEmpresa}?`)) return;
    try {
      setLoading(true);
      const res = await apiClient.post(`/super-admin/sponsors/${sponsor.id}/reset-password`);
      alert(`Contraseña reseteada con éxito. La nueva contraseña temporal es: ${res.data.newPassword}\n\nCópiala antes de cerrar este mensaje.`);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al resetear la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await apiClient.post('/super-admin/sponsors', formData);
      
      let successMessage = 'Sponsor creado con éxito.';
      if (res.data.subdomain) {
        successMessage += ` Subdominio configurado (${formData.slug}.menuview.app).`;
      } else if (formData.slug) {
        successMessage += ` Aviso: El subdominio no pudo configurarse en Name.com (${res.data.subdomainMessage}).`;
      }

      alert(successMessage);
      
      setShowModal(false);
      setFormData({
        nombreEmpresa: '',
        contactoName: '',
        email: '',
        telefono: '',
        password: '',
        slug: '',
        cargo: '',
        logoUrl: ''
      });
      loadSponsors();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear el Sponsor');
    } finally {
      setCreating(false);
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
          <h1 className="text-xl font-bold text-gray-900 border-l pl-3 ml-2 border-gray-300">Gestión de Sponsors</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Sponsor
        </button>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {loading ? (
          <div className="text-center py-10">Cargando sponsors...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {sponsors.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500">No hay sponsors registrados.</li>
              ) : (
                sponsors.map((sponsor) => (
                  <li key={sponsor.id} className="p-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                          {sponsor.logoUrl ? (
                            <img src={sponsor.logoUrl} alt={sponsor.nombreEmpresa} className="h-full w-full object-cover" />
                          ) : (
                            <BuildingOfficeIcon className="h-6 w-6 text-blue-800" />
                          )}
                        </div>
                        <div className="ml-4">
                          <h2 className="text-lg font-bold text-gray-900">
                            {sponsor.nombreEmpresa}
                            {sponsor.slug && <span className="ml-2 text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">.{sponsor.slug}</span>}
                          </h2>
                          <div className="text-sm text-gray-500">
                            Contacto: {sponsor.contactoName} {sponsor.cargo ? `(${sponsor.cargo})` : ''} - {sponsor.email}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Creado: {new Date(sponsor.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 items-center text-center">
                        <div className="bg-gray-50 p-2 rounded-lg border">
                          <div className="text-xs text-gray-500 uppercase">Restaurantes</div>
                          <div className="text-lg font-bold text-gray-900">{sponsor.stats?.totalRestaurants || 0}</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                          <div className="text-xs text-blue-600 uppercase">Campañas</div>
                          <div className="text-lg font-bold text-blue-900">{sponsor.stats?.totalCampanas || 0}</div>
                        </div>
                        <button
                          onClick={() => handleResetPassword(sponsor)}
                          title="Resetear Contraseña"
                          className="ml-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

      </main>

      {/* Modal para Crear Sponsor */}
      {showModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreate}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Nuevo Usuario Sponsor</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                      <input type="text" required value={formData.nombreEmpresa} onChange={(e) => setFormData({...formData, nombreEmpresa: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Slug (Subdominio)</label>
                      <input type="text" required placeholder="ccn" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Nombre del Contacto</label>
                      <input type="text" required value={formData.contactoName} onChange={(e) => setFormData({...formData, contactoName: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Cargo</label>
                      <input type="text" value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Email (Usuario)</label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Contraseña Temporal</label>
                      <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700">URL del Logo (opcional)</label>
                      <input type="text" placeholder="https://..." value={formData.logoUrl} onChange={(e) => setFormData({...formData, logoUrl: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                  {formData.slug && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                      <p className="text-sm text-blue-800">
                        <strong>Automatización:</strong> Se intentará crear el subdominio <code>{formData.slug}.menuview.app</code> automáticamente vía Name.com API.
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={creating} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-800 text-base font-medium text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                    {creating ? 'Creando...' : 'Crear Sponsor'}
                  </button>
                  <button type="button" disabled={creating} onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
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

export default SuperAdminSponsorsPage;
