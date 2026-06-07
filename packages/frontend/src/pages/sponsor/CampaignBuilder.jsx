import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileVideo, Image as ImageIcon, Save, Trash2, PlusCircle, Edit3, X, CheckCircle2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export default function CampaignBuilder({ sponsorId }) {
  const [campaigns, setCampaigns] = useState([]);

  // Extracted card component for reuse
  const CampaignCard = ({ camp, handleEdit, handleDelete }) => {
    const mediaToUse = camp.splashImageUrl || camp.bannerImageUrl;
    const isVideo = mediaToUse?.match(/\.(mp4|webm)$/i);
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col">
        <div className="h-40 bg-slate-100 relative group overflow-hidden">
          {isVideo ? (
            <video src={mediaToUse} className="w-full h-full object-cover" muted />
          ) : (
            <img src={mediaToUse} alt={camp.nombre} className="w-full h-full object-cover" />
          )}
          {!camp.activo && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold bg-slate-800/80 px-3 py-1 rounded-md backdrop-blur-sm">Inactiva</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-slate-800 truncate" title={camp.nombre}>{camp.nombre}</h3>
            <div className="flex flex-col gap-1 items-end">
              <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${camp.position === 'SPLASH' || !camp.position ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {camp.position === 'SPLASH' || !camp.position ? 'Splash' : `Banner ${camp.position}`}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${new Date(camp.fechaFin) >= new Date() ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {new Date(camp.fechaFin) >= new Date() ? 'Vigente' : 'Vencida'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            {new Date(camp.fechaInicio).toLocaleDateString()} - {new Date(camp.fechaFin).toLocaleDateString()}
          </p>
          
          <div className="mt-auto flex justify-between pt-3 border-t border-slate-100">
            <button onClick={() => handleEdit(camp)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium">
              <Edit3 size={16} /> Editar
            </button>
            <button onClick={() => handleDelete(camp.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium">
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        </div>
      </motion.div>
    );
  };
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tipoCampana, setTipoCampana] = useState('SPLASH');
  const [posicionBanner, setPosicionBanner] = useState('BOTTOM');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/sponsor/campaigns');
      if (res.data.success) {
        setCampaigns(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombre('');
    setActivo(true);
    setFechaInicio('');
    setFechaFin('');
    setTargetUrl('');
    setMediaFile(null);
    setMediaPreview(null);
    setCurrentCampaign(null);
    setIsEditing(false);
    setTipoCampana('SPLASH');
    setPosicionBanner('BOTTOM');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (campaign) => {
    setCurrentCampaign(campaign);
    setNombre(campaign.nombre);
    setActivo(campaign.activo);
    setFechaInicio(new Date(campaign.fechaInicio).toISOString().split('T')[0]);
    setFechaFin(new Date(campaign.fechaFin).toISOString().split('T')[0]);
    setTargetUrl(campaign.targetUrl || '');
    setMediaPreview(campaign.splashImageUrl || campaign.bannerImageUrl);
    setMediaFile(null);
    
    // Si la posición es vacía o "TOP" y tiene splashImageUrl, asumimos SPLASH por compatibilidad
    if (campaign.position === 'SPLASH' || (!campaign.position && campaign.splashImageUrl)) {
      setTipoCampana('SPLASH');
      setPosicionBanner('BOTTOM');
    } else {
      setTipoCampana('BANNER');
      setPosicionBanner(campaign.position || 'BOTTOM');
    }
    
    setIsEditing(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo excede el límite de 10MB');
        return;
      }
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre || !fechaInicio || !fechaFin) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    try {
      setIsUploading(true);
      let mediaUrl = currentCampaign?.splashImageUrl || currentCampaign?.bannerImageUrl || '';

      if (mediaFile) {
        const formData = new FormData();
        formData.append('media', mediaFile);
        const uploadRes = await apiClient.post('/upload/sponsor/campaign/media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          mediaUrl = uploadRes.data.data.mediaUrl;
        }
      }

      if (!mediaUrl) {
        alert('Debes subir una imagen o video para el Splash.');
        setIsUploading(false);
        return;
      }

      const campaignData = {
        nombre,
        activo,
        fechaInicio,
        fechaFin,
        targetUrl,
        position: tipoCampana === 'SPLASH' ? 'SPLASH' : posicionBanner,
        splashImageUrl: tipoCampana === 'SPLASH' ? mediaUrl : null,
        bannerImageUrl: tipoCampana === 'BANNER' ? mediaUrl : null
      };

      if (currentCampaign) {
        await apiClient.put(`/sponsor/campaigns/${currentCampaign.id}`, campaignData);
      } else {
        await apiClient.post('/sponsor/campaigns', campaignData);
      }

      fetchCampaigns();
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Hubo un error al guardar la campaña');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta campaña?')) {
      try {
        await apiClient.delete(`/sponsor/campaigns/${id}`);
        fetchCampaigns();
      } catch (error) {
        console.error('Error deleting campaign', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {!isEditing ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Tus Campañas</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusCircle size={18} />
              Nueva Campaña
            </button>
          </div>

          {loading ? (
            <p className="text-slate-500">Cargando campañas...</p>
          ) : (
            <div className="space-y-10">
              {/* Sección SPLASHES */}
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                  Splash Screens (Pantalla Completa)
                </h3>
                {campaigns.filter(c => c.position === 'SPLASH' || !c.position).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No tienes Splashes configurados.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.filter(c => c.position === 'SPLASH' || !c.position).map(camp => (
                      <CampaignCard key={camp.id} camp={camp} handleEdit={handleEdit} handleDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sección BANNERS */}
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                  Banners Publicitarios (In-Feed, Top, Footer)
                </h3>
                {campaigns.filter(c => c.position && c.position !== 'SPLASH').length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No tienes Banners configurados.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.filter(c => c.position && c.position !== 'SPLASH').map(camp => (
                      <CampaignCard key={camp.id} camp={camp} handleEdit={handleEdit} handleDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              {currentCampaign ? 'Editar Campaña' : 'Nueva Campaña Splash'}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Details */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Campaña *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Ej. Promo Verano Cerveza"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Campaña</label>
                  <select
                    value={tipoCampana}
                    onChange={e => setTipoCampana(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="SPLASH">Splash Screen (3s)</option>
                    <option value="BANNER">Banner Persistente</option>
                  </select>
                </div>
                {tipoCampana === 'BANNER' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Posición del Banner</label>
                    <select
                      value={posicionBanner}
                      onChange={e => setPosicionBanner(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="BOTTOM">Sticky Footer (Abajo)</option>
                      <option value="TOP">Top (Debajo del Header)</option>
                      <option value="IN_FEED">In-Feed (Entre categorías)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio *</label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin *</label>
                  <input
                    type="date"
                    required
                    value={fechaFin}
                    onChange={e => setFechaFin(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL de Redirección (Opcional)</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="https://misponsor.com/promo"
                />
                <p className="text-xs text-slate-500 mt-1">Hacia dónde irá el usuario si hace clic en el Splash.</p>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="activo"
                  checked={activo}
                  onChange={e => setActivo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="ml-2 text-sm font-medium text-slate-700">
                  Campaña Activa
                </label>
              </div>
            </div>

            {/* Right Column - Media Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Multimedia ({tipoCampana === 'SPLASH' ? 'Splash Screen' : 'Banner'}) *</label>
              <div 
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${mediaPreview ? 'border-blue-300 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 bg-slate-50'}`}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <div className="space-y-2 text-center w-full">
                  {mediaPreview ? (
                    <div className="relative rounded-lg overflow-hidden h-48 bg-black/5 flex items-center justify-center">
                      {mediaPreview.match(/\.(mp4|webm)$/i) || (mediaFile && mediaFile.type.startsWith('video/')) ? (
                        <video src={mediaPreview} className="max-h-full max-w-full" controls />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md shadow-sm text-xs font-bold text-slate-700 backdrop-blur-sm cursor-pointer hover:bg-white" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Cambiar
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center text-slate-400 gap-4">
                        <ImageIcon size={40} />
                        <FileVideo size={40} />
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="text-blue-600 font-semibold">Sube un archivo</span> o arrástralo y suéltalo
                      </div>
                      <p className="text-xs text-slate-500">
                        PNG, JPG, WEBP, MP4, WEBM hasta 10MB
                      </p>
                    </>
                  )}
                  <input
                    id="media-upload"
                    name="media-upload"
                    type="file"
                    className="sr-only"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp, video/mp4, video/webm"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              <div className={`mt-4 p-4 rounded-lg border ${tipoCampana === 'SPLASH' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-sm font-semibold flex items-center gap-1 mb-1 ${tipoCampana === 'SPLASH' ? 'text-amber-800' : 'text-blue-800'}`}>
                  <CheckCircle2 size={16} /> Experiencia de Usuario (UX)
                </h4>
                <p className={`text-xs ${tipoCampana === 'SPLASH' ? 'text-amber-700' : 'text-blue-700'}`}>
                  {tipoCampana === 'SPLASH' 
                    ? 'La imagen o video que subas se mostrará durante 3 segundos a pantalla completa sobre el menú. Recomendamos proporciones verticales (9:16).' 
                    : `El banner permanecerá visible en la posición seleccionada (${posicionBanner}). Recomendamos proporciones horizontales como 16:9 o ultra anchas (21:9).`
                  }
                </p>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium shadow-sm transition-all ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
                >
                  {isUploading ? (
                    <>Subiendo... <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span></>
                  ) : (
                    <><Save size={18} /> Guardar Campaña</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
