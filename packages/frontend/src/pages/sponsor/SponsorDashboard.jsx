import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, MousePointerClick, Eye, Activity, Award } from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import defaultLogo from '../../assets/logo.png';
import CampaignBuilder from './CampaignBuilder';

// Se eliminan datos quemados de la gráfica
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function SponsorDashboard() {
  useDocumentTitle('Trade Marketing | Dashboard');
  const navigate = useNavigate();
  const [sponsorDetails, setSponsorDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' o 'campaigns'
  const [metrics, setMetrics] = useState({
    splash: { vistas: 0, clics: 0, ctr: 0 },
    banner: { vistas: 0, clics: 0, ctr: 0 },
    chartData: [],
    topPuntosVenta: []
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    let slug = null;
    if (hostname.endsWith('.localhost')) slug = hostname.replace('.localhost', '');
    else if (hostname.endsWith('.menuview.app')) slug = hostname.replace('.menuview.app', '');

    if (slug) {
      const fetchSponsorDetails = async () => {
        try {
          const res = await apiClient.get(`/public/sponsor/${slug}`);
          if (res.data.success) {
            setSponsorDetails(res.data.data);
          }
        } catch (err) {
          console.error("No se pudo cargar detalles del sponsor", err);
        }
      };
      fetchSponsorDetails();
    }

    const fetchMetrics = async () => {
      try {
        const res = await apiClient.get('/sponsor/campaigns/metrics');
        if (res.data.success) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error("Error cargando métricas reales", err);
      }
    };
    fetchMetrics();
  }, []);

  // Animación personalizada para el tooltip del gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xl">
          <p className="text-slate-900 font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className={`text-sm font-medium ${entry.dataKey === 'Vistas' ? 'text-amber-500' : 'text-blue-600'}`}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleLogout = () => {
    // Aquí iría la lógica real de logout (limpiar tokens, etc)
    navigate('/sponsor/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <motion.div 
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Brandeado */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 min-w-[3.5rem] flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden px-2">
              <img 
                src={sponsorDetails?.logoUrl || defaultLogo} 
                alt="Logo Sponsor" 
                className="max-h-10 max-w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Control de Campañas en Mesa
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                {window.location.hostname}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{sponsorDetails?.contactoName || 'Admin'}</p>
              <p className="text-xs text-slate-500">Trade Marketing</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-300 shadow-sm"
            >
              Salir
            </button>
          </div>
        </motion.div>

        {/* Custom Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'dashboard' ? 'bg-white text-blue-600 border-t border-x border-slate-200 shadow-[0_4px_0_0_white] relative z-10 -mb-[1px]' : 'text-slate-500 hover:text-slate-700 bg-transparent border-transparent'}`}
          >
            Dashboard y Métricas
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'campaigns' ? 'bg-white text-blue-600 border-t border-x border-slate-200 shadow-[0_4px_0_0_white] relative z-10 -mb-[1px]' : 'text-slate-500 hover:text-slate-700 bg-transparent border-transparent'}`}
          >
            Campaign Builder <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">Nuevo</span>
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {/* Métricas Generales - Splash */}
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 mt-2">
              <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
              Rendimiento de Splash Screens
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Eye size={16} /> Impresiones Únicas
                  </span>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Eye className="text-purple-500" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{metrics.splash.vistas.toLocaleString()}</h3>
                <div className="mt-2 text-sm text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md font-medium">
                  <TrendingUp size={14} className="inline mr-1" />
                  Métrica en Tiempo Real
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <MousePointerClick size={16} /> Clics (Redirecciones)
                  </span>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MousePointerClick className="text-blue-500" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{metrics.splash.clics.toLocaleString()}</h3>
                <div className="mt-2 text-sm text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md font-medium">
                  <TrendingUp size={14} className="inline mr-1" />
                  Métrica en Tiempo Real
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Activity size={16} /> CTR (Efectividad)
                  </span>
                  <div className="p-2 bg-rose-50 rounded-lg">
                    <Activity className="text-rose-500" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 text-purple-600">{metrics.splash.ctr}%</h3>
                <div className="mt-2 text-sm text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md font-medium">
                  Canal de Alto Impacto
                </div>
              </div>
            </div>

            {/* Métricas Generales - Banners */}
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 mt-8">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Rendimiento de Banners Publicitarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Eye size={16} /> Impresiones en Menú
                  </span>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Eye className="text-purple-500" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{metrics.banner.vistas.toLocaleString()}</h3>
                <div className="mt-2 text-sm text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md font-medium">
                  <TrendingUp size={14} className="inline mr-1" />
                  Métrica en Tiempo Real
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <MousePointerClick size={16} /> Clics (Interés)
                  </span>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MousePointerClick className="text-blue-500" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{metrics.banner.clics.toLocaleString()}</h3>
                <div className="mt-2 text-sm text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md font-medium">
                  <TrendingUp size={14} className="inline mr-1" />
                  Métrica en Tiempo Real
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Activity size={16} /> CTR (Efectividad)
                  </span>
                  <div className="p-2 bg-rose-50 rounded-lg">
                    <Activity className="text-rose-500" size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 text-blue-600">{metrics.banner.ctr}%</h3>
                <div className="mt-2 text-sm text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md font-medium">
                  Canal de Intención Orgánica
                </div>
              </div>
            </div>

        {/* Gráficos y Tablas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Gráfico Recharts */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Rendimiento por Campaña Activa</h2>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.chartData || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 500, color: '#475569' }} />
                  <Bar dataKey="Vistas" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="Clics" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Puntos de Venta */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Award className="text-amber-500" size={20} />
              <h2 className="text-lg font-bold text-slate-900">Top Puntos de Venta</h2>
            </div>
            <div className="flex-1 space-y-4">
              {(metrics.topPuntosVenta || []).map((punto, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${index === 0 ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{punto.name}</span>
                    </div>
                    <span className="text-xs text-blue-600 font-bold">{punto.clicks.toLocaleString()} clics</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-blue-500 h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${punto.percent}%` }}
                      transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full py-3 bg-white hover:bg-slate-50 text-sm text-slate-700 font-semibold rounded-xl transition-colors border border-slate-200 shadow-sm">
              Ver reporte detallado
            </button>
          </motion.div>
          </div>
          </>
        ) : (
          <CampaignBuilder sponsorId={sponsorDetails?.id} />
        )}
      </motion.div>
    </div>
  );
}
