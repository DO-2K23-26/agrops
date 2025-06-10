import { useState, useCallback, useRef, memo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaSpinner, FaTimes, FaPlay, FaTrophy } from 'react-icons/fa'
import { challengePlayers } from '../services/playerService'
import { usePlayerContext } from '../contexts/PlayerContext'

// Use memo to prevent unnecessary re-renders
const MatchModal = memo(function MatchModal({ players, onClose }) {
  const [player1, player2] = players
  const [isLoading, setIsLoading] = useState(false)
  const [matchResult, setMatchResult] = useState(null)
  const [error, setError] = useState(null)
  const { updateScore, addMatch } = usePlayerContext()
  const matchAttemptTimeoutRef = useRef(null);
  
  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (matchAttemptTimeoutRef.current) {
        clearTimeout(matchAttemptTimeoutRef.current);
      }
    };
  }, []);

  // Use useCallback to prevent unnecessary function recreations
  const startMatch = useCallback(async () => {
    if (!player1 || !player2) return
    
    // Check if either player is rate-limited
    if (player1.rateLimited || player2.rateLimited) {
      setError(`Un ou plusieurs joueurs sont actuellement en limite de taux. Veuillez réessayer dans quelques secondes.`);
      return;
    }
    
    // Check if either player is using cached data
    if (player1.cached || player2.cached) {
      setError(`Les données de joueur sont mises en cache. Les données en direct sont nécessaires pour un match.`);
      return;
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Set a timeout to abort the request if it takes too long
      const abortTimeout = setTimeout(() => {
        if (isLoading) {
          setError(`La requête a pris trop de temps. Veuillez réessayer plus tard.`);
          setIsLoading(false);
        }
      }, 15000); // 15 second timeout
      
      matchAttemptTimeoutRef.current = abortTimeout;
      
      // Attempt the challenge
      const result = await challengePlayers(player1.name, player2.name)
      
      // Clear the timeout since we got a response
      clearTimeout(abortTimeout);
      matchAttemptTimeoutRef.current = null;
      
      // Check if result contains an error
      if (result.error) {
        if (result.circuitBreaker) {
          setError(`Service temporairement indisponible. Trop d'erreurs récentes.`);
        } else if (result.timeout) {
          setError(`La requête a pris trop de temps. Veuillez réessayer plus tard.`);
        } else {
          setError(result.error);
        }
        return;
      }
      
      setMatchResult(result)
      
      // Update scores for both players
      updateScore(player1.name, {
        isWinner: result.winner === player1.name,
        latency: result.durationMs
      })
      
      updateScore(player2.name, {
        isWinner: result.winner === player2.name,
        latency: result.durationMs
      })
      
      // Add match to history
      addMatch({
        id: `match-${Date.now()}`,
        timestamp: new Date().toISOString(),
        player1: player1.name,
        player2: player2.name,
        winner: result.winner,
        loser: result.loser,
        durationMs: result.durationMs
      })
      
    } catch (err) {
      setError(err.message || 'Une erreur est survenue pendant le match')
      console.error('Match error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [player1, player2, updateScore, addMatch]);
  
  // Reset state for a new match
  const resetMatch = useCallback(() => {
    setMatchResult(null)
    setError(null)
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center p-5 bg-gray-700">
          <h2 className="text-2xl font-bold">Match de Joueurs</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {!matchResult ? (
            <>
              <div className="flex items-center justify-center space-x-6 mb-8">
                <div className="text-center">
                  <div className="bg-primary-900/50 p-4 rounded-lg mb-2 border border-primary-700">
                    <h3 className="text-lg font-semibold text-primary-400 mb-1">{player1?.name || 'Joueur 1'}</h3>
                    <p className="text-sm text-gray-300">
                      Latence: {player1?.latency || '?'} ms
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Service: {player1?.challengeUrl || `http://${player1?.name}:8080/ping`}
                    </p>
                  </div>
                </div>
                
                <div className="text-2xl font-bold text-gray-400">VS</div>
                
                <div className="text-center">
                  <div className="bg-secondary-900/50 p-4 rounded-lg mb-2 border border-secondary-700">
                    <h3 className="text-lg font-semibold text-secondary-400 mb-1">{player2?.name || 'Joueur 2'}</h3>
                    <p className="text-sm text-gray-300">
                      Latence: {player2?.latency || '?'} ms
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Service: {player2?.challengeUrl || `http://${player2?.name}:8080/ping`}
                    </p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
                  {error}
                </div>
              )}
              
              <div className="flex justify-center">
                <button
                  onClick={startMatch}
                  disabled={isLoading}
                  className="btn btn-primary flex items-center"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Match en cours...
                    </>
                  ) : (
                    <>
                      <FaPlay className="mr-2" />
                      Démarrer le Match
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-center mb-8">
                <FaTrophy className="text-yellow-500 text-6xl mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Match Terminé!</h3>
                <p className="text-gray-300">
                  Durée totale: <span className="font-semibold">{matchResult.durationMs} ms</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-8 mb-8">
                <div className={`text-center ${matchResult.winner === player1?.name ? 'scale-110' : 'opacity-70'}`}>
                  <div className={`p-4 rounded-lg mb-2 border ${
                    matchResult.winner === player1?.name 
                      ? 'bg-green-900/50 border-green-700' 
                      : 'bg-gray-800 border-gray-700'
                  }`}>
                    <h3 className="text-lg font-semibold mb-1">{player1?.name}</h3>
                    <p className="text-sm text-gray-300">
                      {matchResult.winner === player1?.name ? (
                        <span className="text-green-400 font-bold">GAGNANT</span>
                      ) : (
                        <span className="text-red-400">Perdant</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`p-4 rounded-lg mb-2 border ${
                    matchResult.winner === player2?.name 
                      ? 'bg-green-900/50 border-green-700' 
                      : 'bg-gray-800 border-gray-700'
                  }`}>
                    <h3 className="text-lg font-semibold mb-1">{player2?.name}</h3>
                    <p className="text-sm text-gray-300">
                      {matchResult.winner === player2?.name ? (
                        <span className="text-green-400 font-bold">GAGNANT</span>
                      ) : (
                        <span className="text-red-400">Perdant</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetMatch}
                  className="btn btn-secondary"
                >
                  Nouveau Match
                </button>
                
                <button
                  onClick={onClose}
                  className="btn btn-primary"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
});

export default MatchModal
