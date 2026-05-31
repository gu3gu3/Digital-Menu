import React from 'react'
import { ArrowTopRightOnSquareIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'

const DemoSection = () => {
  const demoUrl = "https://menuview.app/bella-vista";

  return (
    <section id="demo" className="section-padding bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Experimenta la Magia en Tiempo Real
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Ponte en los zapatos de tus clientes. Explora nuestro menú de demostración y descubre lo fácil, rápido y atractivo que es ordenar con <strong>MenuView.app</strong>.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <a 
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <DevicePhoneMobileIcon className="h-6 w-6 mr-2" />
              <span>Abrir Menú de Prueba</span>
              <ArrowTopRightOnSquareIcon className="h-5 w-5 ml-2 opacity-80" />
            </a>
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <StarIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">100%</div>
            <div className="text-gray-500 text-sm font-medium">Digital & Higiénico</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <StarIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-gray-500 text-sm font-medium">Costos de Impresión</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <StarIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">+30%</div>
            <div className="text-gray-500 text-sm font-medium">Aumento en Ventas</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <StarIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">5 min</div>
            <div className="text-gray-500 text-sm font-medium">Para Digitalizar con IA</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DemoSection