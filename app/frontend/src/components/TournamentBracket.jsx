import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaArrowRight, FaRandom } from 'react-icons/fa'

function TournamentBracket({ players, onStartMatch }) {
  const [rounds, setRounds] = useState([])
  
  useEffect(() => {
    // Create a tournament bracket based on available players
    const generateBracket = () => {
      if (players.length < 2) return []
      
      // For simplicity, we'll create a single elimination bracket
      // with a maximum of 8 players (3 rounds)
      
      // Round 1: Quarter-finals (4 matches)
      const quarterFinals = []
      for (let i = 0; i < Math.min(8, players.length); i += 2) {
        if (i + 1 < players.length) {
          quarterFinals.push({
            id: `qf-${i/2}`,
            player1: players[i],
            player2: players[i+1],
            winner: null,
            completed: false
          })
        } else {
          // Odd number of players, one gets a bye
          quarterFinals.push({
            id: `qf-${i/2}`,
            player1: players[i],
            player2: null,
            winner: players[i],
            completed: true
          })
        }
      }
      
      // If we have less than 4 matches, fill with empty matches
      while (quarterFinals.length < 4) {
        quarterFinals.push({
          id: `qf-${quarterFinals.length}`,
          player1: null,
          player2: null,
          winner: null,
          completed: false
        })
      }
      
      // Round 2: Semi-finals (2 matches)
      const semiFinals = [
        {
          id: 'sf-0',
          player1: null,
          player2: null,
          winner: null,
          completed: false
        },
        {
          id: 'sf-1',
          player1: null,
          player2: null,
          winner: null,
          completed: false
        }
      ]
      
      // Round 3: Final (1 match)
      const final = {
        id: 'final',
        player1: null,
        player2: null,
        winner: null,
        completed: false
      }
      
      return [quarterFinals, semiFinals, [final]]
    }
    
    setRounds(generateBracket())
  }, [players])
  
  // If we don't have enough players, show placeholder
  if (players.length < 2) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400 mb-4">
          Pas assez de joueurs pour créer un bracket de tournoi.
        </p>
        <p className="text-gray-400">
          Ajoutez au moins 2 joueurs pour commencer.
        </p>
      </div>
    )
  }
  
  return (
    <div className="tournament-bracket overflow-x-auto">
      <div className="flex justify-between min-w-[800px]">
        {rounds.map((round, roundIndex) => (
          <div 
            key={`round-${roundIndex}`} 
            className="round flex-1"
            style={{ 
              marginTop: roundIndex === 0 ? 0 : `${Math.pow(2, roundIndex) * 2}rem` 
            }}
          >
            <div className="text-center mb-4 text-lg font-medium text-gray-300">
              {roundIndex === 0 && 'Quarts de finale'}
              {roundIndex === 1 && 'Demi-finales'}
              {roundIndex === 2 && 'Finale'}
            </div>
            
            {round.map((match, matchIndex) => (
              <motion.div 
                key={match.id}
                className="match"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: matchIndex * 0.1 }}
                style={{ 
                  marginBottom: roundIndex === 0 ? '1rem' : `${Math.pow(2, roundIndex+1)}rem` 
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Match {match.id}</span>
                  {match.player1 && match.player2 && (
                    <button 
                      onClick={() => onStartMatch(match.player1, match.player2)}
                      className="text-primary-400 text-sm hover:underline flex items-center"
                    >
                      <FaRandom className="mr-1" /> Jouer
                    </button>
                  )}
                </div>
                
                <div className={`player ${match.winner?.name === match.player1?.name ? 'winner' : ''}`}>
                  <span className="font-medium">
                    {match.player1?.name || 'TBD'}
                  </span>
                  {match.winner?.name === match.player1?.name && (
                    <span className="text-green-500 text-xs">Gagnant</span>
                  )}
                </div>
                
                <div className={`player ${match.winner?.name === match.player2?.name ? 'winner' : ''}`}>
                  <span className="font-medium">
                    {match.player2?.name || 'TBD'}
                  </span>
                  {match.winner?.name === match.player2?.name && (
                    <span className="text-green-500 text-xs">Gagnant</span>
                  )}
                </div>
                
                {roundIndex < rounds.length - 1 && (
                  <div className="text-right mt-2">
                    <span className="text-gray-500 text-xs flex justify-end items-center">
                      {match.winner ? (
                        <>
                          {match.winner.name} avance
                          <FaArrowRight className="ml-1" />
                        </>
                      ) : (
                        'En attente'
                      )}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TournamentBracket
