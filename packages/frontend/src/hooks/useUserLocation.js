import { useState, useEffect } from 'react';

const CACHE_KEY = 'user_country_code';
const CACHE_TIME_KEY = 'user_country_code_timestamp';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const useUserLocation = () => {
  const [countryCode, setCountryCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Check cache first
        const cachedCode = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        if (cachedCode && cachedTime && (Date.now() - parseInt(cachedTime) < CACHE_EXPIRY)) {
          setCountryCode(cachedCode);
          setLoading(false);
          return;
        }

        // Fetch from API
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch location');
        
        const data = await response.json();
        const code = data.country_code; // e.g., 'ES', 'NI'
        
        if (code) {
          setCountryCode(code);
          localStorage.setItem(CACHE_KEY, code);
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } else {
          throw new Error('Country code not found in response');
        }
      } catch (err) {
        console.error('Error fetching user location:', err);
        setError(err.message);
        
        // Fallback: try to guess from timezone
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz.includes('Europe/Madrid') || tz.includes('Europe/Ceuta') || tz.includes('Atlantic/Canary')) {
            setCountryCode('ES');
          } else if (tz.includes('Managua')) {
            setCountryCode('NI');
          }
        } catch (tzErr) {
          // Ignore
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { countryCode, loading, error };
};

export default useUserLocation;
