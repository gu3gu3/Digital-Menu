import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  QrCodeIcon,
  UsersIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    productos: 0,
    categorias: 0,
    ordenes: 0,
    mesas: 0,
    meseros: 0,
    ordenesHoy: 0,
    plan: {
      nombre: '',
      limiteProductos: 50,
      limiteMesas: 10,
      limiteMeseros: 2,
      limiteOrdenes: 200
    }
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      
      // Cargar estadísticas generales
      const statsResponse = await fetch('http://localhost:3001/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      // Cargar órdenes recientes
      const ordersResponse = await fetch('http://localhost:3001/api/orders?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData.data || [])
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (current, limit) => {
    if (limit === 0) {
      return 0; // Si el límite es 0 (ilimitado), el uso es 0%
    }
    return Math.min((current / limit) * 100, 100);
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const quickActions = [
    {
      title: 'Agregar Producto',
      description: 'Añadir nuevo producto al menú',
      icon: PlusIcon,
      action: () => navigate('/admin/menu'),
      color: 'bg-primary-500'
    },
    {
      title: 'Crear Mesa',
      description: 'Agregar nueva mesa con QR',
      icon: QrCodeIcon,
      action: () => navigate('/admin/tables'),
      color: 'bg-secondary-500'
    },
    {
      title: 'Ver Órdenes',
      description: 'Revisar órdenes activas',
      icon: EyeIcon,
      action: () => navigate('/admin/orders'),
      color: 'bg-blue-500'
    },
    {
      title: 'Agregar Mesero',
      description: 'Crear cuenta de mesero',
      icon: UsersIcon,
      action: () => navigate('/admin/staff'),
      color: 'bg-purple-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general de tu restaurante y menú digital
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RectangleStackIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Productos</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stats.productos}</p>
                <span className="ml-2 text-sm text-gray-500">/ {stats.plan?.limiteProductos === 0 ? '∞' : stats.plan?.limiteProductos || '∞'}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(stats.productos, stats.plan?.limiteProductos || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <QrCodeIcon className="h-8 w-8 text-secondary-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Mesas</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stats.mesas}</p>
                <span className="ml-2 text-sm text-gray-500">
                  / {stats.plan?.limiteMesas === 0 ? '∞' : stats.plan?.limiteMesas || '∞'}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-secondary-500 h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(stats.mesas, stats.plan?.limiteMesas || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Órdenes Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.ordenesHoy}</p>
              <p className="text-sm text-gray-500">Total: {stats.ordenes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Meseros</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stats.meseros}</p>
                 <span className="ml-2 text-sm text-gray-500">
                  / {stats.plan?.limiteMeseros === 0 ? '∞' : stats.plan?.limiteMeseros || '∞'}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(stats.meseros, stats.plan?.limiteMeseros || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Órdenes Recientes</h2>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Ver todas
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Orden #{order.numeroOrden?.split('-').pop() || 'N/A'} • Mesa {order.mesa?.numero || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items?.length || 0} productos
                        {order.mesero && (
                          <span className="ml-2 text-blue-600">
                            • Mesero: {order.mesero.nombre} {order.mesero.apellido || ''}
                          </span>
                        )}
                        {!order.mesero && (
                          <span className="ml-2 text-amber-600">• Sin asignar</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        C$ {parseFloat(order.total || 0).toFixed(2)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                        order.estado === 'EN_PREPARACION' ? 'bg-yellow-100 text-yellow-800' :
                        order.estado === 'SERVIDA' ? 'bg-blue-100 text-blue-800' :
                        order.estado === 'LISTA' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.estado || 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay órdenes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Las órdenes aparecerán aquí cuando los clientes empiecen a pedir.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Plan Info */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{stats.plan?.nombre || 'Plan Básico'}</h2>
            <p className="text-sm text-gray-500">Plan con funciones esenciales para tu restaurante</p>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.plan?.limiteProductos === 0 ? '∞' : stats.plan?.limiteProductos || '∞'}</p>
              <p className="text-sm text-gray-500">Productos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.plan?.limiteMesas === 0 ? '∞' : stats.plan?.limiteMesas || '∞'}</p>
              <p className="text-sm text-gray-500">Mesas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.plan?.limiteMeseros === 0 ? '∞' : stats.plan?.limiteMeseros || '∞'}</p>
              <p className="text-sm text-gray-500">Meseros</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.plan?.limiteOrdenes === 0 ? '∞' : stats.plan?.limiteOrdenes || '∞'}</p>
              <p className="text-sm text-gray-500">Órdenes/mes</p>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 text-right">
             <button
              onClick={() => navigate('/admin/billing')} // Asumiendo que esta será la ruta
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Explorar Planes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 