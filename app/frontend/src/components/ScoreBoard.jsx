import { motion } from 'framer-motion'
import { FaTrophy, FaMedal } from 'react-icons/fa'
import { usePlayerContext } from '../contexts/PlayerContext'

function ScoreBoard() {
  const { scores, players } = usePlayerContext()
  
  // Sort players by wins
  const sortedPlayers = [...Object.entries(scores)]
    .filter(([playerName]) => players.some(p => p.name === playerName))
    .sort((a, b) => b[1].wins - a[1].wins || a[1].losses - b[1].losses)
  
  return (
    <motion.div 
      className="scoreboard h-full"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="scoreboard-header flex justify-between items-center">
        <h2 className="text-xl font-bold">Classement</h2>
        <FaTrophy className="text-yellow-500" />
      </div>
      
      <div className="scoreboard-body">
        {sortedPlayers.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Aucun match joué pour le moment
          </div>
        ) : (
          <>
            {/* Headers */}
            <div className="grid grid-cols-5 text-sm text-gray-400 border-b border-gray-700 pb-2 mb-2">
              <div className="col-span-2">Joueur</div>
              <div className="text-center">V</div>
              <div className="text-center">D</div>
              <div className="text-center">Latence</div>
            </div>
            
            {/* Player rows */}
            {sortedPlayers.map(([playerName, playerStats], index) => (
              <motion.div 
                key={playerName}
                className="grid grid-cols-5 items-center py-3 border-b border-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="col-span-2 flex items-center">
                  {index === 0 && <FaTrophy className="text-yellow-500 mr-2" />}
                  {index === 1 && <FaMedal className="text-gray-400 mr-2" />}
                  {index === 2 && <FaMedal className="text-amber-700 mr-2" />}
                  <span className="truncate font-medium">
                    {playerName}
                  </span>
                </div>
                <div className="text-center text-green-500 font-medium">
                  {playerStats.wins}
                </div>
                <div className="text-center text-red-500 font-medium">
                  {playerStats.losses}
                </div>
                <div className="text-center text-gray-300">
                  {playerStats.avgLatency > 0 
                    ? `${Math.round(playerStats.avgLatency)} ms` 
                    : '-'}
                </div>
              </motion.div>
            ))}
            
            {/* Total matches played */}
            <div className="mt-4 text-center text-sm text-gray-400">
              {sortedPlayers.reduce((total, [_, stats]) => total + stats.challenges, 0)} matchs joués
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default ScoreBoard
