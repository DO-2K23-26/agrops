import React, { memo } from 'react';
import StatusIndicator from './StatusIndicator';

// This component is memoized to prevent unnecessary re-renders
// Only re-renders if the player props actually change
const PlayerStatusItem = memo(({ player, index }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
      <div className="flex items-center">
        <span className="text-sm bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center mr-3">
          {index + 1}
        </span>
        <span className="font-medium">{player.name}</span>
        {player.cached && (
          <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
            Cached
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        <StatusIndicator 
          status={player.status} 
          latency={player.latency} 
          rateLimited={player.rateLimited}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if important properties change
  return (
    prevProps.player.status === nextProps.player.status &&
    prevProps.player.latency === nextProps.player.latency &&
    prevProps.player.rateLimited === nextProps.player.rateLimited &&
    prevProps.player.cached === nextProps.player.cached &&
    prevProps.index === nextProps.index
  );
});

export default PlayerStatusItem;
