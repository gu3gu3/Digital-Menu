import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminAuth } from '../services/superAdminService';
import aiMenuService from '../services/aiMenuService';
import useDocumentTitle from '../hooks/useDocumentTitle';
import RestaurantAutocomplete from '../components/RestaurantAutocomplete';

const AIMenuGeneratorPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [menuFiles, setMenuFiles] = useState([]);
  const [replaceExistingMenu, setReplaceExistingMenu] = useState(false);
  const [generateDescriptions, setGenerateDescriptions] = useState(true);
  const [menuType, setMenuType] = useState('');
  const [specialCases, setSpecialCases] = useState([]);
  
  const [bulkTableData, setBulkTableData] = useState({
    baseName: 'Mesa',
    count: 10,
    startNumber: 1,
    capacity: 4
  });

  // Estados para editor de prompts
  const [prompts, setPrompts] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);

  // Estados para personalización visual
  const [visualFiles, setVisualFiles] = useState({
    logo: null,
    banner: null,
    backgroundImage: null
  });
  const [visualPreviews, setVisualPreviews] = useState({
    logo: null,
    banner: null,
    backgroundImage: null
  });
  const [visualLoading, setVisualLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [bulkTableLoading, setBulkTableLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('menu-generator');

  const navigate = useNavigate();

  // Set dynamic page title
  useDocumentTitle('MenuView.app | Generador de Menús con IA');

  useEffect(() => {
    if (!superAdminAuth.isAuthenticated()) {
      navigate('/super-admin/login');
      return;
    }

    loadRestaurants();
    loadPrompts();
  }, [navigate]);

  const loadRestaurants = async () => {
    try {
      const response = await aiMenuService.getRestaurants();
      if (response.success) {
        setRestaurants(response.data.restaurantes);
      }
    } catch (error) {
      setError(error.message || 'Error cargando restaurantes');
    }
  };

  const loadPrompts = async () => {
    try {
      const response = await aiMenuService.getPrompts();
      if (response.success) {
        setPrompts(response.data);
        setCustomPrompt(response.data.mainPrompt);
      }
    } catch (error) {
      console.error('Error cargando prompts:', error);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) {
      setMenuFiles([]);
      return;
    }

    // Validar archivos
    const validation = aiMenuService.validateFiles(files);
    if (!validation.isValid) {
      setError(validation.errors.join('. '));
      return;
    }

    setMenuFiles(files);
    setError('');
  };

  const removeFile = (index) => {
    const newFiles = menuFiles.filter((_, i) => i !== index);
    setMenuFiles(newFiles);
  };

  // Funciones para personalización visual
  const handleVisualFileChange = (type, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      setError(`El archivo ${type} es demasiado grande. Máximo 5MB.`);
      return;
    }

    setVisualFiles(prev => ({
      ...prev,
      [type]: file
    }));

    // Crear vista previa
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setVisualPreviews(prev => ({
          ...prev,
          [type]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setVisualPreviews(prev => ({
        ...prev,
        [type]: null
      }));
    }
  };

  const removeVisualFile = (type) => {
    setVisualFiles(prev => ({
      ...prev,
      [type]: null
    }));
    setVisualPreviews(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const handleSpecialCaseChange = (caseValue, checked) => {
    if (checked) {
      setSpecialCases([...specialCases, caseValue]);
    } else {
      setSpecialCases(specialCases.filter(c => c !== caseValue));
    }
  };

  const handleGenerateMenu = async (e) => {
    e.preventDefault();
    
    if (!selectedRestaurant) {
      setError('Debe seleccionar un restaurante');
      return;
    }
    
    if (menuFiles.length === 0) {
      setError('Debe seleccionar al menos una imagen del menú');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = aiMenuService.createMenuFormData(selectedRestaurant, menuFiles, {
        replaceExistingMenu,
        generateDescriptions,
        menuType: menuType || null,
        specialCases
      });

      const response = await aiMenuService.generateMenuFromImage(formData);
      
      if (response.success) {
        setResult({
          type: 'menu',
          data: response.data,
          message: response.message
        });
        // Limpiar formulario
        setMenuFiles([]);
        setSelectedRestaurant('');
        setMenuType('');
        setSpecialCases([]);
        document.getElementById('menuFiles').value = '';
      }
    } catch (error) {
      setError(error.error || error.message || 'Error generando menú con IA');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBulkTables = async (e) => {
    e.preventDefault();
    
    if (!selectedRestaurant) {
      setError('Debe seleccionar un restaurante');
      return;
    }

    setBulkTableLoading(true);
    setError('');
    setResult(null);

    try {
      const tableData = {
        restauranteId: selectedRestaurant,
        ...bulkTableData
      };

      const response = await aiMenuService.createBulkTables(tableData);
      
      if (response.success) {
        setResult({
          type: 'tables',
          data: response.data,
          message: response.message
        });
        // Reset form
        setBulkTableData({
          baseName: 'Mesa',
          count: 10,
          startNumber: 1,
          capacity: 4
        });
      }
    } catch (error) {
      setError(error.error || error.message || 'Error creando mesas');
    } finally {
      setBulkTableLoading(false);
    }
  };

  const handleGenerateWithCustomPrompt = async (e) => {
    e.preventDefault();
    
    if (!selectedRestaurant) {
      setError('Debe seleccionar un restaurante');
      return;
    }
    
    if (menuFiles.length === 0) {
      setError('Debe seleccionar al menos una imagen del menú');
      return;
    }

    if (!customPrompt.trim()) {
      setError('Debe ingresar un prompt personalizado');
      return;
    }

    setPromptLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = aiMenuService.createCustomPromptFormData(selectedRestaurant, menuFiles, customPrompt, {
        replaceExistingMenu,
        generateDescriptions
      });

      const response = await aiMenuService.generateMenuWithCustomPrompt(formData);
      
      if (response.success) {
        setResult({
          type: 'menu',
          data: response.data,
          message: response.message
        });
        // Limpiar archivos pero mantener prompt
        setMenuFiles([]);
        document.getElementById('menuFiles').value = '';
      }
    } catch (error) {
      setError(error.error || error.message || 'Error generando menú con prompt personalizado');
    } finally {
      setPromptLoading(false);
    }
  };

  const resetPromptToDefault = () => {
    if (prompts) {
      setCustomPrompt(prompts.mainPrompt);
    }
  };

  const handleUpdateVisualIdentity = async (e) => {
    e.preventDefault();
    
    if (!selectedRestaurant) {
      setError('Debe seleccionar un restaurante');
      return;
    }

    const hasFiles = Object.values(visualFiles).some(file => file !== null);
    if (!hasFiles) {
      setError('Debe seleccionar al menos un archivo (logo, banner o imagen de fondo)');
      return;
    }

    setVisualLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('restauranteId', selectedRestaurant);
      
      Object.entries(visualFiles).forEach(([type, file]) => {
        if (file) {
          formData.append(type, file);
        }
      });

      const response = await aiMenuService.updateVisualIdentity(formData);
      
      if (response.success) {
        setResult({
          type: 'visual',
          data: response.data,
          message: response.message
        });
        // Limpiar formulario
        setVisualFiles({
          logo: null,
          banner: null,
          backgroundImage: null
        });
        setVisualPreviews({
          logo: null,
          banner: null,
          backgroundImage: null
        });
      }
    } catch (error) {
      setError(error.error || error.message || 'Error actualizando identidad visual');
    } finally {
      setVisualLoading(false);
    }
  };

  const selectedRestaurantInfo = restaurants.find(r => r.id === selectedRestaurant);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Generador de Menús con IA</h1>
                <p className="text-sm text-gray-500">Crea menús automáticamente desde imágenes</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/super-admin/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{result.message}</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Restaurante:</strong> {result.data.restaurante}</p>
                  {result.type === 'menu' ? (
                    <>
                      <p><strong>Categorías creadas:</strong> {result.data.categoriasCreadas}</p>
                      <p><strong>Productos creados:</strong> {result.data.productosCreados}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Mesas creadas:</strong> {result.data.mesasCreadas}</p>
                      <p><strong>Rango de números:</strong> {result.data.rangoNumeros}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('menu-generator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'menu-generator'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🤖 Generador de Menús con IA
              </button>
              <button
                onClick={() => setActiveTab('bulk-tables')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bulk-tables'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🪑 Creación Masiva de Mesas
              </button>
              <button
                onClick={() => setActiveTab('prompt-editor')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prompt-editor'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✏️ Editor de Prompts
              </button>
              <button
                onClick={() => setActiveTab('visual-identity')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'visual-identity'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎨 Personalización Visual
              </button>
            </nav>
          </div>
        </div>

        {/* Restaurant Selection (Shared) */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Restaurante</h3>
          <div className="max-w-md">
            <RestaurantAutocomplete
              restaurants={restaurants}
              selectedRestaurant={selectedRestaurant}
              onRestaurantSelect={setSelectedRestaurant}
              placeholder="Escriba el nombre del restaurante..."
            />
          </div>
          
          {selectedRestaurantInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-900">Restaurante Seleccionado:</h4>
              <p className="text-blue-700">{selectedRestaurantInfo.nombre}</p>
              <p className="text-sm text-blue-600">
                {selectedRestaurantInfo._count.categorias} categorías • {selectedRestaurantInfo._count.productos} productos • {selectedRestaurantInfo._count.mesas} mesas
              </p>
            </div>
          )}
        </div>

        {/* Menu Generator Tab */}
        {activeTab === 'menu-generator' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generar Menú desde Imagen</h3>
            
            <form onSubmit={handleGenerateMenu} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes del Menú (máximo 3 archivos)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="menuFiles" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                        <span>Seleccionar archivos</span>
                        <input
                          id="menuFiles"
                          type="file"
                          multiple
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 5MB cada uno • Máximo 3 archivos</p>
                  </div>
                </div>
                
                {menuFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {menuFiles.map((file, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({aiMenuService.formatFileSize(file.size)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Menú (opcional)
                </label>
                <select
                  value={menuType}
                  onChange={(e) => setMenuType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Detección automática</option>
                  {aiMenuService.getMenuTypes().map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Selecciona el tipo para obtener mejores resultados de extracción
                </p>
              </div>

              {/* Special Cases */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Casos Especiales (opcional)
                </label>
                <div className="space-y-2">
                  {aiMenuService.getSpecialCases().map((specialCase) => (
                    <div key={specialCase.value} className="flex items-center">
                      <input
                        id={`specialCase-${specialCase.value}`}
                        type="checkbox"
                        checked={specialCases.includes(specialCase.value)}
                        onChange={(e) => handleSpecialCaseChange(specialCase.value, e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`specialCase-${specialCase.value}`} className="ml-2 block text-sm text-gray-900">
                        {specialCase.label}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Selecciona las características especiales de tu menú para mejorar la precisión
                </p>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="replaceExistingMenu"
                    type="checkbox"
                    checked={replaceExistingMenu}
                    onChange={(e) => setReplaceExistingMenu(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="replaceExistingMenu" className="ml-2 block text-sm text-gray-900">
                    Reemplazar menú existente (eliminar categorías y productos actuales)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="generateDescriptions"
                    type="checkbox"
                    checked={generateDescriptions}
                    onChange={(e) => setGenerateDescriptions(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generateDescriptions" className="ml-2 block text-sm text-gray-900">
                    Generar descripciones mejoradas con IA
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || !selectedRestaurant || menuFiles.length === 0}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando con IA...
                    </>
                  ) : (
                    '🤖 Generar Menú con IA'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Tables Tab */}
        {activeTab === 'bulk-tables' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Creación Masiva de Mesas</h3>
            
            <form onSubmit={handleCreateBulkTables} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="baseName" className="block text-sm font-medium text-gray-700">
                    Nombre Base
                  </label>
                  <input
                    type="text"
                    id="baseName"
                    value={bulkTableData.baseName}
                    onChange={(e) => setBulkTableData({...bulkTableData, baseName: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Mesa, Habitación, Salón..."
                  />
                  <p className="mt-1 text-xs text-gray-500">Se agregará el número consecutivo automáticamente</p>
                </div>

                <div>
                  <label htmlFor="count" className="block text-sm font-medium text-gray-700">
                    Cantidad a Crear
                  </label>
                  <input
                    type="number"
                    id="count"
                    min="1"
                    max="50"
                    value={bulkTableData.count}
                    onChange={(e) => setBulkTableData({...bulkTableData, count: parseInt(e.target.value) || 1})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="startNumber" className="block text-sm font-medium text-gray-700">
                    Número Inicial
                  </label>
                  <input
                    type="number"
                    id="startNumber"
                    min="1"
                    value={bulkTableData.startNumber}
                    onChange={(e) => setBulkTableData({...bulkTableData, startNumber: parseInt(e.target.value) || 1})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    Capacidad por Mesa
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    min="1"
                    value={bulkTableData.capacity}
                    onChange={(e) => setBulkTableData({...bulkTableData, capacity: parseInt(e.target.value) || 1})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Vista Previa:</h4>
                <p className="text-sm text-gray-600">
                  Se crearán {bulkTableData.count} mesas: <strong>{bulkTableData.baseName} {bulkTableData.startNumber}</strong> hasta <strong>{bulkTableData.baseName} {bulkTableData.startNumber + bulkTableData.count - 1}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Cada mesa tendrá capacidad para {bulkTableData.capacity} personas
                </p>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={bulkTableLoading || !selectedRestaurant}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkTableLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando Mesas...
                    </>
                  ) : (
                    '🪑 Crear Mesas'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Prompt Editor Tab */}
        {activeTab === 'prompt-editor' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Editor de Prompts Personalizado</h3>
              <button
                onClick={resetPromptToDefault}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                🔄 Restaurar Original
              </button>
            </div>
            
            <form onSubmit={handleGenerateWithCustomPrompt} className="space-y-6">
              {/* File Upload (compartido) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes del Menú (máximo 3 archivos)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="menuFiles" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                        <span>Seleccionar archivos</span>
                        <input
                          id="menuFiles"
                          type="file"
                          multiple
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 5MB cada uno • Máximo 3 archivos</p>
                  </div>
                </div>
                
                {menuFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {menuFiles.map((file, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({aiMenuService.formatFileSize(file.size)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Prompt Editor */}
              <div>
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Personalizado para GPT-4 Vision
                </label>
                <div className="mb-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Personaliza las instrucciones para obtener mejores resultados. 
                    El prompt debe indicar qué extraer y en qué formato JSON responder.
                  </p>
                </div>
                <textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={12}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  placeholder="Ingresa tu prompt personalizado aquí..."
                />
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>{customPrompt.length} caracteres</span>
                  <span>Usa instrucciones claras y específicas para mejores resultados</span>
                </div>
              </div>

              {/* Quick Prompt Templates */}
              {prompts && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plantillas Rápidas
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomPrompt(prompts.mainPrompt)}
                      className="p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                    >
                      📄 Prompt Principal
                    </button>
                    {Object.entries(prompts.specializedPrompts || {}).map(([key, prompt]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCustomPrompt(prompt.text)}
                        className="p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                      >
                        {prompt.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="replaceExistingMenuCustom"
                    type="checkbox"
                    checked={replaceExistingMenu}
                    onChange={(e) => setReplaceExistingMenu(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="replaceExistingMenuCustom" className="ml-2 block text-sm text-gray-900">
                    Reemplazar menú existente
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="generateDescriptionsCustom"
                    type="checkbox"
                    checked={generateDescriptions}
                    onChange={(e) => setGenerateDescriptions(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generateDescriptionsCustom" className="ml-2 block text-sm text-gray-900">
                    Generar descripciones mejoradas con IA
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={promptLoading || !selectedRestaurant || menuFiles.length === 0 || !customPrompt.trim()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promptLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando con Prompt Personalizado...
                    </>
                  ) : (
                    '✏️ Generar con Prompt Personalizado'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Visual Identity Tab */}
        {activeTab === 'visual-identity' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Personalización Visual del Restaurante</h3>
              <div className="text-sm text-gray-500">
                Actualiza la identidad visual de tu restaurante
              </div>
            </div>
            
            <form onSubmit={handleUpdateVisualIdentity} className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo del Restaurante
                </label>
                <p className="text-xs text-gray-500 mb-3">Formato cuadrado recomendado (ej: 512x512). Se mostrará en la cabecera del menú.</p>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      onChange={(e) => handleVisualFileChange('logo', e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  
                  {visualPreviews.logo && (
                    <div className="relative">
                      <img 
                        src={visualPreviews.logo} 
                        alt="Logo preview" 
                        className="w-16 h-16 object-cover rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeVisualFile('logo')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner del Restaurante
                </label>
                <p className="text-xs text-gray-500 mb-3">Recomendado: 1600x400 píxeles. Se mostrará en la cabecera del menú público.</p>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      onChange={(e) => handleVisualFileChange('banner', e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  
                  {visualPreviews.banner && (
                    <div className="relative">
                      <img 
                        src={visualPreviews.banner} 
                        alt="Banner preview" 
                        className="w-24 h-12 object-cover rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeVisualFile('banner')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Fondo
                </label>
                <p className="text-xs text-gray-500 mb-3">Recomendado: 1920x1080 píxeles. Se usará como fondo del menú público.</p>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      onChange={(e) => handleVisualFileChange('backgroundImage', e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  
                  {visualPreviews.backgroundImage && (
                    <div className="relative">
                      <img 
                        src={visualPreviews.backgroundImage} 
                        alt="Background preview" 
                        className="w-24 h-12 object-cover rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeVisualFile('backgroundImage')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vista Previa Combinada */}
              {(visualPreviews.logo || visualPreviews.banner || visualPreviews.backgroundImage) && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Vista Previa del Menú</h4>
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{minHeight: '200px'}}>
                    {/* Imagen de fondo */}
                    {visualPreviews.backgroundImage && (
                      <img 
                        src={visualPreviews.backgroundImage} 
                        alt="Background" 
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                    )}
                    
                    {/* Banner */}
                    {visualPreviews.banner && (
                      <div className="relative">
                        <img 
                          src={visualPreviews.banner} 
                          alt="Banner" 
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Contenido con logo */}
                    <div className="relative p-4 flex items-center space-x-4">
                      {visualPreviews.logo && (
                        <img 
                          src={visualPreviews.logo} 
                          alt="Logo" 
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {selectedRestaurantInfo?.nombre || 'Nombre del Restaurante'}
                        </h3>
                        <p className="text-sm text-gray-600">Vista previa del menú público</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={visualLoading || !selectedRestaurant || !Object.values(visualFiles).some(file => file !== null)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {visualLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Actualizando Identidad Visual...
                    </>
                  ) : (
                    '🎨 Actualizar Identidad Visual'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIMenuGeneratorPage; 