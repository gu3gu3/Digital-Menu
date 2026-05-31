import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import PublicMenuPage from '../pages/PublicMenuPage';

const ALLOWED_SYSTEM_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'menuview.app',
  'www.menuview.app'
];

const DomainInterceptor = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [customSlug, setCustomSlug] = useState(null);
  
  useEffect(() => {
    const hostname = window.location.hostname;
    
    // Si es un dominio del sistema, continuamos normal
    if (ALLOWED_SYSTEM_DOMAINS.includes(hostname)) {
      setLoading(false);
      return;
    }

    // Si es un dominio personalizado, verificamos si existe en la BD
    const checkCustomDomain = async () => {
      try {
        const response = await apiClient.get(`/public/domain/${hostname}`);
        if (response.data.success && response.data.data.slug) {
          setCustomSlug(response.data.data.slug);
        }
      } catch (error) {
        console.error('Error verificando dominio personalizado:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCustomDomain();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Si encontramos un dominio personalizado, renderizamos directamente el menú
  // ignorando las rutas normales.
  if (customSlug) {
    return <PublicMenuPage slugOverride={customSlug} />;
  }

  // De lo contrario, continuamos con la aplicación normal
  return children;
};

export default DomainInterceptor;
