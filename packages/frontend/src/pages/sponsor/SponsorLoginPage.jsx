import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import apiClient from '../../lib/apiClient';
// Asumiendo que tenemos un logo por defecto si el sponsor no tiene
import defaultLogo from '../../assets/logo.png';

function SponsorLoginPage({ sponsorSlug: initialSlug }) {
  useDocumentTitle('Trade Marketing Platform | Login');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sponsorDetails, setSponsorDetails] = useState(null);

  const sponsorSlug = initialSlug || (() => {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.localhost')) return hostname.replace('.localhost', '');
    if (hostname.endsWith('.menuview.app')) return hostname.replace('.menuview.app', '');
    return null;
  })();

  useEffect(() => {
    if (sponsorSlug) {
      // Intentar cargar detalles públicos del sponsor para mostrar el logo
      const fetchSponsorDetails = async () => {
        try {
          const res = await apiClient.get(`/public/sponsor/${sponsorSlug}`);
          if (res.data.success) {
            setSponsorDetails(res.data.data);
          }
        } catch (err) {
          console.error("No se pudo cargar detalles del sponsor", err);
        }
      };
      fetchSponsorDetails();
    }
  }, [sponsorSlug]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.post('/sponsor/auth/login', { email, password });
      
      if (response.data.success) {
        // Save token (using localStorage for simplicity or context)
        localStorage.setItem('sponsor_token', response.data.data.token);
        localStorage.setItem('sponsor_user', JSON.stringify(response.data.data.user));
        
        // Setup default auth header if needed (usually handled by interceptor)
        // apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        
        navigate('/sponsor/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const logoToDisplay = sponsorDetails?.logoUrl || defaultLogo;
  const companyName = sponsorDetails?.nombreEmpresa || 'Trade Marketing Platform';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-32 w-auto flex items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
             <img
              src={logoToDisplay}
              alt="Sponsor Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {companyName}
        </h2>
        <div className="mt-3 text-center">
          <span className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text text-sm font-bold tracking-widest uppercase shadow-sm">
            Trade Marketing Platform
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SponsorLoginPage;
