import { Avatar } from "antd";
import { useEffect } from "react";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { Strategy } from "../../types/strategy";

// Strategy Selection Component for Action Sheet
export const StrategiesList = ({
  onSelectedStrategy,
}: {
  onSelectedStrategy: (strategy: Strategy) => void;
}) => {
  const { strategies, refreshStrategies, strategiesLoading } =
    useDiscoveryContext();

  // Handle scroll events for header positioning
  useEffect(() => {
    refreshStrategies();
  }, []);

  return (
    <div className="modern-action-sheet-list">
      <div className="modern-action-sheet-header">
        <h3 style={{ marginBottom: 0 }}>🎯 Trading Strategies</h3>
      </div>
      <div className="modern-action-sheet-list">
        {strategiesLoading ? (
          <span>Loading ...</span>
        ) : (
          <>
            {strategies.map((strategy: Strategy) => (
              <div
                key={strategy.strategyId}
                className="modern-action-sheet-item"
                onClick={() => onSelectedStrategy(strategy)}
              >
                <div className="modern-action-sheet-icon">
                  <Avatar
                    src={strategy.coverPhoto}
                    shape="square"
                    className="strategy-selection-avatar"
                  />
                </div>
                <div className="modern-action-sheet-content">
                  <div>
                    <div className="modern-action-sheet-label">
                      {strategy.title}
                    </div>
                    <div className="modern-action-sheet-description">
                      {strategy.description}
                    </div>
                  </div>
                  <div className="modern-action-sheet-right">
                    <span className="modern-action-sheet-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
