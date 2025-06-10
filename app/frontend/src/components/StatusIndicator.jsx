import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaQuestionCircle } from 'react-icons/fa';

/**
 * StatusIndicator Component
 * Displays a colored icon and text based on the player status
 */
function StatusIndicator({ status, rateLimited, cached }) {
  // Status visualization
  if (rateLimited) {
    return (
      <div className="flex items-center text-yellow-500">
        <FaHourglassHalf className="mr-1" />
        <span className="text-sm">Rate Limited</span>
      </div>
    );
  }
  
  if (cached) {
    return (
      <div className="flex items-center text-blue-400">
        <FaQuestionCircle className="mr-1" />
        <span className="text-sm">Cached</span>
      </div>
    );
  }
  
  switch (status) {
    case 'healthy':
      return (
        <div className="flex items-center text-green-500">
          <FaCheckCircle className="mr-1" />
          <span className="text-sm">Healthy</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center text-red-500">
          <FaTimesCircle className="mr-1" />
          <span className="text-sm">Error</span>
        </div>
      );
    case 'unknown':
      return (
        <div className="flex items-center text-gray-400">
          <FaQuestionCircle className="mr-1" />
          <span className="text-sm">Unknown</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center text-gray-400">
          <FaQuestionCircle className="mr-1" />
          <span className="text-sm">{status || 'Unknown'}</span>
        </div>
      );
  }
}

export default StatusIndicator;
