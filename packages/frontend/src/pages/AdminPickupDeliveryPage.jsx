import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ClipboardDocumentIcon, ArrowDownTrayIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import useDocumentTitle from '../hooks/useDocumentTitle';
import restaurantService from '../services/restaurantService';

const AdminPickupDeliveryPage = () => {
  useDocumentTitle('Delivery & Pickup | Panel');
  const qrRef = useRef(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const data = await restaurantService.getMyRestaurant();
        setRestaurant(data);
      } catch (error) {
        console.error('Error loading restaurant:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRestaurant();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!restaurant || !restaurant.addonPedidosExternos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Módulo no Habilitado</h2>
        <p className="text-gray-600">Este restaurante no tiene habilitado el módulo de Delivery y Pickup.</p>
      </div>
    );
  }

  // Determine the base URL
  const baseUrl = window.location.origin;
  const orderUrl = `${baseUrl}/order/${restaurant.slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(orderUrl);
    alert('¡Enlace copiado al portapapeles!');
  };

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions to match SVG, maybe add some padding
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      
      // Draw white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, padding, padding);
      
      // Download
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-Pedidos-${restaurant.slug}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome / Thank You Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10 text-white flex flex-col md:flex-row items-center md:items-start justify-between">
          <div className="mb-6 md:mb-0 md:mr-8 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight mb-4 flex items-center">
              <RocketLaunchIcon className="h-8 w-8 mr-3" />
              ¡Gracias por adquirir el módulo!
            </h1>
            <p className="text-lg text-indigo-100 leading-relaxed">
              El módulo de <strong>Pick-Up y Delivery</strong> le brindará mayor eficiencia a la gestión de su negocio, 
              permitiéndole recibir órdenes directamente desde sus redes sociales o WhatsApp sin necesidad de ocupar las mesas de su local.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold">1</div>
              <p className="ml-4 text-gray-600"><strong>Comparte</strong> tu enlace único o Código QR con tus clientes a través de WhatsApp, Facebook o Instagram.</p>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold">2</div>
              <p className="ml-4 text-gray-600"><strong>Tus clientes eligen</strong> los productos de tu menú y deciden si pasan a recoger el pedido o si desean envío a domicilio (ingresando sus datos de entrega).</p>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold">3</div>
              <p className="ml-4 text-gray-600"><strong>Recibes la orden</strong> directamente en tu sección de "Órdenes" (Dashboard), etiquetada claramente como Pick-Up o Delivery junto con la información del cliente.</p>
            </div>
          </div>
        </div>

        {/* Share Tools */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Herramientas de Difusión</h2>
          
          {/* Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tu Enlace de Pedidos Externos</label>
            <div className="flex mt-1 rounded-md shadow-sm">
              <div className="relative flex-grow focus-within:z-10">
                <input
                  type="text"
                  readOnly
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 bg-gray-50 text-gray-500"
                  value={orderUrl}
                />
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <ClipboardDocumentIcon className="h-5 w-5 text-gray-400" />
                <span>Copiar</span>
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4" ref={qrRef}>
              <QRCodeSVG 
                value={orderUrl} 
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#1e1b4b" // A dark indigo
              />
            </div>
            <button
              onClick={downloadQR}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowDownTrayIcon className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
              Descargar Código QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPickupDeliveryPage;
