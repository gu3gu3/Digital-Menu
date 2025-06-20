import { useState, useEffect } from 'react'
import { PhotoIcon, BuildingStorefrontIcon, LinkIcon, ClipboardDocumentIcon, CurrencyDollarIcon, PaintBrushIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import restaurantService from '../services/restaurantService'
import { getCurrenciesByRegion, getCurrencyDisplayInfo } from '../utils/currencyUtils'

const AdminRestaurantPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    telefono: '',
    direccion: '',
    email: '',
    moneda: 'USD',
    backgroundColor: '#f3f4f6', // Color gris por defecto
    logo: null,
    banner: null,
    backgroundImage: null
  })
  const [restaurantData, setRestaurantData] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  // ⭐ NUEVO: Paleta de colores predefinidos
  const colorPalette = [
    { color: '#f3f4f6', name: 'Gris Claro' },
    { color: '#fef3c7', name: 'Amarillo Claro' },
    { color: '#fce7f3', name: 'Rosa Claro' },
    { color: '#e0e7ff', name: 'Índigo Claro' },
    { color: '#ecfdf5', name: 'Verde Claro' },
    { color: '#fef2f2', name: 'Rojo Claro' },
    { color: '#f0f9ff', name: 'Azul Cielo Claro' },
    { color: '#f5f3ff', name: 'Violeta Claro' },
    { color: '#1f2937', name: 'Gris Oscuro' },
    { color: '#991b1b', name: 'Rojo Oscuro' },
    { color: '#1e40af', name: 'Azul Oscuro' },
    { color: '#059669', name: 'Verde Esmeralda' },
    { color: '#7c3aed', name: 'Violeta' },
    { color: '#dc2626', name: 'Rojo' },
    { color: '#ca8a04', name: 'Amarillo Dorado' },
    { color: '#0891b2', name: 'Azul Cian' }
  ]

  useEffect(() => {
    loadRestaurantData()
    loadSupportedCurrencies()
  }, [])

  const loadRestaurantData = async () => {
    try {
      const restaurante = await restaurantService.getMyRestaurant()
      
      // Guardar datos completos del restaurante
      setRestaurantData(restaurante)
      
      setFormData({
        nombre: restaurante.nombre || '',
        descripcion: restaurante.descripcion || '',
        telefono: restaurante.telefono || '',
        direccion: restaurante.direccion || '',
        email: restaurante.email || '',
        moneda: restaurante.moneda || 'USD',
        backgroundColor: restaurante.backgroundColor || '#f3f4f6',
        logo: null,
        banner: null,
        backgroundImage: null
      })
    } catch (error) {
      console.error('Error loading restaurant data:', error)
      setError('Error al cargar la información del restaurante')
    }
  }

  const loadSupportedCurrencies = async () => {
    try {
      const supportedCurrencies = await restaurantService.getSupportedCurrencies()
      setCurrencies(supportedCurrencies)
    } catch (error) {
      console.error('Error loading currencies:', error)
      // Fallback a las monedas locales si falla la API
      const localCurrencies = getCurrenciesByRegion()
      const allCurrencies = [
        ...localCurrencies['América del Norte'],
        ...localCurrencies['Centroamérica']
      ]
      setCurrencies(allCurrencies)
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    
    if (files) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // ⭐ NUEVO: Manejar selección de color de la paleta
  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      backgroundColor: color,
      backgroundImage: null // Limpiar imagen si se selecciona color
    }))
    
    // Limpiar el input de imagen de fondo
    const bgImageInput = document.getElementById('backgroundImage')
    if (bgImageInput) bgImageInput.value = ''
  }

  const menuUrl = `${window.location.origin}/menu/${restaurantData?.slug}`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Preparar datos básicos para actualizar (sin archivos)
      const basicData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        telefono: formData.telefono,
        direccion: formData.direccion,
        email: formData.email,
        moneda: formData.moneda,
        backgroundColor: formData.backgroundColor // ⭐ NUEVO
      }

      // Actualizar información básica
      await restaurantService.updateMyRestaurant(basicData)

      // Si hay archivos, subirlos por separado
      if (formData.logo || formData.banner || formData.backgroundImage) {
        const formDataToSend = new FormData()
        
        // Agregar datos del restaurante
        formDataToSend.append('nombre', formData.nombre)
        formDataToSend.append('descripcion', formData.descripcion)
        formDataToSend.append('telefono', formData.telefono)
        formDataToSend.append('direccion', formData.direccion)
        formDataToSend.append('backgroundColor', formData.backgroundColor) // ⭐ NUEVO
        
        // Agregar archivos si existen
        if (formData.logo) {
          formDataToSend.append('logo', formData.logo)
        }
        if (formData.banner) {
          formDataToSend.append('banner', formData.banner)
        }
        if (formData.backgroundImage) { // ⭐ NUEVO
          formDataToSend.append('backgroundImage', formData.backgroundImage)
        }

        await restaurantService.uploadRestaurantFiles(formDataToSend)
      }

      setSuccess('Información del restaurante actualizada exitosamente')
      // Recargar datos para mostrar cambios
      await loadRestaurantData()
      
      // Limpiar archivos del formulario
      setFormData(prev => ({
        ...prev,
        logo: null,
        banner: null,
        backgroundImage: null
      }))
      
      // Limpiar los inputs de archivo
      const logoInput = document.getElementById('logo')
      const bannerInput = document.getElementById('banner')
      const bgImageInput = document.getElementById('backgroundImage')
      if (logoInput) logoInput.value = ''
      if (bannerInput) bannerInput.value = ''
      if (bgImageInput) bgImageInput.value = ''
      
    } catch (error) {
      setError(error.message || 'Error al actualizar la información')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar monedas por región para mostrar mejor en el selector
  const currenciesByRegion = getCurrenciesByRegion()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Restaurante</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona la información básica, moneda y la apariencia de tu restaurante
        </p>
      </div>

      {/* URL del Menú Público */}
      {restaurantData?.slug && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 flex items-center mb-2">
                <LinkIcon className="h-5 w-5 mr-2 text-primary-600" />
                URL de tu Menú Público
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Comparte este enlace con tus clientes para que vean tu menú en línea
              </p>
              
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-white border border-gray-300 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">URL del restaurante:</div>
                  <div className="font-mono text-primary-700 font-medium">
                    {menuUrl}
                  </div>
                </div>
                
                <button
                  onClick={() => copyToClipboard(menuUrl)}
                  className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                  Copiar
                </button>
                
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-3 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Ver Menú
                  <svg className="h-3 w-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
              
              {copySuccess && (
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  ¡URL copiada al portapapeles!
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-primary-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Slug del restaurante:</span>
                <div className="font-mono text-gray-600 mt-1">{restaurantData.slug}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Estado:</span>
                <div className="text-green-600 mt-1 flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Menú público activo
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Moneda actual:</span>
                <div className="mt-1 flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-600" />
                  {getCurrencyDisplayInfo(restaurantData.moneda)?.displayName || 'USD - Dólar'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información del Administrador */}
      {restaurantData?.admin && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
              Información del Administrador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="font-medium text-gray-700">Nombre: <span className="font-normal text-gray-900">{restaurantData.admin.nombre} {restaurantData.admin.apellido}</span></div>
              <div className="font-medium text-gray-700">Email: <span className="font-normal text-gray-900">{restaurantData.admin.email}</span></div>
              <div className="font-medium text-gray-700">Teléfono: <span className="font-normal text-gray-900">{restaurantData.admin.telefono || 'No especificado'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-600" />
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre del Restaurante *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Nombre de tu restaurante"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="+1-234-567-8900"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Breve descripción de tu restaurante"
                  value={formData.descripcion}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                  Dirección *
                </label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Dirección completa del restaurante"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email del Restaurante
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ej: info@turestaurante.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ⭐ NUEVA SECCIÓN: Configuración de Moneda */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-600" />
              Configuración de Moneda
            </h3>
            
            <div className="max-w-md">
              <label htmlFor="moneda" className="block text-sm font-medium text-gray-700 mb-2">
                Moneda de tu Restaurante *
              </label>
              <select
                id="moneda"
                name="moneda"
                value={formData.moneda}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <optgroup label="América del Norte">
                  {currenciesByRegion['América del Norte']?.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.country})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Centroamérica">
                  {currenciesByRegion['Centroamérica']?.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.country})
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Los precios de tu menú se mostrarán en esta moneda. No incluye conversión automática.
              </p>
            </div>
          </div>

          {/* ⭐ NUEVA SECCIÓN: Personalización de Fondo */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <PaintBrushIcon className="h-5 w-5 mr-2 text-gray-600" />
              Personalización del Menú Público
            </h3>
            
            <div className="space-y-6">
              {/* Paleta de colores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Color de Fondo
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {colorPalette.map((colorInfo) => (
                    <button
                      key={colorInfo.color}
                      type="button"
                      onClick={() => handleColorSelect(colorInfo.color)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        formData.backgroundColor === colorInfo.color
                          ? 'border-primary-600 ring-2 ring-primary-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: colorInfo.color }}
                      title={colorInfo.name}
                    >
                      {formData.backgroundColor === colorInfo.color && (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Selecciona un color de fondo para el menú público de tu restaurante
                </p>
              </div>

              {/* Color personalizado */}
              <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Personalizado (Hex)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="backgroundColor"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                    placeholder="#000000"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                  <span className="text-sm text-gray-500">o introduce un código hex</span>
                </div>
              </div>

              {/* Imagen de fondo alternativa */}
              <div>
                <label htmlFor="backgroundImage" className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Fondo (Alternativa al Color)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="backgroundImage"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Subir imagen de fondo</span>
                        <input
                          id="backgroundImage"
                          name="backgroundImage"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleChange}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                  </div>
                </div>
                {formData.backgroundImage && (
                  <p className="mt-2 text-sm text-gray-600">
                    Archivo seleccionado: {formData.backgroundImage.name}
                  </p>
                )}
                <p className="mt-2 text-sm text-yellow-600">
                  <strong>Nota:</strong> Si subes una imagen, se usará en lugar del color seleccionado
                </p>
              </div>
            </div>
          </div>

          {/* Visual Identity */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <PhotoIcon className="h-5 w-5 mr-2 text-gray-600" />
              Identidad Visual
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                  Logo del Restaurante
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="logo"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Subir logo</span>
                        <input
                          id="logo"
                          name="logo"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleChange}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                  </div>
                </div>
                {formData.logo && (
                  <p className="mt-2 text-sm text-gray-600">
                    Archivo seleccionado: {formData.logo.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="banner" className="block text-sm font-medium text-gray-700">
                  Banner del Restaurante
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="banner"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Subir banner</span>
                        <input
                          id="banner"
                          name="banner"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleChange}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                  </div>
                </div>
                {formData.banner && (
                  <p className="mt-2 text-sm text-gray-600">
                    Archivo seleccionado: {formData.banner.name}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  El banner se mostrará como fondo del encabezado en el menú público
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-2 rounded-md font-medium hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminRestaurantPage 