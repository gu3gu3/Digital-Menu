import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currencyUtils';

/**
 * Hook personalizado para obtener la moneda del restaurante
 * y proporcionar función de formateo
 */
export const useRestaurantCurrency = () => {
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    // Función para obtener la moneda del localStorage
    const getCurrencyFromStorage = () => {
      // Intentar obtener datos del usuario desde diferentes fuentes
      let userData = localStorage.getItem('adminUser');
      
      // Si no hay adminUser, intentar con staffUser
      if (!userData) {
        userData = localStorage.getItem('staffUser');
      }
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          const restaurantCurrency = parsedUser.restaurante?.moneda || 'USD';
          setCurrency(restaurantCurrency);
        } catch (error) {
          console.error('Error parsing user data for currency:', error);
          setCurrency('USD'); // fallback
        }
      } else {
        setCurrency('USD'); // fallback si no hay datos
      }
    };

    // Obtener moneda inicial
    getCurrencyFromStorage();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'adminUser' || e.key === 'staffUser') {
        getCurrencyFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Crear un evento personalizado para notificar cambios de moneda
    const handleCurrencyUpdate = () => {
      getCurrencyFromStorage();
    };

    window.addEventListener('currencyUpdated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currencyUpdated', handleCurrencyUpdate);
    };
  }, []);

  // Función para formatear montos con la moneda del restaurante
  const formatAmount = (amount) => {
    return formatCurrency(amount, currency);
  };

  return {
    currency,
    formatAmount
  };
};

export default useRestaurantCurrency; 