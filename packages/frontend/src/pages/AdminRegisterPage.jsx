import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import logo from '../assets/logo.png'
import authService from '../services/authService'
import InternationalPhoneInput from '../components/InternationalPhoneInput'

const AdminRegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '', // Teléfono personal del administrador
    password: '',
    confirmPassword: '',
    // Datos del restaurante
    nombreRestaurante: '',
    descripcion: '',
    telefonoRestaurante: '', // Teléfono del restaurante
    emailRestaurante: '', // Email del restaurante
    direccion: '',
    pais: 'CR' // Default a Costa Rica
  })

  const countries = [
    { code: 'AR', name: 'Argentina' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BR', name: 'Brasil' },
    { code: 'CA', name: 'Canadá' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'ES', name: 'España' },
    { code: 'US', name: 'Estados Unidos' },
    { code: 'FR', name: 'Francia' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'HN', name: 'Honduras' },
    { code: 'IT', name: 'Italia' },
    { code: 'MX', name: 'México' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'PA', name: 'Panamá' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Perú' },
    { code: 'GB', name: 'Reino Unido' },
    { code: 'DO', name: 'República Dominicana' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' }
  ].sort((a, b) => a.name.localeCompare(b.name));
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await authService.getPublicPlans()
        if (response.data && response.data.success) {
          setPlans(response.data.data)
          // Preseleccionar el plan más barato (o gratis) si existe
          if (response.data.data.length > 0) {
            setSelectedPlanId(response.data.data[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      }
    }
    fetchPlans()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpiar error específico cuando el usuario empiece a escribir
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const handlePhoneChange = (value, fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: value || ''
    })
    // Limpiar error específico
    if (errors[fieldName]) {
      setErrors({
        ...errors,
        [fieldName]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validaciones del administrador
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono personal es requerido'
    if (!formData.email.includes('@')) newErrors.email = 'Email no válido'
    if (!formData.password) newErrors.password = 'La contraseña es requerida'
    if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    // Validaciones del restaurante
    if (!formData.nombreRestaurante.trim()) newErrors.nombreRestaurante = 'El nombre del restaurante es requerido'
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida'
    if (!formData.telefonoRestaurante.trim()) newErrors.telefonoRestaurante = 'El teléfono del restaurante es requerido'
    if (!formData.emailRestaurante.trim()) newErrors.emailRestaurante = 'El email del restaurante es requerido'
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es requerida'
    if (!selectedPlanId) newErrors.plan = 'Debes seleccionar un plan'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const result = await authService.register({
        // Datos del administrador
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password,
        // Datos del restaurante
        restaurante: {
          nombre: formData.nombreRestaurante,
          descripcion: formData.descripcion,
          telefono: formData.telefonoRestaurante,
          email: formData.emailRestaurante,
          direccion: formData.direccion,
          pais: formData.pais,
          planId: selectedPlanId
        }
      })

      if (result.data && result.data.success) {
        // Guardar token en localStorage (authService ya lo maneja automáticamente en login)
        localStorage.setItem('adminToken', result.data.data.token)
        localStorage.setItem('adminUser', JSON.stringify(result.data.data.user))
        
        // Redirigir al dashboard
        navigate('/admin/dashboard')
      } else {
        if (result.data && result.data.errors) {
          setErrors(result.data.errors)
        } else {
          setErrors({ general: result.error || result.data?.message || 'Error al registrar' })
        }
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <img src={logo} alt="Menu View" className="h-20 w-auto" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Crea tu cuenta de administrador
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Únete a más de 1,000+ restaurantes que ya modernizaron su experiencia
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-8">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre Completo *
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    className={`mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.nombre ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tu nombre completo"
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                </div>

                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                    Apellido *
                  </label>
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    required
                    className={`mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.apellido ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tu apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                  />
                  {errors.apellido && <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="admin@bellavista.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <InternationalPhoneInput
                    label="Teléfono Personal *"
                    value={formData.telefono}
                    onChange={(value) => handlePhoneChange(value, 'telefono')}
                    placeholder="Tu número de teléfono personal"
                    name="telefono"
                    error={errors.telefono}
                    required={true}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className={`block w-full px-3 py-3 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmar Contraseña *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={`block w-full px-3 py-3 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Información del Restaurante */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Restaurante</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nombreRestaurante" className="block text-sm font-medium text-gray-700">
                      Nombre del Restaurante *
                    </label>
                    <input
                      id="nombreRestaurante"
                      name="nombreRestaurante"
                      type="text"
                      required
                      className={`mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.nombreRestaurante ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nombre de tu restaurante"
                      value={formData.nombreRestaurante}
                      onChange={handleChange}
                    />
                    {errors.nombreRestaurante && <p className="mt-1 text-sm text-red-600">{errors.nombreRestaurante}</p>}
                  </div>

                  <div>
                    <label htmlFor="pais" className="block text-sm font-medium text-gray-700">
                      País del Restaurante *
                    </label>
                    <select
                      id="pais"
                      name="pais"
                      required
                      className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.pais}
                      onChange={handleChange}
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                    Descripción *
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    required
                    rows={3}
                    className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Breve descripción de tu restaurante (opcional)"
                    value={formData.descripcion}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <InternationalPhoneInput
                      label="Teléfono del Restaurante *"
                      value={formData.telefonoRestaurante}
                      onChange={(value) => handlePhoneChange(value, 'telefonoRestaurante')}
                      onCountryChange={(country) => {
                        if (country) {
                          setFormData(prev => ({ ...prev, pais: country }))
                        }
                      }}
                      placeholder="Teléfono de contacto del restaurante"
                      name="telefonoRestaurante"
                      error={errors.telefonoRestaurante}
                      required={true}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Selecciona la bandera correcta o escribe el prefijo internacional (ej. +502) para configurar automáticamente tu país y moneda.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="emailRestaurante" className="block text-sm font-medium text-gray-700">
                      Email del Restaurante *
                    </label>
                    <input
                      id="emailRestaurante"
                      name="emailRestaurante"
                      type="email"
                      required
                      className={`mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.emailRestaurante ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="contacto@turestaurante.com"
                      value={formData.emailRestaurante}
                      onChange={handleChange}
                    />
                    {errors.emailRestaurante && <p className="mt-1 text-sm text-red-600">{errors.emailRestaurante}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                    Dirección *
                  </label>
                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    required
                    className={`mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.direccion ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Dirección del restaurante"
                    value={formData.direccion}
                    onChange={handleChange}
                  />
                  {errors.direccion && <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>}
                </div>
              </div>
            </div>

            {/* Plan Information */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selecciona tu Plan</h3>
              {errors.plan && <p className="mb-4 text-sm text-red-600">{errors.plan}</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.length === 0 ? (
                  <div className="col-span-full flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative rounded-lg border p-4 cursor-pointer flex flex-col focus:outline-none ${
                        selectedPlanId === plan.id 
                          ? 'bg-primary-50 border-primary-500 ring-2 ring-primary-500' 
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`text-lg font-medium ${selectedPlanId === plan.id ? 'text-primary-900' : 'text-gray-900'}`}>
                          {plan.nombre}
                        </h4>
                        <span className={`text-lg font-bold ${selectedPlanId === plan.id ? 'text-primary-700' : 'text-gray-900'}`}>
                          {plan.precio === 0 ? 'Gratis' : `$${plan.precio}/mes`}
                        </span>
                      </div>
                      
                      <ul className={`text-sm space-y-1 ${selectedPlanId === plan.id ? 'text-primary-700' : 'text-gray-600'}`}>
                        <li>• Hasta {plan.limiteProductos} productos</li>
                        <li>• Hasta {plan.limiteCategorias} categorías</li>
                        {plan.limiteMesas > 0 && <li>• Hasta {plan.limiteMesas} mesas (QR)</li>}
                        {plan.limiteMeseros > 0 && <li>• Hasta {plan.limiteMeseros} meseros</li>}
                        {plan.limiteOrdenes > 0 && <li>• {plan.limiteOrdenes} órdenes mensuales</li>}
                      </ul>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 border-opacity-50">
                        <p className="text-xs text-gray-500 text-center font-medium">
                          Incluye 15 días de prueba gratis
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando cuenta...
                  </div>
                ) : (
                  'Crear Cuenta Gratis'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminRegisterPage 