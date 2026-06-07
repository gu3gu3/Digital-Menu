import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackCampaignEvent } from '../../utils/telemetry';

const SplashOverlay = ({ campana, onComplete, restauranteId }) => {
  const [timeLeft, setTimeLeft] = useState(3);
  const [isVisible, setIsVisible] = useState(true);

  // Temporizador para el "Saltar en 3... 2..." y ocultar el splash automáticamente
  useEffect(() => {
    // Registrar impresión al montar
    if (campana?.id) {
      trackCampaignEvent(campana.id, restauranteId, 'VISTA');
    }

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Cuando llega a 0, empezamos a ocultar con fade
      handleComplete();
    }
  }, [timeLeft]);

  const handleComplete = () => {
    setIsVisible(false);
    // Esperamos 500ms para que termine la animación de fade-out antes de desmontar
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleImageClick = () => {
    if (campana?.targetUrl) {
      if (campana?.id) {
        trackCampaignEvent(campana.id, restauranteId, 'CLICK');
      }
      window.open(campana.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!campana) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        >
          {/* Botón Saltar */}
          <div className="absolute top-6 right-6 z-10">
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/20 transition-all shadow-lg"
            >
              {timeLeft > 0 ? `Saltar en ${timeLeft}s` : 'Saltar'}
            </button>
          </div>

          {/* Enlace o Contenedor Multimedia */}
          <div className="w-full h-full cursor-pointer" onClick={handleImageClick}>
            <MediaContent campana={campana} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MediaContent = ({ campana }) => {
  const isVideo = campana.splashImageUrl?.match(/\.(mp4|webm)$/i);
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {isVideo ? (
        <video
          src={campana.splashImageUrl}
          autoPlay
          muted
          playsInline
          loop
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={campana.splashImageUrl}
          alt={campana.nombre}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default SplashOverlay;
