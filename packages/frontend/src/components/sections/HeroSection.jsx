import { SparklesIcon } from '@heroicons/react/24/solid'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import bannerImg from '../../assets/banner-menuviewapp.jpeg'

const HeroSection = () => {
  const scrollToRegister = (e) => {
    e.preventDefault();
    const element = document.getElementById('register')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const whatsappMessage = encodeURIComponent("Me interesa conocer más sobre el Plan Pro");
  const whatsappUrl = `https://wa.me/50588888888?text=${whatsappMessage}`; // Placeholder número, el usuario lo ajustará luego

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax effect */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${bannerImg})` }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gray-900/60" />
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center pt-20 pb-16">
        
        {/* AI Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
          <SparklesIcon className="h-5 w-5 text-yellow-400 animate-pulse" />
          <span className="text-white text-sm font-medium tracking-wide">
            Powered by Inteligencia Artificial
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="animate-fade-in-up animation-delay-100 text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-5xl mb-6 shadow-sm">
          Transforma tu Menú Físico en un{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-primary-400 to-blue-400 drop-shadow-sm">
            Negocio Digital
          </span>{' '}
          en 5 Minutos <span className="block text-3xl md:text-5xl mt-2 text-gray-200">(Garantizado por IA).</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-in-up animation-delay-200 text-lg md:text-xl text-gray-300 max-w-3xl mb-12 leading-relaxed">
          Olvídate de transcribir. <strong className="text-white">MenuView.app</strong> es la única plataforma en Centroamérica que usa Inteligencia Artificial para digitalizar tu menú físico al instante. Más rápido, más higiénico y más inteligente. <br className="hidden md:block" /><span className="text-blue-300 font-medium mt-2 inline-block">Powered by Google Cloud.</span>
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up animation-delay-300 flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl">
          {/* Primary Button */}
          <a 
            href="#register"
            onClick={scrollToRegister}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-[#4CAF50] rounded-lg shadow-lg hover:bg-green-600 hover:scale-105 transition-all duration-300 overflow-hidden w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center">
              Comenzar Gratis (con IA)
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </a>

          {/* Secondary WhatsApp Link */}
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center text-[#FF9800] hover:text-orange-400 font-bold text-lg underline decoration-2 underline-offset-4 transition-colors duration-300"
          >
            Interesado en Plan Pro? Contáctanos
          </a>
        </div>

      </div>

      {/* Subtle bottom gradient to blend with the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  )
}

export default HeroSection