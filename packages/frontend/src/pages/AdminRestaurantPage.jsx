import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Toaster, toast } from 'sonner';
import { 
  Trash2, 
  UploadCloud, 
  Link as LinkIcon, 
  ClipboardCopy as ClipboardDocumentIcon,
  UserCircle,
  Store as BuildingStorefrontIcon,
  DollarSign as CurrencyDollarIcon,
  Paintbrush as PaintBrushIcon
} from 'lucide-react';
import restaurantService from '../services/restaurantService';
import { getCurrenciesByRegion, getCurrencyDisplayInfo } from '../utils/currencyUtils';

const AdminRestaurantPage = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [restaurantData, setRestaurantData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const backgroundColor = watch("backgroundColor");

  const fetchRestaurantData = useCallback(async () => {
    try {
      const restaurante = await restaurantService.getMyRestaurant();
      setRestaurantData(restaurante);
      // Populate form with fetched data
      Object.keys(restaurante).forEach(key => {
        if (key in restaurante && restaurante[key] !== null) {
          setValue(key, restaurante[key]);
    }
      });
      setMenuUrl(`${window.location.origin}/menu/${restaurante.slug}`);
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      setError('Error al cargar la información del restaurante.');
      toast.error('Error al cargar la información del restaurante.');
    }
  }, [setValue]);

  useEffect(() => {
    fetchRestaurantData();
  }, [fetchRestaurantData]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');
    try {
      const updatedData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        telefono: formData.telefono,
        direccion: formData.direccion,
        email: formData.email,
        moneda: formData.moneda,
        backgroundColor: formData.backgroundColor,
      };
      await restaurantService.updateMyRestaurant(updatedData);
      
      // Actualizar localStorage para que useRestaurantCurrency funcione inmediatamente
      const adminUser = localStorage.getItem('adminUser');
      if (adminUser) {
        try {
          const parsedUser = JSON.parse(adminUser);
          if (parsedUser.restaurante) {
            parsedUser.restaurante.moneda = formData.moneda;
            localStorage.setItem('adminUser', JSON.stringify(parsedUser));
          }
        } catch (error) {
          console.error('Error updating localStorage currency:', error);
        }
      }
      
      // También actualizar staffUser si existe (para que los meseros vean la moneda actualizada)
      const staffUser = localStorage.getItem('staffUser');
      if (staffUser) {
        try {
          const parsedStaff = JSON.parse(staffUser);
          if (parsedStaff.restaurante) {
            parsedStaff.restaurante.moneda = formData.moneda;
            localStorage.setItem('staffUser', JSON.stringify(parsedStaff));
          }
        } catch (error) {
          console.error('Error updating staffUser currency:', error);
        }
      }
      
      // Disparar evento personalizado para notificar cambios de moneda
      window.dispatchEvent(new CustomEvent('currencyUpdated'));
      
      toast.success('Información del restaurante actualizada exitosamente');
      await fetchRestaurantData();
    } catch (error) {
      setError(error.message || 'Error al actualizar la información');
      toast.error(error.message || 'Error al actualizar la información');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageUpload = async (imageType, file) => {
    if (!file) return;
    toast.info(`Subiendo imagen...`);
    
    // The backend route expects 'backgroundImage' but our component uses 'background'
    const fieldName = imageType === 'background' ? 'backgroundImage' : imageType;

    try {
      const formData = new FormData();
      // The key here must match what multer expects on the backend
      formData.append(fieldName, file);

      await restaurantService.uploadRestaurantFiles(formData);
      
      toast.success(`Imagen actualizada.`);
      await fetchRestaurantData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || `Error al subir la imagen.`;
      toast.error(errorMessage);
    }
  };

  const handleImageDelete = async (imageType) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la imagen de ${imageType}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await restaurantService.deleteImage(imageType);
      toast.success(`Imagen de ${imageType} eliminada.`);
      await fetchRestaurantData();
    } catch (error) {
      toast.error(error.message || `Error al eliminar la imagen.`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('¡URL copiada al portapapeles!');
    }, () => {
      toast.error('No se pudo copiar la URL.');
    });
  };

  const ImageUploadField = ({ label, description, imageType, currentImageUrl }) => {
    const inputId = `file-upload-${imageType}`;
    return (
      <div className="flex flex-col">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-2">
          <label htmlFor={inputId} className="group relative flex justify-center items-center w-full h-40 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-primary-500 transition-colors duration-200">
            {currentImageUrl ? (
              <>
                <img src={currentImageUrl} alt={`${label} preview`} className="absolute inset-0 w-full h-full object-cover rounded-md" />
                <div className="absolute inset-0 w-full h-full bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-md flex flex-col justify-center items-center text-white opacity-0 group-hover:opacity-100">
                  <UploadCloud size={32} />
                  <span className="mt-2 text-sm font-semibold">Cambiar imagen</span>
                </div>
              </>
            ) : (
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-600"><span className="font-medium text-primary-600">Haz clic</span> o arrastra y suelta</p>
                <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
              </div>
            )}
            <input id={inputId} name={inputId} type="file" className="sr-only" onChange={(e) => handleImageUpload(imageType, e.target.files[0])} />
          </label>
        </div>
        {currentImageUrl && (
            <button type="button" onClick={() => handleImageDelete(imageType)} className="mt-2 self-start flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors" aria-label={`Eliminar ${label}`}>
              <Trash2 size={14} className="mr-1.5" />
              Eliminar
            </button>
        )}
        {description && <p className="mt-2 text-xs text-gray-500">{description}</p>}
      </div>
    );
  };

  const currenciesByRegion = getCurrenciesByRegion();
  const colorPalette = [ { color: '#ffffff', name: 'Blanco' }, { color: '#111827', name: 'Gris Oscuro' }, { color: '#fef2f2', name: 'Rojo Claro' }, { color: '#eff6ff', name: 'Azul Claro' } ];


  if (!restaurantData) {
    return <div className="p-6">Cargando configuración del restaurante...</div>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />
      
      <div>
        <h2 className="text-2xl font-bold leading-tight text-gray-900">Configuración del Restaurante</h2>
        <p className="mt-1 text-sm text-gray-600">Gestiona la información básica, moneda y la apariencia de tu restaurante.</p>
      </div>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {menuUrl && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 flex items-center mb-2"><LinkIcon className="h-5 w-5 mr-2 text-primary-600" />URL de tu Menú Público</h3>
              <p className="text-sm text-gray-600 mb-4">Comparte este enlace con tus clientes para que vean tu menú en línea.</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 bg-white border border-gray-300 rounded-lg p-3 min-w-0"><div className="text-sm text-gray-500 mb-1">URL:</div><div className="font-mono text-primary-700 font-medium break-all">{menuUrl}</div></div>
                <button type="button" onClick={() => copyToClipboard(menuUrl)} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><ClipboardDocumentIcon className="h-4 w-4 mr-2" />Copiar</button>
                <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">Ver Menú →</a>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"><div><span className="font-medium text-gray-700">Slug:</span><div className="font-mono text-gray-600 mt-1">{restaurantData.slug}</div></div><div><span className="font-medium text-gray-700">Estado:</span><div className="text-green-600 mt-1 flex items-center"><div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>Menú público activo</div></div><div><span className="font-medium text-gray-700">Moneda:</span><div className="mt-1 flex items-center"><CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-500" />{getCurrencyDisplayInfo(restaurantData.moneda)?.displayName || 'N/A'}</div></div></div></div>
        </div>
      )}

      {restaurantData.admin && (
        <div className="p-6 bg-white shadow rounded-lg">
           <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center"><UserCircle className="h-5 w-5 mr-2 text-gray-600" />Información del Administrador</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm"><div className="font-medium text-gray-700">Nombre: <span className="font-normal text-gray-900">{restaurantData.admin.nombre} {restaurantData.admin.apellido}</span></div><div className="font-medium text-gray-700">Email: <span className="font-normal text-gray-900">{restaurantData.admin.email}</span></div><div className="font-medium text-gray-700">Teléfono: <span className="font-normal text-gray-900">{restaurantData.admin.telefono || 'No especificado'}</span></div></div>
            </div>
          )}
          
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="p-6 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center"><BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-600" />Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre del Restaurante *</label><input type="text" id="nombre" {...register("nombre", { required: "El nombre es requerido" })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />{errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}</div>
            <div><label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono *</label><input type="tel" id="telefono" {...register("telefono", { required: "El teléfono es requerido" })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />{errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>}</div>
            <div className="md:col-span-2"><label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label><textarea id="descripcion" rows={3} {...register("descripcion")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" /></div>
            <div className="md:col-span-2"><label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Dirección *</label><input type="text" id="direccion" {...register("direccion", { required: "La dirección es requerida" })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />{errors.direccion && <p className="mt-1 text-xs text-red-500">{errors.direccion.message}</p>}</div>
            <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">Email del Restaurante</label><input type="email" id="email" {...register("email", { pattern: { value: /^\S+@\S+$/i, message: "Email no válido" } })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />{errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}</div>
            </div>
          </div>

        <div className="p-6 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center"><CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-600" />Configuración de Moneda</h3>
          <div className="max-w-md"><label htmlFor="moneda" className="block text-sm font-medium text-gray-700 mb-2">Moneda de tu Restaurante *</label><select id="moneda" {...register("moneda", { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">{Object.entries(currenciesByRegion).map(([region, currencies]) => (<optgroup key={region} label={region}>{currencies.map((currency) => (<option key={currency.code} value={currency.code}>{currency.symbol} {currency.name} ({currency.country})</option>))}</optgroup>))}</select><p className="mt-2 text-sm text-gray-500">Los precios de tu menú se mostrarán en esta moneda.</p></div>
        </div>
            
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6"><h3 className="text-xl font-bold text-gray-900">Apariencia del Menú Público</h3><p className="mt-1 text-sm text-gray-500">Personaliza los colores e imágenes que verán tus clientes.</p></div>
          <div className="px-6 pb-6 border-b border-gray-200">
             <div><label className="block text-sm font-medium text-gray-700 mb-3">Color de Fondo</label><div className='flex items-center gap-2'>
              {['#FFFFFF', '#111827', '#FEE2E2', '#DBEAFE', '#F3F4F6', '#F5F5F4', '#D1FAE5', '#FEF3C7'].map((color) => (
                    <button
                  key={color}
                  type='button'
                  onClick={() => setValue('backgroundColor', color)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${backgroundColor === color ? 'border-primary-600 ring-2 ring-primary-200' : 'border-gray-300 hover:border-gray-400'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                    >
                  {backgroundColor === color && (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
            </div></div>
          </div>
          <div className="p-6 border-b border-gray-200"><h4 className="text-lg font-semibold text-gray-800 mb-4">Identidad Visual</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"><ImageUploadField label="Logo del Restaurante" description="Formato cuadrado recomendado (ej. 512x512)." imageType="logo" currentImageUrl={restaurantData?.logoUrl} /><ImageUploadField label="Banner del Restaurante" description="Se mostrará en la cabecera del menú. Recomendado: 1600x400." imageType="banner" currentImageUrl={restaurantData?.bannerUrl} /></div></div>
          <div className="p-6"><h4 className="text-lg font-semibold text-gray-800 mb-1">Imagen de Fondo</h4><p className="text-sm text-gray-500 mb-4">Alternativa al color de fondo. Si subes una imagen, esta tendrá prioridad.</p><ImageUploadField label="" description="Recomendado: 1920x1080. Intenta que no sea muy pesada." imageType="background" currentImageUrl={restaurantData?.backgroundImage} /></div>
              </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
          </div>
        </form>
    </div>
  );
};

export default AdminRestaurantPage; 