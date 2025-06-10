import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa'
import StatusIndicator from './StatusIndicator'
import PlayerStatusItem from './PlayerStatusItem'

function StatusPanel({ players }) {
  // Memoize player grouping to prevent unnecessary calculations
  const { healthyPlayers, rateLimitedPlayers, unhealthyPlayers } = useMemo(() => {
    const healthy = players.filter(p => p.status === 'healthy' && !p.rateLimited && !p.cached);
    const rateLimited = players.filter(p => p.rateLimited || p.cached);
    const unhealthy = players.filter(p => p.status !== 'healthy' && !p.rateLimited && !p.cached);
    
    return {
      healthyPlayers: healthy,
      rateLimitedPlayers: rateLimited,
      unhealthyPlayers: unhealthy
    };
  }, [players]);
  
  // Use state to reduce re-renders - only update the display every 5 seconds at most
  const [displayCounts, setDisplayCounts] = useState({
    healthy: 0,
    rateLimited: 0,
    unhealthy: 0
  });
  
  // Update display counts periodically instead of on every render
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDisplayCounts({
        healthy: healthyPlayers.length,
        rateLimited: rateLimitedPlayers.length,
        unhealthy: unhealthyPlayers.length
      });
    }, 5000); // Update counts every 5 seconds
    
    // Initial update
    setDisplayCounts({
      healthy: healthyPlayers.length,
      rateLimited: rateLimitedPlayers.length,
      unhealthy: unhealthyPlayers.length
    });
    
    return () => clearInterval(intervalId);
  }, [healthyPlayers.length, rateLimitedPlayers.length, unhealthyPlayers.length]);
  
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-gray-700 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">État des Services</h2>
        <div className="text-sm text-gray-300">
          <span className="inline-flex items-center mr-4">
            <div className="bg-green-500 h-3 w-3 rounded-full mr-2"></div>
            Opérationnel: {displayCounts.healthy}
          </span>
          <span className="inline-flex items-center mr-4">
            <div className="bg-yellow-500 h-3 w-3 rounded-full mr-2"></div>
            Rate-limited: {displayCounts.rateLimited}
          </span>
          <span className="inline-flex items-center">
            <div className="bg-red-500 h-3 w-3 rounded-full mr-2"></div>
            Erreur: {displayCounts.unhealthy}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Use memoized component to prevent excessive re-renders */}
          {players.map((player, index) => (
            <motion.div
              key={player.name}
              className={`rounded-lg p-4 border ${
                player.status === 'healthy'
                  ? 'bg-green-900/20 border-green-800'
                  : 'bg-red-900/20 border-red-800'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <PlayerStatusItem player={player} index={index} />
              
              {player.status !== 'healthy' && player.error && (
                <div className="mt-2 text-xs text-red-300">
                  Erreur: {player.error}
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        {players.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Aucun joueur disponible
          </div>
        )}
      </div>
    </div>
  )
}

export default StatusPanel
