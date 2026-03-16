import React from "react";
import { Typography } from "antd";
import {
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FieldTimeOutlined,
  BarChartOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { CountDownTimer } from "../Composite/CountDownTimer";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
const { Title } = Typography;

export const QuickStats: React.FC = () => {
  
  const { botHeartbeat } = useDiscoveryContext();

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
              <span className="stat-value">{formatCurrency(data.quickStats.commissionsThisMonth)}</span>
              <span className="stat-label">Commissions</span>
            </div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-icon bots">
              <RobotOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{runningBots}<span className="stat-suffix">/{data.quickStats.totalBots}</span></span>
              <span className="stat-label">Active Bots</span>
            </div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-icon winrate">
              <TrophyOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{(winRate*100).toFixed(2)}<span className="stat-suffix">%</span></span>
              <span className="stat-label">Win Rate</span>
            </div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-icon trades">
              <LineChartOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.quickStats.totalTrades.toLocaleString()}</span>
              <span className="stat-label">Total Trades</span>
            </div>
          </div>
          
          <div className="stat-card glass streak">
            <div className="stat-icon fire">
              <FireOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.quickStats.streak}<span className="stat-suffix"> days</span></span>
              <span className="stat-label">Win Streak 🔥</span>
            </div>
          </div>
        </div>
      </section>
  );
};
