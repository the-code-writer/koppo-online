import React from 'react';
import './styles.scss';

export const StrategyUpdates: React.FC = () => {
  return (
    <div className="strategy-updates">
      <h3>Strategy Updates</h3>
      <div className="connection-status">
        <div className="status-row">
          <span className="status-text">
            Real-time updates are currently disabled
          </span>
        </div>
        <div className="info-message">
          Strategy updates will be available when you implement your preferred real-time solution.
        </div>
      </div>
    </div>
  );
};
