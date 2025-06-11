import { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Menu View" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary-600">menu</span>
              <span className="text-xl font-bold text-secondary-600 -mt-1">view.app</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Características
            </button>
            <button 
              onClick={() => scrollToSection('demo')}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Demo
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Precios
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Contacto
            </button>
            <button 
              onClick={() => navigate('/admin/login')}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Acceso Admin
            </button>
            <button 
              onClick={() => scrollToSection('register')}
              className="btn-primary ml-4"
            >
              Comenzar Gratis
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              >
                Características
              </button>
              <button 
                onClick={() => scrollToSection('demo')}
                className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              >
                Demo
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              >
                Precios
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              >
                Contacto
              </button>
              <button 
                onClick={() => {
                  navigate('/admin/login')
                  setIsMenuOpen(false)
                }}
                className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              >
                Acceso Admin
              </button>
              <button 
                onClick={() => scrollToSection('register')}
                className="btn-primary w-full mt-4"
              >
                Comenzar Gratis
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 