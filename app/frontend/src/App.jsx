import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FaTrophy, 
  FaSpinner, 
  FaChartLine, 
  FaCog, 
  FaExclamationTriangle,
  FaArrowRight
} from 'react-icons/fa'

import Navbar from './components/Navbar'
import TournamentBracket from './components/TournamentBracket'
import ScoreBoard from './components/ScoreBoard'
import PlayerCard from './components/PlayerCard'
import MetricsPanel from './components/MetricsPanel'
import StatusPanel from './components/StatusPanel'
import MatchModal from './components/MatchModal'
import RateLimitDebug from './components/RateLimitDebug'

import { usePlayerContext } from './contexts/PlayerContext'
import { fetchAllPlayers } from './services/playerService'

function App() {
  const { players, updatePlayers, isLoading, error } = usePlayerContext()
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState([null, null])
  
  useEffect(() => {
    let isActive = true;
    
    // Initialize the refresh coordinator
    import('./services/refreshCoordinator').then(module => {
      const refreshCoordinator = module.default;
      
      // Configure base refresh rates
      refreshCoordinator.refreshRates = {
        players: 60000,      // Players refresh every 60s
        metrics: 30000,      // Metrics refresh every 30s
        matchHistory: 120000 // Match history refreshes every 2 minutes
      };
      
      // Enable refresh coordinator
      refreshCoordinator.setEnabled(true);
      
      // Add keyboard shortcut to toggle refresh (Ctrl+Shift+R)
      const handleKeyDown = (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
          e.preventDefault();
          const isEnabled = refreshCoordinator.isEnabled;
          refreshCoordinator.setEnabled(!isEnabled);
          console.log(`Refresh ${!isEnabled ? 'enabled' : 'disabled'}`);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        refreshCoordinator.setEnabled(false);
      };
    });
    
    return () => {
      isActive = false;
    };
  }, []);

  const handleStartMatch = (player1, player2) => {
    setSelectedPlayers([player1, player2])
    setShowMatchModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Rate limiting notification */}
        {players.some(p => p.rateLimited) && (
          <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-300">
                Limite de taux activée pour certains joueurs. Données mises en cache utilisées.
              </span>
            </div>
          </div>
        )}
        
        {/* Hero section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-primary-400">
            Tournoi de Services Mesh Istio
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explorez les performances des services dans un environnement Kubernetes avec Istio.
            Organisez des duels, observez les latences et les métriques en temps réel.
          </p>
        </motion.div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-primary-500" />
            <span className="ml-3 text-xl">Chargement des joueurs...</span>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 mb-8 text-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Erreur de chargement</h3>
            <p className="text-red-300">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={() => fetchAllPlayers()}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
              {/* ScoreBoard */}
              <div className="lg:col-span-1">
                <ScoreBoard players={players} />
              </div>
              
              {/* Status Panel */}
              <div className="lg:col-span-3">
                <StatusPanel players={players} />
              </div>
            </div>
            
            {/* Tournament Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-400">
                  <FaTrophy className="inline-block mr-2" />
                  Bracket du Tournoi
                </h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStartMatch(players[0], players[1])}
                  disabled={players.length < 2}
                >
                  Démarrer un Match
                </button>
              </div>
              
              <TournamentBracket players={players} onStartMatch={handleStartMatch} />
            </section>
            
            {/* Players Grid */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-primary-400">
                <FaCog className="inline-block mr-2" />
                Joueurs Disponibles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {players.map(player => (
                  <PlayerCard 
                    key={player.name} 
                    player={player} 
                    onSelectOpponent={(opponent) => handleStartMatch(player, opponent)}
                    otherPlayers={players.filter(p => p.name !== player.name)}
                  />
                ))}
              </div>
            </section>
            
            {/* Metrics Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 text-primary-400">
                <FaChartLine className="inline-block mr-2" />
                Métriques en Temps Réel
              </h2>
              
              <MetricsPanel players={players} />
            </section>
          </>
        )}
      </main>
      
      {/* Match Modal */}
      {showMatchModal && (
        <MatchModal 
          players={selectedPlayers}
          onClose={() => setShowMatchModal(false)}
        />
      )}
      
      {/* Debug component - hidden by default, press Ctrl+Shift+D to show */}
      <RateLimitDebug />
      
      <footer className="bg-gray-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>
            Tournoi Mesh Istio &copy; {new Date().getFullYear()} - 
            Explorez les services avec Kubernetes et Istio
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-primary-400">
              Grafana
            </a>
            <a href="http://localhost:20001" target="_blank" rel="noreferrer" className="hover:text-primary-400">
              Kiali
            </a>
            <a href="http://localhost:16686" target="_blank" rel="noreferrer" className="hover:text-primary-400">
              Jaeger
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
