export const trackCampaignEvent = async (campanaId, restauranteId, tipo) => {
  try {
    const payload = JSON.stringify({ campanaId, restauranteId, tipo });
    
    // Usar sendBeacon es ideal para analytics porque no bloquea el hilo y se envía 
    // incluso si la pestaña se está cerrando o redirigiendo (ej. un clic).
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/telemetry/track`, blob);
    } else {
      // Fallback
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/telemetry/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(e => console.error(e));
    }
  } catch (error) {
    console.error('Error tracking campaign event:', error);
  }
};
