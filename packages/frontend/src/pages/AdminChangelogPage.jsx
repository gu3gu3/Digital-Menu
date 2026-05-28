import { useState, useEffect } from 'react'
import { 
  SparklesIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  ServerStackIcon,
  DevicePhoneMobileIcon,
  CurrencyEuroIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline'
import apiClient from '../lib/apiClient'

const AdminChangelogPage = () => {
  const [loading, setLoading] = useState(true)
  const [planName, setPlanName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const statsRes = await apiClient.get('/admin/stats')
      setPlanName(statsRes.data.data.plan.nombre)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Roadmap & Changelog Dummy Data
  const roadmapItems = [
    {
      id: 0,
      title: "Configuración y Desglose Automático de IVA y Servicio",
      description: "Ahora puedes configurar un porcentaje de IVA y un cargo por servicio global. El sistema desglosará y calculará el total en el carrito del cliente de forma automática. Disponible a partir del Plan Pro.",
      date: "Mayo 2026",
      status: "Lanzado",
      icon: SparklesIcon,
      color: "bg-indigo-500"
    },
    {
      id: 1,
      title: "Nuevo Canal de Feedback Directo: 'Danos tu Opinión'",
      description: "Hemos habilitado una nueva sección donde puedes sugerir las funcionalidades que necesitas. ¡Leemos todas las sugerencias!",
      date: "Mayo 2026",
      status: "Planificado",
      icon: ChatBubbleBottomCenterTextIcon,
      color: "bg-green-500"
    },
    {
      id: 2,
      title: "Soporte Multi-divisa: Incorporación del Euro (€) para Expansión Global",
      description: "Soporte del Euro (€) como moneda nativa para nuestros clientes en Europa y España.",
      date: "Enero 2026",
      status: "Planificado",
      icon: CurrencyEuroIcon,
      color: "bg-blue-500"
    },
    {
      id: 3,
      title: "Panel de Meseros Optimizado para Dispositivos Móviles",
      description: "Re-diseño completo de la interfaz de meseros para garantizar rapidez en la toma de órdenes desde cualquier smartphone.",
      date: "Agosto 2025",
      status: "En Desarrollo",
      icon: DevicePhoneMobileIcon,
      color: "bg-yellow-500"
    },
    {
      id: 4,
      title: "Migración a Infraestructura de Google Cloud (Máxima Disponibilidad)",
      description: "Mejoramos nuestra arquitectura en la nube para garantizar 99.9% de uptime y mayor velocidad de carga en los menús.",
      date: "Junio 2025",
      status: "Planificado",
      icon: ServerStackIcon,
      color: "bg-purple-500"
    },
    {
      id: 5,
      title: "Asistente de Inteligencia Artificial para Onboarding",
      description: "Creación automática de menús con Inteligencia Artificial a partir de imágenes o textos para reducir el tiempo de configuración.",
      date: "Marzo 2025",
      status: "Planificado",
      icon: SparklesIcon,
      color: "bg-primary-500"
    },
    {
      id: 6,
      title: "Módulo KDS (Kitchen Display System) para Cocina",
      description: "Panel dedicado para la cocina con métricas de tiempo de preparación para optimizar el flujo de trabajo.",
      date: "Enero 2025",
      status: "Lanzado",
      icon: RocketLaunchIcon,
      color: "bg-orange-500"
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Vista bloqueada para Plan Emprendedor
  if (planName === 'Plan Emprendedor') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <RocketLaunchIcon className="h-6 w-6 mr-2 text-primary-600" />
            Novedades y Mejoras
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Descubre las últimas actualizaciones y lo que viene para MenuView.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-8 text-center border-t-4 border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mantente a la vanguardia</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            El acceso al Roadmap y las Novedades de la plataforma es exclusivo para planes de Crecimiento en adelante.
            ¡Mejora tu plan para estar al tanto de las nuevas funciones que pueden potenciar tu restaurante!
          </p>
          <a
            href="https://wa.me/50577483492?text=Hola,%20me%20gustar%C3%ADa%20mejorar%20mi%20plan%20en%20MenuView"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Mejorar mi Plan
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <RocketLaunchIcon className="h-6 w-6 mr-2 text-primary-600" />
          Novedades y Mejoras
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          El progreso no se detiene. Conoce las últimas actualizaciones y nuestro Roadmap.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flow-root">
            <ul className="-mb-8">
              {roadmapItems.map((item, itemIdx) => (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {itemIdx !== roadmapItems.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${item.color}`}
                        >
                          <item.icon className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}{' '}
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.status}
                            </span>
                          </p>
                          <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={item.date}>{item.date}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminChangelogPage
