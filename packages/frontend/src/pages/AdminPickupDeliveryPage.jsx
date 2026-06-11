import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ClipboardDocumentIcon, 
  ArrowDownTrayIcon, 
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import useDocumentTitle from '../hooks/useDocumentTitle';
import restaurantService from '../services/restaurantService';
import ordersService from '../services/ordersService';

const AdminPickupDeliveryPage = () => {
  useDocumentTitle('Delivery & Pickup | Panel');
  const qrRef = useRef(null);
  
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard states
  const [period, setPeriod] = useState('today');
  const [stats, setStats] = useState({
    totalVentas: 0,
    enviadas: 0,
    recibidas: 0,
    confirmadas: 0,
    enPreparacion: 0,
    listas: 0,
    servidas: 0,
    completadas: 0,
    canceladas: 0,
    aDomicilio: 0,
    recoger: 0,
    totalEnvios: 0,
    ticketPromedio: 0,
    total: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

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

  useEffect(() => {
    if (restaurant?.addonPedidosExternos) {
      loadStats();
    }
  }, [restaurant, period]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      // EXTERNAL parameter to fetch only RECOGER and A_DOMICILIO orders
      const response = await ordersService.getOrderStats(period, 'EXTERNAL');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching external order stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, padding, padding);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-Pedidos-${restaurant.slug}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Dynamic Banner Image */}
      <div className="w-full rounded-2xl overflow-hidden shadow-md">
        <img 
          src="/mvPickupDelivery.png" 
          alt="Delivery y Pickup" 
          className="w-full h-auto object-cover max-h-64"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistics Dashboard Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Rendimiento de Ventas (Delivery & Pick-Up)</h2>
              <div className="flex space-x-2 mt-4 sm:mt-0 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setPeriod('today')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setPeriod('week')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Mes
                </button>
              </div>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ventas Totales */}
                <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100 flex items-center">
                  <div className="rounded-full bg-indigo-100 p-3 mr-4">
                    <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Ventas Totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(stats.totalVentas || 0)}
                    </p>
                  </div>
                </div>

                {/* Ordenes Completadas */}
                <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-100 flex items-center">
                  <div className="rounded-full bg-emerald-100 p-3 mr-4">
                    <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Completadas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completadas || 0}</p>
                  </div>
                </div>

                {/* Ordenes Recibidas (En Proceso) */}
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 flex items-center">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">En Proceso</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.recibidas || 0) + (stats.confirmadas || 0) + (stats.enPreparacion || 0) + (stats.listas || 0)}
                    </p>
                  </div>
                </div>

                {/* Canceladas */}
                <div className="bg-rose-50 rounded-lg p-5 border border-rose-100 flex items-center">
                  <div className="rounded-full bg-rose-100 p-3 mr-4">
                    <XCircleIcon className="h-8 w-8 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-rose-600 uppercase tracking-wide">Canceladas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.canceladas || 0}</p>
                  </div>
                </div>

                {/* Desglose de Canales */}
                <div className="col-span-1 sm:col-span-2 bg-slate-50 rounded-lg p-5 border border-slate-200 mt-2">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Volumen por Canal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between border border-slate-100">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                          <RocketLaunchIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-700">Delivery</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">{stats.aDomicilio || 0}</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between border border-slate-100">
                      <div className="flex items-center">
                        <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                          <ShoppingBagIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-slate-700">Pick-up</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">{stats.recoger || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Métricas Financieras (SaaS) */}
                <div className="bg-amber-50 rounded-lg p-5 border border-amber-100 flex items-center">
                  <div className="rounded-full bg-amber-100 p-3 mr-4">
                    <CurrencyDollarIcon className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-600 uppercase tracking-wide">Ventas Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(stats.ticketPromedio || 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-5 border border-purple-100 flex items-center">
                  <div className="rounded-full bg-purple-100 p-3 mr-4">
                    <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Ingresos por Envíos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(stats.totalEnvios || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share Tools Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Herramientas de Difusión</h2>
          <p className="text-sm text-gray-500 mb-6">Comparte tu menú de pedidos para que tus clientes soliciten a domicilio o recojan en tienda.</p>
          
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4" ref={qrRef}>
              <QRCodeSVG 
                value={orderUrl} 
                size={160}
                level="H"
                includeMargin={false}
                fgColor="#1e1b4b"
              />
            </div>
            <button
              onClick={downloadQR}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full justify-center transition-colors"
            >
              <ArrowDownTrayIcon className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
              Descargar QR
            </button>
          </div>

          <div className="mt-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tu Enlace Exclusivo</label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                readOnly
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 bg-gray-50 text-gray-500"
                value={orderUrl}
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <ClipboardDocumentIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPickupDeliveryPage;
