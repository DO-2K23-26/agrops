import { useState, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaPlayCircle, FaSpinner, FaServer, FaClock, FaStar } from 'react-icons/fa'
import StatusIndicator from './StatusIndicator'

// Use memo to prevent unnecessary re-renders
const PlayerCard = memo(function PlayerCard({ player, onSelectOpponent, otherPlayers }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Memoize toggle function to prevent recreation on every render
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  // Memoize opponent selection to prevent recreation on every render
  const selectOpponent = useCallback((opponent) => {
    setIsLoading(true);
    // Use requestAnimationFrame for smoother UI
    requestAnimationFrame(() => {
      // Add slight delay for visual feedback
      setTimeout(() => {
        onSelectOpponent(opponent);
        setIsLoading(false);
      }, 300);
    });
  }, [onSelectOpponent]);
  
  // Status indicator color - adjusted to handle rate limiting and cached states
  const statusColor = 
    player.rateLimited ? 'bg-yellow-500' :
    player.cached ? 'bg-blue-400' :
    player.status === 'healthy' ? 'bg-green-500' :
    player.status === 'warning' ? 'bg-yellow-500' :
    'bg-red-500'
  
  return (
    <motion.div 
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      // Add layout transition for smoother expansion
      layout
    >
      <div className="p-5 bg-gradient-to-r from-gray-800 to-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <div className={`${statusColor} h-3 w-3 rounded-full mr-2`}></div>
              <h3 className="font-bold text-xl text-primary-300">
                {player.name}
              </h3>
              {player.cached && (
                <span className="ml-2 text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                  Cached
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {player.url}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Challenge URL: {player.challengeUrl}
            </p>
          </div>
          
          <button
            onClick={toggleExpanded}
            className="text-primary-400 hover:text-primary-300"
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center mt-3 text-sm text-gray-300">
          <FaClock className="mr-1 text-gray-400" />
          <span className="mr-3">
            {player.latency} ms
          </span>
          
          <FaServer className="mr-1 text-gray-400" />
          <span>
            <StatusIndicator 
              status={player.status} 
              rateLimited={player.rateLimited} 
              cached={player.cached} 
            />
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <motion.div 
          className="p-4 border-t border-gray-700"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <h4 className="font-medium mb-3 text-gray-300 flex items-center">
            <FaStar className="text-yellow-500 mr-2" />
            Défier un joueur
          </h4>
          
          <div className="space-y-2">
            {otherPlayers.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Aucun autre joueur disponible
              </p>
            ) : (
              otherPlayers.map(opponent => (
                <button
                  key={opponent.name}
                  onClick={() => selectOpponent(opponent)}
                  disabled={isLoading || opponent.status !== 'healthy'}
                  className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center transition-colors ${
                    opponent.status === 'healthy'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`${
                      opponent.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    } h-2 w-2 rounded-full mr-2`}></div>
                    <span>{opponent.name}</span>
                  </div>
                  
                  {isLoading ? (
                    <FaSpinner className="animate-spin text-gray-400" />
                  ) : (
                    <FaPlayCircle className={
                      opponent.status === 'healthy' ? 'text-primary-400' : 'text-gray-500'
                    } />
                  )}
                </button>
              ))
            )}
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            Dernière activité: {
              player.lastSeen 
                ? new Date(player.lastSeen).toLocaleTimeString() 
                : 'Jamais'
            }
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - only re-render when important properties change
  const playerEqual = 
    prevProps.player.status === nextProps.player.status &&
    prevProps.player.latency === nextProps.player.latency &&
    prevProps.player.rateLimited === nextProps.player.rateLimited &&
    prevProps.player.cached === nextProps.player.cached &&
    prevProps.player.lastSeen === nextProps.player.lastSeen;
    
  // Only do deep comparison of otherPlayers if player is equal
  if (playerEqual) {
    // Check if otherPlayers has changed in a meaningful way (status changes)
    const otherPlayersEqual = prevProps.otherPlayers.length === nextProps.otherPlayers.length &&
      prevProps.otherPlayers.every((prevPlayer, index) => {
        const nextPlayer = nextProps.otherPlayers[index];
        return prevPlayer.name === nextPlayer.name && 
               prevPlayer.status === nextPlayer.status;
      });
    
    return otherPlayersEqual;
  }
  
  return false;
});

export default PlayerCard
