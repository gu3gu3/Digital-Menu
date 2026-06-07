import React, { useEffect, useRef, useState } from 'react';
import { trackCampaignEvent } from '../../utils/telemetry';

const SponsorBanner = ({ campana, restauranteId }) => {
  const bannerRef = useRef(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    if (!campana?.id || hasTrackedView) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        trackCampaignEvent(campana.id, restauranteId, 'VISTA');
        setHasTrackedView(true);
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => observer.disconnect();
  }, [campana?.id, restauranteId, hasTrackedView]);

  if (!campana) return null;

  const mediaUrl = campana.bannerImageUrl || campana.splashImageUrl;
  if (!mediaUrl) return null;

  const handleBannerClick = () => {
    if (campana?.targetUrl) {
      if (campana?.id) {
        trackCampaignEvent(campana.id, restauranteId, 'CLICK');
      }
      window.open(campana.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isVideo = mediaUrl.match(/\.(mp4|webm)$/i);
  const position = campana.position;

  const bannerContent = (
    <div className={`w-full overflow-hidden ${position === 'IN_FEED' ? 'rounded-2xl shadow-sm' : ''} ${position === 'BOTTOM' ? 'shadow-lg border-t border-gray-200' : ''}`}>
      {isVideo ? (
        <video
          src={mediaUrl}
          autoPlay
          muted
          playsInline
          loop
          className="w-full object-cover"
          style={{ maxHeight: position === 'BOTTOM' ? '80px' : '150px' }}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={campana.nombre}
          className="w-full object-cover"
          style={{ maxHeight: position === 'BOTTOM' ? '80px' : '150px' }}
        />
      )}
    </div>
  );

  const wrapperClass = position === 'BOTTOM' 
    ? "fixed bottom-0 left-0 right-0 z-[60] bg-white cursor-pointer group"
    : position === 'TOP'
      ? "w-full mb-4 z-10 cursor-pointer group"
      : "w-full my-6 cursor-pointer group";

  return (
    <div 
      ref={bannerRef}
      className={wrapperClass}
      onClick={handleBannerClick}
    >
      {bannerContent}
    </div>
  );
};

export default SponsorBanner;
