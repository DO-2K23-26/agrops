import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllPlayers } from '../services/playerService'

const PlayerContext = createContext()

export function usePlayerContext() {
  return useContext(PlayerContext)
}

export function PlayerProvider({ children }) {
  const [players, setPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scores, setScores] = useState({})
  const [matchHistory, setMatchHistory] = useState([])
  const [refreshInterval, setRefreshInterval] = useState(60000) // Start with 60s refresh interval
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const lastRefreshTime = useRef(0)
  const isRefreshing = useRef(false)

  // Adaptive refresh interval based on system performance and error states
  const getRefreshInterval = useCallback(() => {
    // Increase interval if we have consecutive errors
    if (consecutiveErrors > 2) {
      return 120000; // 2 minutes when system is unstable
    } else if (consecutiveErrors > 0) {
      return 90000; // 1.5 minutes when there are some errors
    } else if (players.some(p => p.rateLimited)) {
      return 90000; // 1.5 minutes when rate limiting is active
    }
    return 60000; // Base case: 1 minute
  }, [consecutiveErrors, players]);

  // Fetch all players with debouncing to prevent excessive calls
  const fetchPlayers = useCallback(async (force = false) => {
    // Skip if already refreshing
    if (isRefreshing.current) {
      console.log('Skipping refresh - already in progress');
      return;
    }

    // Implement debouncing - don't refresh if less than 30s since last refresh (unless forced)
    const now = Date.now();
    if (!force && now - lastRefreshTime.current < 30000) {
      console.log('Skipping refresh due to debouncing - last refresh too recent');
      return;
    }

    isRefreshing.current = true;
    setIsLoading(true);
    
    try {
      const playersData = await fetchAllPlayers();
      lastRefreshTime.current = Date.now();
      
      // Check if we received data
      if (!playersData || playersData.length === 0) {
        throw new Error('No player data received');
      }
      
      // Process players data - handle rate-limited players gracefully
      const processedPlayers = playersData.map(player => {
        if (player.rateLimited) {
          // For rate-limited players, keep their previous state if we have it
          const existingPlayer = players.find(p => p.name === player.name);
          if (existingPlayer && existingPlayer.status !== 'error') {
            return {
              ...player,
              status: existingPlayer.status,
              latency: existingPlayer.latency || 0,
              lastSeen: existingPlayer.lastSeen,
              // Add a flag to indicate this is cached data
              cached: true
            };
          }
        }
        return player;
      });
      
      setPlayers(processedPlayers);
      
      // Initialize scores for new players
      const newScores = { ...scores }
      playersData.forEach(player => {
        if (!newScores[player.name]) {
          newScores[player.name] = {
            wins: 0,
            losses: 0,
            challenges: 0,
            avgLatency: 0
          }
        }
      })
      setScores(newScores)
      
      setError(null);
      setConsecutiveErrors(0); // Reset error counter on success
      
      // Update refresh interval based on new state
      setRefreshInterval(getRefreshInterval());
    } catch (err) {
      console.error('Error in fetchPlayers:', err);
      setError(err.message || 'Failed to fetch players');
      setConsecutiveErrors(prev => prev + 1); // Increment error counter
      // Don't update players array on error
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, [scores, players, getRefreshInterval])
  
  // Update player data with error handling
  const updatePlayers = useCallback((updatedPlayers) => {
    if (!updatedPlayers || updatedPlayers.length === 0) {
      console.warn('Attempted to update players with empty data');
      return;
    }
    
    try {
      setPlayers(updatedPlayers);
      
      // Check if any players have errors and set the error state
      const hasErrors = updatedPlayers.some(player => player.status === 'error');
      if (hasErrors) {
        const errorPlayers = updatedPlayers
          .filter(player => player.status === 'error')
          .map(player => player.name)
          .join(', ');
        console.warn(`Some players have errors: ${errorPlayers}`);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error updating players:', err);
    }
  }, [])
  
  // Update score for a player with throttling for frequent updates
  const updateScore = useCallback((playerName, result) => {
    // Use a ref to hold pending updates to batch them
    const pendingUpdatesRef = useRef(null);
    
    if (!pendingUpdatesRef.current) {
      pendingUpdatesRef.current = {};
    }
    
    // Store this update in pending updates
    pendingUpdatesRef.current[playerName] = {
      ...(pendingUpdatesRef.current[playerName] || {}),
      isWinner: result.isWinner,
      latency: result.latency,
      timestamp: Date.now()
    };
    
    // Apply updates with debouncing - only update once every 500ms
    setTimeout(() => {
      // Skip if no pending updates
      if (!pendingUpdatesRef.current) return;
      
      // Get all updates to apply
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = null;
      
      // Apply all updates at once in a single state update
      setScores(prevScores => {
        const newScores = { ...prevScores };
        
        Object.entries(updates).forEach(([playerName, update]) => {
          const playerScore = prevScores[playerName] || {
            wins: 0,
            losses: 0,
            challenges: 0,
            avgLatency: 0
          };
          
          newScores[playerName] = {
            ...playerScore,
            wins: update.isWinner ? playerScore.wins + 1 : playerScore.wins,
            losses: !update.isWinner ? playerScore.losses + 1 : playerScore.losses,
            challenges: playerScore.challenges + 1,
            avgLatency: (playerScore.avgLatency * playerScore.challenges + update.latency) / (playerScore.challenges + 1)
          };
        });
        
        return newScores;
      });
    }, 500);
  }, [])
  
  // Add match to history
  const addMatch = useCallback((match) => {
    setMatchHistory(prev => [match, ...prev])
  }, [])
  
  // Initialize data on component mount
  useEffect(() => {
    // Load saved scores and match history from localStorage first (to prevent blank screen)
    const savedScores = localStorage.getItem('playerScores')
    if (savedScores) {
      setScores(JSON.parse(savedScores))
    }
    
    const savedHistory = localStorage.getItem('matchHistory')
    if (savedHistory) {
      setMatchHistory(JSON.parse(savedHistory))
    }
    
    // Import the refresh coordinator dynamically to avoid circular dependencies
    import('../services/refreshCoordinator').then(module => {
      const refreshCoordinator = module.default;
      
      // Initial data fetch (forced)
      fetchPlayers(true);
      
      // Subscribe to the refresh coordinator for player updates
      const unsubscribe = refreshCoordinator.subscribe('players', () => fetchPlayers(false));
      
      // Clean up subscription on unmount
      return () => unsubscribe();
    });
  }, [])
  
  // Save scores and match history to localStorage when they change
  useEffect(() => {
    localStorage.setItem('playerScores', JSON.stringify(scores))
  }, [scores])
  
  useEffect(() => {
    localStorage.setItem('matchHistory', JSON.stringify(matchHistory))
  }, [matchHistory])
  
  const value = {
    players,
    isLoading,
    error,
    scores,
    matchHistory,
    updatePlayers,
    updateScore,
    addMatch,
    fetchPlayers
  }
  
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}
