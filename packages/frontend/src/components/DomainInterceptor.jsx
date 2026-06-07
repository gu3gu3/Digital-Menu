import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import PublicMenuPage from '../pages/PublicMenuPage';
import SponsorLoginPage from '../pages/sponsor/SponsorLoginPage';

const ALLOWED_SYSTEM_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'menuview.app',
  'www.menuview.app'
];

const DomainInterceptor = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [customSlug, setCustomSlug] = useState(null);
  const [sponsorSlug, setSponsorSlug] = useState(null);
  
  useEffect(() => {
    const hostname = window.location.hostname;
    
    // Si es un dominio del sistema, continuamos normal
    if (ALLOWED_SYSTEM_DOMAINS.includes(hostname)) {
      setLoading(false);
      return;
    }

    const checkDomainAndSubdomain = async () => {
      try {
        // 1. Verificar si es un subdominio para Sponsor
        let maybeSponsorSlug = null;
        if (hostname.endsWith('.localhost')) {
          maybeSponsorSlug = hostname.replace('.localhost', '');
        } else if (hostname.endsWith('.menuview.app')) {
          maybeSponsorSlug = hostname.replace('.menuview.app', '');
        }

        if (maybeSponsorSlug && maybeSponsorSlug !== 'www') {
          // Verificar si el slug existe como sponsor
          try {
            const sponsorRes = await apiClient.get(`/public/sponsor/${maybeSponsorSlug}`);
            if (sponsorRes.data.success) {
              setSponsorSlug(maybeSponsorSlug);
              return; // Detenemos aquí, es un sponsor
            }
          } catch (e) {
            // No es un sponsor válido, continuamos
          }
        }

        // 2. Si no es un sponsor, verificar si es un dominio personalizado de Restaurante
        const response = await apiClient.get(`/public/domain/${hostname}`);
        if (response.data.success && response.data.data.slug) {
          setCustomSlug(response.data.data.slug);
        }
      } catch (error) {
        console.error('Error verificando dominio o subdominio:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDomainAndSubdomain();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si es un sponsor, mostramos el login si estamos en la raíz, o dejamos que el router decida
  if (sponsorSlug) {
    if (window.location.pathname === '/') {
      window.location.replace('/sponsor/login');
      return null;
    }
    return children;
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
