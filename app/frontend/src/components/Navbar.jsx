import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaBars, FaTimes, FaGithub, FaChartLine, FaInfoCircle } from 'react-icons/fa'
import { SiIstio, SiKubernetes, SiGrafana } from 'react-icons/si'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex items-center">
              <SiIstio className="text-primary-500 text-3xl mr-2" />
              <span className="font-bold text-xl">Tournoi Mesh</span>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href="http://localhost:3000" 
              target="_blank" 
              rel="noreferrer"
              className="text-gray-300 hover:text-primary-400 flex items-center"
            >
              <SiGrafana className="mr-2" />
              Grafana
            </a>
            <a 
              href="http://localhost:20001" 
              target="_blank" 
              rel="noreferrer"
              className="text-gray-300 hover:text-primary-400 flex items-center"
            >
              <FaChartLine className="mr-2" />
              Kiali
            </a>
            <a 
              href="http://localhost:16686" 
              target="_blank" 
              rel="noreferrer"
              className="text-gray-300 hover:text-primary-400 flex items-center"
            >
              <FaInfoCircle className="mr-2" />
              Jaeger
            </a>
            <a 
              href="https://github.com/user/player-service" 
              target="_blank" 
              rel="noreferrer"
              className="text-gray-300 hover:text-primary-400 flex items-center"
            >
              <FaGithub className="mr-2" />
              GitHub
            </a>
            <div className="bg-gray-700 rounded-full px-3 py-1 flex items-center">
              <SiKubernetes className="text-primary-500 mr-2" />
              <span className="text-sm text-gray-300">Kubernetes + Istio</span>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-700">
              <a 
                href="http://localhost:3000"
                target="_blank" 
                rel="noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <SiGrafana className="inline-block mr-2" />
                Grafana
              </a>
              <a 
                href="http://localhost:20001"
                target="_blank" 
                rel="noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <FaChartLine className="inline-block mr-2" />
                Kiali
              </a>
              <a 
                href="http://localhost:16686"
                target="_blank" 
                rel="noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <FaInfoCircle className="inline-block mr-2" />
                Jaeger
              </a>
              <a 
                href="https://github.com/user/player-service"
                target="_blank" 
                rel="noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <FaGithub className="inline-block mr-2" />
                GitHub
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
