import axios from 'axios'

// Base URLs for different environments
const API_URL = import.meta.env.VITE_API_URL || '/api'
const PROMETHEUS_URL = import.meta.env.VITE_PROMETHEUS_URL || '/metrics'

// Rate limiter for ping requests - track last ping time per player
const pingRateLimiter = new Map();
const PING_RATE_LIMIT_MS = 10000; // 10 seconds between pings

// Define player configuration - centralized data structure for player information
export const playerConfigs = [
  { 
    name: 'benbenos', 
    url: '/benbenos',
    challengeUrl: 'http://benbenos:8080/ping'
  },
  { 
    name: 'doriano', 
    url: '/doriano',
    challengeUrl: 'http://doriano:8080/ping'
  },
  { 
    name: 'mathios', 
    url: '/mathios',
    challengeUrl: 'http://mathios:8080/ping'
  },
  { 
    name: 'tristiano', 
    url: '/tristiano',
    challengeUrl: 'http://tristiano:8080/ping'
  }
];

// HTTP client with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor for tracing headers
apiClient.interceptors.request.use(config => {
  // Generate a unique request ID for tracing
  config.headers['X-Request-ID'] = `frontend-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  return config;
})

// Rate limiting logger to track patterns
const logRateLimiting = (playerName, action) => {
  const timestamp = new Date().toISOString();
  const event = {
    timestamp,
    playerName,
    action,
    url: `${API_URL}/${playerName}/ping`
  };
  
  // Keep a log in localStorage for diagnostics
  try {
    const logsJSON = localStorage.getItem('rateLimitLogs');
    let logs = logsJSON ? JSON.parse(logsJSON) : [];
    
    // Limit log size to 100 entries
    logs = [event, ...logs].slice(0, 100);
    localStorage.setItem('rateLimitLogs', JSON.stringify(logs));
    
    // Also output to console for development
    // console.info(`[Rate Limit] ${action} for ${playerName} at ${timestamp}`);
  } catch (error) {
    // console.error('Error logging rate limit event:', error);
  }
};

// Fetch all players from the API
export const fetchAllPlayers = async () => {
  try {
    // This is a mock implementation - in a real scenario, we would have an endpoint
    // that returns all players or we would make multiple requests
    
    // Use the centralized player configs
    const playersWithStatus = await Promise.allSettled(
      playerConfigs.map(async player => {
        try {
          // Apply rate limiting to each player ping
          const now = Date.now();
          const playerKey = `${player.name}-bulk`;
          const lastPingTime = pingRateLimiter.get(playerKey) || 0;
          
          if (now - lastPingTime < PING_RATE_LIMIT_MS) {
            logRateLimiting(player.name, "BULK_BLOCKED");
            
            // Try to find this player in localStorage cache
            try {
              const cachedPlayersJSON = localStorage.getItem('cachedPlayers');
              if (cachedPlayersJSON) {
                const cachedPlayers = JSON.parse(cachedPlayersJSON);
                const cachedPlayer = cachedPlayers.find(p => p.name === player.name);
                
                if (cachedPlayer && cachedPlayer.lastSeen) {
                  // Use cached data but mark it as cached
                  return {
                    ...cachedPlayer,
                    rateLimited: true,
                    cached: true,
                    lastUpdated: lastPingTime
                  };
                }
              }
            } catch (cacheError) {
              console.error('Error accessing cache:', cacheError);
            }
            
            // Return rate limited state if no cache is available
            return {
              ...player,
              status: 'unknown',
              error: `Rate limited (max 1 ping every ${PING_RATE_LIMIT_MS/1000}s)`,
              rateLimited: true,
              lastSeen: lastPingTime ? new Date(lastPingTime).toISOString() : null
            };
          }
          
          // Set last ping time before making the request
          pingRateLimiter.set(playerKey, now);
          logRateLimiting(player.name, "BULK_ALLOWED");
          
          // Try to ping the player with a timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
          
          const response = await apiClient.get(`${player.url}/ping`, { 
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          
          return {
            ...player,
            status: 'healthy',
            latency: response.data.latencyMs || 0,
            lastSeen: new Date().toISOString()
          }
        } catch (error) {
          // If there's an error, mark the player as unavailable
          return {
            ...player,
            status: 'error',
            error: error.message,
            lastSeen: null
          }
        }
      })
    )
    
    // Process the results from Promise.allSettled
    const processedPlayers = playersWithStatus.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Handle rejected promise
        console.error(`Error fetching player ${playerConfigs[index].name}:`, result.reason);
        return {
          ...playerConfigs[index],
          status: 'error',
          error: result.reason.message,
          lastSeen: null
        };
      }
    });
    
    // Save successful responses to localStorage for future use during rate limiting
    try {
      const playersToCache = processedPlayers.filter(player => player.status === 'healthy');
      if (playersToCache.length > 0) {
        const cachedPlayersJSON = localStorage.getItem('cachedPlayers');
        let cachedPlayers = [];
        
        if (cachedPlayersJSON) {
          cachedPlayers = JSON.parse(cachedPlayersJSON);
          
          // Update cached players with new data
          playersToCache.forEach(player => {
            const index = cachedPlayers.findIndex(p => p.name === player.name);
            if (index >= 0) {
              cachedPlayers[index] = player;
            } else {
              cachedPlayers.push(player);
            }
          });
        } else {
          cachedPlayers = playersToCache;
        }
        
        localStorage.setItem('cachedPlayers', JSON.stringify(cachedPlayers));
      }
    } catch (cacheError) {
      console.error('Error updating cache:', cacheError);
    }
    
    return processedPlayers;
  } catch (error) {
    console.error('Error fetching players:', error);
    // Return the player configs with error status instead of throwing
    return playerConfigs.map(player => ({
      ...player,
      status: 'error',
      error: 'Failed to fetch player data',
      lastSeen: null
    }));
  }
}

// Ping a specific player
export const pingPlayer = async (playerName) => {
  try {
    // Check rate limit
    const now = Date.now();
    if (pingRateLimiter.has(playerName)) {
      const lastPingTime = pingRateLimiter.get(playerName);
      if (now - lastPingTime < PING_RATE_LIMIT_MS) {
        logRateLimiting(playerName, "BLOCKED");
        return {
          error: "Ping request rate limited. Please try again later.",
          latencyMs: 0,
          rateLimited: true
        };
      }
    }
    
    const response = await apiClient.get(`/${playerName}/ping`)
    
    // Update last ping time
    pingRateLimiter.set(playerName, now);
    logRateLimiting(playerName, "ALLOWED");
    
    return response.data
  } catch (error) {
    console.error(`Error pinging player ${playerName}:`, error)
    return {
      error: error.message || "Error contacting service",
      latencyMs: 0
    }
  }
}

// Challenge between two players
export const challengePlayers = async (challenger, opponent) => {
  try {
    // Use direct Kubernetes service URLs for the challenge
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout
    
    // Find the opponent player in our player configs
    const opponentPlayer = playerConfigs.find(p => p.name === opponent);
    
    if (!opponentPlayer) {
      throw new Error(`Opponent ${opponent} not found`);
    }
    
    // Use the challenge URL from the player config
    const response = await apiClient.post(`/${challenger}/challenge`, {
      opponentUrl: opponentPlayer.challengeUrl
    }, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.data;
  } catch (error) {
    // Handle timeout error
    if (error.name === 'AbortError') {
      console.warn(`Challenge request timed out between ${challenger} and ${opponent}`);
      return {
        error: "Request timed out",
        timeout: true
      };
    }
    
    console.error(`Error in challenge between ${challenger} and ${opponent}:`, error);
    return {
      error: error.message || "Failed to complete challenge"
    };
  }
}


// Fetch metrics from Prometheus
export const fetchMetrics = async (query) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.data.data.result;
  } catch (error) {
    // Handle timeout
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      console.warn(`Metrics request timed out for query: ${query}`);
      return [];
    }
    
    console.error('Error fetching metrics:', error);
    return [];
  }
}

// Fetch request rate by player
export const fetchRequestRateByPlayer = async () => {
  const query = 'sum by (destination_workload) (rate(istio_requests_total[1m]))'
  return fetchMetrics(query)
}

// Fetch average latency for challenges
export const fetchChallengeLatency = async () => {
  const query = 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{handler="/challenge"}[1m])) by (le, instance))'
  return fetchMetrics(query)
}

// Fetch error rate by route
export const fetchErrorRate = async () => {
  const query = 'rate(istio_requests_total{response_code=~"5.*"}[1m])'
  return fetchMetrics(query)
}

// Fetch challenge metrics by player
export const fetchChallengeMetrics = async () => {
  try {
    // Fetch challenge rate
    const rateQuery = 'sum(rate(player_challenge_total[1m])) by (pod)'
    const rateResponse = await fetchMetrics(rateQuery)
    
    // Fetch challenge duration
    const durationQuery = 'histogram_quantile(0.95, sum(rate(player_challenge_duration_ms_bucket[1m])) by (pod, le))'
    const durationResponse = await fetchMetrics(durationQuery)
    
    // Fetch win/loss ratio
    const winsQuery = 'sum(rate(player_challenge_wins[1m])) by (pod)'
    const lossesQuery = 'sum(rate(player_challenge_losses[1m])) by (pod)'
    
    const [winsResponse, lossesResponse] = await Promise.all([
      fetchMetrics(winsQuery),
      fetchMetrics(lossesQuery)
    ])
    
    return {
      rate: rateResponse,
      duration: durationResponse,
      wins: winsResponse,
      losses: lossesResponse
    }
  } catch (error) {
    console.error('Error fetching challenge metrics:', error)
    throw error
  }
}

// Fetch ping metrics by player
export const fetchPingMetrics = async () => {
  try {
    // Fetch ping rate
    const rateQuery = 'sum(rate(player_ping_total[1m])) by (pod)'
    const rateResponse = await fetchMetrics(rateQuery)
    
    // Fetch ping latency
    const latencyQuery = 'histogram_quantile(0.95, sum(rate(player_ping_latency_ms_bucket[1m])) by (pod, le))'
    const latencyResponse = await fetchMetrics(latencyQuery)
    
    return {
      rate: rateResponse,
      latency: latencyResponse
    }
  } catch (error) {
    console.error('Error fetching ping metrics:', error)
    throw error
  }
}

// Fetch error metrics
export const fetchErrorMetrics = async () => {
  try {
    const query = 'sum(rate(player_request_errors[1m])) by (pod)'
    return fetchMetrics(query)
  } catch (error) {
    console.error('Error fetching error metrics:', error)
    throw error
  }
}

// Clear rate limiting data for debugging
export const clearRateLimitingData = () => {
  try {
    // Clear rate limiting maps
    pingRateLimiter.clear();
    
    // Clear stored logs
    localStorage.removeItem('rateLimitLogs');
    
    console.log('Rate limiting data cleared');
    return { success: true };
  } catch (error) {
    console.error('Error clearing rate limiting data:', error);
    return { success: false, error: error.message };
  }
}

