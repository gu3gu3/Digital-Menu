import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet, NavLink } from 'react-router-dom'
import {
  HomeIcon,
  BuildingStorefrontIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  QrCodeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  LinkIcon,
  BellIcon as BellIconOutline,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import logo from '../assets/logo.png'
import NotificationBell from './NotificationBell'
import { Transition } from '@headlessui/react'
import { getBeautifulMenuUrl } from '../utils/urlHelper'
import apiClient from '../lib/apiClient'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [planInfo, setPlanInfo] = useState({ nombre: 'Cargando...' })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('adminToken')
    const userData = localStorage.getItem('adminUser')
    
    if (!token || !userData) {
      navigate('/admin/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setRestaurant(parsedUser.restaurante)
      
      // Obtener información del plan
      loadPlanInfo()
    } catch (error) {
      console.error('Error parsing user data:', error)
      navigate('/admin/login')
    }
  }, [navigate])

  const loadPlanInfo = async () => {
    try {
      // 1. Refrescar información de usuario y restaurante
      const userRes = await apiClient.get('/auth/me')
      if (userRes.data?.data?.user) {
        const freshUser = userRes.data.data.user;
        const currentUser = JSON.parse(localStorage.getItem('adminUser'));
        const updatedUser = { ...currentUser, ...freshUser };
        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setRestaurant(freshUser.restaurante);
      }

      // 2. Cargar info del plan
      const response = await apiClient.get('/admin/stats')
      setPlanInfo(response.data.data.plan)
    } catch (error) {
      console.error('Error loading plan info or refreshing user:', error)
      setPlanInfo({ nombre: 'Plan Desconocido' }) // fallback
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/admin/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Restaurante', href: '/admin/restaurant', icon: BuildingStorefrontIcon },
    { name: 'Menú', href: '/admin/menu', icon: RectangleStackIcon },
    { name: 'Órdenes', href: '/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Notificaciones', href: '/admin/notifications', icon: BellIconOutline },
    { name: 'Mesas & QR', href: '/admin/tables', icon: QrCodeIcon },
    { name: 'Meseros', href: '/admin/staff', icon: UsersIcon },
    { name: 'Danos tu opinión', href: '/admin/feedback', icon: ChatBubbleBottomCenterTextIcon },
    { name: 'Novedades y Mejoras', href: '/admin/changelog', icon: SparklesIcon },
    { name: 'Configuración', href: '/admin/settings', icon: Cog6ToothIcon },
  ]

  const isCurrentPath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Soft Block: Si el restaurante está inactivo, ocultar el panel
  if (restaurant && restaurant.activo === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img src={logo} alt="Menu View" className="mx-auto h-16 w-auto grayscale" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cuenta Suspendida
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Su cuenta se encuentra inactiva por falta de pago o por decisión administrativa.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Acceso Restringido</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>No puede acceder al panel de administración ni recibir órdenes en este momento.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Por favor, contacte a soporte o regularice su situación de facturación para restaurar el acceso.
            </p>
            
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 flex-col w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-in-out md:static md:inset-0 z-40 flex`}>
        
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <img src={logo} alt="Menu View" className="h-10 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-colors duration-150 ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <button
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6 text-gray-500" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <h1 className="text-lg font-semibold text-gray-900">
                    Panel de Administración
                  </h1>
                </div>
                
                {restaurant?.slug && (
                  <a 
                    href={getBeautifulMenuUrl(restaurant)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    <span className="hidden lg:inline">Ver Mi Menú Público</span>
                    <span className="lg:hidden">Ver Menú</span>
                    <svg className="h-3 w-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <NotificationBell />
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.nombre} {user.apellido}
                </p>
                <PlanBadge planName={planInfo.nombre} />
                {restaurant?.nombre && (
                  <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                    {restaurant.nombre}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.nombre?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const PlanBadge = ({ planName }) => {
  const planStyles = {
    'Plan Gratuito': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Plan Básico': 'bg-blue-100 text-blue-800 border-blue-200',
    'Plan Platinium': 'bg-slate-100 text-slate-800 border-slate-200',
    'Plan Gold': 'bg-amber-100 text-amber-800 border-amber-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const style = planStyles[planName] || planStyles.default;

  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm border ${style}`}>
      {planName}
    </span>
  );
};

export default AdminLayout 