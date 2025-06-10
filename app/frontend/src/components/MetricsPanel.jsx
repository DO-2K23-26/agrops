import { useState, useEffect } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa'
import { 
  fetchRequestRateByPlayer, 
  fetchChallengeLatency, 
  fetchErrorRate 
} from '../services/playerService'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function MetricsPanel({ players }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [requestRateData, setRequestRateData] = useState(null)
  const [latencyData, setLatencyData] = useState(null)
  const [errorRateData, setErrorRateData] = useState(null)
  
  useEffect(() => {
    let isActive = true;
    let fetchAttempts = 0;
    const maxFetchAttempts = 3;
    
    // Import the refresh coordinator dynamically to avoid circular dependencies
    import('../services/refreshCoordinator').then(module => {
      const refreshCoordinator = module.default;
      
      const fetchMetrics = async () => {
        if (!isActive) return;
        
        if (fetchAttempts >= maxFetchAttempts) {
          console.warn(`Reached max metrics fetch attempts (${maxFetchAttempts}), pausing metrics updates`);
          setError('Trop d\'erreurs de récupération des métriques. Nouvelle tentative plus tard.');
          refreshCoordinator.reportError('metrics');
          return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
          // For development, use mock data instead of actual API calls
          // In production, uncomment the real API calls
          
          // Mock data for request rates
          const mockRequestRates = {
            labels: players.map(p => p.name),
            datasets: [
              {
                label: 'Requêtes par seconde',
                data: players.map(() => Math.random() * 10),
                backgroundColor: 'rgba(14, 165, 233, 0.7)',
                borderColor: 'rgba(14, 165, 233, 1)',
                borderWidth: 1
              }
            ]
          }
          
          // Safely set state only if component is still mounted
          if (isActive) {
            setRequestRateData(mockRequestRates);
          }
          
          // Mock data for latency
          const timeLabels = Array.from({ length: 10 }, (_, i) => 
            new Date(Date.now() - (9-i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          )
          
          const mockLatencyData = {
            labels: timeLabels,
            datasets: players.map((player, index) => ({
              label: player.name,
              data: Array.from({ length: 10 }, () => 100 + Math.random() * 900),
              borderColor: getPlayerColor(index),
              backgroundColor: getPlayerColor(index, 0.1),
              tension: 0.4,
              fill: false
            }))
          }
          
          if (isActive) {
            setLatencyData(mockLatencyData);
          }
          
          // Mock data for error rates
          const mockErrorRates = {
            labels: ['/ping', '/challenge'],
            datasets: players.map((player, index) => ({
              label: player.name,
              data: [Math.random() * 2, Math.random() * 5],
              backgroundColor: getPlayerColor(index, 0.7),
              borderColor: getPlayerColor(index),
              borderWidth: 1
            }))
          }
          
          if (isActive) {
            setErrorRateData(mockErrorRates);
            // Reset fetch attempts on success
            fetchAttempts = 0;
            // Report success to the coordinator
            refreshCoordinator.reportSuccess('metrics');
          }
          
          // In production, use these:
          // const requestRates = await fetchRequestRateByPlayer()
          // const latencies = await fetchChallengeLatency()
          // const errorRates = await fetchErrorRate()
          
        } catch (err) {
          console.error('Error fetching metrics:', err);
          fetchAttempts++;
          if (isActive) {
            setError('Impossible de récupérer les métriques');
            refreshCoordinator.reportError('metrics');
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }
      
      // Initial fetch
      fetchMetrics();
      
      // Subscribe to the refresh coordinator for metrics updates
      const unsubscribe = refreshCoordinator.subscribe('metrics', fetchMetrics);
      
      // Clean up subscription on unmount
      return () => {
        isActive = false;
        unsubscribe();
      };
    });
    
    return () => {
      isActive = false;
    };
  }, [players])
  
  // Helper to get consistent colors for players
  const getPlayerColor = (index, alpha = 1) => {
    const colors = [
      `rgba(14, 165, 233, ${alpha})`,     // Blue
      `rgba(139, 92, 246, ${alpha})`,     // Purple
      `rgba(249, 115, 22, ${alpha})`,     // Orange
      `rgba(34, 197, 94, ${alpha})`,      // Green
      `rgba(236, 72, 153, ${alpha})`,     // Pink
      `rgba(234, 179, 8, ${alpha})`,      // Yellow
      `rgba(239, 68, 68, ${alpha})`,      // Red
      `rgba(20, 184, 166, ${alpha})`      // Teal
    ]
    
    return colors[index % colors.length]
  }
  
  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  }
  
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Latence (ms)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Temps',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-primary-500" />
        <span className="ml-3 text-xl">Chargement des métriques...</span>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-center">
        <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Erreur de chargement</h3>
        <p className="text-red-300">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Request Rate Chart */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3>Requêtes par Joueur</h3>
        </div>
        <div className="dashboard-card-body bg-gray-850 p-4">
          <Bar data={requestRateData} options={barOptions} />
        </div>
      </div>
      
      {/* Latency Chart */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3>Latence Moyenne</h3>
        </div>
        <div className="dashboard-card-body bg-gray-850 p-4">
          <Line data={latencyData} options={lineOptions} />
        </div>
      </div>
      
      {/* Error Rate Chart */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3>Taux d'Erreurs par Route</h3>
        </div>
        <div className="dashboard-card-body bg-gray-850 p-4">
          <Bar data={errorRateData} options={barOptions} />
        </div>
      </div>
      
      {/* Recent Matches Summary */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3>Statistiques des Matchs</h3>
        </div>
        <div className="dashboard-card-body">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary-400">
                {Math.round(players.reduce((sum, p) => sum + (p.latency || 0), 0) / players.length)} ms
              </div>
              <div className="text-sm text-gray-400">Latence Moyenne</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {players.filter(p => p.status === 'healthy').length}/{players.length}
              </div>
              <div className="text-sm text-gray-400">Services Disponibles</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {players.reduce((max, p) => Math.max(max, p.latency || 0), 0)} ms
              </div>
              <div className="text-sm text-gray-400">Latence Max</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-secondary-400">
                {players.reduce((min, p) => p.latency ? Math.min(min, p.latency) : min, 10000) || 0} ms
              </div>
              <div className="text-sm text-gray-400">Latence Min</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsPanel
