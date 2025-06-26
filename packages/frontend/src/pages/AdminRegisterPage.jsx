import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import logo from '../assets/logo.png'
import authService from '../services/authService'
import InternationalPhoneInput from '../components/InternationalPhoneInput'

const AdminRegisterPage = () => {
  const [formData, setFormData] = useState({
    // Datos del administrador
    nombre: '',
    email: '',
    telefono: '', // Teléfono personal del administrador
    password: '',
    confirmPassword: '',
    // Datos del restaurante
    nombreRestaurante: '',
    descripcion: '',
    telefonoRestaurante: '', // Teléfono del restaurante
    emailRestaurante: '', // Email del restaurante
    direccion: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

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
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    if (!formData.email.includes('@')) newErrors.email = 'Email no válido'
    if (!formData.password) newErrors.password = 'La contraseña es requerida'
    if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    // Validaciones del restaurante
    if (!formData.nombreRestaurante.trim()) newErrors.nombreRestaurante = 'El nombre del restaurante es requerido'
    if (!formData.telefonoRestaurante.trim()) newErrors.telefonoRestaurante = 'El teléfono del restaurante es requerido'
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es requerida'

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
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password,
        // Datos del restaurante
        restaurante: {
          nombre: formData.nombreRestaurante,
          descripcion: formData.descripcion,
          telefono: formData.telefonoRestaurante,
          email: formData.emailRestaurante,
          direccion: formData.direccion
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
                    label="Teléfono Personal"
                    value={formData.telefono}
                    onChange={(value) => handlePhoneChange(value, 'telefono')}
                    placeholder="Tu número de teléfono personal"
                    name="telefono"
                    error={errors.telefono}
                    required={false}
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
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
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
                      placeholder="Teléfono de contacto del restaurante"
                      name="telefonoRestaurante"
                      error={errors.telefonoRestaurante}
                      required={true}
                    />
                  </div>

                  <div>
                    <label htmlFor="emailRestaurante" className="block text-sm font-medium text-gray-700">
                      Email del Restaurante
                    </label>
                    <input
                      id="emailRestaurante"
                      name="emailRestaurante"
                      type="email"
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

            {/* Plan Information - CORREGIDO */}
            <div className="bg-primary-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-primary-800 mb-2">Plan Gratuito Incluye:</h4>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>• Hasta 25 productos en el menú</li>
                <li>• Hasta 5 mesas con código QR</li>
                <li>• Hasta 1 cuenta de meseros</li>
                <li>• Hasta 300 órdenes mensuales</li>
                <li>• 🤖 Digitalización de menú con IA*</li>
                <li>• 💱 7 monedas centroamericanas</li>
                <li>• 📱 Menú digital responsivo</li>
                <li>• Soporte por email</li>
              </ul>
              <p className="text-xs text-primary-600 mt-2">
                * Servicio de digitalización disponible como servicio adicional para clientes activos
              </p>
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