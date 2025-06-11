import { useState } from 'react'
import { 
  CheckCircleIcon, 
  BuildingStorefrontIcon, 
  UserIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

const WelcomeDashboard = ({ userData, onContinueToDashboard }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState({ email: false, password: false, menuUrl: false })

  const credentials = {
    email: userData.email,
    password: 'tempPassword123!'
  }

  // Generar URL pública del menú
  const menuUrl = userData.restaurante?.slug 
    ? `${window.location.origin}/menu/${userData.restaurante.slug}`
    : 'URL pendiente de generar'

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied({ ...copied, [type]: true })
      setTimeout(() => {
        setCopied({ ...copied, [type]: false })
      }, 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">¡Bienvenido a Digital Menu!</h1>
          <p className="text-green-100 text-lg">
            Tu cuenta ha sido creada exitosamente
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Restaurant Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <BuildingStorefrontIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Tu Restaurante</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-semibold text-gray-900">{userData.restaurante?.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold text-primary-600">
                  {userData.restaurante?.plan?.nombre} (30 días gratis)
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Tu Cuenta</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Administrador</p>
                <p className="font-semibold text-gray-900">
                  {userData.nombre} {userData.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Public Menu URL */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <GlobeAltIcon className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-green-900">URL Pública de tu Menú</h2>
            </div>
            <p className="text-green-800 mb-4">
              Esta es la URL donde tus clientes podrán ver tu menú digital. ¡Compártela con todos!
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Tu menú estará disponible en:
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={menuUrl}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-gray-900 text-sm pr-10"
                    />
                    <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  </div>
                  <button
                    onClick={() => copyToClipboard(menuUrl, 'menuUrl')}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Copiar URL del menú"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                  {copied.menuUrl && (
                    <span className="text-green-600 text-sm font-semibold">¡Copiado!</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>💡 Tip:</strong> Una vez que agregues productos a tu menú desde el dashboard, 
                esta URL estará lista para compartir con tus clientes a través de códigos QR, redes sociales, 
                WhatsApp, o cualquier otro medio.
              </p>
            </div>
          </div>

          {/* Dashboard Access */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              🚀 Accede a tu Dashboard de Administración
            </h3>
            <p className="text-primary-800 mb-4">
              Usa estas credenciales para iniciar sesión en tu panel de administración del restaurante:
            </p>
            
            <div className="space-y-3">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Tu email de acceso:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={credentials.email}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-primary-300 rounded-lg text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    title="Copiar email"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                  {copied.email && (
                    <span className="text-green-600 text-sm font-semibold">¡Copiado!</span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Tu contraseña temporal:
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-primary-300 rounded-lg text-gray-900 font-mono text-sm pr-10"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    title="Copiar contraseña"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                  {copied.password && (
                    <span className="text-green-600 text-sm font-semibold">¡Copiado!</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Esta es tu contraseña temporal asignada automáticamente. Te recomendamos cambiarla una vez que accedas a tu dashboard por primera vez para mayor seguridad.
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Próximos pasos:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">1.</span>
                Ingresa al dashboard con las credenciales proporcionadas
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">2.</span>
                Personaliza la información de tu restaurante
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">3.</span>
                Configura tu menú digital y productos
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">4.</span>
                Invita a tu equipo de meseros
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">5.</span>
                ¡Comienza a recibir órdenes digitales!
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onContinueToDashboard}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <span>Ir al Dashboard</span>
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
            <button
              onClick={() => window.open('mailto:soporte@menuview.app')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Contactar Soporte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeDashboard 