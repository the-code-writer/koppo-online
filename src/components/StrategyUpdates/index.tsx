import React from 'react';
import './styles.scss';

export const StrategyUpdates: React.FC = () => {
  // SSE functionality removed - component now shows static status
  const isConnected = false;
  const connectionTime: Date | null = null;
  const error = 'SSE service has been disabled';

  return (
    <div className="strategy-updates">
      <h3>SSE Connection Status</h3>
      <div className={`connection-status ${error ? 'error' : ''}`}>
        <div className="status-row">
          <span 
            className="status-text"
            data-connected={isConnected}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isConnected && connectionTime && (
            <span className="connected-time">
              {connectionTime.toLocaleTimeString()}
            </span>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};
