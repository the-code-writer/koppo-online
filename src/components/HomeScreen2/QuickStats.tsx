import React from "react";
import {
  TrophyOutlined,
  DollarOutlined,
  DollarCircleFilled,
  FireOutlined,
  LineChartOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { formatCurrency } from "../../utils/snippets";

export const QuickStats: React.FC = () => {

  const {
    sessionProfits, winRate, runningBots, highestStreak, commissionsThisMonth, totalBots, totalStrategies
  } = useDiscoveryContext();

  return (
    <section className="hs2-quick-stats">
      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon session">
            <DollarOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(sessionProfits)}</span>
            <span className="stat-label">Session profits</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon commissions">
            <DollarCircleFilled />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(commissionsThisMonth)}</span>
            <span className="stat-label">Commissions</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon bots">
            <RobotOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-value">{runningBots}<span className="stat-suffix">/{totalBots}</span></span>
            <span className="stat-label">Active Bots</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon winrate">
            <TrophyOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-value">{(winRate * 100).toFixed(2)}<span className="stat-suffix">%</span></span>
            <span className="stat-label">Win Rate</span>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon trades">
            <LineChartOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStrategies}</span>
            <span className="stat-label">Strategies</span>
          </div>
        </div>

        <div className="stat-card glass streak">
          <div className="stat-icon fire">
            <FireOutlined />
          </div>
          <div className="stat-info">
            <span className="stat-value">{highestStreak}<span className="stat-suffix"> days</span></span>
            <span className="stat-label">Win Streak 🔥</span>
          </div>
        </div>
      </div>
    </section>
  );
};
