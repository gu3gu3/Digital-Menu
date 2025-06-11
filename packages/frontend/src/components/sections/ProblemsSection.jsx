import { 
  XCircleIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline'

const ProblemsSection = () => {
  const problems = [
    {
      icon: DocumentTextIcon,
      title: 'Menús sin Imágenes',
      description: 'Los menús físicos tradicionales no pueden mostrar fotos atractivas de los platos, limitando la experiencia visual del cliente.',
      color: 'text-red-600 bg-red-100'
    },
    {
      icon: ExclamationTriangleIcon,
      title: 'Falta de Higiene',
      description: 'Los menús físicos pasan de mano en mano, creando puntos de contacto innecesarios especialmente críticos en la era post-COVID.',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: XCircleIcon,
      title: 'Deterioro Constante',
      description: 'Los menús impresos se manchan, rompen y deterioran rápidamente, dando una imagen poco profesional al restaurante.',
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Costos de Reimpresión',
      description: 'Cada cambio de precio o nuevo platillo requiere reimprimir todos los menús, generando costos innecesarios y desperdicio.',
      color: 'text-purple-600 bg-purple-100'
    }
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Cansado de los problemas de los menús tradicionales?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Los menús físicos presentan múltiples desafíos que afectan tanto la experiencia del cliente 
            como la operación de tu restaurante
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="card text-center group hover:-translate-y-2">
              <div className={`w-16 h-16 ${problem.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <problem.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {problem.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Es hora de hacer el cambio
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Únete a la revolución digital y ofrece a tus clientes una experiencia moderna y segura
            </p>
            <button 
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary"
            >
              Descubre la Solución
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProblemsSection 