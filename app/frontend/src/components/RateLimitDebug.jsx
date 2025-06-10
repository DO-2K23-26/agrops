import React, { useState, useEffect } from 'react';
import { clearRateLimitingData } from '../services/playerService';

/**
 * RateLimitDebug Component
 * A hidden debug component that can be shown with keyboard shortcut Ctrl+Shift+D
 */
function RateLimitDebug() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('rate-limiting');
  
  // Import playerConfigs from playerService
  const [mockPlayers, setMockPlayers] = useState([]);
  
  useEffect(() => {
    // Import playerConfigs dynamically to avoid circular dependencies
    import('../services/playerService').then(module => {
      if (module.playerConfigs) {
        setMockPlayers(module.playerConfigs);
      }
    });
  }, []);
  
  useEffect(() => {
    // Add keyboard shortcut to show/hide the debug panel
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev);
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  useEffect(() => {
    if (isVisible) {
      // Load logs from localStorage
      try {
        const logsJSON = localStorage.getItem('rateLimitLogs');
        if (logsJSON) {
          setLogs(JSON.parse(logsJSON));
        }
      } catch (error) {
        console.error('Error loading rate limit logs:', error);
      }
      
      // Load refresh coordinator status
      import('../services/refreshCoordinator').then(module => {
        const refreshCoordinator = module.default;
        setRefreshStatus(refreshCoordinator.getStatus());
        
        // Set up interval to refresh status
        const intervalId = setInterval(() => {
          setRefreshStatus(refreshCoordinator.getStatus());
        }, 1000);
        
        return () => clearInterval(intervalId);
      }).catch(err => {
        console.error('Error loading refresh coordinator:', err);
      });
    }
  }, [isVisible]);
  
  const handleClearData = () => {
    const result = clearRateLimitingData();
    if (result.success) {
      setLogs([]);
    }
  };
  
  const toggleRefreshCoordinator = () => {
    import('../services/refreshCoordinator').then(module => {
      const refreshCoordinator = module.default;
      refreshCoordinator.setEnabled(!refreshCoordinator.isEnabled);
      setRefreshStatus(refreshCoordinator.getStatus());
    });
  };
  
  const forceRefresh = (type) => {
    import('../services/refreshCoordinator').then(module => {
      const refreshCoordinator = module.default;
      refreshCoordinator.forceRefresh(type);
      setRefreshStatus(refreshCoordinator.getStatus());
    });
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50 max-h-80 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Debug Panel</h3>
        <div>
          <button 
            onClick={handleClearData}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm mr-2"
          >
            Clear Rate Limit Data
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('rate-limiting')}
          className={`px-4 py-2 rounded-t-lg ${
            activeTab === 'rate-limiting' 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Rate Limiting
        </button>
        <button
          onClick={() => setActiveTab('refresh-status')}
          className={`px-4 py-2 rounded-t-lg ${
            activeTab === 'refresh-status' 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Refresh Status
        </button>
        <button
          onClick={() => setActiveTab('service-urls')}
          className={`px-4 py-2 rounded-t-lg ${
            activeTab === 'service-urls' 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Service URLs
        </button>
      </div>
      
      {activeTab === 'rate-limiting' && (
        <div className="text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Player</th>
                <th className="p-2">Action</th>
                <th className="p-2">URL</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-700/50'}>
                  <td className="p-2">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2">{log.playerName}</td>
                  <td className="p-2">
                    <span className={
                      log.action.includes('BLOCKED') ? 'text-red-400' : 'text-green-400'
                    }>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2">{log.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {logs.length === 0 && (
            <p className="text-center text-gray-400 py-4">No rate limiting logs found</p>
          )}
        </div>
      )}
      
      {activeTab === 'refresh-status' && refreshStatus && (
        <div className="text-xs">
          <div className="mb-4 flex items-center">
            <span className="mr-4">Global Status: 
              <span className={refreshStatus.enabled ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                {refreshStatus.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </span>
            <button
              onClick={toggleRefreshCoordinator}
              className={`px-3 py-1 rounded text-sm ${
                refreshStatus.enabled 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {refreshStatus.enabled ? 'Disable' : 'Enable'} Refreshes
            </button>
            <span className="text-gray-400 ml-4 text-xs">Use Ctrl+Shift+R to toggle refresh globally</span>
          </div>
          
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2">Type</th>
                <th className="p-2">Base Rate</th>
                <th className="p-2">Effective Rate</th>
                <th className="p-2">Backoff Factor</th>
                <th className="p-2">Subscribers</th>
                <th className="p-2">Last Refresh</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(refreshStatus.refreshTypes).map(([type, status], index) => (
                <tr key={type} className={index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-700/50'}>
                  <td className="p-2">{type}</td>
                  <td className="p-2">{status.baseRate / 1000}s</td>
                  <td className="p-2">{status.effectiveRate / 1000}s</td>
                  <td className="p-2">
                    <span className={status.backoffFactor > 1 ? 'text-yellow-400' : 'text-green-400'}>
                      {status.backoffFactor}x
                    </span>
                  </td>
                  <td className="p-2">{status.subscriberCount}</td>
                  <td className="p-2">
                    {status.lastRefresh 
                      ? new Date(status.lastRefresh).toLocaleTimeString() 
                      : 'Never'
                    }
                  </td>
                  <td className="p-2">
                    <span className={status.active ? 'text-green-400' : 'text-gray-400'}>
                      {status.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => forceRefresh(type)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs"
                      disabled={!refreshStatus.enabled}
                    >
                      Force Refresh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === 'service-urls' && (
        <div className="text-xs">
          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">Player Service URLs in Istio Mesh</h3>
            <p className="text-gray-400 mb-4">
              These URLs are used for direct service-to-service communication within the Istio mesh.
            </p>
          </div>
          
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2">Player Name</th>
                <th className="p-2">API URL</th>
                <th className="p-2">Challenge URL</th>
                <th className="p-2">Test</th>
              </tr>
            </thead>
            <tbody>
              {mockPlayers.map((player, index) => (
                <tr key={player.name} className={index % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-700/50'}>
                  <td className="p-2">{player.name}</td>
                  <td className="p-2">{player.url}</td>
                  <td className="p-2">{player.challengeUrl}</td>
                  <td className="p-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const challengeInfo = {
                            challenger: mockPlayers[0].name,
                            opponent: player.name,
                            url: player.challengeUrl
                          };
                          navigator.clipboard.writeText(JSON.stringify(challengeInfo, null, 2));
                          alert(`Challenge info copied to clipboard:\n${JSON.stringify(challengeInfo, null, 2)}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs"
                      >
                        Copy Challenge Info
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <h4 className="text-sm font-medium mb-2">Challenge JSON Example:</h4>
            <pre className="text-xs bg-gray-900 p-3 rounded overflow-auto">
{`{
  "opponentUrl": "http://mathios:8080/ping"
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default RateLimitDebug;

